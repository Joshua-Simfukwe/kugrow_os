import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { getPostLoginRoute } from "../utils/authRoutes";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import TextInput from "../../../shared/components/TextInput";
import Button from "../../../shared/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      navigate(getPostLoginRoute(user), { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ??
          requestError.response?.data?.non_field_errors?.[0] ??
          "We could not sign you in with those details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your account"
      theme="login"
      containerClassName="max-w-xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="email"
          name="email"
          label="Email *"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <TextInput
          id="password"
          name="password"
          label="Password *"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button type="submit">
          {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
        </Button>
      </form>

      <p className="mt-8 text-center text-lg text-slate-700">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
