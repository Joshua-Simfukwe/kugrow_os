function getChartPath(points, width, height, padding) {
  if (!points.length) {
    return "";
  }

  const values = points.map((point) => Number(point.value ?? 0));
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = padding + index * xStep;
      const ratio = (Number(point.value ?? 0) - minValue) / (maxValue - minValue || 1);
      const y = height - padding - ratio * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function SimpleLineChart({
  points,
  height = 240,
}) {
  const width = 720;
  const padding = 30;
  const path = getChartPath(points, width, height, padding);
  const values = points.map((point) => Number(point.value ?? 0));
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[260px] w-full"
        role="img"
        aria-label="Sales trend chart"
      >
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return (
            <line
              key={`grid-${line}`}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#dbe4f3"
              strokeDasharray="4 4"
            />
          );
        })}

        {points.map((point, index) => {
          const x = padding + index * xStep;
          const ratio = (Number(point.value ?? 0) - minValue) / (maxValue - minValue || 1);
          const y = height - padding - ratio * (height - padding * 2);

          return (
            <g key={`${point.label}-${index}`}>
              <circle cx={x} cy={y} r="5.5" fill="#2563eb" />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="12"
                fill="#64748b"
              >
                {point.label}
              </text>
            </g>
          );
        })}

        <path
          d={path}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
