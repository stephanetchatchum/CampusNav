# CampusNav UI/UX update

Unzip this folder over your CampusNav project (same folder structure). It contains only changed or new files, so your .env files, .git and node_modules are not touched. The map (Home.jsx, CampusMap.jsx, navigation) was not edited.

## Frontend
- components/Nav.jsx: top bar replaced by a mobile bottom tab bar. Tabs depend on account type: Home (the map), Rooms, Events, Bookings, Admin, Settings. Hidden on login and sign-up pages.
- components/ProtectedRoute.jsx: new "viewer" tier so alumni can open Rooms.
- App.jsx: Settings replaces Profile (/profile redirects to /settings), rooms routes use the viewer tier, space under pages for the tab bar.
- pages/Settings.jsx (new): profile, help contacts (edit the SUPPORT block), log out. pages/Profile.jsx deleted.
- pages/Events.jsx and data/events.js (new): upcoming events. Sample data, edit events.js.
- pages/Book.jsx, BookRoom.jsx, components/DayTimeline.jsx: rooms list with Free now / In use now, day timeline, no past days, alumni see availability without the booking form.
- components/PageShell.jsx (new): soft ALU-blue gradient page frame.
- Login, Register, ForgotPassword, ResetPassword, VerifyEmail, MyBookings, Admin: new gradient background, rounder cards, tighter padding for phones.
- api/index.js: alumni tier, "Admin / Staff Engineer" label, canBook and canSeeAvailability helpers.

## Backend
- bookings/views.py: room availability now returns 403 for guests (server-side check).

## Not done
- Kenya and Burundi as one class (the map draws two rectangles, needs Stephane first).
- Map "Show on map" link from events (/?room=CODE) until the map reads it.
- Engineer-only out-of-service controls, QR codes and scanner, events in the database.
