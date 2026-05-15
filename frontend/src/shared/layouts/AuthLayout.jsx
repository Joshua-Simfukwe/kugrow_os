export default function AuthLayout({
  title,
  subtitle,
  theme = "default",
  containerClassName = "",
  cardClassName = "",
  contentClassName = "",
  children,
}) {
  const themeMap = {
    default: "from-slate-100 via-white to-slate-100",
    login: "from-blue-100 via-slate-50 to-blue-200",
    signup: "from-fuchsia-100 via-rose-50 to-purple-100",
    createOrganization: "from-teal-100 via-emerald-50 to-cyan-100",
    organizationSelect: "from-amber-100 via-yellow-50 to-orange-100",
    joinOrganization: "from-sky-100 via-cyan-50 to-indigo-100",
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${themeMap[theme]} px-4 py-8`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-5rem] h-56 w-56 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-72 w-72 rounded-full bg-white/35 blur-3xl" />
      </div>

      <div className={`relative mx-auto flex min-h-[calc(100vh-4rem)] w-full items-center justify-center ${containerClassName}`}>
        <div
          className={`w-full rounded-[2rem] border border-white/70 bg-white/92 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur sm:p-10 ${cardClassName}`}
        >
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-950">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-3 text-lg text-slate-600">
                {subtitle}
              </p>
            )}
          </div>

          <div className={contentClassName}>{children}</div>
        </div>
      </div>

      <button className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white/90 text-lg font-semibold text-slate-600 shadow-sm">
        ?
      </button>
    </div>
  );
}
