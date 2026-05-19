export default function MaterialSymbol({
  name,
  className = "",
  filled = false,
  grade = 0,
  weight = 400,
  opticalSize = 24,
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined-local select-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
      }}
    >
      {name}
    </span>
  );
}
