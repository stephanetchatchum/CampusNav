import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _get_gmail_service():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("gmail", "v1", credentials=creds)


def send_password_reset_email(to_email, reset_link):
    """
    Sends a password reset email via Gmail, using the same Google
    account already authorized for Calendar sync.
    """
    service = _get_gmail_service()

    body = (
        "Hello,\n\n"
        "We received a request to reset your CampusNav password.\n\n"
        f"Click the link below to choose a new password:\n{reset_link}\n\n"
        "This link expires in 1 hour. If you didn't request this, "
        "you can safely ignore this email.\n\n"
        "- CampusNav"
    )

    message = MIMEText(body)
    message["to"] = to_email
    message["subject"] = "Reset your CampusNav password"

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    service.users().messages().send(userId="me", body={"raw": raw}).execute()

def send_verification_email(to_email, verify_link):
    """
    Sends an email verification link via Gmail, using the same
    Google account already authorized for Calendar and password reset.
    """
    service = _get_gmail_service()

    body = (
        "Hello,\n\n"
        "Thanks for creating a CampusNav account. Click the link below "
        "to verify your email and activate your account:\n\n"
        f"{verify_link}\n\n"
        "This link expires in 24 hours.\n\n"
        "- CampusNav"
    )

    message = MIMEText(body)
    message["to"] = to_email
    message["subject"] = "Verify your CampusNav account"

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(userId="me", body={"raw": raw}).execute()