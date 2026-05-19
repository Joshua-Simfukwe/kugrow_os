import MaterialSymbol from "../../../shared/components/MaterialSymbol";

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
          <MaterialSymbol name="storefront" className="text-[2.5rem]" weight={300} opticalSize={40} />
        ) : (
          <MaterialSymbol name="school" className="text-[2.5rem]" weight={300} opticalSize={40} />
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
