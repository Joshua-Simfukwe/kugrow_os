import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import Button from "../../../shared/components/Button";

import OrganizationCard from "../components/OrganizationCard";

export default function OrganizationSelectPage() {
  const navigate = useNavigate();
  const { user, selectOrganization } = useAuth();
  const organizations = user?.organizations ?? [];

  async function handleSelectOrganization(organizationId) {
    await selectOrganization(organizationId);
    navigate("/home", { replace: true });
  }

  return (
    <AuthLayout
      title={`Welcome, ${user?.profile?.full_name?.toUpperCase() ?? "TEAM MEMBER"}`}
      subtitle="Select or join an organization to continue"
      theme="organizationSelect"
      containerClassName="max-w-5xl"
      cardClassName="max-w-5xl"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {organizations.map((organization) => (
          <OrganizationCard
            key={organization.id}
            role={organization.role}
            organizationType={organization.organization_type}
            name={organization.name}
            onClick={() => handleSelectOrganization(organization.id)}
          />
        ))}

        <Link
          to="/create-organization"
          className="flex min-h-[22rem] flex-col items-center justify-center rounded-[1.8rem] border-2 border-dashed border-slate-300 bg-white/70 px-6 text-center text-slate-500 shadow-[0_14px_32px_rgba(15,23,42,0.08)] transition hover:border-blue-400 hover:text-blue-600"
        >
          <span className="text-7xl font-light">+</span>
          <h3 className="mt-6 text-4xl font-semibold text-slate-800">
            Create New
          </h3>
          <p className="mt-3 text-lg">
            Start a new organization
          </p>
        </Link>
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/join-organization">
          <Button fullWidth={false} className="px-10">
            JOIN EXISTING ORGANIZATION
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
