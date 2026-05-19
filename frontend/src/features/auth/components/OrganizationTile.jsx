import MaterialSymbol from "../../../shared/components/MaterialSymbol";

function Badge({ children, tone = "blue" }) {
  const toneClasses =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-blue-50 text-blue-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.04em] ${toneClasses}`}>
      {children}
    </span>
  );
}

export default function OrganizationTile({
  organization,
  onSelect,
  isLoading = false,
}) {
  const isEducation = organization.organization_type === "education";
  const roleBadgeLabel = organization.role === "owner" ? "Owner" : "Joined";
  const roleBadgeTone = organization.role === "owner" ? "blue" : "green";
  const description = isEducation
    ? "Education management and finance"
    : "Retail operations and inventory";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLoading}
      className="flex min-h-[9.6rem] w-full items-center gap-4 rounded-[1.6rem] border border-slate-200/90 bg-white px-5 py-5 text-left shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_54px_rgba(15,23,42,0.11)] disabled:cursor-wait disabled:opacity-70"
    >
      <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-blue-50 to-slate-50">
        {isEducation ? (
          <MaterialSymbol name="school" className="text-[2.6rem] text-blue-600" weight={300} opticalSize={48} />
        ) : (
          <MaterialSymbol name="storefront" className="text-[2.6rem] text-blue-600" weight={300} opticalSize={48} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[1.15rem] font-bold tracking-tight text-slate-950 sm:text-[1.4rem]">
            {organization.name}
          </h3>
          <Badge tone={roleBadgeTone}>{roleBadgeLabel}</Badge>
        </div>
        <p className="mt-1.5 text-[0.92rem] leading-6 text-slate-500 sm:text-[0.96rem]">{description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[0.9rem] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <MaterialSymbol name="groups" className="text-[1rem]" />
            {organization.member_count} {organization.member_count === 1 ? "member" : "members"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <MaterialSymbol name="schedule" className="text-[1rem]" />
            Ready to open
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {isLoading ? (
          <span className="text-sm font-medium text-blue-600">Opening...</span>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MaterialSymbol name="arrow_forward" className="text-[1.5rem]" />
          </span>
        )}
      </div>
    </button>
  );
}
