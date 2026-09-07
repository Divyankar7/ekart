import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  PackageSearch, RefreshCw, Sparkles, Filter,
} from 'lucide-react';
import { fetchProducts } from '../api/products';
import useShopFilters, { SORT_OPTIONS, CATEGORIES } from '../hooks/useShopFilters';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { useCurrency } from '../context/CurrencyContext';

// ---------------------------------------------------------------------------
// Active filter chip
// ---------------------------------------------------------------------------
const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold px-3 py-1 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.2)]">
    {label}
    <button onClick={onRemove} className="hover:text-white transition-colors cursor-pointer" aria-label={`Remove ${label} filter`}>
      <X size={12} />
    </button>
  </span>
);

// ---------------------------------------------------------------------------
// Pagination row
// ---------------------------------------------------------------------------
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  const withEllipsis = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) withEllipsis.push('…');
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {withEllipsis.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-zinc-600 font-mono text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl text-xs font-mono font-bold transition active:scale-95 cursor-pointer ${
              p === page
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400'
                : 'border border-white/10 bg-zinc-900 text-zinc-400 hover:border-cyan-500/40 hover:text-white'
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main ShopPage
// ---------------------------------------------------------------------------
const ShopPage = () => {
  const filters  = useShopFilters();
  const { format } = useCurrency();

  const {
    search, sort, categories, minRating, minPrice, maxPrice,
    activeFilterCount, apiParams,
    setSearch, setSort, toggleCategory, setMinRating,
    setMinPrice, setMaxPrice, clearAllFilters, setPage,
    LIMIT,
  } = filters;

  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [bounds,     setBounds]     = useState({ minPrice: 0, maxPrice: 2000 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Local search input state
  const [localSearch, setLocalSearch] = useState(search);
  const searchTimer = useRef(null);

  useEffect(() => { setLocalSearch(search); }, [search]);

  // Debounce search (400 ms)
  const handleSearchChange = (val) => {
    setLocalSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProducts(apiParams);
        if (cancelled) return;
        setProducts(res.data   ?? []);
        setTotal(res.total     ?? 0);
        setTotalPages(res.totalPages ?? 1);
        if (res.bounds) setBounds(res.bounds);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [apiParams]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [filters.page]);

  // Active filter chips
  const chips = [];
  categories.forEach((c) => {
    const cat = CATEGORIES.find((x) => x.slug === c);
    chips.push({ key: `cat-${c}`, label: cat?.label ?? c, onRemove: () => toggleCategory(c) });
  });
  if (minRating) {
    chips.push({ key: 'rating', label: `${minRating}★ & Above`, onRemove: () => setMinRating('') });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const lo = minPrice !== undefined ? format(minPrice) : format(bounds.minPrice);
    const hi = maxPrice !== undefined ? format(maxPrice) : format(bounds.maxPrice);
    chips.push({ key: 'price', label: `${lo} – ${hi}`, onRemove: () => { setMinPrice(undefined); setMaxPrice(undefined); } });
  }
  if (search) {
    chips.push({ key: 'q', label: `"${search}"`, onRemove: () => { setSearch(''); setLocalSearch(''); } });
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Trending';

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page Header ── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-2">
              <Sparkles size={12} />
              <span>CATALOG MATRIX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              Explore Tech &amp; Gear
            </h1>
          </div>

          {!loading && (
            <p className="text-xs font-mono text-zinc-400">
              <span className="text-cyan-300 font-bold">{total.toLocaleString()}</span> drops detected
              {search && <> for <span className="text-white">"{search}"</span></>}
            </p>
          )}
        </div>

        {/* ── Search + Mobile Filter Bar ── */}
        <div className="flex gap-3 mb-6">
          {/* Search input */}
          <div className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Filter products, spec, brand..."
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm border border-white/10 rounded-2xl bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/60 transition shadow-inner"
              aria-label="Search products"
            />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-xs font-bold text-zinc-200 hover:border-cyan-500/40 transition active:scale-95"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={15} className="text-cyan-400" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-cyan-500 text-black text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Inline Sort on Mobile/Tablet */}
          <div className="hidden sm:flex lg:hidden items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-mono border border-white/10 rounded-2xl px-3.5 py-3 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-cyan-500/60 transition"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-950 text-white">{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Active Filter Chips ── */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {chips.map((chip) => (
              <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs font-mono text-zinc-400 hover:text-cyan-400 underline underline-offset-4 transition-colors ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* ── Body: Sidebar + Grid ── */}
        <div className="flex gap-8 items-start">

          {/* Sidebar */}
          <FilterSidebar
            bounds={bounds}
            sort={sort} categories={categories}
            minRating={minRating} minPrice={minPrice} maxPrice={maxPrice}
            activeFilterCount={activeFilterCount}
            setSort={setSort} toggleCategory={toggleCategory}
            setMinRating={setMinRating}
            setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
            clearAllFilters={clearAllFilters}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* Product Grid Container */}
          <div className="flex-1 min-w-0">

            {/* Meta Row */}
            <div className="flex items-center justify-between mb-5 text-xs font-mono text-zinc-400">
              <span>
                {loading ? 'Scanning catalog…' : `${total} items matching criteria`}
              </span>
              <span className="hidden lg:block">
                Mode: <span className="text-cyan-300 font-bold">{currentSortLabel}</span>
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/40 rounded-3xl border border-rose-500/20 p-8">
                <RefreshCw size={36} className="text-rose-400 mb-3" />
                <p className="text-sm text-zinc-300 mb-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-full text-xs font-bold font-mono hover:from-cyan-400 hover:to-indigo-500 transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Retry Scan
                </button>
              </div>
            )}

            {/* Skeleton Grid */}
            {loading && !error && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {Array(LIMIT).fill(null).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-900/40 rounded-3xl border border-white/10 p-8">
                <PackageSearch size={48} className="text-zinc-600 mb-4" />
                <h2 className="text-base font-bold font-display text-white mb-1">No matches found</h2>
                <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                  Try widening your price range or removing filter tags to discover more products.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-full text-xs font-bold font-mono hover:from-cyan-400 hover:to-indigo-500 transition shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ShopPage;
