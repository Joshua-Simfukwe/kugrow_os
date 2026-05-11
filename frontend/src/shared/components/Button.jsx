export default function Button({
  children,
  type = "button",
  fullWidth = true,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-xl
        px-4
        py-3
        text-sm
        font-medium
        transition
        active:scale-[0.99]

        ${
          disabled
            ? "cursor-not-allowed bg-gray-300 text-gray-500"
            : "bg-black text-white hover:opacity-90"
        }

        ${fullWidth ? "w-full" : ""}
      `}
    >
      {children}
    </button>
  );
}