const BASE_URL = "http://127.0.0.1:8000/api"

export const getToken = () => localStorage.getItem("token")
export const isLoggedIn = () => !!localStorage.getItem("token")
export const saveToken = (token) => localStorage.setItem("token", token)

export const saveUser = (email, role) => {
  localStorage.setItem("userEmail", email)
  localStorage.setItem("userRole", role)
}

export const getUserEmail = () => localStorage.getItem("userEmail")
export const getUserRole = () => localStorage.getItem("userRole")

export const getUserTier = () => {
  const role = getUserRole()
  const email = getUserEmail() || ""
  if (role === "admin") return "admin"
  if (email.endsWith("@alustudent.com") || email.endsWith("@alueducation.com")) return "student"
  return "guest"
}

export const getAccountLabel = () => {
  const role = getUserRole()
  const email = getUserEmail() || ""
  if (role === "admin") return "Admin"
  if (email.endsWith("@alustudent.com")) return "Student"
  if (email.endsWith("@alueducation.com")) return "Staff"
  return "Guest"
}

export const saveRefreshToken = (refresh) => localStorage.setItem("refreshToken", refresh)
export const getRefreshToken = () => localStorage.getItem("refreshToken")

export const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userRole")
}

export const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
})

export const refreshAccessToken = async () => {
  const refresh = getRefreshToken()
  if (!refresh) return false

  const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh })
  })

  if (!response.ok) return false

  const data = await response.json()
  saveToken(data.access)
  return true
}

export const authFetch = async (url, options = {}) => {
  const withAuth = { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } }
  let response = await fetch(url, withAuth)

  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const retryWithAuth = { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } }
      response = await fetch(url, retryWithAuth)
    } else {
      logout()
      window.location.href = "/login"
    }
  }

  return response
}

export const registerUser = async (email, password, firstName, lastName) => {
  const response = await fetch(`${BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName })
  })
  return response
}

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  return response
}

export const forgotPassword = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/forgot-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
  return response
}

export const resetPassword = async (token, password) => {
  const response = await fetch(`${BASE_URL}/auth/reset-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  })
  return response
}

export const verifyEmail = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/verify-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  })
  return response
}

export const resendVerification = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/resend-verification/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
  return response
}