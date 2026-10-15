import { Link, useLocation } from "react-router-dom"
import { getUserTier, isLoggedIn } from "../api"

const HIDE_ON = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]

const ICONS = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  rooms: "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14 12h.01",
  events: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M9 3v4M15 3v4",
  bookings: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  admin: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  settings: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4",
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

// Bottom tab bar. Which tabs show depends on the account type.
function Nav() {
  const { pathname } = useLocation()
  if (HIDE_ON.includes(pathname)) return null

  const tier = isLoggedIn() ? getUserTier() : "guest"
  const canViewRooms = ["student", "admin", "alumni"].includes(tier)
  const canBook = ["student", "admin"].includes(tier)

  const tabs = [{ to: "/", label: "Home", icon: "home" }]
  if (canViewRooms) tabs.push({ to: "/book", label: "Rooms", icon: "rooms" })
  tabs.push({ to: "/events", label: "Events", icon: "events" })
  if (canBook) tabs.push({ to: "/my-bookings", label: "Bookings", icon: "bookings" })
  if (tier === "admin") tabs.push({ to: "/admin", label: "Admin", icon: "admin" })
  tabs.push({ to: "/settings", label: "Settings", icon: "settings" })

  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to))

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-3xl bg-white/95 p-1.5 shadow-lg ring-1 ring-slate-200 backdrop-blur"
    >
      <ul className="flex">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <Link
              to={t.to}
              aria-current={isActive(t.to) ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F] ${
                isActive(t.to) ? "bg-[#003087] text-white" : "text-slate-600"
              }`}
            >
              <Icon name={t.icon} />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Nav
