export default function AppHeader({
  title,
  subtitle,
}) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="
            rounded-xl border border-gray-300
            bg-white px-4 py-2 text-sm
            transition hover:bg-gray-50
          "
        >
          Notifications
        </button>

        <button
          className="
            rounded-xl bg-black
            px-4 py-2 text-sm text-white
            transition hover:opacity-90
          "
        >
          Joshua
        </button>
      </div>
    </header>
  );
}