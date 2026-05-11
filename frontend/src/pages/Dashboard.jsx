import AppHeader from "../shared/components/AppHeader";

export default function Dashboard() {
  return (
    <div>
      <AppHeader
        title="Dashboard"
        subtitle="Welcome to Kugrow OS"
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm text-gray-500">
            Today's Sales
          </h3>

          <p className="mt-3 text-3xl font-bold">
            ZMW 12,450
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm text-gray-500">
            Transactions
          </h3>

          <p className="mt-3 text-3xl font-bold">
            124
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm text-gray-500">
            Inventory Alerts
          </h3>

          <p className="mt-3 text-3xl font-bold">
            8
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm text-gray-500">
            Active Staff
          </h3>

          <p className="mt-3 text-3xl font-bold">
            14
          </p>
        </div>
      </div>
    </div>
  );
}