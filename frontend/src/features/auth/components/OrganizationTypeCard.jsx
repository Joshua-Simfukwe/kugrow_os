export default function OrganizationTypeCard({
  title,
  description,
  selected,
  onClick,
}) {
  const isRetail = title.toLowerCase() === "retail";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-[1.6rem] border bg-white px-6 py-7 text-center shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition
        ${
          selected
            ? "border-blue-500 ring-4 ring-blue-100"
            : "border-slate-200 hover:border-blue-300"
        }
      `}
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {isRetail ? (
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
            <path d="M4 8.75 5.4 4h13.2L20 8.75V10a2.75 2.75 0 0 1-1 2.13V20H5v-7.87A2.75 2.75 0 0 1 4 10V8.75Zm3 .75V18h10V9.5H7Zm1.3-3.5-.59 2h8.58l-.59-2H8.3Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
            <path d="M12 3 2 8.5 12 14l8-4.4V17h2V8.5L12 3Zm-6 9.4V16l6 3.3 6-3.3v-3.6L12 16l-6-3.6Z" />
          </svg>
        )}
      </div>

      <h3 className="text-[2rem] font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-base leading-7 text-slate-600">
        {description}
      </p>
    </button>
  );
}
