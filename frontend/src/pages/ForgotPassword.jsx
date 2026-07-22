import { useState } from "react"
import { forgotPassword } from "../api"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    setMessage("")
    const response = await forgotPassword(email)
    const data = await response.json()
    setLoading(false)
    setMessage(data.message || "If that email is registered, a reset link has been sent.")
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-[#003087] mb-1">CampusNav</h1>
        <p className="text-gray-500 mb-8">Reset your password</p>

        {message ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">
            {message}
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-[#003087]"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full bg-[#003087] text-white rounded-lg p-3 font-semibold hover:bg-[#002060] transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/login" className="text-[#003087] font-semibold hover:underline">← Back to sign in</a>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword