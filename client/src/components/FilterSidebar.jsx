import { useEffect, useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Star, Sparkles } from 'lucide-react';
import {
  CATEGORIES, SORT_OPTIONS, RATING_OPTIONS,
} from '../hooks/useShopFilters';
import { useCurrency } from '../context/CurrencyContext';

// ---------------------------------------------------------------------------
// Collapsible section wrapper
// ---------------------------------------------------------------------------
const Section = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.08] py-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Price range slider
// ---------------------------------------------------------------------------
const PriceSlider = ({ bounds, minPrice, maxPrice, setMinPrice, setMaxPrice }) => {
  const { format } = useCurrency();

  const globalMin = Math.floor(bounds?.minPrice ?? 0);
  const globalMax = Math.ceil(bounds?.maxPrice ?? 2000);

  const [lo, setLo] = useState(minPrice ?? globalMin);
  const [hi, setHi] = useState(maxPrice ?? globalMax);

  useEffect(() => { setLo(minPrice ?? globalMin); }, [minPrice, globalMin]);
  useEffect(() => { setHi(maxPrice ?? globalMax); }, [maxPrice, globalMax]);

  const commitLo = (v) => {
    const val = Math.min(Number(v), hi - 1);
    setLo(val);
    setMinPrice(val === globalMin ? undefined : val);
  };

  const commitHi = (v) => {
    const val = Math.max(Number(v), lo + 1);
    setHi(val);
    setMaxPrice(val === globalMax ? undefined : val);
  };

  const loPercent = ((lo - globalMin) / (globalMax - globalMin)) * 100;
  const hiPercent = ((hi - globalMin) / (globalMax - globalMin)) * 100;

  return (
    <div className="space-y-4 pt-1">
      {/* Track */}
      <div className="relative h-2 rounded-full bg-zinc-800 mx-1">
        {/* Active range fill */}
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
          style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
        />
        {/* Min thumb */}
        <input
          type="range" min={globalMin} max={globalMax} step={1}
          value={lo}
          onChange={(e) => setLo(Number(e.target.value))}
          onMouseUp={(e)  => commitLo(e.target.value)}
          onTouchEnd={(e) => commitLo(e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label="Minimum price"
          style={{ zIndex: lo > globalMax - 10 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range" min={globalMin} max={globalMax} step={1}
          value={hi}
          onChange={(e) => setHi(Number(e.target.value))}
          onMouseUp={(e)  => commitHi(e.target.value)}
          onTouchEnd={(e) => commitHi(e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label="Maximum price"
          style={{ zIndex: 4 }}
        />
        {/* Thumb dots with neon glow */}
        <span
          className="absolute w-4 h-4 rounded-full bg-cyan-300 border-2 border-zinc-950 -top-[4px] shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none"
          style={{ left: `calc(${loPercent}% - 8px)` }}
          aria-hidden
        />
        <span
          className="absolute w-4 h-4 rounded-full bg-cyan-300 border-2 border-zinc-950 -top-[4px] shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none"
          style={{ left: `calc(${hiPercent}% - 8px)` }}
          aria-hidden
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300">
        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10">{format(lo)}</span>
        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10">{format(hi)}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main FilterSidebar
// ---------------------------------------------------------------------------
const FilterSidebar = ({
  bounds,
  sort, categories, minRating, minPrice, maxPrice,
  activeFilterCount,
  setSort, toggleCategory, setMinRating,
  setMinPrice, setMaxPrice, clearAllFilters,
  mobileOpen, onMobileClose,
}) => {
  const content = (
    <div className="p-5 space-y-0 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.08]">
        <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-cyan-400" />
          Refine Matrix
          {activeFilterCount > 0 && (
            <span className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400"
              aria-label="Close filters"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <Section title="Sorting Mode" defaultOpen>
        <div className="space-y-2">
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group select-none">
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                sort === opt.value
                  ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                  : 'border-zinc-700 group-hover:border-zinc-500'
              }`}>
                {sort === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </span>
              <span className={`text-xs transition-colors ${sort === opt.value ? 'font-semibold text-cyan-300' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                {opt.label}
              </span>
              <input
                type="radio" name="sort" value={opt.value}
                checked={sort === opt.value}
                onChange={() => setSort(opt.value)}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </Section>

      {/* Category */}
      <Section title="Sector Categories" defaultOpen>
        <div className="space-y-2">
          {CATEGORIES.map(({ slug, label }) => {
            const checked = categories.includes(slug);
            return (
              <label key={slug} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <span className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                  checked
                    ? 'border-cyan-400 bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'border-zinc-700 group-hover:border-zinc-500 bg-zinc-950'
                }`}>
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 9 7" fill="none" className="text-zinc-950 stroke-current">
                      <path d="M1 3.5L3.5 6L8 1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className={`text-xs transition-colors capitalize ${checked ? 'font-semibold text-cyan-300' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                  {label}
                </span>
                <input
                  type="checkbox" checked={checked}
                  onChange={() => toggleCategory(slug)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </Section>

      {/* Price range */}
      <Section title="Price Bracket" defaultOpen>
        <PriceSlider
          bounds={bounds}
          minPrice={minPrice} maxPrice={maxPrice}
          setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
        />
      </Section>

      {/* Rating */}
      <Section title="Rating Level" defaultOpen>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
              !minRating ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'border-zinc-700 group-hover:border-zinc-500'
            }`}>
              {!minRating && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </span>
            <span className={`text-xs transition-colors ${!minRating ? 'font-semibold text-cyan-300' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
              All Ratings
            </span>
            <input type="radio" name="rating" value="" checked={!minRating} onChange={() => setMinRating('')} className="sr-only" />
          </label>

          {RATING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group select-none">
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                minRating === opt.value ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'border-zinc-700 group-hover:border-zinc-500'
              }`}>
                {minRating === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </span>
              <span className={`text-xs flex items-center gap-1 transition-colors ${minRating === opt.value ? 'font-semibold text-cyan-300' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                <span className="flex">
                  {Array(parseInt(opt.value)).fill(null).map((_, i) => (
                    <Star key={i} size={11} className="fill-amber-400 text-amber-400 inline" />
                  ))}
                </span>
                <span>{opt.label}</span>
              </span>
              <input type="radio" name="rating" value={opt.value} checked={minRating === opt.value} onChange={() => setMinRating(opt.value)} className="sr-only" />
            </label>
          ))}
        </div>
      </Section>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-zinc-900/60 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/10 self-start sticky top-24">
        {content}
      </aside>

      {/* Mobile drawer */}
      <>
        <div
          className={`fixed inset-0 bg-black/75 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={onMobileClose}
          aria-hidden
        />
        <aside
          className={`
            fixed top-0 left-0 h-full w-72 bg-[#09090b]/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl z-50 lg:hidden
            transition-transform duration-300
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-label="Filters"
        >
          {content}
        </aside>
      </>
    </>
  );
};

export default FilterSidebar;
