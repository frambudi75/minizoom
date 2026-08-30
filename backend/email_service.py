import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@minizoom.local")

def _get_smtp_client(config: dict = None):
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
        return None, None, None, None, None

    return server_host, port, username, password, sender


def send_new_user_notification(admin_emails: list, new_user_name: str, new_user_email: str, config: dict = None):
    """Notifies superadmins when a new user registers and is pending approval."""
    server_host, port, username, password, sender = _get_smtp_client(config)
    if not server_host:
        print("[SMTP] SMTP is not configured. Skipping new user email notification.")
        return

    if not admin_emails:
        return

    subject = f"🔔 [Minizoom] New User Registration: {new_user_name}"
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 24px; margin: 0;">
        <div style="max-width: 540px; margin: 0 auto; background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <h2 style="color: #60a5fa; margin-top: 0;">Minizoom User Registration</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">A new user has registered and is pending your approval to access the workspace.</p>
          <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; margin: 16px 0;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Full Name:</strong> {new_user_name}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> {new_user_email}</p>
          </div>
          <p style="color: #cbd5e1; font-size: 14px;">Log in to your Minizoom Dashboard to approve or reject this user.</p>
          <br>
          <p style="color: #64748b; font-size: 12px; margin: 0; border-top: 1px solid #334155; padding-top: 12px;">This is an automated notification from Minizoom Video Conferencing.</p>
        </div>
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
        server = smtplib.SMTP(server_host, port, timeout=15)
        server.ehlo()
        server.starttls()
        server.login(username, password)
        server.sendmail(sender, admin_emails, msg.as_string())
        server.quit()
        print(f"[SMTP] New registration notification email sent to {len(admin_emails)} admins.")
    except Exception as e:
        print(f"[SMTP] Failed to send new user registration email: {e}")


def send_user_approved_notification(user_email: str, user_name: str, config: dict = None):
    """Notifies a user that their account has been approved by the superadmin."""
    server_host, port, username, password, sender = _get_smtp_client(config)
    if not server_host:
        print("[SMTP] SMTP is not configured. Skipping user approved email notification.")
        return

    if not user_email:
        return

    subject = f"✅ [Minizoom] Your Account Has Been Approved!"
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 24px; margin: 0;">
        <div style="max-width: 540px; margin: 0 auto; background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <h2 style="color: #34d399; margin-top: 0;">Welcome to Minizoom!</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">Hi <strong>{user_name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">Great news! Your account registration has been reviewed and <strong>approved</strong> by the administrator. You can now sign in and start hosting video meetings.</p>
          
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://zoom.minirack.my.id/login" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 14px;">Sign In to Minizoom</a>
          </div>

          <p style="color: #94a3b8; font-size: 13px;">If you have any questions or need assistance, feel free to contact your team administrator.</p>
          <br>
          <p style="color: #64748b; font-size: 12px; margin: 0; border-top: 1px solid #334155; padding-top: 12px;">This is an automated notification from Minizoom Video Conferencing.</p>
        </div>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Minizoom <{sender}>"
    msg["To"] = user_email

    part = MIMEText(html, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(server_host, port, timeout=15)
        server.ehlo()
        server.starttls()
        server.login(username, password)
        server.sendmail(sender, [user_email], msg.as_string())
        server.quit()
        print(f"[SMTP] Account approved notification email sent successfully to {user_email}.")
    except Exception as e:
        print(f"[SMTP] Failed to send account approved email to {user_email}: {e}")
