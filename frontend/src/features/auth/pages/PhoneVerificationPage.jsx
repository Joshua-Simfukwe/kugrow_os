import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import KugrowLogo from "../components/KugrowLogo";
import VerificationCodeInput from "../components/VerificationCodeInput";
import { useAuth } from "../context/useAuth";
import MaterialSymbol from "../../../shared/components/MaterialSymbol";

function formatCountdown(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function PhoneVerificationPage() {
  const navigate = useNavigate();
  const {
    phoneVerificationChallenge,
    verifyPhoneCode,
    resendPhoneCode,
    cancelPhoneVerification,
  } = useAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    phoneVerificationChallenge?.expires_in_seconds ?? 0,
  );
  const containerRef = useRef(null);

  useEffect(() => {
    if (!secondsRemaining) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const code = digits.join("");
  const helperText = useMemo(() => {
    if (phoneVerificationChallenge?.masked_phone_number) {
      return `Enter the 6-digit code sent to your phone number ending in ${phoneVerificationChallenge.masked_phone_number}.`;
    }
    return "Enter the 6-digit code sent to your saved phone number.";
  }, [phoneVerificationChallenge]);

  function focusInput(index) {
    const nextInput = containerRef.current?.querySelector(
      `input[data-code-index="${index}"]`,
    );
    nextInput?.focus();
    nextInput?.select();
  }

  function handleDigitChange(index, value, options = {}) {
    if (options.pasteAll) {
      const nextDigits = Array.from({ length: digits.length }, (_, itemIndex) => value[itemIndex] ?? "");
      setDigits(nextDigits);
      setError("");
      focusInput(Math.min(value.length, digits.length - 1));
      return;
    }

    if (options.focusPrevious) {
      setDigits((current) => {
        const nextDigits = [...current];
        nextDigits[index] = "";
        return nextDigits;
      });
      setError("");
      focusInput(index);
      return;
    }

    setDigits((current) => {
      const nextDigits = [...current];
      nextDigits[index] = value;
      return nextDigits;
    });
    setError("");

    if (value && index < digits.length - 1) {
      window.requestAnimationFrame(() => focusInput(index + 1));
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (code.length !== digits.length) {
      setError("Enter the full 6-digit code to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await verifyPhoneCode(code);
      navigate("/organizations", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.code?.[0] ??
          requestError.response?.data?.challenge_id?.[0] ??
          "We could not verify that code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError("");
    try {
      const nextChallenge = await resendPhoneCode();
      setDigits(["", "", "", "", "", ""]);
      setSecondsRemaining(nextChallenge.expires_in_seconds ?? 0);
      window.requestAnimationFrame(() => focusInput(0));
    } catch (requestError) {
      setError(
        requestError.response?.data?.challenge_id?.[0] ??
          "We could not resend the verification code.",
      );
    } finally {
      setIsResending(false);
    }
  }

  function returnToLogin(extraState = {}) {
    cancelPhoneVerification();
    navigate("/login", { replace: true, state: extraState });
  }

  return (
    <AuthShell>
      <div className="mx-auto max-w-md text-center">
        <KugrowLogo />

        <h1 className="mt-7 text-[2.55rem] font-bold tracking-tight text-slate-950 sm:text-[3.25rem]">
          Verify your phone
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-slate-500 sm:text-lg">
          {helperText}
        </p>

        <form className="mt-9" onSubmit={handleVerify}>
          <div ref={containerRef}>
            <VerificationCodeInput
              values={digits}
              onChange={handleDigitChange}
              hasError={Boolean(error)}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <MaterialSymbol name="schedule" className="text-[1rem]" />
            Code expires in {formatCountdown(secondsRemaining)}
          </div>

          {phoneVerificationChallenge?.debug_code ? (
            <div className="mt-4 rounded-[1.35rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-800">
              Development code: <span className="font-semibold tracking-[0.2em]">{phoneVerificationChallenge.debug_code}</span>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-[1.35rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-[1.35rem] bg-gradient-to-r from-[#1F6BFF] to-[#1557F7] px-4 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(21,87,247,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_42px_rgba(21,87,247,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Verifying..." : "Verify code"}
          </button>
        </form>

        <div className="mt-8 space-y-4 text-sm">
          <p className="text-slate-500">
            Didn&apos;t receive a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-blue-600 transition hover:text-blue-700 disabled:opacity-60"
            >
              {isResending ? "Resending..." : "Resend"}
            </button>
          </p>

          <div className="mx-auto h-px w-full max-w-xs bg-slate-200" />

          <button
            type="button"
            onClick={() =>
              returnToLogin({
                alternatePhoneRequested: true,
              })
            }
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Use another phone number
          </button>

          <div className="mx-auto h-px w-full max-w-xs bg-slate-200" />

          <button
            type="button"
            onClick={() => returnToLogin()}
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Back to login
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
