export default function TextInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full
          rounded-xl
          border
          border-gray-300
          px-4
          py-3
          text-sm
          outline-none
          transition
          focus:border-black
        "
      />
    </div>
  );
}