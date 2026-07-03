import { useState } from "react"
import { registerUser, saveToken } from "../api"

function Register() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async () => {
    setError("")
    setLoading(true)

    const response = await registerUser(email, password, firstName, lastName)
    const data = await response.json()

    setLoading(false)

    if (response.ok) {
      // Save token and send straight to home — no need to log in separately
      saveToken(data.access)
      window.location.href = "/"
    } else {
      setError(data.error || "Registration failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-[#003087] mb-1">CampusNav</h1>
        <p className="text-gray-500 mb-8">Create your ALU account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* First and last name side by side */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#003087]"
              placeholder="Dorcase"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#003087]"
              placeholder="Lesly"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">ALU Email</label>
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-[#003087]"
          type="email"
          placeholder="you@alustudent.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
        </label>
        <div className="relative mb-6">
            <input
                className="w-full border border-gray-300 rounded-lg p-3 pr-16 focus:outline-none focus:border-[#003087]"
                type={showPassword ? "text" : "password"}
                placeholder="Choose a password"
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

        <button
          className="w-full bg-[#003087] text-white rounded-lg p-3 font-semibold hover:bg-[#002060] transition disabled:opacity-50"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#003087] font-semibold hover:underline">
            Sign in
          </a>
        </p>

      </div>
    </div>
  )
}

export default Register