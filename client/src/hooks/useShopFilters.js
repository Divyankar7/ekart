import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useShopFilters
 *
 * Single source of truth for all /shop filter state.
 * Reads from and writes to URL search params so filters are
 * bookmarkable, shareable, and survive page refreshes.
 *
 * URL shape:
 *   /shop?q=headphones&category=electronics,footwear&sort=price-asc
 *        &minPrice=50&maxPrice=500&minRating=4&page=2
 */

export const CATEGORIES = [
  { slug: 'electronics',   label: 'Electronics' },
  { slug: 'footwear',      label: 'Footwear' },
  { slug: 'apparel',       label: 'Apparel' },
  { slug: 'home & kitchen', label: 'Home & Kitchen' },
  { slug: 'accessories',   label: 'Accessories' },
];

export const SORT_OPTIONS = [
  { value: 'trending',    label: 'Trending' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
];

export const RATING_OPTIONS = [
  { value: '4', label: '4★ & above' },
  { value: '3', label: '3★ & above' },
];

const DEFAULT_PAGE  = 1;
const DEFAULT_SORT  = 'trending';
const DEFAULT_LIMIT = 12;

const useShopFilters = () => {
  const [params, setParams] = useSearchParams();

  // ── Readers ──────────────────────────────────────────────────────────────

  const search     = params.get('q')         ?? '';
  const sort       = params.get('sort')      ?? DEFAULT_SORT;
  const minRating  = params.get('minRating') ?? '';
  const page       = parseInt(params.get('page') ?? String(DEFAULT_PAGE), 10);
  const minPrice   = params.get('minPrice')  !== null ? Number(params.get('minPrice'))  : undefined;
  const maxPrice   = params.get('maxPrice')  !== null ? Number(params.get('maxPrice'))  : undefined;

  const categories = useMemo(() => {
    const raw = params.get('category');
    return raw ? raw.split(',').map((c) => c.trim()).filter(Boolean) : [];
  }, [params]);

  // ── Writers — each setter merges into existing params ────────────────────

  const setParam = useCallback((key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      // Reset to page 1 on any filter change (not on page change itself)
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  }, [setParams]);

  const setSearch   = useCallback((v) => setParam('q',         v), [setParam]);
  const setSort     = useCallback((v) => setParam('sort',      v), [setParam]);
  const setMinRating = useCallback((v) => setParam('minRating', v), [setParam]);
  const setPage     = useCallback((v) => setParam('page',      v), [setParam]);
  const setMinPrice = useCallback((v) => setParam('minPrice',  v), [setParam]);
  const setMaxPrice = useCallback((v) => setParam('maxPrice',  v), [setParam]);

  const toggleCategory = useCallback((slug) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const existing = (prev.get('category') ?? '')
        .split(',').map((c) => c.trim()).filter(Boolean);
      const updated = existing.includes(slug)
        ? existing.filter((c) => c !== slug)
        : [...existing, slug];
      if (updated.length) next.set('category', updated.join(','));
      else next.delete('category');
      next.set('page', '1');
      return next;
    });
  }, [setParams]);

  const clearAllFilters = useCallback(() => {
    setParams(new URLSearchParams());
  }, [setParams]);

  // ── API params object ready to pass to fetchProducts ─────────────────────
  const apiParams = useMemo(() => {
    const p = {
      sort,
      page,
      limit: DEFAULT_LIMIT,
    };
    if (search)    p.search    = search;
    if (categories.length) p.category = categories.join(',');
    if (minPrice !== undefined) p.minPrice = minPrice;
    if (maxPrice !== undefined) p.maxPrice = maxPrice;
    if (minRating) p.minRating = minRating;
    return p;
  }, [search, sort, categories, minPrice, maxPrice, minRating, page]);

  // ── Active filter count (for badge on mobile toggle) ─────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (categories.length) n += categories.length;
    if (minRating)          n += 1;
    if (minPrice !== undefined || maxPrice !== undefined) n += 1;
    return n;
  }, [categories, minRating, minPrice, maxPrice]);

  return {
    // state
    search, sort, categories, minRating, page,
    minPrice, maxPrice, activeFilterCount,
    // setters
    setSearch, setSort, toggleCategory, setMinRating,
    setPage, setMinPrice, setMaxPrice, clearAllFilters,
    // ready-to-use object for the API call
    apiParams,
    // constants
    LIMIT: DEFAULT_LIMIT,
  };
};

export default useShopFilters;
