export default function AuthShell({
  children,
  cardWidthClassName = "max-w-[31rem]",
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf4ff_48%,#eaf1ff_100%)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12)_0%,rgba(37,99,235,0.03)_35%,rgba(37,99,235,0)_72%)]" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.22)_0%,rgba(191,219,254,0.08)_40%,rgba(219,234,254,0)_74%)] blur-[2px]" />
        <div className="absolute right-[-6rem] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,rgba(191,219,254,0.04)_44%,rgba(219,234,254,0)_74%)]" />
        <div className="absolute bottom-10 right-10 grid grid-cols-4 gap-2 opacity-60">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-blue-300/80" />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 h-40 w-72 rounded-tr-[8rem] border-t border-r border-blue-100/80 opacity-80" />
      </div>

      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className={`w-full ${cardWidthClassName}`}>
          <div className="rounded-[2rem] border border-white/80 bg-white/88 px-6 py-8 shadow-[0_32px_90px_rgba(15,23,42,0.14)] backdrop-blur-[10px] sm:px-9 sm:py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
