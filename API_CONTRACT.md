# CampusNav API Contract

## Base URL
http://localhost:8000/api

---

## Auth Endpoints (Dorcase owns)

### POST /users/register
**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "student | admin"
}
```
**Response:** `201` - User created

### POST /users/login
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:** `200` - Returns JWT token

---

## Booking Endpoints (Dorcase owns)

### GET /bookings/
**Response:** List of all bookings

### POST /bookings/
**Body:**
```json
{
  "room_id": "number",
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM"
}
```
**Response:** `201` - Booking created

### DELETE /bookings/{id}/
**Response:** `204` - Booking cancelled

---

## Room Endpoints (Stephane owns)

### GET /rooms/
**Response:** List of all rooms

### GET /rooms/{id}/
**Response:** Single room details