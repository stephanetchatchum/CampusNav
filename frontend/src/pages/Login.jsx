import { useState } from "react"
import { loginUser, saveToken, saveUser } from "../api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    // Clear previous errors and show loading state
    setError("")
    setLoading(true)

    const response = await loginUser(email, password)
    const data = await response.json()

    setLoading(false)

    if (response.ok) {
      // Save the token and user info, then send user to the home page
      saveToken(data.access)
      saveUser(data.email, data.role)
      window.location.href = "/"
    } else {
      setError(data.error || "Invalid email or password")
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">

        {/* Logo / Title */}
        <h1 className="text-3xl font-bold text-[#003087] mb-1">CampusNav</h1>
        <p className="text-gray-500 mb-8">Sign in to your account</p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Email field */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-[#003087]"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {/* Password field */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
        Password
        </label>
        <div className="relative mb-6">
            <input
                className="w-full border border-gray-300 rounded-lg p-3 pr-16 focus:outline-none focus:border-[#003087]"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            {/* Toggle button — shows or hides the password */}
            <button
                type="button"
                className="absolute right-3 top-3 text-sm text-[#003087] font-medium"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? "Hide" : "Show"}
            </button>
        </div>

        {/* Login button */}
        <button
          className="w-full bg-[#003087] text-white rounded-lg p-3 font-semibold hover:bg-[#002060] transition disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-sm mb-4">
          <a href="/forgot-password" className="text-[#003087] font-semibold hover:underline">
            Forgot password?
          </a>
        </p>

        {/* Link to register */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-[#003087] font-semibold hover:underline">
            Create one
          </a>
        </p>

      </div>
    </div>
  )
}

export default Login