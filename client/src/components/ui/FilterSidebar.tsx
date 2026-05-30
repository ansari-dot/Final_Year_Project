import { ChevronDown, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { categories, sizes, conditions, genders, colors } from '../../lib/mockData';

export interface BrowseFilters {
  categories: string[];
  sizes: string[];
  genders: string[];
  conditions: string[];
  colors: string[];
  brand: string;
}

interface FilterSidebarProps {
  filters: BrowseFilters;
  onChange: (next: BrowseFilters) => void;
  onClear: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

const Section = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60 py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between font-bold text-primary text-[12px] uppercase tracking-widest"
      >
        {title}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

export default function FilterSidebar({
  filters,
  onChange,
  onClear,
  mobile,
  onClose,
}: FilterSidebarProps) {
  const toggle = (key: keyof BrowseFilters, value: string) => {
    if (key === 'brand') return;
    const arr = filters[key] as string[];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div
      className={`bg-background rounded-xl border border-border/60 p-4 shadow-sm ${
        mobile ? 'h-full overflow-y-auto rounded-none' : 'sticky top-24'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-headings text-base font-bold text-primary">Filters</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
          >
            Clear All
          </button>
          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/40 text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <Section title="Category">
        {categories.map((c) => (
          <label
            key={c}
            className="flex items-center gap-2.5 text-sm text-primary/80 cursor-pointer hover:text-primary"
          >
            <input
              type="checkbox"
              checked={filters.categories.includes(c)}
              onChange={() => toggle('categories', c)}
              className="w-4 h-4 rounded border-border accent-accent"
            />
            {c}
          </label>
        ))}
      </Section>

      <Section title="Size">
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle('sizes', s)}
              className={`px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                filters.sizes.includes(s)
                  ? 'bg-primary text-white border-primary'
                  : 'border-border/60 text-primary/80 hover:border-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Gender">
        <div className="flex flex-col gap-2">
          {genders.map((g) => (
            <label
              key={g}
              className="flex items-center gap-2.5 text-sm text-primary/80 cursor-pointer hover:text-primary"
            >
              <input
                type="radio"
                name="gender"
                checked={filters.genders[0] === g}
                onChange={() => onChange({ ...filters, genders: [g] })}
                className="w-4 h-4 accent-accent"
              />
              {g}
            </label>
          ))}
          {filters.genders.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, genders: [] })}
              className="text-[11px] text-muted-foreground hover:text-primary uppercase tracking-wider font-bold mt-1 self-start"
            >
              Reset
            </button>
          )}
        </div>
      </Section>

      <Section title="Condition">
        {conditions.map((c) => (
          <label
            key={c}
            className="flex items-center gap-2.5 text-sm text-primary/80 cursor-pointer hover:text-primary"
          >
            <input
              type="checkbox"
              checked={filters.conditions.includes(c)}
              onChange={() => toggle('conditions', c)}
              className="w-4 h-4 rounded border-border accent-accent"
            />
            {c}
          </label>
        ))}
      </Section>

      <Section title="Color">
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const active = filters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggle('colors', c.name)}
                title={c.name}
                aria-label={c.name}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  active ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Brand" defaultOpen={false}>
        <input
          type="text"
          placeholder="e.g. Levi's, Arket"
          value={filters.brand}
          onChange={(e) => onChange({ ...filters, brand: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-border/60 bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </Section>
    </div>
  );
}
