import { useEffect, useState } from "react";

import { useAuth } from "../features/auth/context/useAuth";
import { apiClient } from "../lib/api";
import AppHeader from "../shared/components/AppHeader";

const moduleOptions = [
  { key: "home", label: "Home" },
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "POS" },
  { key: "inventory", label: "Inventory" },
  { key: "settings", label: "Settings" },
  { key: "users", label: "User Management" },
];

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "member",
    module_access: ["home", "pos"],
  });

  async function loadMembers() {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/auth/team/");
      setMembers(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ??
          "We could not load organization members.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;
    apiClient
      .get("/auth/team/")
      .then((response) => {
        if (!isActive) {
          return;
        }
        setMembers(response.data);
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }
        setError(
          requestError.response?.data?.detail ??
            "We could not load organization members.",
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

  function toggleModule(moduleKey) {
    setForm((current) => {
      const hasModule = current.module_access.includes(moduleKey);
      return {
        ...current,
        module_access: hasModule
          ? current.module_access.filter((item) => item !== moduleKey)
          : [...current.module_access, moduleKey],
      };
    });
  }

  async function handleCreateMember(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await apiClient.post("/auth/team/", form);
      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "member",
        module_access: ["home", "pos"],
      });
      await Promise.all([loadMembers(), refreshUser()]);
    } catch (requestError) {
      setSubmitError(
        requestError.response?.data?.email?.[0] ??
          requestError.response?.data?.password?.[0] ??
          requestError.response?.data?.detail ??
          "We could not add that user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateMember(memberId, payload) {
    await apiClient.patch(`/auth/team/${memberId}/`, payload);
    await loadMembers();
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Settings" subtitle="Manage your store and user access" />

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">Store Settings</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.4rem] bg-slate-50 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Store Name</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {user?.profile?.active_organization?.name}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-slate-50 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Organization Type</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {user?.profile?.active_organization?.organization_type}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-slate-50 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Join Code</p>
            <p className="mt-3 text-2xl font-bold text-blue-700">
              {user?.profile?.active_organization?.join_code}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.15fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900">Add User</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create organization users with role-based and modular access.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateMember}>
            <input
              type="text"
              placeholder="Full name"
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>

            <div>
              <p className="text-sm font-medium text-slate-700">Module Access</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {moduleOptions.map((moduleOption) => (
                  <label
                    key={moduleOption.key}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.module_access.includes(moduleOption.key)}
                      onChange={() => toggleModule(moduleOption.key)}
                    />
                    {moduleOption.label}
                  </label>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isSubmitting ? "Saving..." : "Add User"}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900">Team Access</h2>
          <p className="mt-2 text-sm text-slate-500">
            Adjust user roles and what parts of the workspace they can reach.
          </p>

          {isLoading ? (
            <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              Loading team members...
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {members.map((member) => (
                <div key={member.id} className="rounded-[1.4rem] border border-slate-200 px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{member.full_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.module_access.map((moduleKey) => (
                        <span
                          key={`${member.id}-${moduleKey}`}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700"
                        >
                          {moduleKey}
                        </span>
                      ))}
                    </div>
                  </div>

                  {member.role !== "owner" && (
                    <div className="mt-5 flex flex-col gap-3 md:flex-row">
                      <select
                        value={member.role}
                        onChange={(event) => updateMember(member.id, { role: event.target.value })}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          updateMember(member.id, {
                            module_access: member.module_access.includes("inventory")
                              ? member.module_access.filter((moduleKey) => moduleKey !== "inventory")
                              : [...member.module_access, "inventory"],
                          })
                        }
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Toggle Inventory Access
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
