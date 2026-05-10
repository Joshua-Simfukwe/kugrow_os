export default function Button({
  children,
  type = "button",
  fullWidth = true,
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        rounded-xl
        bg-black
        px-4
        py-3
        text-sm
        font-medium
        text-white
        transition
        hover:opacity-90
        active:scale-[0.99]
        ${fullWidth ? "w-full" : ""}
      `}
    >
      {children}
    </button>
  );
}