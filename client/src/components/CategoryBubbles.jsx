import {
  Cpu,
  Footprints,
  Shirt,
  UtensilsCrossed,
  Watch,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  {
    label: 'Electronics',
    slug: 'electronics',
    icon: Cpu,
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'rgba(6, 182, 212, 0.4)',
    accent: 'text-cyan-400',
  },
  {
    label: 'Footwear',
    slug: 'footwear',
    icon: Footprints,
    gradient: 'from-emerald-400 to-teal-600',
    glow: 'rgba(16, 185, 129, 0.4)',
    accent: 'text-emerald-400',
  },
  {
    label: 'Apparel',
    slug: 'apparel',
    icon: Shirt,
    gradient: 'from-fuchsia-500 to-pink-600',
    glow: 'rgba(217, 70, 239, 0.4)',
    accent: 'text-fuchsia-400',
  },
  {
    label: 'Home & Living',
    slug: 'home & kitchen',
    icon: UtensilsCrossed,
    gradient: 'from-amber-400 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.4)',
    accent: 'text-amber-400',
  },
  {
    label: 'Accessories',
    slug: 'accessories',
    icon: Watch,
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'rgba(99, 102, 241, 0.4)',
    accent: 'text-indigo-400',
  },
];

const CategoryBubbles = ({ onSelect }) => (
  <section aria-label="Shop by category" className="mb-10">
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-cyan-400" />
        <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Explore Sectors
        </h2>
      </div>
      <span className="text-[11px] text-zinc-500 hidden sm:inline">Swipe to explore categories</span>
    </div>

    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pt-1 px-1">
      {CATEGORIES.map(({ label, slug, icon: Icon, gradient, glow, accent }) => (
        <button
          key={slug}
          onClick={() => onSelect?.(slug)}
          className="
            group flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl
            bg-zinc-900/70 border border-white/10
            hover:border-cyan-500/50 hover:bg-zinc-800/80
            hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]
            hover:-translate-y-1 active:scale-95
            transition-all duration-300 select-none cursor-pointer
          "
          aria-label={`Browse ${label}`}
        >
          {/* Gradient Icon Badge */}
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}
            style={{ boxShadow: `0 0 14px ${glow}` }}
          >
            <Icon size={17} className="text-white drop-shadow" />
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors block">
              {label}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
              Browse
            </span>
          </div>
        </button>
      ))}
    </div>
  </section>
);

export default CategoryBubbles;
