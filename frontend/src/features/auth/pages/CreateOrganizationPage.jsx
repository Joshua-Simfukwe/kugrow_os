import { useState } from "react";

import AuthLayout from "../../../shared/layouts/AuthLayout";
import Button from "../../../shared/components/Button";

import OrganizationTypeCard from "../components/OrganizationTypeCard";

export default function CreateOrganizationPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");

  const isFormValid =
    organizationName.trim() !== "" &&
    organizationType !== "";

  return (
    <AuthLayout
      title="Create organization"
      subtitle="Set up your workspace to continue"
    >
      <div className="space-y-6">
        {/* Organization Name */}
        <div>
          <label
            htmlFor="organizationName"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Organization Name
          </label>

          <input
            id="organizationName"
            type="text"
            placeholder="e.g. Kugrow Enterprises"
            value={organizationName}
            onChange={(e) =>
              setOrganizationName(e.target.value)
            }
            className="
              w-full rounded-xl border border-gray-300
              px-4 py-3 outline-none transition
              focus:border-black
            "
          />
        </div>

        {/* Organization Type */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Organization Type
          </h3>

          <OrganizationTypeCard
            title="Retail"
            description="For shops, stores, and retail businesses."
            selected={organizationType === "retail"}
            onClick={() =>
              setOrganizationType("retail")
            }
          />

          <OrganizationTypeCard
            title="Education"
            description="For schools and learning institutions."
            selected={organizationType === "education"}
            onClick={() =>
              setOrganizationType("education")
            }
          />
        </div>

        {/* CTA */}
        <Button disabled={!isFormValid}>
          Create Organization
        </Button>
      </div>
    </AuthLayout>
  );
}