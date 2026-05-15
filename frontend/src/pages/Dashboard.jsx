import { useEffect, useMemo, useState } from "react";

import { apiClient } from "../lib/api";
import AppHeader from "../shared/components/AppHeader";
import SimpleLineChart from "../shared/components/SimpleLineChart";

function SectionCard({ title, children, accent = "slate" }) {
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

export default function Dashboard() {
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
            <SectionCard title="Spending Safety" accent="amber">
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
            </SectionCard>
          )}

          {!!summary?.alerts?.length && (
            <SectionCard title="Alerts" accent="rose">
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

          {summary?.growth && (
            <SectionCard title="Are You Growing?">
              <div className="grid gap-4 md:grid-cols-2">
                {summary.growth.cards.map((card) => (
                  <GrowthCard key={card.label} card={card} />
                ))}
              </div>
              <div className="mt-6">
                <SimpleLineChart points={summary.growth.points ?? []} />
              </div>
            </SectionCard>
          )}

          {summary?.debt && (
            <SectionCard title="Debt Exposure">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] bg-rose-50 px-5 py-5">
                  <p className="text-sm text-rose-500">Total debt exposure</p>
                  <p className="mt-3 text-5xl font-bold text-rose-600">{summary.debt.total}</p>
                </div>
                <div className="rounded-[1.6rem] border-l-4 border-blue-500 bg-blue-50 px-5 py-4 text-sm text-blue-800">
                  {summary.debt.message}
                </div>
              </div>
            </SectionCard>
          )}

          {!!summary?.upcoming?.length && (
            <SectionCard title="Upcoming">
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
            </SectionCard>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Business Position">
              <div className="divide-y divide-slate-200">
                {positionRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-4">
                    <p className="text-lg text-slate-700">{row.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{row.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top Selling Products">
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
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
