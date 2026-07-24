import { cn } from "../lib/cn";
import type { Direction } from "../game/scoreRound";

type DirectionPickerProps = {
  value: Direction;
  onChange: (direction: Direction) => void;
  disabled?: boolean;
};

const options: { value: Direction; label: string }[] = [
  { value: "buy", label: "Buy" },
  { value: "hold", label: "Hold" },
  { value: "short", label: "Short" },
];

export function DirectionPicker({ value, onChange, disabled = false }: DirectionPickerProps) {
  return (
    <div className="grid grid-cols-3 rounded border border-slate-300 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-10 text-sm font-medium",
            value === option.value ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
