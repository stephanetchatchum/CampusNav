import { Link, useLocation } from "react-router-dom"
import { isLoggedIn, logout, getUserTier } from "../api"

function Nav() {
  const location = useLocation()
  const tier = getUserTier()

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg font-medium ${
      location.pathname === path
        ? "bg-[#003087] text-white"
        : "text-[#003087] hover:bg-[#EFF4FA]"
    }`

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center gap-2">
      <Link to="/" className={linkClass("/")}>Map</Link>

      {/* Booking features are only for real ALU student and staff accounts */}
      {(tier === "student" || tier === "admin") && (
        <>
          <Link to="/book" className={linkClass("/book")}>Book a Room</Link>
          <Link to="/my-bookings" className={linkClass("/my-bookings")}>My Bookings</Link>
        </>
      )}

      <Link to="/profile" className={linkClass("/profile")}>Profile</Link>

      {/* Admin panel is only for the designated admin account */}
      {tier === "admin" && (
        <Link to="/admin" className={linkClass("/admin")}>Admin</Link>
      )}

      <div className="ml-auto">
        {isLoggedIn() ? (
          <button onClick={handleLogout} className="px-3 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg">
            Log Out
          </button>
        ) : (
          <Link to="/login" className={linkClass("/login")}>Log In</Link>
        )}
      </div>
    </nav>
  )
}

export default Nav