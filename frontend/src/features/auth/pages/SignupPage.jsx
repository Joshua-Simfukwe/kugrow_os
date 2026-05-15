import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import TextInput from "../../../shared/components/TextInput";
import Button from "../../../shared/components/Button";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup({ full_name: fullName, email, password });
      navigate("/create-organization", { replace: true });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const firstError =
        responseData?.password?.[0] ??
        responseData?.email?.[0] ??
        responseData?.full_name?.[0] ??
        "We could not create your account right now.";
      setError(firstError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to get started"
      theme="signup"
      containerClassName="max-w-xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="full-name"
          name="fullName"
          label="Full Name *"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />

        <TextInput
          id="signup-email"
          name="email"
          label="Email *"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <TextInput
          id="signup-password"
          name="password"
          label="Password *"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          helperText="Minimum 8 characters"
        />

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button type="submit">
          {isSubmitting ? "SIGNING UP..." : "SIGN UP"}
        </Button>
      </form>

      <p className="mt-8 text-center text-lg text-slate-700">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
