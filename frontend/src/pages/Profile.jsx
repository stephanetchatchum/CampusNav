import { getUserEmail, getAccountLabel } from "../api"

function Profile() {
  const email = getUserEmail() || "Not available"
  const label = getAccountLabel()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">My Profile</h1>
      <div className="bg-white shadow rounded-lg p-6 max-w-md">
        <p className="text-gray-500 text-sm">Email</p>
        <p className="text-xl font-semibold mb-4">{email}</p>
        <p className="text-gray-500 text-sm">Account Type</p>
        <p className="text-xl font-semibold">{label}</p>
      </div>
    </div>
  )
}

export default Profile