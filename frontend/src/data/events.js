// SAMPLE EVENTS. Replace these with real campus events.
// Dates are relative to today so the list always has upcoming items for a demo.
// Later this list can move to the database and be edited by the admin.
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const inDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}

export const EVENTS = [
  {
    id: 1,
    title: "Career skills workshop",
    date: inDays(0),
    start: "16:00",
    end: "18:00",
    room: "Leadership Center",
    code: "LC-F0-LC",
    category: "Workshop",
    description: "Hands-on session on CVs, interviews and building a professional profile. Bring a laptop.",
  },
  {
    id: 2,
    title: "Guest lecture on agritech in Africa",
    date: inDays(1),
    start: "14:00",
    end: "15:30",
    room: "Egypt",
    code: "SC-F0-EG",
    category: "Lecture",
    description: "A speaker from the agritech sector talks about building products for smallholder farmers.",
  },
  {
    id: 3,
    title: "Entrepreneurship club meetup",
    date: inDays(3),
    start: "17:00",
    end: "19:00",
    room: "Angola",
    code: "EC-F1-AN",
    category: "Club",
    description: "Open meetup for students with startup ideas. Pitch for two minutes and get feedback.",
  },
]