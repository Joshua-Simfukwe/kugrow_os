export default function VerificationCodeInput({
  values,
  onChange,
  hasError = false,
}) {
  function handleInput(index, nextValue) {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    onChange(index, digit);
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      onChange(index - 1, "", { focusPrevious: true });
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, values.length);
    if (!pasted) {
      return;
    }
    event.preventDefault();
    onChange(0, pasted, { pasteAll: true });
  }

  return (
    <div className="flex justify-center gap-2.5 sm:gap-3.5" onPaste={handlePaste}>
      {values.map((digit, index) => (
        <input
          key={index}
          data-code-index={index}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={`h-14 w-12 rounded-[1.15rem] border bg-white/95 text-center text-2xl font-semibold tracking-[0.08em] text-slate-900 outline-none transition sm:h-[4.4rem] sm:w-[3.75rem] ${
            hasError
              ? "border-rose-300 shadow-[0_0_0_4px_rgba(251,113,133,0.10)]"
              : "border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.07)] focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12),0_14px_34px_rgba(15,23,42,0.08)]"
          }`}
          aria-label={`Verification digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
