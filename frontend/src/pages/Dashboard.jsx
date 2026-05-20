import { useEffect, useMemo, useState } from "react";

import { apiClient } from "../lib/api";
import { useAuth } from "../features/auth/context/useAuth";
import AppHeader from "../shared/components/AppHeader";
import MaterialSymbol from "../shared/components/MaterialSymbol";
import SimpleLineChart from "../shared/components/SimpleLineChart";

function RetailSectionCard({ title, children, accent = "slate" }) {
  const accentClass =
    accent === "amber"
      ? "border-amber-300"
      : accent === "rose"
        ? "border-rose-300"
        : "border-slate-200";

  return (
    <section className={`rounded-[2rem] border ${accentClass} bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]`}>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function GrowthCard({ card }) {
  const positive = card.tone === "positive";

  return (
    <div
      className={`rounded-[1.6rem] px-5 py-5 ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <p className="text-sm">{card.label}</p>
      <p className="mt-3 text-4xl font-bold">
        {positive ? "+" : ""}
        {card.value}%
      </p>
    </div>
  );
}

function EducationMetricCard({ item, index }) {
  const iconNames = ["school", "apartment", "storefront", "groups", "schedule"];
  const toneClasses = [
    "bg-blue-50 text-blue-700",
    "bg-slate-100 text-slate-900",
    "bg-emerald-50 text-emerald-700",
    "bg-amber-50 text-amber-700",
    "bg-cyan-50 text-cyan-700",
  ];

  return (
    <div className="rounded-[1.75rem] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${toneClasses[index % toneClasses.length]}`}>
          <MaterialSymbol name={iconNames[index % iconNames.length]} className="text-[1.5rem]" />
        </div>
        <MaterialSymbol name="arrow_forward" className="text-[1.2rem] text-slate-300" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{item.label}</p>
      <p className="mt-2 text-[1.75rem] font-bold tracking-tight text-slate-950">{item.value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">{item.note ?? ""}</p>
    </div>
  );
}

function getEducationActionIcon(label) {
  switch (label) {
    case "Record Fee Payment":
      return "schedule";
    case "Print Receipt":
      return "storefront";
    case "Print Unpaid Balances":
      return "apartment";
    case "Add Pupil":
      return "school";
    case "Payment History":
      return "schedule";
    case "Sell Uniform":
      return "storefront";
    default:
      return "apartment";
  }
}

function EducationQuickActionCard({ action }) {
  const isPrimary = action.tone === "primary";
  const isAvailable = Boolean(action.available);

  return (
    <button
      type="button"
      disabled={!isAvailable}
      className={`flex min-h-[7.8rem] items-center justify-between rounded-[1.75rem] border p-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition ${
        isPrimary
          ? "border-blue-600 bg-gradient-to-r from-[#1F6BFF] to-[#1557F7] text-white"
          : "border-slate-200 bg-white text-slate-950"
      } ${!isAvailable ? "cursor-not-allowed opacity-80" : "hover:-translate-y-1"}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${
            isPrimary ? "bg-white/15 text-white" : "bg-slate-100 text-blue-600"
          }`}
        >
          <MaterialSymbol name={getEducationActionIcon(action.label)} className="text-[1.5rem]" />
        </div>
        <div>
          <p className="text-base font-bold">{action.label}</p>
          <p className={`mt-1 text-xs font-semibold ${isPrimary ? "text-white/75" : "text-slate-500"}`}>
            {action.caption}
          </p>
        </div>
      </div>
      {isAvailable ? (
        <MaterialSymbol
          name="arrow_forward"
          className={`text-[1.4rem] ${isPrimary ? "text-white" : "text-slate-300"}`}
        />
      ) : (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Soon
        </span>
      )}
    </button>
  );
}

function EducationPanel({ title, children }) {
  return (
    <section className="rounded-[1.9rem] border border-slate-200/90 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-[1.15rem] font-bold tracking-tight text-slate-950">{title}</h3>
        <button className="text-sm font-semibold text-blue-600">View all</button>
      </div>
      {children}
    </section>
  );
}

function EducationRow({ row }) {
  const valueClassName =
    row.tone === "warning"
      ? "text-amber-700"
      : row.tone === "positive"
        ? "text-emerald-700"
        : "text-slate-950";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.15rem] bg-[#f7faff] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{row.label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{row.subtext}</p>
      </div>
      <p className={`shrink-0 text-sm font-bold ${valueClassName}`}>{row.value}</p>
    </div>
  );
}

function EducationDashboard({ summary, organizationName }) {
  const overview = summary?.overview ?? {};
  const quickActions = summary?.quick_actions ?? [];
  const unpaidRows = useMemo(
    () => summary?.tables?.find((table) => table.title === "Unpaid Balances")?.rows ?? [],
    [summary],
  );
  const recentRows = useMemo(
    () => summary?.tables?.find((table) => table.title === "Recent Fee Payments")?.rows ?? [],
    [summary],
  );
  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-ZM", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white/78 px-6 py-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur-[10px] sm:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-blue-600">
              Education Dashboard
            </p>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.65rem]">
              {overview.school_name ?? organizationName}
            </h1>
            <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-slate-500 sm:text-[1.05rem]">
              School finance and operations at a glance. Track collections, unpaid balances,
              and daily bursar activity from one place.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
            <MaterialSymbol name="schedule" className="text-[1.2rem] text-blue-600" />
            {currentDateLabel}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {(summary?.headline_metrics ?? []).map((item, index) => (
          <EducationMetricCard key={item.label} item={item} index={index} />
        ))}
      </section>

      <section className="rounded-[1.9rem] border border-white/80 bg-white/72 px-6 py-6 shadow-[0_20px_52px_rgba(15,23,42,0.07)] backdrop-blur-[10px]">
        <div className="mb-4">
          <h2 className="text-[1.2rem] font-bold tracking-tight text-slate-950">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Bursar, administrator, and authorized users can manage school collections and receipts here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <EducationQuickActionCard key={action.label} action={action} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <EducationPanel title="Unpaid Balances">
          {unpaidRows.length ? (
            <div className="space-y-3">
              {unpaidRows.map((row) => (
                <EducationRow key={`${row.label}-${row.subtext}`} row={row} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.15rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No unpaid balances yet.
            </div>
          )}
        </EducationPanel>

        <EducationPanel title="Recent Payments">
          {recentRows.length ? (
            <div className="space-y-3">
              {recentRows.map((row) => (
                <EducationRow key={`${row.label}-${row.subtext}`} row={row} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.15rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No fee payments have been recorded yet.
            </div>
          )}
        </EducationPanel>
      </section>
    </div>
  );
}

function RetailDashboard({ summary, isLoading, error }) {
  const positionRows = useMemo(
    () => summary?.tables?.find((table) => table.title === "Business Position")?.rows ?? [],
    [summary],
  );
  const topSellingRows = useMemo(
    () => summary?.tables?.find((table) => table.title === "Top Selling Products")?.rows ?? [],
    [summary],
  );

  return (
    <div className="space-y-6">
      <AppHeader
        title="Retail Dashboard"
        subtitle="Decision-ready financial and operational visibility"
      />

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading dashboard summary...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          {summary?.spending_safety && (
            <RetailSectionCard title="Spending Safety" accent="amber">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-slate-500">Available to spend today</p>
                  <p className="mt-3 text-5xl font-bold text-emerald-600">
                    {summary.spending_safety.available_to_spend}
                  </p>
                </div>
                <div className="rounded-[1.6rem] border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                  {summary.spending_safety.message}
                </div>
                {!!summary.upcoming?.length && (
                  <div>
                    <p className="text-xl font-semibold text-slate-900">
                      Non-negotiable upcoming
                    </p>
                    <div className="mt-4 space-y-4">
                      {summary.upcoming.map((item) => (
                        <div key={`${item.title}-${item.subtext}`} className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-medium text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.subtext}</p>
                          </div>
                          <p className="text-2xl font-semibold text-slate-900">{item.amount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </RetailSectionCard>
          )}

          {!!summary?.alerts?.length && (
            <RetailSectionCard title="Alerts" accent="rose">
              <div className="space-y-4">
                {summary.alerts.map((alert, index) => (
                  <div
                    key={`${alert.title}-${index}`}
                    className={`rounded-[1.4rem] px-5 py-4 ${
                      alert.tone === "warning"
                        ? "bg-amber-50 text-amber-900"
                        : "bg-rose-50 text-rose-900"
                    }`}
                  >
                    <p className="text-xl font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm opacity-80">{alert.description}</p>
                  </div>
                ))}
              </div>
            </RetailSectionCard>
          )}

          {summary?.growth && (
            <RetailSectionCard title="Are You Growing?">
              <div className="grid gap-4 md:grid-cols-2">
                {summary.growth.cards.map((card) => (
                  <GrowthCard key={card.label} card={card} />
                ))}
              </div>
              <div className="mt-6">
                <SimpleLineChart points={summary.growth.points ?? []} />
              </div>
            </RetailSectionCard>
          )}

          {summary?.debt && (
            <RetailSectionCard title="Debt Exposure">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] bg-rose-50 px-5 py-5">
                  <p className="text-sm text-rose-500">Total debt exposure</p>
                  <p className="mt-3 text-5xl font-bold text-rose-600">{summary.debt.total}</p>
                </div>
                <div className="rounded-[1.6rem] border-l-4 border-blue-500 bg-blue-50 px-5 py-4 text-sm text-blue-800">
                  {summary.debt.message}
                </div>
              </div>
            </RetailSectionCard>
          )}

          {!!summary?.upcoming?.length && (
            <RetailSectionCard title="Upcoming">
              <div className="space-y-4">
                {summary.upcoming.map((item) => (
                  <div
                    key={`${item.title}-${item.subtext}`}
                    className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-4"
                  >
                    <div>
                      <p className="text-xl font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-amber-700">{item.subtext}</p>
                    </div>
                    <p className="text-3xl font-semibold text-slate-900">{item.amount}</p>
                  </div>
                ))}
              </div>
            </RetailSectionCard>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <RetailSectionCard title="Business Position">
              <div className="divide-y divide-slate-200">
                {positionRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-4">
                    <p className="text-lg text-slate-700">{row.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{row.value}</p>
                  </div>
                ))}
              </div>
            </RetailSectionCard>

            <RetailSectionCard title="Top Selling Products">
              {topSellingRows.length ? (
                <div className="space-y-4">
                  {topSellingRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 rounded-[1.4rem] bg-slate-50 px-5 py-4"
                    >
                      <p className="text-lg font-medium text-slate-900">{row.label}</p>
                      <p className="text-2xl font-semibold text-blue-700">{row.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                  No sales yet to rank products.
                </div>
              )}
            </RetailSectionCard>
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    apiClient
      .get("/finance/dashboard/summary/")
      .then((response) => {
        if (!isActive) {
          return;
        }
        setSummary(response.data);
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }
        setError(
          requestError.response?.data?.detail ??
            "We could not load the latest dashboard summary.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (summary?.organization_type === "education") {
    return (
      <>
        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            Loading school dashboard...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : (
          <EducationDashboard
            summary={summary}
            organizationName={user?.profile?.active_organization?.name ?? "School Workspace"}
          />
        )}
      </>
    );
  }

  return <RetailDashboard summary={summary} isLoading={isLoading} error={error} />;
}
