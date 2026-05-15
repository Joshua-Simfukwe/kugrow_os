export default function TextInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled = false,
  helperText,
  error,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        disabled={disabled}
        className="
          w-full
          rounded-2xl
          border
          border-slate-300
          px-4
          py-3
          text-base
          text-slate-900
          outline-none
          transition
          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-100
          disabled:cursor-not-allowed
          disabled:bg-slate-100
        "
      />

      {(helperText || error) && (
        <p className={`text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
