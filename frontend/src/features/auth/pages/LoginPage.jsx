import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthField from "../components/AuthField";
import AuthShell from "../components/AuthShell";
import KugrowLogo from "../components/KugrowLogo";
import { useAuth } from "../context/useAuth";
import MaterialSymbol from "../../../shared/components/MaterialSymbol";

function EyeButton({ isVisible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      aria-label={isVisible ? "Hide password" : "Show password"}
    >
      <MaterialSymbol name="visibility" className="text-[20px]" />
    </button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    location.state?.infoMessage ??
      (location.state?.alternatePhoneRequested
        ? "Sign in again to verify with a different saved phone number."
        : ""),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailError = useMemo(() => (error.toLowerCase().includes("email") ? error : ""), [error]);
  const passwordError = useMemo(
    () => (error && !emailError ? error : ""),
    [emailError, error],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/verify-phone", { replace: true });
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
    <AuthShell>
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <KugrowLogo />
          <h1 className="mt-7 text-[2.65rem] font-bold tracking-tight text-slate-950 sm:text-[3.4rem]">
            Welcome back
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-500 sm:text-lg">
            Sign in to continue to KUGROW_OS.
          </p>
        </div>

        <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
          <AuthField
            id="email"
            label="Email address"
            type="email"
            icon="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            error={emailError}
          />

          <AuthField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            icon="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            rightAdornment={
              <EyeButton
                isVisible={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              />
            }
            error={passwordError}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                setInfo(
                  "Password reset is not live yet. Use your current password or ask an organization owner to help you recover access.",
                )
              }
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Forgot password?
            </button>
          </div>

          {info ? (
            <div className="rounded-[1.35rem] border border-blue-200 bg-blue-50/90 px-4 py-3 text-sm leading-6 text-blue-700">
              {info}
            </div>
          ) : null}

          {error && !emailError && !passwordError ? (
            <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[1.35rem] bg-gradient-to-r from-[#1F6BFF] to-[#1557F7] px-4 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(21,87,247,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_42px_rgba(21,87,247,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-sm text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="font-medium">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() =>
            setInfo("Google sign-in is not enabled in this environment yet.")
          }
          className="flex w-full items-center justify-center rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-slate-50"
        >
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-base text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
