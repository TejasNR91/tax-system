import sqlite3
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import bcrypt

DB_PATH = os.path.join(os.path.dirname(__file__), "tax_system.db")

def hash_password(password: str) -> Tuple[str, str]:
    """
    Hashes password using bcrypt. Returns (salt, hashed_password_str).
    """
    salt_bytes = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt_bytes)
    return salt_bytes.decode('utf-8'), hashed_bytes.decode('utf-8')

def verify_password(password: str, salt: str, expected_hashed: str) -> bool:
    """
    Verifies password. Supports modern bcrypt hashes as well as legacy PBKDF2 hashes.
    """
    if expected_hashed.startswith('$2b$') or expected_hashed.startswith('$2a$'):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), expected_hashed.encode('utf-8'))
        except Exception:
            return False
    # Fallback for existing legacy accounts in SQLite
    legacy_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return secrets.compare_digest(legacy_hash, expected_hashed)

def hash_otp(otp: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Hashes OTP code with a cryptographically secure salt.
    Plaintext OTP is NEVER stored.
    """
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}:{otp}".encode('utf-8')).hexdigest()
    return salt, hashed

def verify_otp_hash(otp: str, salt: str, expected_hashed: str) -> bool:
    """
    Timing-attack-resistant verification of OTP code.
    """
    computed = hashlib.sha256(f"{salt}:{otp}".encode('utf-8')).hexdigest()
    return secrets.compare_digest(computed, expected_hashed)

def init_db(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        salt TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT,
        pan_number TEXT,
        created_at TEXT NOT NULL
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")

    # 2. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp TEXT NOT NULL,
        query TEXT NOT NULL,
        financial_year TEXT NOT NULL,
        response TEXT NOT NULL,
        tool_results TEXT,
        audit_trail TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    
    # 3. Calculation History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calculation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp TEXT NOT NULL,
        financial_year TEXT NOT NULL,
        regime TEXT NOT NULL,
        gross_income REAL NOT NULL,
        taxable_income REAL NOT NULL,
        total_tax REAL NOT NULL,
        breakdown_json TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # 4. Password Resets / OTP Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        salt TEXT NOT NULL,
        hashed_otp TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 5,
        is_used INTEGER DEFAULT 0,
        reset_token TEXT,
        reset_token_expires_at TEXT
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email)")

    conn.commit()
    conn.close()

def register_user_in_db(username: str, email: str, password: str, full_name: str = "", pan_number: str = "", db_path: str = DB_PATH) -> Dict[str, Any]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    clean_username = username.strip().lower()
    clean_email = email.strip().lower()

    # Check if username or email exists
    cursor.execute("SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", (clean_username, clean_email))
    if cursor.fetchone():
        conn.close()
        raise ValueError("Username or Email already registered.")
        
    salt, hashed = hash_password(password)
    created_at = datetime.now().isoformat()
    
    cursor.execute("""
    INSERT INTO users (username, email, salt, hashed_password, full_name, pan_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (clean_username, clean_email, salt, hashed, full_name.strip(), pan_number.strip().upper(), created_at))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "id": user_id,
        "username": clean_username,
        "email": clean_email,
        "full_name": full_name.strip(),
        "pan_number": pan_number.strip().upper(),
        "created_at": created_at
    }

def authenticate_user_in_db(username_or_email: str, password: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    clean_id = username_or_email.strip().lower()
    cursor.execute("SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", (clean_id, clean_id))
    user_row = cursor.fetchone()
    conn.close()
    
    if not user_row:
        return None
        
    user_dict = dict(user_row)
    if verify_password(password, user_dict["salt"], user_dict["hashed_password"]):
        return {
            "id": user_dict["id"],
            "username": user_dict["username"],
            "email": user_dict["email"],
            "full_name": user_dict["full_name"],
            "pan_number": user_dict["pan_number"],
            "created_at": user_dict["created_at"]
        }
    return None

def get_user_by_id(user_id: int, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email, full_name, pan_number, created_at FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    conn.close()
    return dict(user_row) if user_row else None

def get_user_by_email(email: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email, full_name, pan_number, created_at FROM users WHERE LOWER(email) = ?", (email.strip().lower(),))
    user_row = cursor.fetchone()
    conn.close()
    return dict(user_row) if user_row else None

# ==========================================
# OTP & Password Reset Database Operations
# ==========================================

def get_last_otp_request(email: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM password_resets WHERE LOWER(email) = ? ORDER BY id DESC LIMIT 1",
        (email.strip().lower(),)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_recent_otp_requests_count(email: str, window_minutes: int = 60, db_path: str = DB_PATH) -> int:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cutoff = (datetime.now() - timedelta(minutes=window_minutes)).isoformat()
    cursor.execute(
        "SELECT COUNT(*) FROM password_resets WHERE LOWER(email) = ? AND created_at >= ?",
        (email.strip().lower(), cutoff)
    )
    count = cursor.fetchone()[0]
    conn.close()
    return count

def invalidate_pending_otps_for_email(email: str, db_path: str = DB_PATH):
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE password_resets SET is_used = 1 WHERE LOWER(email) = ? AND is_used = 0",
        (email.strip().lower(),)
    )
    conn.commit()
    conn.close()

def create_otp_record(email: str, hashed_otp: str, salt: str, expiry_minutes: int = 5, max_attempts: int = 5, db_path: str = DB_PATH) -> int:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime.now()
    created_at = now.isoformat()
    expires_at = (now + timedelta(minutes=expiry_minutes)).isoformat()
    
    # Invalidate previous unverified OTPs
    cursor.execute(
        "UPDATE password_resets SET is_used = 1 WHERE LOWER(email) = ? AND is_used = 0",
        (email.strip().lower(),)
    )
    
    cursor.execute("""
    INSERT INTO password_resets (email, salt, hashed_otp, created_at, expires_at, attempts, max_attempts, is_used)
    VALUES (?, ?, ?, ?, ?, 0, ?, 0)
    """, (email.strip().lower(), salt, hashed_otp, created_at, expires_at, max_attempts))
    
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id

def get_active_otp_record(email: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM password_resets WHERE LOWER(email) = ? AND is_used = 0 ORDER BY id DESC LIMIT 1",
        (email.strip().lower(),)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def increment_otp_attempts(record_id: int, db_path: str = DB_PATH) -> int:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?", (record_id,))
    cursor.execute("SELECT attempts, max_attempts FROM password_resets WHERE id = ?", (record_id,))
    row = cursor.fetchone()
    attempts, max_attempts = row[0], row[1]
    if attempts >= max_attempts:
        cursor.execute("UPDATE password_resets SET is_used = 1 WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return attempts

def mark_otp_verified(record_id: int, reset_token: str, validity_minutes: int = 10, db_path: str = DB_PATH):
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    token_expires_at = (datetime.now() + timedelta(minutes=validity_minutes)).isoformat()
    cursor.execute("""
    UPDATE password_resets 
    SET is_used = 1, reset_token = ?, reset_token_expires_at = ?
    WHERE id = ?
    """, (reset_token, token_expires_at, record_id))
    
    conn.commit()
    conn.close()

def get_valid_reset_token_record(email: str, reset_token: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    now_iso = datetime.now().isoformat()
    cursor.execute("""
    SELECT * FROM password_resets 
    WHERE LOWER(email) = ? AND reset_token = ? AND reset_token_expires_at > ?
    ORDER BY id DESC LIMIT 1
    """, (email.strip().lower(), reset_token, now_iso))
    
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_user_password(email: str, new_password: str, reset_record_id: int, db_path: str = DB_PATH) -> bool:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    clean_email = email.strip().lower()
    salt, hashed = hash_password(new_password)
    
    cursor.execute("""
    UPDATE users SET salt = ?, hashed_password = ? WHERE LOWER(email) = ?
    """, (salt, hashed, clean_email))
    
    rows_affected = cursor.rowcount
    
    # Invalidate reset token record
    cursor.execute("""
    UPDATE password_resets SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?
    """, (reset_record_id,))
    
    conn.commit()
    conn.close()
    return rows_affected > 0

# ==========================================
# Audit and Calculation Logging
# ==========================================

def log_chat_query(query: str, financial_year: str, response: str, tool_results: list, audit_trail: list, user_id: Optional[int] = None, db_path: str = DB_PATH):
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO audit_logs (user_id, timestamp, query, financial_year, response, tool_results, audit_trail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        datetime.now().isoformat(),
        query,
        financial_year,
        response,
        json.dumps(tool_results),
        json.dumps(audit_trail)
    ))
    conn.commit()
    conn.close()

def log_calculation(financial_year: str, regime: str, gross_income: float, taxable_income: float, total_tax: float, breakdown: dict, user_id: Optional[int] = None, db_path: str = DB_PATH):
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO calculation_history (user_id, timestamp, financial_year, regime, gross_income, taxable_income, total_tax, breakdown_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        datetime.now().isoformat(),
        financial_year,
        regime,
        gross_income,
        taxable_income,
        total_tax,
        json.dumps(breakdown)
    ))
    conn.commit()
    conn.close()

def get_recent_history(limit: int = 10, user_id: Optional[int] = None, db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM calculation_history WHERE user_id = ? ORDER BY id DESC LIMIT ?", (user_id, limit))
    else:
        cursor.execute("SELECT * FROM calculation_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_recent_chat_logs(limit: int = 10, user_id: Optional[int] = None, db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM audit_logs WHERE user_id = ? ORDER BY id DESC LIMIT ?", (user_id, limit))
    else:
        cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
