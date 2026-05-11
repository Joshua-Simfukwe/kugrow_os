export default function OrganizationTypeCard({
  title,
  description,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-2xl border p-5 text-left transition
        ${
          selected
            ? "border-black bg-black text-white"
            : "border-gray-200 bg-white hover:border-black"
        }
      `}
    >
      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p
        className={`mt-2 text-sm ${
          selected ? "text-gray-200" : "text-gray-600"
        }`}
      >
        {description}
      </p>
    </button>
  );
}