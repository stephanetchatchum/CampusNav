# CampusNav API Contract

## Base URL
http://localhost:8000/api

---

## Auth Endpoints (Dorcase owns)

### POST /auth/register/
**Body:**
```json
{
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "student | admin"
}
```

### POST /auth/login/
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200` - Returns JWT access and refresh tokens

---

## Booking Endpoints (Dorcase owns)

### GET /bookings/
**Auth required:** Yes (JWT token)
**Response:** List of all bookings (admin use)

### GET /bookings/mine/
**Auth required:** Yes (JWT token)
**Response:** List of bookings belonging to the logged-in user only

### POST /bookings/
**Auth required:** Yes (JWT token)
**Body:**
```json
{
  "room": "number",
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM"
}
```
**Response:** `201` - Booking created (status: pending)

### PATCH /bookings/{id}/status/
**Auth required:** Yes (admin only)
**Body:**
```json
{ "status": "approved | cancelled" }
```
**Response:** `200` - Booking status updated

---

## Room Endpoints (Stephane owns)

### GET /rooms/
**Response:** List of all rooms with real-time availability

### GET /rooms/{id}/
**Response:** Single room details with today's booking schedule