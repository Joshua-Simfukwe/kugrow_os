import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import KugrowLogo from "../components/KugrowLogo";
import OrganizationTile from "../components/OrganizationTile";
import { useAuth } from "../context/useAuth";
import { getWorkspaceRoute, hasModuleAccess } from "../utils/authRoutes";
import MaterialSymbol from "../../../shared/components/MaterialSymbol";

function EmptyOrganizationsState() {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200/85 bg-white px-8 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-slate-50">
        <MaterialSymbol name="apartment" className="text-[3.35rem] text-blue-600" weight={300} opticalSize={48} />
      </div>
      <h2 className="mt-6 text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.6rem]">
        No Organizations Yet
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[0.98rem] leading-7 text-slate-500 sm:text-[1.05rem]">
        Create your first organization or join an existing one.
      </p>
    </div>
  );
}

export default function OrganizationSelectPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser, selectOrganization } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [error, setError] = useState("");
  const organizations = user?.organizations ?? [];
  const firstName = useMemo(
    () => user?.profile?.full_name?.trim()?.split(/\s+/)?.[0] ?? "there",
    [user],
  );
  const canOpenSettings = Boolean(
    user?.profile?.active_organization && hasModuleAccess(user, "settings"),
  );
  const profileInitial = firstName.charAt(0).toUpperCase() || "K";

  async function handleSelectOrganization(organizationId) {
    setSelectedOrganizationId(organizationId);
    setError("");
    try {
      const nextUser = await selectOrganization(organizationId);
      navigate(getWorkspaceRoute(nextUser), { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.organization_id?.[0] ??
          requestError.response?.data?.detail ??
          "We could not open that organization right now.",
      );
      setSelectedOrganizationId(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleSettingsClick() {
    if (canOpenSettings) {
      navigate("/settings");
      return;
    }
    await refreshUser();
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_38%,#ebf2ff_100%)]">
      <header className="border-b border-slate-200/80 bg-white/92 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-none items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <KugrowLogo
            layout="horizontal"
            imageClassName="h-10 w-auto sm:h-11"
            wordmarkClassName="text-[1.05rem] font-black tracking-[0.16em] text-slate-950 sm:text-[1.15rem]"
          />

          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:border-blue-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-[#2f7bff] text-sm font-bold text-white">
                {profileInitial}
              </span>
              <span className="hidden pr-1 text-[1.02rem] font-semibold text-slate-900 sm:block">
                {firstName}
              </span>
              <span className="hidden text-slate-400 sm:block">
                <MaterialSymbol name="keyboard_arrow_down" className="text-[1.2rem]" />
              </span>
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-10 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{user?.profile?.full_name}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <MaterialSymbol name="settings" className="text-[1rem]" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[74rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="mx-auto max-w-[68rem] rounded-[2.2rem] border border-white/80 bg-white/78 px-6 py-6 shadow-[0_32px_95px_rgba(15,23,42,0.11)] backdrop-blur-[12px] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
          <div className="max-w-3xl">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-blue-600">
              Organization access
            </p>
            <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-slate-950 sm:text-[3.25rem]">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 text-[1rem] leading-7 text-slate-500 sm:text-[1.12rem]">
              Choose an organization workspace to continue
            </p>
          </div>

          {organizations.length ? (
            <>
              <div className="mt-6 h-px w-full bg-slate-200/80" />

              <section className="mt-6">
                <h2 className="text-[1.4rem] font-bold tracking-tight text-slate-950 sm:text-[1.6rem]">
                  Your Organizations
                </h2>
                {error ? (
                  <div className="mt-4 rounded-[1.35rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-700">
                    {error}
                  </div>
                ) : null}
                <div className="mt-4 space-y-4">
                  {organizations.map((organization) => (
                    <OrganizationTile
                      key={organization.id}
                      organization={organization}
                      isLoading={selectedOrganizationId === organization.id}
                      onSelect={() => handleSelectOrganization(organization.id)}
                    />
                  ))}
                </div>
              </section>

              <div className="mt-7 h-px w-full bg-slate-200/80" />

              <section className="mt-6">
                <h2 className="text-[1.4rem] font-bold tracking-tight text-slate-950 sm:text-[1.6rem]">
                  Need another workspace?
                </h2>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/create-organization"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-gradient-to-r from-[#1F6BFF] to-[#1557F7] px-5 py-3.5 text-[0.98rem] font-semibold text-white shadow-[0_18px_38px_rgba(21,87,247,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_42px_rgba(21,87,247,0.32)] sm:min-w-[15rem]"
                  >
                    <MaterialSymbol name="add" className="text-[1.25rem]" />
                    Create Organization
                  </Link>
                  <Link
                    to="/join-organization"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-blue-300 bg-white px-5 py-3.5 text-[0.98rem] font-semibold text-blue-700 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-blue-400 hover:bg-blue-50 sm:min-w-[15rem]"
                  >
                    <MaterialSymbol name="groups" className="text-[1.15rem]" />
                    Join with Invite Code
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <div className="mt-6">
              <EmptyOrganizationsState />
              <div className="mt-7 h-px w-full bg-slate-200/80" />
              <section className="mx-auto mt-6 max-w-3xl">
                <h2 className="text-[1.4rem] font-bold tracking-tight text-slate-950 sm:text-[1.6rem]">
                  Need another workspace?
                </h2>
              </section>
              <div className="mx-auto mt-4 flex max-w-md flex-col gap-3">
                <Link
                  to="/create-organization"
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-gradient-to-r from-[#1F6BFF] to-[#1557F7] px-5 py-3.5 text-[0.98rem] font-semibold text-white shadow-[0_18px_38px_rgba(21,87,247,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_42px_rgba(21,87,247,0.32)]"
                >
                  <MaterialSymbol name="add" className="text-[1.25rem]" />
                  Create Organization
                </Link>
                <Link
                  to="/join-organization"
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-blue-300 bg-white px-5 py-3.5 text-[0.98rem] font-semibold text-blue-700 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <MaterialSymbol name="groups" className="text-[1.15rem]" />
                  Join with Invite Code
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
