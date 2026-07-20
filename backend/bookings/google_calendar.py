import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _get_calendar_service():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("calendar", "v3", credentials=creds)


def create_calendar_event(booking):
    """
    Creates a Google Calendar event for a confirmed booking and invites
    the booking user as an attendee. Returns the created event's ID so
    it can be deleted later if the booking is cancelled.
    """
    service = _get_calendar_service()

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

    created = service.events().insert(
        calendarId="primary",
        body=event,
        sendUpdates="all",
    ).execute()

    return created.get("id")


def delete_calendar_event(event_id):
    """
    Deletes a previously created event, e.g. when a booking is cancelled.
    Notifies attendees of the cancellation.
    """
    service = _get_calendar_service()
    service.events().delete(
        calendarId="primary",
        eventId=event_id,
        sendUpdates="all",
    ).execute()