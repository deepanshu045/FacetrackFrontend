import { cn } from "../../utils/cn";

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

export default function Toggle({
  checked,
  disabled = false,
  onChange,
}: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 rounded-full transition-all duration-300",
        checked ? "bg-blue-600" : "bg-white/20",
        disabled ? "cursor-not-allowed opacity-50" : ""
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}