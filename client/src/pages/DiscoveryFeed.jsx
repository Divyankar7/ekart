import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, TrendingUp, Flame, AlertCircle, RefreshCw,
  ArrowRight, ShieldCheck, Zap, Layers, Compass, CheckCircle2,
} from 'lucide-react';
import { fetchDiscoveryFeed } from '../api/discovery';
import { useAuth } from '../context/AuthContext';
import ProductCarousel from '../components/ProductCarousel';
import CategoryBubbles from '../components/CategoryBubbles';
import FlashSaleBanner from '../components/FlashSaleBanner';

/* ── Hero Section ─────────────────────────────────────────────────────────── */
const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-3xl overflow-hidden mb-12 border border-white/10 bg-gradient-to-b from-zinc-900/90 via-[#0f111a]/80 to-zinc-950 p-6 sm:p-10 md:p-14 shadow-[0_10px_50px_rgba(0,0,0,0.7)]">
      {/* Background glowing mesh orb elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        {/* Futuristic Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold mb-5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>CYBER DROP 2026 // LIVE</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.1] mb-4">
          Next-Gen <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
            Shopping Experience
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 mb-8 max-w-lg leading-relaxed">
          Explore breakthrough consumer tech, high-performance audio, gaming gear, and exclusive limited-edition drops with ultra-fast delivery.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate('/shop')}
            className="
              btn-shimmer flex items-center gap-2.5 px-6 py-3.5 rounded-2xl
              bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700
              hover:from-cyan-400 hover:via-indigo-500 hover:to-indigo-600
              text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)]
              active:scale-95 transition-all duration-200 cursor-pointer
            "
          >
            <span>Explore Drops</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/shop?sort=trending')}
            className="
              flex items-center gap-2 px-5 py-3.5 rounded-2xl
              bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-cyan-500/40
              text-zinc-200 hover:text-white font-semibold text-sm
              active:scale-95 transition-all duration-200 cursor-pointer
            "
          >
            <Flame size={16} className="text-amber-400" />
            <span>Trending Deals</span>
          </button>
        </div>

        {/* Features / Guarantees Strip */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-10 pt-8 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Zap size={15} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">Fast Shipping</p>
              <p className="text-[10px] text-zinc-400 hidden sm:block">Dispatch in 24h</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={15} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">100% Genuine</p>
              <p className="text-[10px] text-zinc-400 hidden sm:block">Verified Brands</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">Prime Rewards</p>
              <p className="text-[10px] text-zinc-400 hidden sm:block">Exclusive perks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Cold-start category shelf ────────────────────────────────────────────── */
const PopularCategoriesShelf = ({ items, loading }) => {
  const navigate = useNavigate();
  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className="mb-12" aria-label="Popular categories">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]" aria-hidden />
        <h2 className="text-base sm:text-lg font-bold font-display text-zinc-100 tracking-tight">Popular Right Now</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {loading
          ? Array(6).fill(null).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.08] bg-zinc-900/50">
                <div className="skeleton h-32 w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))
          : items.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/product/${item._id}`)}
                className="
                  rounded-2xl overflow-hidden border border-white/[0.08] bg-zinc-900/60
                  hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]
                  hover:-translate-y-1 transition-all duration-300 cursor-pointer group
                "
              >
                <div className="h-32 bg-zinc-950/80 overflow-hidden relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/300x200/18181b/71717a?text=${encodeURIComponent(item.category)}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs capitalize">
                      {item.category}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-mono font-semibold text-cyan-400 uppercase tracking-wide mb-0.5 truncate">
                    {item.category}
                  </p>
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
};

/* ── Feed type badge ──────────────────────────────────────────────────────── */
const FeedTypeBadge = ({ feedType, meta }) => {
  if (!feedType) return null;
  const isPersonalized = feedType === 'personalized';
  return (
    <div className={`
      inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold mb-8
      ${isPersonalized
        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
        : 'bg-zinc-900 text-zinc-400 border border-white/10'}
    `}>
      {isPersonalized ? <Sparkles size={13} className="text-cyan-400" /> : <TrendingUp size={13} className="text-amber-400" />}
      <span>
        {isPersonalized
          ? `Curated Algorithm: ${meta?.userId ? meta.userId.toUpperCase() : 'Active Profile'}`
          : 'Global Popular Picks'}
      </span>
      {isPersonalized && meta?.topCategories?.length > 0 && (
        <span className="flex gap-1 ml-1.5">
          {meta.topCategories.map((c) => (
            <span key={c} className="bg-indigo-900/80 border border-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full text-[10px] capitalize">
              {c}
            </span>
          ))}
        </span>
      )}
    </div>
  );
};

/* ── Main Discovery Feed Page ─────────────────────────────────────────────── */
const DiscoveryFeed = ({ searchQuery }) => {
  const navigate = useNavigate();
  const { activeUser } = useAuth();
  const [feedData, setFeedData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDiscoveryFeed();
      setFeedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [activeUser.id, loadFeed]);

  const feed       = feedData?.feed ?? {};
  const feedType   = feedData?.feedType;
  const meta       = feedData?.meta;
  const isPersonal = feedType === 'personalized';

  /* ── Error state ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <AlertCircle size={32} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-100 mb-1">Couldn't load your feed</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">{error}</p>
        <button
          onClick={loadFeed}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-full text-sm font-semibold hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Hero Banner ── */}
      <HeroBanner />

      {/* ── Flash sale banner ── */}
      <FlashSaleBanner />

      {/* ── Category story bubbles ── */}
      <CategoryBubbles onSelect={(slug) => navigate(`/shop?category=${encodeURIComponent(slug)}`)} />

      {/* ── Feed type indicator ── */}
      <FeedTypeBadge feedType={feedType} meta={meta} />

      {/* ────────────────────────────────────────────────────────────────────
          PERSONALIZED SHELVES
      ──────────────────────────────────────────────────────────────────── */}
      {(isPersonal || loading) && (
        <>
          {/* 1. Continue Browsing */}
          <ProductCarousel
            title="Pick Up Where You Left Off"
            subtitle="Based on your recent views and interactions"
            products={feed.continueBrowsing ?? []}
            loading={loading}
            accentColor="from-cyan-400 to-blue-500"
          />

          {/* 2. Based on Recent Search */}
          <ProductCarousel
            title="Inspired by Your Search"
            subtitle={
              meta?.basedOnSearch?.query
                ? `Results matched with "${meta.basedOnSearch.query}"`
                : undefined
            }
            products={feed.basedOnRecentSearch ?? []}
            loading={loading}
            accentColor="from-indigo-400 to-purple-500"
          />

          {/* 3. For You */}
          <ProductCarousel
            title="Curated Algorithm For You"
            subtitle="Hand-picked picks tailored to your preferences"
            products={feed.forYou ?? []}
            loading={loading}
            accentColor="from-fuchsia-400 to-pink-500"
          />
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          COLD-START SHELVES
      ──────────────────────────────────────────────────────────────────── */}
      {(!isPersonal || loading) && (
        <PopularCategoriesShelf
          items={feed.popularCategories ?? []}
          loading={loading}
        />
      )}

      {/* ────────────────────────────────────────────────────────────────────
          ALWAYS-VISIBLE SHELVES
      ──────────────────────────────────────────────────────────────────── */}

      {/* Fresh Drops */}
      <ProductCarousel
        title="Fresh Tech Drops"
        subtitle="Newly launched releases in the past 14 days"
        products={feed.freshDrops ?? []}
        loading={loading}
        badge="NEW"
        accentColor="from-emerald-400 to-teal-500"
      />

      {/* Trending Now */}
      <ProductCarousel
        title="Trending Hotlist"
        subtitle="Top ranked products by sales velocity and user ratings"
        products={feed.trendingNow ?? []}
        loading={loading}
        badge="🔥"
        accentColor="from-amber-400 to-orange-500"
      />

      {/* ── Empty state ── */}
      {!loading && !error && Object.values(feed).every((s) => s?.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-900/40 rounded-3xl border border-white/10 p-8">
          <Flame size={44} className="text-amber-400 mb-3 animate-bounce" />
          <h2 className="text-lg font-bold text-zinc-100 mb-1">No products found in feed</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Run <code className="font-mono bg-zinc-800 text-cyan-300 px-2 py-0.5 rounded border border-white/10">npm run seed</code> in server to populate catalog.
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-full text-sm font-semibold hover:from-cyan-400 hover:to-indigo-500 transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            Go to Shop Catalog
          </button>
        </div>
      )}
    </main>
  );
};

export default DiscoveryFeed;
