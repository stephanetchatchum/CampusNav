// Central config — change this one line when we deploy to production
const BASE_URL = "http://127.0.0.1:8000/api"

// Get the JWT token stored after login
export const getToken = () => localStorage.getItem("token")

// Check if a user is currently logged in
export const isLoggedIn = () => !!localStorage.getItem("token")

// Save token after login or register
export const saveToken = (token) => localStorage.setItem("token", token)

// Save user info alongside the token after login or register
export const saveUser = (email, role) => {
  localStorage.setItem("userEmail", email)
  localStorage.setItem("userRole", role)
}

// Read stored user info
export const getUserEmail = () => localStorage.getItem("userEmail")
export const getUserRole = () => localStorage.getItem("userRole")

// Which tier this account has:
// "admin"   — the designated admin account, full access
// "student" — real ALU student or staff email, can book rooms
// "guest"   — everyone else, navigation only
export const getUserTier = () => {
  const role = getUserRole()
  const email = getUserEmail() || ""
  if (role === "admin") return "admin"
  if (email.endsWith("@alustudent.com") || email.endsWith("@alueducation.com")) return "student"
  return "guest"
}

// Remove token and user info when user logs out
export const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userRole")
}

// Ready-made headers for authenticated requests — attaches the JWT token automatically
export const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
})

// Call the register endpoint
export const registerUser = async (email, password, firstName, lastName) => {
  const response = await fetch(`${BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role: "student"
    })
  })
  return response
}

// Call the login endpoint
export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  return response
}

// Request a password reset email
export const forgotPassword = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/forgot-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
  return response
}

// Set a new password using a reset token from the emailed link
export const resetPassword = async (token, password) => {
  const response = await fetch(`${BASE_URL}/auth/reset-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  })
  return response
}