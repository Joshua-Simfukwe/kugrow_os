import { useEffect, useState } from "react";

import { useAuth } from "../features/auth/context/useAuth";
import { apiClient } from "../lib/api";
import AppHeader from "../shared/components/AppHeader";

function DashboardCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DashboardTable({ title, rows }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Live
        </span>
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${title}-${index}`}
              className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{row.label}</p>
                {row.subtext && (
                  <p className="mt-1 text-xs text-slate-500">{row.subtext}</p>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-700">{row.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          No records to show yet.
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadSummary() {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/finance/dashboard/summary/");
        if (!isActive) {
          return;
        }
        setSummary(response.data);
      } catch (requestError) {
        if (!isActive) {
          return;
        }
        setError(
          requestError.response?.data?.detail ??
            "We could not load the latest dashboard summary.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isActive = false;
    };
  }, [user?.profile?.active_organization?.id]);

  const organizationType = summary?.organization_type;
  const subtitle =
    organizationType === "education"
      ? "Fees, enrollment, and class visibility for your school"
      : "Sales, cash, and inventory visibility for your business";

  return (
    <div className="space-y-6">
      <AppHeader title="Dashboard" subtitle={subtitle} />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading dashboard summary...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {(summary?.headline_metrics ?? []).map((metric) => (
              <DashboardCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {(summary?.tables ?? []).map((table) => (
              <DashboardTable
                key={table.title}
                title={table.title}
                rows={table.rows ?? []}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
