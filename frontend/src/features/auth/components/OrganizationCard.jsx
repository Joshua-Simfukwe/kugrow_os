export default function OrganizationCard({
  name,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        text-left
        transition
        hover:border-black
        hover:shadow-sm
      "
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {name}
      </h3>

      <p className="mt-1 text-sm text-gray-600">
        {description}
      </p>
    </button>
  );
}