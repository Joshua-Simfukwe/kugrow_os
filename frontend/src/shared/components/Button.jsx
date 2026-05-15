export default function Button({
  children,
  type = "button",
  fullWidth = true,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-2xl
        px-4
        py-3.5
        text-sm
        font-semibold
        tracking-wide
        transition-all
        active:scale-[0.99]
        shadow-[0_10px_20px_rgba(37,99,235,0.2)]

        ${
          disabled
            ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }

        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
