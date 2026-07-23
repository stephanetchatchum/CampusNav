import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { verifyEmail } from "../api"

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus("error")
        setMessage("This verification link is invalid.")
        return
      }
      try {
        const response = await verifyEmail(token)
        const data = await response.json()
        if (response.ok) {
          setStatus("success")
          setMessage(data.message)
        } else {
          setStatus("error")
          setMessage(data.error || "This verification link is invalid or has expired.")
        }
      } catch (err) {
        setStatus("error")
        setMessage("Could not reach the server. Please try again.")
      }
    }
    run()
  }, [token])

  return (
    <div className="min-h-screen bg-[#EFF4FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-[#003087] mb-1">CampusNav</h1>
        <p className="text-gray-500 mb-8">Email verification</p>

        {status === "verifying" && <p className="text-gray-500">Verifying...</p>}

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm">
            {message}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/login" className="text-[#003087] font-semibold hover:underline">← Back to sign in</a>
        </p>
      </div>
    </div>
  )
}

export default VerifyEmail