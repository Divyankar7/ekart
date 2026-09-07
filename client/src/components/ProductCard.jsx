import { ShoppingCart, Star, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackActivity } from '../api/discovery';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Render N filled/half/empty stars up to 5 */
const StarRating = ({ rating = 0, count = 0 }) => {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.3 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array(full).fill(null).map((_, i) => (
        <Star key={`f${i}`} size={11} className="fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
      ))}
      {half === 1 && (
        <span className="relative inline-block w-[11px] h-[11px]">
          <Star size={11} className="text-zinc-700 fill-zinc-800 absolute inset-0" />
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <Star size={11} className="fill-amber-400 text-amber-400" />
          </span>
        </span>
      )}
      {Array(empty).fill(null).map((_, i) => (
        <Star key={`e${i}`} size={11} className="text-zinc-700 fill-zinc-800" />
      ))}
      {count > 0 && (
        <span className="text-[10px] font-mono text-zinc-500 ml-1">({count.toLocaleString()})</span>
      )}
    </span>
  );
};

/** Fake a discount percentage from the price for visual variety */
const getDiscount = (price) => {
  if (price > 500) return 15;
  if (price > 200) return 20;
  if (price > 100) return 25;
  if (price > 50)  return 30;
  return 10;
};

const getOriginalPrice = (price, discount) =>
  price / (1 - discount / 100);

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
export const ProductCardSkeleton = () => (
  <div className="flex-shrink-0 w-48 sm:w-52 rounded-2xl overflow-hidden border border-white/[0.08] bg-zinc-900/50 backdrop-blur-md">
    <div className="skeleton h-48 w-full" />
    <div className="p-3.5 space-y-2.5">
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-3.5 w-full" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-4 w-2/5" />
      <div className="skeleton h-8 w-full rounded-xl" />
    </div>
  </div>
);

/* ── Main Card ────────────────────────────────────────────────────────────── */
const ProductCard = ({ product, badge }) => {
  const navigate    = useNavigate();
  const { addToCart } = useCart();
  const { activeUser } = useAuth();
  const { format } = useCurrency();

  const {
    _id,
    name,
    category,
    price,
    images,
    ratingsAverage,
    ratingsCount,
    stock,
  } = product;

  const discount    = getDiscount(price);
  const original    = getOriginalPrice(price, discount);
  const imageUrl    = images?.[0] ?? `https://placehold.co/400x300/18181b/71717a?text=${encodeURIComponent(name)}`;
  const isLowStock  = stock > 0 && stock < 5;
  const isOutOfStock = stock === 0;

  const handleCardClick = () => {
    if (activeUser.token) {
      trackActivity({ type: 'view', productId: _id, category }).catch(() => {});
    }
    navigate(`/product/${_id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) addToCart(product);
  };

  return (
    <article
      onClick={handleCardClick}
      className="
        flex-shrink-0 w-48 sm:w-52 rounded-2xl overflow-hidden
        bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08]
        hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)]
        hover:-translate-y-1.5 cursor-pointer select-none
        transition-all duration-300 group flex flex-col justify-between
      "
      aria-label={name}
    >
      {/* ── Thumbnail Container ── */}
      <div className="relative overflow-hidden h-44 sm:h-48 bg-zinc-950/70">
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/400x300/18181b/71717a?text=${encodeURIComponent(category)}`;
          }}
        />

        {/* Ambient Gradient Overlay on Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-950/90 to-transparent pointer-events-none" />

        {/* Discount Badge in Bright Emerald */}
        <span className="absolute top-2 left-2 bg-emerald-950/85 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]">
          -{discount}%
        </span>

        {/* Custom shelf badge (NEW / 🔥) */}
        {badge && (
          <span className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-900/90 border border-white/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            {badge}
          </span>
        )}

        {/* 'eKart Assured' Neon Pill */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full">
          <Zap size={9} className="text-cyan-400 fill-cyan-400" />
          <span>PRIME</span>
        </div>

        {/* Low-stock urgency */}
        {isLowStock && (
          <span className="absolute bottom-2 right-2 bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full animate-pulse">
            Only {stock} left
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-rose-400 text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* ── Product Info ── */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Category chip */}
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block truncate">
            {category}
          </span>

          {/* Name */}
          <p className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
            {name}
          </p>

          {/* Stars */}
          <div className="pt-0.5">
            <StarRating rating={ratingsAverage} count={ratingsCount} />
          </div>
        </div>

        {/* Price & CTA Row */}
        <div className="pt-1.5 space-y-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold font-mono text-zinc-100">
              {format(price)}
            </span>
            <span className="text-[11px] font-mono text-zinc-500 line-through">
              {format(original)}
            </span>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="
              w-full flex items-center justify-center gap-1.5
              py-2 rounded-xl text-xs font-bold
              bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700
              hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600
              text-white shadow-md shadow-indigo-950/60
              active:scale-[0.97]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-200 cursor-pointer
            "
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingCart size={13} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
