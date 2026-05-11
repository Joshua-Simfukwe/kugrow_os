import { Link } from "react-router-dom";

import AuthLayout from "../../../shared/layouts/AuthLayout";
import Button from "../../../shared/components/Button";

import OrganizationCard from "../components/OrganizationCard";

export default function OrganizationSelectPage() {
  const organizations = [
    {
      id: 1,
      name: "Kugrow Enterprises",
      description: "Retail business workspace",
    },
    {
      id: 2,
      name: "Future Academy",
      description: "School management workspace",
    },
  ];

  return (
    <AuthLayout
      title="Choose organization"
      subtitle="Select a workspace to continue"
    >
      <div className="space-y-4">
        {organizations.map((organization) => (
          <OrganizationCard
            key={organization.id}
            name={organization.name}
            description={organization.description}
            onClick={() => console.log(organization.name)}
          />
        ))}
      </div>

      <div className="mt-6">
        <Link to="/create-organization">
          <Button>
            Create Organization
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}