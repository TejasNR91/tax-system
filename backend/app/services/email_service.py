import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Tuple, Optional
from dotenv import load_dotenv

# Load .env file from project root or current working dir
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

logger = logging.getLogger("taxsaathi.email")

def get_email_config():
    return {
        "host": os.getenv("EMAIL_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("EMAIL_PORT", "587")),
        "user": os.getenv("EMAIL_USER", "").strip(),
        "password": os.getenv("EMAIL_PASSWORD", "").strip(),
        "sender": os.getenv("EMAIL_FROM", "TaxSaathi AI <no-reply@taxsaathi.in>"),
        "use_tls": os.getenv("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes"),
        "expiry_minutes": int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
    }

def send_otp_email(recipient_email: str, otp: str, expiry_minutes: int = 5) -> Tuple[bool, Optional[str]]:
    """
    Sends a 6-digit OTP verification code to the user's Gmail/email address via SMTP.
    Security: The OTP is transmitted strictly via email and NEVER logged or exposed.
    """
    config = get_email_config()
    sender_email = config["user"] or "no-reply@taxsaathi.in"
    from_header = config["sender"] or f"TaxSaathi AI <{sender_email}>"

    subject = f"TaxSaathi AI — Password Reset Verification Code ({otp[:2]}****)"

    text_content = f"""
TaxSaathi AI — Indian Tax Reasoning & Assistant System

You requested a password reset for your account associated with {recipient_email}.

Your One-Time Password (OTP) is: {otp}

This code is valid for {expiry_minutes} minutes.
For your security:
- Never share this code with anyone.
- TaxSaathi representatives will never ask you for this code.
- If you did not request this password reset, please ignore this email immediately.

Warm regards,
TaxSaathi AI Team
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #FF6B00 0%, #E65100 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }}
    .body {{ padding: 32px 28px; }}
    .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; }}
    .instructions {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
    .otp-box {{ background: #f8fafc; border: 2px dashed #FF6B00; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
    .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #FF6B00; font-family: 'Courier New', monospace; }}
    .otp-expiry {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
    .warning-box {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 24px; }}
    .footer {{ background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇮🇳 TaxSaathi AI</h1>
      <p>Secure Account Password Recovery</p>
    </div>
    <div class="body">
      <div class="greeting">Hello,</div>
      <div class="instructions">
        We received a request to reset the password for your TaxSaathi AI account (<strong>{recipient_email}</strong>). Use the verification code below to complete your reset request:
      </div>
      <div class="otp-box">
        <div class="otp-code">{otp}</div>
        <div class="otp-expiry">⏱️ This code expires in <strong>{expiry_minutes} minutes</strong></div>
      </div>
      <div class="warning-box">
        <strong>🔒 Security Notice:</strong> Never share this OTP with anyone, including members of our support team. If you did not make this request, your account may be secure but we advise reviewing your login activity.
      </div>
    </div>
    <div class="footer">
      &copy; TaxSaathi AI — Deterministic Indian Tax Reasoning System.<br>
      This is an automated system email. Please do not reply directly.
    </div>
  </div>
</body>
</html>"""

    if not config["user"] or not config["password"]:
        logger.warning(
            "SMTP credentials not fully configured in .env (EMAIL_USER or EMAIL_PASSWORD missing). "
            "Please configure EMAIL_USER and EMAIL_PASSWORD in .env for live email dispatch."
        )
        return False, "SMTP credentials not configured on server"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = recipient_email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        if config["port"] == 465:
            server = smtplib.SMTP_SSL(config["host"], config["port"], timeout=15)
        else:
            server = smtplib.SMTP(config["host"], config["port"], timeout=15)
            if config["use_tls"]:
                server.starttls()

        server.login(config["user"], config["password"])
        server.sendmail(sender_email, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Verification OTP email dispatched successfully to {recipient_email}")
        return True, None
    except Exception as e:
        logger.error(f"Failed to dispatch OTP email to {recipient_email}: {str(e)}")
        return False, str(e)
