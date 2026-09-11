export default function ChipSelect({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active
                ? "bg-[var(--jm-jam)] border-[var(--jm-jam)] text-white"
                : "bg-[var(--jm-surface-2)] border-[var(--jm-border)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
