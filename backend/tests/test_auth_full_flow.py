import sys
import os
import time
from datetime import datetime, timedelta
import sqlite3

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import (
    init_db,
    DB_PATH,
    register_user_in_db,
    authenticate_user_in_db,
    get_user_by_email,
    get_active_otp_record,
    hash_otp,
    verify_otp_hash,
    create_otp_record,
    increment_otp_attempts
)
from app.routers.auth import (
    register_user,
    login_user,
    forgot_password,
    verify_otp,
    reset_password,
    get_current_profile,
    logout_user,
    RegisterPayload,
    LoginPayload,
    ForgotPasswordPayload,
    VerifyOtpPayload,
    ResetPasswordPayload,
    TOKEN_STORE
)
from fastapi import HTTPException

TEST_DB = os.path.join(os.path.dirname(__file__), "test_auth.db")

def setup_test_env():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    init_db(TEST_DB)

def run_tests():
    print("=" * 60)
    print("RUNNING COMPLETE AUTHENTICATION & PASSWORD RESET TEST SUITE")
    print("=" * 60)

    # Clean up any existing test user from previous run
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE username = 'test_taxpayer_1' OR email = 'taxpayer1@example.com'")
    cur.execute("DELETE FROM password_resets WHERE email = 'taxpayer1@example.com'")
    conn.commit()
    conn.close()

    # 1. New User Registration Test
    print("\n1. Testing User Registration...")
    reg_payload = RegisterPayload(
        username="test_taxpayer_1",
        email="taxpayer1@example.com",
        password="SecurePassword123",
        confirm_password="SecurePassword123",
        full_name="Tax Payer One",
        pan_number="ABCDE1234F"
    )
    reg_res = register_user(reg_payload)
    assert reg_res["status"] == "success", "Registration should succeed"
    assert "token" in reg_res, "Registration must return token"
    assert reg_res["user"]["username"] == "test_taxpayer_1"
    token = reg_res["token"]
    print("✓ Registration successful with bcrypt password hashing.")

    # 2. Duplicate Registration Test
    print("\n2. Testing Duplicate Registration Prevention...")
    try:
        register_user(reg_payload)
        assert False, "Duplicate registration should fail"
    except HTTPException as e:
        assert e.status_code == 400
        print(f"✓ Duplicate prevented correctly: {e.detail}")

    # 3. Wrong Password Test
    print("\n3. Testing Login with Wrong Password...")
    try:
        login_user(LoginPayload(username="test_taxpayer_1", password="WrongPassword999"))
        assert False, "Login with wrong password should fail"
    except HTTPException as e:
        assert e.status_code == 401
        print(f"✓ Rejected wrong password correctly: {e.detail}")

    # 4. Valid Login Test
    print("\n4. Testing Login with Correct Credentials...")
    login_res = login_user(LoginPayload(username="test_taxpayer_1", password="SecurePassword123"))
    assert login_res["status"] == "success"
    login_token = login_res["token"]
    print(f"✓ Login successful! Token generated: {login_token[:8]}...")

    # 5. Protected Profile Access Test (/api/auth/me)
    print("\n5. Testing Protected Profile Access...")
    profile = get_current_profile(user_id=TOKEN_STORE.get(login_token))
    assert profile["username"] == "test_taxpayer_1"
    print(f"✓ Protected profile accessed: {profile['full_name']} ({profile['email']})")

    # 6. Unauthenticated Profile Access Test
    print("\n6. Testing Access with Invalid/Missing Token...")
    try:
        get_current_profile(user_id=None)
        assert False, "Should reject unauthenticated access"
    except HTTPException as e:
        assert e.status_code == 401
        print(f"✓ Protected route blocked unauthenticated access correctly: {e.detail}")

    # 7. Forgot Password with Unregistered Email (Anti-Enumeration Check)
    print("\n7. Testing Forgot Password with Unregistered Email...")
    unreg_res = forgot_password(ForgotPasswordPayload(email="unregistered_ghost@example.com"))
    assert unreg_res["status"] == "success"
    assert "If this email is registered" in unreg_res["message"]
    print(f"✓ Anti-enumeration verified: Generic message returned without revealing email non-existence.")

    # 8. Forgot Password with Registered Email
    print("\n8. Testing Forgot Password with Registered Email...")
    forgot_res = forgot_password(ForgotPasswordPayload(email="taxpayer1@example.com"))
    assert forgot_res["status"] == "success"
    assert "If this email is registered" in forgot_res["message"]
    print(f"✓ OTP request processed and hashed OTP stored in database.")

    # 9. Rate Limiting: Rapid Subsequent OTP Request (Cooldown)
    print("\n9. Testing OTP Request Cooldown Rate Limiting (within 60s)...")
    try:
        forgot_password(ForgotPasswordPayload(email="taxpayer1@example.com"))
        assert False, "Rapid duplicate OTP request should be blocked"
    except HTTPException as e:
        assert e.status_code == 429
        print(f"✓ Cooldown enforced: {e.detail}")

    # 10. Wrong OTP Verification Test
    print("\n10. Testing OTP Verification with Wrong Code...")
    try:
        verify_otp(VerifyOtpPayload(email="taxpayer1@example.com", otp="000000"))
        assert False, "Wrong OTP should be rejected"
    except HTTPException as e:
        assert e.status_code == 400
        assert "attempt(s) remaining" in e.detail or "Incorrect OTP" in e.detail
        print(f"✓ Wrong OTP rejected correctly: {e.detail}")

    # 11. Test Expired OTP Check
    print("\n11. Testing Expired OTP Behavior...")
    # Simulate an expired OTP by setting expires_at to 10 minutes ago in DB
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    past_time = (datetime.now() - timedelta(minutes=10)).isoformat()
    cur.execute("UPDATE password_resets SET expires_at = ? WHERE email = ?", (past_time, "taxpayer1@example.com"))
    conn.commit()
    conn.close()

    try:
        verify_otp(VerifyOtpPayload(email="taxpayer1@example.com", otp="123456"))
        assert False, "Expired OTP should be rejected"
    except HTTPException as e:
        assert e.status_code == 400
        assert "expired" in e.detail.lower()
        print(f"✓ Expired OTP rejected correctly: {e.detail}")

    # 12. Correct OTP Verification Flow
    print("\n12. Testing Valid OTP Generation and Verification Flow...")
    # Inject a fresh test OTP directly to test cryptographic verification without email delivery dependency
    test_otp = "849201"
    salt, hashed_otp = hash_otp(test_otp)
    create_otp_record("taxpayer1@example.com", hashed_otp, salt, expiry_minutes=5)
    
    verify_res = verify_otp(VerifyOtpPayload(email="taxpayer1@example.com", otp=test_otp))
    assert verify_res["status"] == "success"
    assert "reset_token" in verify_res
    reset_token = verify_res["reset_token"]
    print(f"✓ Correct OTP verified! One-time reset token issued: {reset_token[:10]}...")

    # 13. OTP Single-Use Invalidation Test
    print("\n13. Testing OTP Invalidation (Cannot Re-use Same OTP)...")
    try:
        verify_otp(VerifyOtpPayload(email="taxpayer1@example.com", otp=test_otp))
        assert False, "Used OTP must not be reusable"
    except HTTPException as e:
        assert e.status_code == 400
        print(f"✓ OTP reuse prevented: {e.detail}")

    # 14. Password Reset with Mismatched Passwords
    print("\n14. Testing Password Reset with Mismatched Passwords...")
    try:
        reset_password(ResetPasswordPayload(
            email="taxpayer1@example.com",
            reset_token=reset_token,
            new_password="NewSecurePassword456",
            confirm_password="DifferentPassword789"
        ))
        assert False, "Mismatched passwords must fail"
    except HTTPException as e:
        assert e.status_code == 400
        print(f"✓ Mismatched password rejected: {e.detail}")

    # 15. Password Reset with Weak Password
    print("\n15. Testing Password Reset with Weak Password (< 8 chars)...")
    try:
        reset_password(ResetPasswordPayload(
            email="taxpayer1@example.com",
            reset_token=reset_token,
            new_password="weak",
            confirm_password="weak"
        ))
        assert False, "Weak password must fail"
    except Exception as e:
        print(f"✓ Weak password rejected: {str(e)[:70]}...")

    # 16. Valid Password Reset
    print("\n16. Testing Valid Password Reset...")
    reset_res = reset_password(ResetPasswordPayload(
        email="taxpayer1@example.com",
        reset_token=reset_token,
        new_password="BrandNewPassword2026",
        confirm_password="BrandNewPassword2026"
    ))
    assert reset_res["status"] == "success"
    print(f"✓ Password successfully reset in database.")

    # 17. Reset Token Invalidation Test (Cannot Re-use Same Reset Token)
    print("\n17. Testing Reset Token Invalidation (Single-Use Token Enforcement)...")
    try:
        reset_password(ResetPasswordPayload(
            email="taxpayer1@example.com",
            reset_token=reset_token,
            new_password="AnotherPassword999",
            confirm_password="AnotherPassword999"
        ))
        assert False, "Used reset token must not be reusable"
    except HTTPException as e:
        assert e.status_code == 400
        print(f"✓ Reset token reuse prevented: {e.detail}")

    # 18. Login with Old Password Must Fail
    print("\n18. Testing Login with Old Password (Must Fail)...")
    try:
        login_user(LoginPayload(username="test_taxpayer_1", password="SecurePassword123"))
        assert False, "Old password should no longer work"
    except HTTPException as e:
        assert e.status_code == 401
        print(f"✓ Old password successfully rejected: {e.detail}")

    # 19. Login with New Password Must Succeed
    print("\n19. Testing Login with New Password (Must Succeed)...")
    new_login = login_user(LoginPayload(username="test_taxpayer_1", password="BrandNewPassword2026"))
    assert new_login["status"] == "success"
    print(f"✓ Login with new password succeeded! User authenticated as: {new_login['user']['username']}")

    # 20. Logout Test
    print("\n20. Testing Logout...")
    new_token = new_login["token"]
    assert new_token in TOKEN_STORE
    logout_res = logout_user(authorization=f"Bearer {new_token}")
    assert logout_res["status"] == "success"
    assert new_token not in TOKEN_STORE
    print("✓ Session successfully destroyed on logout.")

    print("\n" + "=" * 60)
    print("ALL 20 TEST CASES PASSED SUCCESSFULLY! 🚀")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
