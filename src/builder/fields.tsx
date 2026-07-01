/* Small, theme-styled form primitives shared across the builder wizard. */

import { X, Plus } from "lucide-react";

const base =
  "w-full rounded-2xl border border-border bg-surface/70 px-5 py-3 font-body text-text outline-none backdrop-blur-sm transition-colors focus:border-accent placeholder:text-text-soft/60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-body text-sm text-text-soft">{label}</span>
      {children}
      {hint && <span className="font-body text-xs text-text-soft/70">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={base}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${base} resize-y`}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={base}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-surface/50 px-5 py-4 text-left backdrop-blur-sm transition-colors hover:border-accent/60"
    >
      <span>
        <span className="block font-body text-text">{label}</span>
        {description && (
          <span className="block font-body text-xs text-text-soft">{description}</span>
        )}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/* Edit a flat list of strings (captions, balloon words, messages…). */
export function StringListEditor({
  items,
  onChange,
  placeholder = "Add an item…",
  addLabel = "Add",
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const update = (i: number, v: string) =>
    onChange(items.map((it, idx) => (idx === i ? v : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={it}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className={base}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove"
            className="shrink-0 rounded-full border border-border bg-surface/60 p-2 text-text-soft transition-colors hover:border-accent-2 hover:text-accent-2"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface/60 px-4 py-2 font-body text-sm text-text-soft transition-colors hover:border-accent hover:text-text"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}
