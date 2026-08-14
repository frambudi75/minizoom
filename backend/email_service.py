import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@minizoom.local")

def send_new_user_notification(admin_emails: list, new_user_name: str, new_user_email: str, config: dict = None):
    # Fallback to env variables if config not provided or incomplete
    smtp_server = config.get("smtp_server") if config else None
    smtp_port = config.get("smtp_port") if config else None
    smtp_username = config.get("smtp_username") if config else None
    smtp_password = config.get("smtp_password") if config else None
    smtp_from = config.get("smtp_from") if config else None

    server_host = smtp_server or SMTP_SERVER
    port = int(smtp_port) if smtp_port else SMTP_PORT
    username = smtp_username or SMTP_USERNAME
    password = smtp_password or SMTP_PASSWORD
    sender = smtp_from or SMTP_FROM

    if not server_host or not username or not password:
        print("SMTP is not configured. Skipping email notification.")
        return

    if not admin_emails:
        return

    subject = f"New User Registration: {new_user_name}"
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Minizoom - New User Registration</h2>
        <p>A new user has registered and is pending your approval.</p>
        <div style="background: #f4f4f5; padding: 15px; border-radius: 8px;">
            <p><strong>Name:</strong> {new_user_name}</p>
            <p><strong>Email:</strong> {new_user_email}</p>
        </div>
        <p>Please log in to the Minizoom Dashboard to approve or reject this user.</p>
        <br>
        <p><small>This is an automated message from Minizoom.</small></p>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Minizoom <{sender}>"
    msg["To"] = ", ".join(admin_emails)

    part = MIMEText(html, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(server_host, port)
        server.ehlo()
        server.starttls()
        server.login(username, password)
        server.sendmail(sender, admin_emails, msg.as_string())
        server.quit()
        print(f"Notification email sent successfully to {len(admin_emails)} admins.")
    except Exception as e:
        print(f"Failed to send email notification: {e}")
