import os
import re
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel, Field, EmailStr
from email_validator import validate_email, EmailNotValidError

from app.db.database import (
    register_user_in_db,
    authenticate_user_in_db,
    get_user_by_id,
    get_user_by_email,
    get_last_otp_request,
    get_recent_otp_requests_count,
    create_otp_record,
    get_active_otp_record,
    increment_otp_attempts,
    verify_otp_hash,
    hash_otp,
    mark_otp_verified,
    get_valid_reset_token_record,
    update_user_password
)
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])

# Active session / token store
TOKEN_STORE: Dict[str, int] = {}

# Security settings
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
OTP_COOLDOWN_SECONDS = int(os.getenv("OTP_COOLDOWN_SECONDS", "60"))

# Request models
class RegisterPayload(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: str
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)
    full_name: Optional[str] = ""
    pan_number: Optional[str] = ""

class LoginPayload(BaseModel):
    username: str
    password: str

class ForgotPasswordPayload(BaseModel):
    email: str

class VerifyOtpPayload(BaseModel):
    email: str
    otp: str = Field(min_length=6, max_length=6)

class ResetPasswordPayload(BaseModel):
    email: str
    reset_token: str
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    return TOKEN_STORE.get(token)

def validate_password_complexity(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain both letters and numbers."
        )

# ==========================================
# Authentication Endpoints
# ==========================================

@router.post("/register")
def register_user(payload: RegisterPayload):
    # Validate email format
    try:
        valid_email_info = validate_email(payload.email.strip(), check_deliverability=False)
        normalized_email = valid_email_info.normalized.lower()
    except EmailNotValidError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid email: {str(e)}")

    # Validate passwords
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password and Confirm Password do not match.")
    
    validate_password_complexity(payload.password)

    # Optional PAN validation (format: 5 uppercase letters, 4 digits, 1 letter)
    clean_pan = payload.pan_number.strip().upper() if payload.pan_number else ""
    if clean_pan and not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", clean_pan):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid PAN format (e.g. ABCDE1234F).")

    try:
        user = register_user_in_db(
            username=payload.username.strip(),
            email=normalized_email,
            password=payload.password,
            full_name=payload.full_name or "",
            pan_number=clean_pan
        )
        # Generate session token
        token = secrets.token_hex(24)
        TOKEN_STORE[token] = user["id"]

        return {
            "status": "success",
            "message": "User registered successfully!",
            "token": token,
            "user": user
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/login")
def login_user(payload: LoginPayload):
    login_id = payload.username.strip()
    if not login_id or not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username/Email and Password are required.")

    user = authenticate_user_in_db(login_id, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username/email or password.")

    token = secrets.token_hex(24)
    TOKEN_STORE[token] = user["id"]

    return {
        "status": "success",
        "message": "Login successful!",
        "token": token,
        "user": user
    }

@router.get("/me")
def get_current_profile(user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user

@router.post("/logout")
def logout_user(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        TOKEN_STORE.pop(token, None)
    return {"status": "success", "message": "Logged out successfully."}

# ==========================================
# Real Gmail OTP & Password Reset Endpoints
# ==========================================

GENERIC_RESET_MSG = (
    "If this email is registered in TaxSaathi AI, a 6-digit verification code has been sent. "
    "Please check your inbox and spam folder."
)

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordPayload):
    """
    Receives user's registered email, validates format, applies rate limiting,
    generates secure random 6-digit OTP, stores hashed OTP with 5-minute expiry,
    and dispatches OTP via Gmail SMTP.
    Returns a generic message to prevent user enumeration attacks.
    """
    raw_email = payload.email.strip().lower()
    try:
        valid_email_info = validate_email(raw_email, check_deliverability=False)
        clean_email = valid_email_info.normalized.lower()
    except EmailNotValidError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter a valid email address.")

    # 1. Rate Limiting: Cooldown check (60 seconds)
    last_req = get_last_otp_request(clean_email)
    if last_req:
        last_req_time = datetime.fromisoformat(last_req["created_at"])
        elapsed_seconds = (datetime.now() - last_req_time).total_seconds()
        if elapsed_seconds < OTP_COOLDOWN_SECONDS:
            remaining_wait = int(OTP_COOLDOWN_SECONDS - elapsed_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining_wait} second(s) before requesting another OTP."
            )

    # 2. Rate Limiting: Max requests per hour (5)
    hourly_count = get_recent_otp_requests_count(clean_email, window_minutes=60)
    if hourly_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset attempts for this email. Please try again after 1 hour."
        )

    # 3. Check if user exists in database
    user = get_user_by_email(clean_email)
    if not user:
        # Anti-enumeration: Return generic success message even if user doesn't exist
        return {
            "status": "success",
            "message": GENERIC_RESET_MSG,
            "email": clean_email
        }

    # 4. Generate cryptographically secure 6-digit numeric OTP
    # secrets.randbelow(900000) generates integer 0 to 899999 + 100000 = 100000..999999
    otp = f"{secrets.randbelow(900000) + 100000:06d}"

    # 5. Securely hash the OTP before storing
    salt, hashed_otp = hash_otp(otp)
    create_otp_record(
        email=clean_email,
        hashed_otp=hashed_otp,
        salt=salt,
        expiry_minutes=OTP_EXPIRY_MINUTES,
        max_attempts=OTP_MAX_ATTEMPTS
    )

    # 6. Dispatch real email via SMTP (NEVER log or expose the OTP)
    sent_success, err_msg = send_otp_email(clean_email, otp, expiry_minutes=OTP_EXPIRY_MINUTES)
    if not sent_success:
        # If sending fails due to unconfigured SMTP in local test, return a diagnostic note
        if "SMTP credentials not configured" in (err_msg or ""):
            return {
                "status": "success",
                "message": (
                    f"{GENERIC_RESET_MSG} (Note: SMTP credentials are not yet configured in .env. "
                    "Configure EMAIL_USER and EMAIL_PASSWORD for live Gmail delivery.)"
                ),
                "email": clean_email,
                "smtp_configured": False
            }

    return {
        "status": "success",
        "message": GENERIC_RESET_MSG,
        "email": clean_email,
        "smtp_configured": True
    }

@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpPayload):
    """
    Verifies the submitted 6-digit OTP against the securely hashed OTP in the database.
    Enforces maximum attempts and expiration.
    Returns a one-time reset token upon successful verification.
    """
    clean_email = payload.email.strip().lower()
    otp_code = payload.otp.strip()

    if not re.match(r"^\d{6}$", otp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP must be exactly 6 numeric digits."
        )

    active_record = get_active_otp_record(clean_email)
    if not active_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found for this email, or it has already been used. Please request a new OTP."
        )

    # Check expiration
    expires_at = datetime.fromisoformat(active_record["expires_at"])
    if datetime.now() > expires_at:
        increment_otp_attempts(active_record["id"])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your OTP has expired (valid for 5 minutes). Please request a new OTP."
        )

    # Check max attempts
    current_attempts = active_record["attempts"]
    max_attempts = active_record["max_attempts"]
    if current_attempts >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded for this OTP. Please request a new OTP."
        )

    # Timing-safe verification of hashed OTP
    is_valid = verify_otp_hash(otp_code, active_record["salt"], active_record["hashed_otp"])
    if not is_valid:
        new_attempts = increment_otp_attempts(active_record["id"])
        remaining = max(0, max_attempts - new_attempts)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect OTP. Maximum attempts exceeded. This OTP has been invalidated. Please request a new one."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect OTP. You have {remaining} attempt(s) remaining."
        )

    # OTP is valid! Generate cryptographically random single-use reset token (valid for 10 minutes)
    reset_token = secrets.token_urlsafe(32)
    mark_otp_verified(active_record["id"], reset_token, validity_minutes=10)

    return {
        "status": "success",
        "message": "OTP verified successfully! You may now set your new password.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload):
    """
    Updates the user's password using the verified reset token.
    Validates password strength, confirms token validity, hashes new password with bcrypt,
    and invalidates the reset token to prevent reuse.
    """
    clean_email = payload.email.strip().lower()
    reset_token = payload.reset_token.strip()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is required."
        )

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New Password and Confirm Password do not match."
        )

    validate_password_complexity(payload.new_password)

    # Validate reset token from DB
    valid_record = get_valid_reset_token_record(clean_email, reset_token)
    if not valid_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset session. Please request a new OTP and try again."
        )

    # Perform password update with bcrypt
    success = update_user_password(clean_email, payload.new_password, valid_record["id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account could not be found to update password."
        )

    return {
        "status": "success",
        "message": "Your password has been reset successfully! You can now log in with your new password."
    }
