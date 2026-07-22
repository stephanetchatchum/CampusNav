import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { resetPassword } from "../api"

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setError("")

    if (!token) {
      setError("This reset link is invalid. Please request a new one.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const response = await resetPassword(token, password)
    const data = await response.json()
    setLoading(false)

    if (response.ok) {
      setSuccess(true)
    } else {
      setError(data.error || "Something went wrong. Please request a new reset link.")
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-[#003087] mb-1">CampusNav</h1>
        <p className="text-gray-500 mb-8">Choose a new password</p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">
            Password reset successful.{" "}
            <button onClick={() => navigate("/login")} className="font-semibold underline">
              Sign in now
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-[#003087]"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:outline-none focus:border-[#003087]"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#003087] text-white rounded-lg p-3 font-semibold hover:bg-[#002060] transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword