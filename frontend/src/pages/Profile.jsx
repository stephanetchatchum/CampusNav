function Profile() {
  const user = {
    name: "Dorcase Lesly",
    email: "d.nanatoun@alustudent.com",
    role: "Student"
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">My Profile</h1>
      <div className="bg-white shadow rounded-lg p-6 max-w-md">
        <p className="text-gray-500 text-sm">Name</p>
        <p className="text-xl font-semibold mb-4">{user.name}</p>
        <p className="text-gray-500 text-sm">Email</p>
        <p className="text-xl font-semibold mb-4">{user.email}</p>
        <p className="text-gray-500 text-sm">Role</p>
        <p className="text-xl font-semibold">{user.role}</p>
      </div>
    </div>
  )
}

export default Profile