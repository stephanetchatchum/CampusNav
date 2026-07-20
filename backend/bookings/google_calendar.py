import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def create_calendar_event(booking):
    """
    Creates a Google Calendar event for a confirmed booking and invites
    the booking user as an attendee. Google emails them the invite and
    the event appears on their calendar automatically as pending.
    """
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )

    service = build("calendar", "v3", credentials=creds)

    event = {
        "summary": f"CampusNav Booking: {booking.room.name}",
        "location": f"{booking.room.name} ({booking.room.code})",
        "description": "Room booked via CampusNav.",
        "start": {
            "dateTime": f"{booking.date}T{booking.start_time}",
            "timeZone": "Africa/Kigali",
        },
        "end": {
            "dateTime": f"{booking.date}T{booking.end_time}",
            "timeZone": "Africa/Kigali",
        },
        "attendees": [
            {"email": booking.user.email},
        ],
    }

    service.events().insert(
        calendarId="primary",
        body=event,
        sendUpdates="all",
    ).execute()