// Shared page frame: soft ALU-blue gradient at the top fading to near white,
// with bottom padding so content clears a bottom tab bar.
export default function PageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C9D8F2] via-[#E6EDF9] to-[#F4F7FB] pb-6">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <h1 className="text-2xl font-semibold text-[#003087]">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-700">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}