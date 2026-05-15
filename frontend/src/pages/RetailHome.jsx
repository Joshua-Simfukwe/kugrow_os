import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppHeader from "../shared/components/AppHeader";
import { apiClient } from "../lib/api";

function formatToneClasses(tone) {
  if (tone === "success") {
    return "bg-emerald-500 text-white hover:bg-emerald-600";
  }
  if (tone === "secondary") {
    return "border border-blue-300 bg-white text-blue-700 hover:bg-blue-50";
  }
  return "bg-blue-600 text-white hover:bg-blue-700";
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function RetailHome() {
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
            "We could not load the retail workspace summary.",
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

  const positionRows = useMemo(
    () => summary?.tables?.find((table) => table.title === "Business Position")?.rows ?? [],
    [summary],
  );

  return (
    <div className="space-y-6">
      <AppHeader
        title="Retail Home"
        subtitle="Fast daily visibility for your store"
      />

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading your store workspace...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(summary?.quick_actions ?? []).map((action) => (
              <Link
                key={action.route}
                to={action.route}
                className={`rounded-[1.6rem] px-6 py-5 text-center text-2xl font-semibold shadow-[0_12px_26px_rgba(37,99,235,0.18)] transition ${formatToneClasses(action.tone)}`}
              >
                {action.label}
              </Link>
            ))}
          </div>

          <SectionCard title="Today Performance">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {(summary?.headline_metrics ?? []).map((metric) => (
                <div key={metric.label}>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold text-slate-900">{metric.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Business Position">
            <div className="divide-y divide-slate-200">
              {positionRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <p className="text-lg text-slate-700">{row.label}</p>
                  <p className="text-2xl font-semibold text-slate-900">{row.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {summary?.spending_safety && (
            <SectionCard title="Spending Safety">
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
              </div>
            </SectionCard>
          )}

          {!!summary?.alerts?.length && (
            <SectionCard title="Alerts">
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
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
