import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from './ProductCard';

/**
 * Reusable horizontal product carousel.
 *
 * Props:
 *   title      — shelf heading string
 *   subtitle   — optional sub-heading
 *   products   — array of product objects
 *   badge      — optional badge string forwarded to every ProductCard ("NEW" / "🔥")
 *   loading    — show skeleton placeholders
 *   accentColor — Tailwind gradient or color for the title accent bar
 */
const ProductCarousel = ({
  title,
  subtitle,
  products = [],
  badge,
  loading = false,
  accentColor = 'from-cyan-500 to-blue-600',
}) => {
  const trackRef   = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  /* Track scroll position to show/hide nav buttons */
  const syncButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncButtons();
    el.addEventListener('scroll', syncButtons, { passive: true });
    const ro = new ResizeObserver(syncButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncButtons);
      ro.disconnect();
    };
  }, [syncButtons, products, loading]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="mb-12" aria-label={title}>
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`w-1.5 h-5 rounded-full bg-gradient-to-b ${accentColor} shadow-[0_0_10px_rgba(6,182,212,0.6)]`} aria-hidden />
            <h2 className="text-base sm:text-lg font-bold font-display text-zinc-100 tracking-tight">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-400 ml-4 pl-0.5">{subtitle}</p>
          )}
        </div>

        {/* Desktop scroll buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            disabled={!canLeft}
            className="
              p-2 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300
              hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-zinc-800
              disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-white/10
              transition-all duration-200 active:scale-95 shadow-sm
            "
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canRight}
            className="
              p-2 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300
              hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-zinc-800
              disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-white/10
              transition-all duration-200 active:scale-95 shadow-sm
            "
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable track ── */}
      <div
        ref={trackRef}
        className="
          flex gap-4 overflow-x-auto scrollbar-hide
          px-1 py-1.5
        "
      >
        {loading
          ? Array(5).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => (
              <ProductCard key={p._id} product={p} badge={badge} />
            ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
