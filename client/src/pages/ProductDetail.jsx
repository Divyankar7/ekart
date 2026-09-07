import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Zap, Star, Package,
  Shield, RefreshCw, Truck, ChevronLeft, ChevronRight,
  AlertCircle, Minus, Plus, Tag, Copy, Check, MapPin, Sparkles, Flame,
} from 'lucide-react';
import { fetchProductById, fetchProducts } from '../api/products';
import { trackActivity } from '../api/discovery';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductCarousel from '../components/ProductCarousel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getDiscount = (price) => {
  if (price > 500) return 15;
  if (price > 200) return 20;
  if (price > 100) return 25;
  if (price > 50)  return 30;
  return 10;
};

// ---------------------------------------------------------------------------
// StarRating — larger variant for the detail page
// ---------------------------------------------------------------------------
const StarRating = ({ rating = 0, count = 0, size = 16 }) => {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.3 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10" aria-label={`${rating} out of 5 stars`}>
      <span className="flex items-center gap-0.5">
        {Array(full).fill(null).map((_, i) => (
          <Star key={`f${i}`} size={size} className="fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
        ))}
        {half === 1 && (
          <span className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-zinc-700 fill-zinc-800 absolute inset-0" />
            <span className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={size} className="fill-amber-400 text-amber-400" />
            </span>
          </span>
        )}
        {Array(empty).fill(null).map((_, i) => (
          <Star key={`e${i}`} size={size} className="text-zinc-700 fill-zinc-800" />
        ))}
      </span>
      <span className="text-xs font-mono font-bold text-zinc-200 ml-1">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-zinc-500 font-mono">
        ({count.toLocaleString()} reviews)
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Image gallery with thumbnail strip
// ---------------------------------------------------------------------------
const ImageGallery = ({ images = [], name }) => {
  const [active, setActive] = useState(0);
  const fallback = `https://placehold.co/600x500/18181b/71717a?text=${encodeURIComponent(name)}`;
  const gallery  = images.length ? images : [fallback];

  const prev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length);
  const next = () => setActive((i) => (i + 1) % gallery.length);

  return (
    <div className="flex flex-col gap-3.5 sticky top-24">
      {/* Main image preview */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-950/80 border border-white/10 aspect-square max-h-[500px] flex items-center justify-center group shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <img
          key={active}
          src={gallery[active]}
          alt={`${name} — image ${active + 1}`}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = fallback; }}
        />

        {/* Ambient bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />

        {gallery.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md text-zinc-200 flex items-center justify-center hover:bg-zinc-800 hover:border-cyan-500/50 hover:text-cyan-300 transition-all active:scale-95 shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md text-zinc-200 flex items-center justify-center hover:bg-zinc-800 hover:border-cyan-500/50 hover:text-cyan-300 transition-all active:scale-95 shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {gallery.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
          {gallery.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border-2 transition-all duration-200 ${
                i === active
                  ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                  : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover p-1"
                onError={(e) => { e.currentTarget.src = fallback; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bank Offers & Coupons Component
// ---------------------------------------------------------------------------
const BankOffers = () => {
  const [copiedCode, setCopiedCode] = useState(null);

  const offers = [
    {
      code: 'CYBER10',
      title: '10% Instant Discount',
      desc: 'Max discount ₹1,500 on all HDFC & ICICI Credit Cards.',
      badge: 'Popular',
    },
    {
      code: 'EKARTPRIME',
      title: 'Flat ₹500 Cashback',
      desc: 'Applicable on orders above ₹4,999 with UPI payments.',
      badge: 'Prime Exclusive',
    },
    {
      code: 'TECHFEST26',
      title: 'Free Extended Warranty',
      desc: 'Get additional 1-year brand warranty on electronics.',
      badge: 'Limited Drop',
    },
  ];

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag size={16} className="text-cyan-400" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
          Bank Offers &amp; Promo Codes
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {offers.map((o) => (
          <div
            key={o.code}
            className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                  {o.code}
                </span>
                <span className="text-[9px] text-amber-400 font-mono font-semibold">{o.badge}</span>
              </div>
              <p className="text-xs font-bold text-zinc-200 mb-0.5">{o.title}</p>
              <p className="text-[10px] text-zinc-400 leading-snug">{o.desc}</p>
            </div>

            <button
              onClick={() => handleCopy(o.code)}
              className="mt-2.5 w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition active:scale-95"
            >
              {copiedCode === o.code ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Delivery Estimator Component
// ---------------------------------------------------------------------------
const DeliveryEstimator = () => {
  const [pin, setPin] = useState('');
  const [estimated, setEstimated] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = (e) => {
    e.preventDefault();
    if (pin.trim().length >= 4) {
      setChecking(true);
      setTimeout(() => {
        setChecking(false);
        setEstimated(`Express Delivery by Tomorrow, 11:00 AM (Free)`);
      }, 400);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-cyan-400" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
          Delivery &amp; Service Availability
        </h3>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit PIN Code (e.g. 560001)"
          className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={checking || pin.length < 4}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold text-cyan-300 rounded-xl border border-white/10 transition active:scale-95"
        >
          {checking ? 'Checking…' : 'Check'}
        </button>
      </form>

      {estimated && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-500/30 px-3 py-2 rounded-xl">
          <Truck size={14} className="shrink-0" />
          <span>{estimated}</span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Trust badges
// ---------------------------------------------------------------------------
const TrustBadges = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
    {[
      { icon: Truck,     label: 'Free Express Delivery', sub: 'On orders over ₹999' },
      { icon: RefreshCw, label: '10-Day Replacement',    sub: 'Hassle-free guarantee' },
      { icon: Shield,    label: '1-Year Warranty',       sub: '100% Brand Authorised' },
      { icon: Package,   label: 'Damage-Free Packaging', sub: 'Tamper-proof sealed' },
    ].map(({ icon: Icon, label, sub }) => (
      <div key={label} className="p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-cyan-400" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-zinc-200 truncate">{label}</p>
          <p className="text-[9px] text-zinc-400 truncate">{sub}</p>
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
const DetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div className="skeleton h-5 w-32 rounded-lg mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-zinc-900/50 rounded-3xl p-6 border border-white/10">
      <div className="skeleton rounded-3xl aspect-square" />
      <div className="space-y-4 py-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-3/4 rounded" />
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-10 w-36 rounded" />
        <div className="skeleton h-24 w-full rounded" />
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="skeleton h-12 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Product Details Page
// ---------------------------------------------------------------------------
const ProductDetail = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { activeUser } = useAuth();
  const { addToCart }  = useCart();
  const { format }     = useCurrency();

  const [product,  setProduct]  = useState(null);
  const [similar,  setSimilar]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [qty,      setQty]      = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQty(1);
    try {
      const res = await fetchProductById(id);
      const p   = res.data;
      setProduct(p);

      if (activeUser?.token) {
        trackActivity({ type: 'view', productId: p._id, category: p.category }).catch(() => {});
      }

      fetchProducts({ category: p.category, exclude: p._id, limit: 8, sort: 'trending' })
        .then((r) => setSimilar(r.data ?? []))
        .catch(() => setSimilar([]));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, activeUser]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProduct();
  }, [loadProduct]);

  // ── Cart Handlers ────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    navigate('/checkout');
  };

  // ── States ───────────────────────────────────────────────────────────────
  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <AlertCircle size={36} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-100 mb-1">Product not found</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 border border-white/10 rounded-full text-sm font-medium hover:bg-zinc-800 text-zinc-300 transition"
          >
            <ArrowLeft size={14} /> Go back
          </button>
          <button
            onClick={loadProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-full text-sm font-semibold hover:from-cyan-400 hover:to-indigo-500 transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    name, category, brand, price, description,
    images, ratingsAverage, ratingsCount,
    totalSales, stock, tags = [],
  } = product;

  const discount     = getDiscount(price);
  const originalUsd  = price / (1 - discount / 100);
  const isLowStock   = stock > 0 && stock < 5;
  const isOutOfStock = stock === 0;
  const maxQty       = Math.min(stock, 10);

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Breadcrumb / Back ── */}
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6" aria-label="Breadcrumb">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(category)}`} className="capitalize hover:text-cyan-300 transition-colors">
            {category}
          </Link>
          <span>/</span>
          <span className="text-zinc-200 font-semibold truncate max-w-[200px] sm:max-w-md">{name}</span>
        </nav>

        {/* ── Main Product Display Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-zinc-900/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.5)] mb-12">

          {/* Left: Gallery */}
          <ImageGallery images={images} name={name} />

          {/* Right: Product Details */}
          <div className="flex flex-col gap-5">

            {/* Category / Brand / Bestseller Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                {category}
              </span>
              {brand && (
                <span className="text-xs font-mono text-zinc-300 font-medium bg-zinc-800/80 border border-white/10 px-3 py-1 rounded-full">
                  {brand}
                </span>
              )}
              {totalSales > 100 && (
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <Flame size={12} className="text-amber-400" /> Bestseller Drop
                </span>
              )}
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white leading-tight">
              {name}
            </h1>

            {/* Ratings row */}
            <div className="flex items-center gap-3">
              <StarRating rating={ratingsAverage} count={ratingsCount} size={15} />
            </div>

            {/* Price block */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/[0.08] flex items-baseline gap-3.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {format(price)}
              </span>
              <span className="text-base font-mono text-zinc-500 line-through">
                {format(originalUsd)}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                {discount}% OFF
              </span>
            </div>

            {/* Live Inventory Status */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-3.5 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Currently Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Urgency: Only {stock} units left in stock!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  In Stock — Ready for Instant Dispatch
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-zinc-300 leading-relaxed border-t border-white/[0.08] pt-4">
                {description}
              </p>
            )}

            {/* Bank Offers & Coupons Accordion */}
            <BankOffers />

            {/* Delivery Estimator */}
            <DeliveryEstimator />

            {/* Quantity picker */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  Quantity:
                </span>
                <div className="flex items-center border border-white/10 rounded-2xl bg-zinc-950/80 overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold font-mono text-white select-none">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {isLowStock && (
                  <span className="text-xs font-mono text-amber-400 font-medium">Max {maxQty} per user</span>
                )}
              </div>
            )}

            {/* High-visibility Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3.5 rounded-2xl font-bold text-sm
                  border-2 border-cyan-500/80 bg-cyan-950/30 text-cyan-300
                  hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white
                  hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]
                  active:scale-[0.98]
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200 cursor-pointer
                "
              >
                <ShoppingCart size={17} />
                <span>{addedMsg ? '✓ Added to Cart!' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="
                  btn-shimmer flex-1 flex items-center justify-center gap-2
                  py-3.5 rounded-2xl font-bold text-sm
                  bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600
                  hover:from-amber-400 hover:via-orange-500 hover:to-rose-500
                  text-white shadow-[0_0_25px_rgba(245,158,11,0.35)]
                  active:scale-[0.98]
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200 cursor-pointer
                "
              >
                <Zap size={17} className="fill-white" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Trust Badges */}
            <TrustBadges />

          </div>
        </div>

        {/* ── Similar products shelf ── */}
        {similar.length > 0 && (
          <div className="bg-zinc-900/40 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg">
            <ProductCarousel
              title="Similar Cyber Recommendations"
              subtitle={`Top tier selections in ${category}`}
              products={similar}
              accentColor="from-indigo-500 to-cyan-400"
            />
          </div>
        )}

      </div>
    </main>
  );
};

export default ProductDetail;
