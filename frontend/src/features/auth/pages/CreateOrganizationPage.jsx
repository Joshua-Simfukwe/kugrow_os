import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import Button from "../../../shared/components/Button";

import OrganizationTypeCard from "../components/OrganizationTypeCard";

export default function CreateOrganizationPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { createOrganization } = useAuth();

  const isFormValid =
    organizationName.trim() !== "" &&
    organizationType !== "";

  async function handleCreateOrganization() {
    if (!isFormValid || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await createOrganization({
        name: organizationName,
        organization_type: organizationType,
      });
      navigate("/home", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.name?.[0] ??
          requestError.response?.data?.organization_type?.[0] ??
          "We could not create that organization.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create Your Organization"
      subtitle="Choose your organization type to customize your experience"
      theme="createOrganization"
      containerClassName="max-w-3xl"
    >
      <div className="space-y-6">
        <div>
          <label
            htmlFor="organizationName"
            className="mb-2 block text-sm font-medium text-blue-600"
          >
            Organization Name *
          </label>

          <input
            id="organizationName"
            type="text"
            placeholder="e.g., My Store, My School"
            value={organizationName}
            onChange={(e) =>
              setOrganizationName(e.target.value)
            }
            className="
              w-full rounded-2xl border border-blue-500
              px-4 py-4 text-lg outline-none transition
              focus:ring-4 focus:ring-blue-100
            "
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">
            Organization Type
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <OrganizationTypeCard
              title="Retail"
              description="For shops, stores, and retail businesses. Manage customers, inventory, and sales."
              selected={organizationType === "retail"}
              onClick={() =>
                setOrganizationType("retail")
              }
            />

            <OrganizationTypeCard
              title="Education"
              description="For schools and educational institutions. Manage students, classes, and curriculum."
              selected={organizationType === "education"}
              onClick={() =>
                setOrganizationType("education")
              }
            />
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button disabled={!isFormValid || isSubmitting} onClick={handleCreateOrganization}>
          {isSubmitting ? "CREATING..." : "CREATE ORGANIZATION"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          This determines the features and terminology used throughout the app
        </p>
      </div>
    </AuthLayout>
  );
}
