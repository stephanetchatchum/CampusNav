import { Navigate } from "react-router-dom"
import { isLoggedIn, getUserTier } from "../api"

// tier: minimum access level this route requires.
// "student" — must be a real ALU student/staff account, or admin
// "admin"   — must be the designated admin account
// omitted   — just needs to be logged in, any tier allowed
function ProtectedRoute({ children, tier }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  const userTier = getUserTier()

  if (tier === "admin" && userTier !== "admin") {
    return <Navigate to="/" replace />
  }

  if (tier === "student" && userTier !== "student" && userTier !== "admin") {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute