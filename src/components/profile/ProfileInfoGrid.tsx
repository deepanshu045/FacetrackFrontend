interface ProfileInfoGridProps {
  items: {
    label: string;
    value: string;
  }[];
}

export default function ProfileInfoGrid({
  items,
}: ProfileInfoGridProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/5 bg-white/5 p-4"
        >
          <p className="mb-1 text-xs text-[#94A3B8]">
            {item.label}
          </p>

          <p className="text-sm font-medium text-white">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}