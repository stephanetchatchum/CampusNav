import { useNavigate } from "react-router-dom"
import PageShell from "../components/PageShell"
import { getUserEmail, getAccountLabel, isLoggedIn, logout } from "../api"

// Fill these in. Empty values are hidden automatically.
const SUPPORT = {
  email: "alucampusnav@gmail.com",
  phone: "",
  note: "We usually reply within one working day.",
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 font-semibold text-[#003087]">{title}</h2>
      {children}
    </section>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const email = getUserEmail() || "Not available"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <PageShell title="Settings">
      <div className="flex flex-col gap-4">
        {loggedIn ? (
          <Card title="Profile">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#003087] text-xl font-semibold text-white"
              >
                {email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="break-all font-semibold text-[#0F1B33]">{email}</p>
                <p className="text-sm text-slate-600">{getAccountLabel()}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Account">
            <p className="text-slate-700">You're not signed in.</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 min-h-12 rounded-lg bg-[#003087] px-6 font-semibold text-white hover:bg-[#002060]"
            >
              Sign in
            </button>
          </Card>
        )}

        <Card title="Help with CampusNav">
          <p className="text-sm text-slate-600">
            Something not working, or a room shown wrongly? Contact us.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {SUPPORT.email && (
              <li>
                <a
                  href={`mailto:${SUPPORT.email}`}
                  className="flex min-h-12 items-center rounded-lg bg-[#EAF0FB] px-4 font-medium text-[#003087]"
                >
                  {SUPPORT.email}
                </a>
              </li>
            )}
            {SUPPORT.phone && (
              <li>
                <a
                  href={`tel:${SUPPORT.phone}`}
                  className="flex min-h-12 items-center rounded-lg bg-[#EAF0FB] px-4 font-medium text-[#003087]"
                >
                  {SUPPORT.phone}
                </a>
              </li>
            )}
          </ul>
          {SUPPORT.note && <p className="mt-3 text-sm text-slate-500">{SUPPORT.note}</p>}
        </Card>

        {loggedIn && (
          <button
            onClick={handleLogout}
            className="min-h-12 rounded-lg bg-white font-semibold text-[#C62828] ring-1 ring-red-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828]"
          >
            Log out
          </button>
        )}
      </div>
    </PageShell>
  )
}