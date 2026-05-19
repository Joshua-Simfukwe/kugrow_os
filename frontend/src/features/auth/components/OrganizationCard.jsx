import MaterialSymbol from "../../../shared/components/MaterialSymbol";

export default function OrganizationCard({
  role,
  organizationType,
  name,
  onClick,
}) {
  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <MaterialSymbol
            name={organizationType === "education" ? "school" : "storefront"}
            className="text-[2rem]"
            weight={300}
            opticalSize={40}
          />
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
          {role}
        </span>
      </div>

      <div className="mt-8">
        <h3 className="text-3xl font-black uppercase tracking-tight text-slate-950">
          {name}
        </h3>

        <p className="mt-3 text-base capitalize text-slate-500">
          {organizationType}
        </p>
      </div>

      <button
        onClick={onClick}
        className="mt-8 w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
      >
        SELECT
      </button>
    </div>
  );
}
