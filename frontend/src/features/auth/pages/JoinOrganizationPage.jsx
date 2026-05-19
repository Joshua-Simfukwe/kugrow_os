import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { getWorkspaceRoute } from "../utils/authRoutes";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import TextInput from "../../../shared/components/TextInput";
import Button from "../../../shared/components/Button";

export default function JoinOrganizationPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinOrganization } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await joinOrganization(joinCode);
      navigate(getWorkspaceRoute(user), { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.join_code?.[0] ??
          "We could not find an organization with that join code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Join Existing Organization"
      subtitle="Enter the organization join code to continue"
      theme="joinOrganization"
      containerClassName="max-w-xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="join-code"
          name="joinCode"
          label="Join Code"
          placeholder="e.g. A1B2C3D4"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          helperText="Ask an organization owner for the code."
        />

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={!joinCode.trim() || isSubmitting}>
          {isSubmitting ? "JOINING..." : "JOIN ORGANIZATION"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Want to choose from your existing workspaces?{" "}
        <Link to="/organizations" className="font-semibold text-blue-600 hover:underline">
          Go back
        </Link>
      </p>
    </AuthLayout>
  );
}
