import MaterialSymbol from "../../../shared/components/MaterialSymbol";

function FieldIcon({ kind }) {
  const iconName = kind === "email" ? "mail" : "lock";
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
      <MaterialSymbol name={iconName} className="text-[20px]" />
    </span>
  );
}

export default function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon = "email",
  rightAdornment = null,
  error = "",
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2.5 block text-sm font-semibold text-slate-700">{label}</span>
      <div
        className={`flex items-center gap-3 rounded-[1.35rem] border bg-white/92 px-4 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.07)] transition focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12),0_14px_34px_rgba(15,23,42,0.08)] ${
          error ? "border-rose-300" : "border-slate-200/90"
        }`}
      >
        <FieldIcon kind={icon} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 border-0 bg-transparent text-[1.02rem] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
        />
        {rightAdornment}
      </div>
      {error ? <span className="mt-2 block text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
