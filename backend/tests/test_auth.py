import pytest
from app.db.database import register_user_in_db, authenticate_user_in_db, get_user_by_id

def test_user_registration_and_login():
    import secrets
    test_username = f"testuser_{secrets.token_hex(4)}"
    test_email = f"{test_username}@example.com"
    test_password = "SecretPassword123!"
    
    # 1. Register User
    user = register_user_in_db(
        username=test_username,
        email=test_email,
        password=test_password,
        full_name="Test Taxpayer",
        pan_number="ABCDE1234F"
    )
    assert user["id"] is not None
    assert user["username"] == test_username
    assert user["email"] == test_email

    # 2. Authenticate Valid Credentials
    auth_user = authenticate_user_in_db(test_username, test_password)
    assert auth_user is not None
    assert auth_user["id"] == user["id"]

    # 3. Authenticate Email & Password
    auth_email_user = authenticate_user_in_db(test_email, test_password)
    assert auth_email_user is not None
    assert auth_email_user["id"] == user["id"]

    # 4. Invalid Password Check
    invalid_user = authenticate_user_in_db(test_username, "WrongPassword")
    assert invalid_user is None
