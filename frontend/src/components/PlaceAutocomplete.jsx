import { useEffect, useRef, useState } from "react";

// Generic debounced search-and-pick input. `search(query)` resolves to an
// array of option objects; `renderOption` / `getLabel` describe how to show
// each one. Selecting an option calls onSelect and closes the dropdown.
export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  search,
  getLabel,
  placeholder,
  disabled,
}) {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(e) {
    const next = e.target.value;
    onChange(next);
    setOpen(true);

    clearTimeout(debounceRef.current);
    if (next.trim().length < 2) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await search(next);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(option) {
    onSelect(option);
    setOptions([]);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--jm-jam)] disabled:opacity-40"
      />

      {open && (loading || options.length > 0) && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-[var(--jm-text-dim)]">Searching…</div>
          )}
          {!loading &&
            options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--jm-surface-2)]"
              >
                {getLabel(option)}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
