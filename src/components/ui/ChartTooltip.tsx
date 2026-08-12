interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: {
    value: number;
    name: string;
  }[];
}

export default function ChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#1E293B] shadow-xl p-3 text-sm">

      <p className="text-[#94A3B8] mb-1">
        {label}
      </p>

      {payload.map((item, index) => (
        <p
          key={index}
          className="text-white font-medium"
        >
          {item.value}
        </p>
      ))}
    </div>
  );
}