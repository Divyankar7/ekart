import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GST_RATE = 0.18; // 18% GST

// ---------------------------------------------------------------------------
// CartItem row
// ---------------------------------------------------------------------------
const CartItem = ({ item, onQtyChange, onRemove, format }) => {
  const { product, qty } = item;
  const imageUrl =
    product.images?.[0] ??
    `https://placehold.co/80x80/18181b/71717a?text=${encodeURIComponent(product.name)}`;

  return (
    <li className="flex gap-3.5 py-4 border-b border-white/[0.06] last:border-0 group">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover p-0.5"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/80x80/18181b/71717a?text=img`;
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-100 line-clamp-1 leading-snug">
              {product.name}
            </p>
            <button
              onClick={() => onRemove(product._id)}
              className="text-zinc-500 hover:text-rose-400 p-1 hover:bg-rose-950/40 rounded-lg transition"
              aria-label="Remove item"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <p className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider mt-0.5">
            {product.category}
          </p>
        </div>

        {/* Price + qty row */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-bold font-mono text-white">
            {format(product.price * qty)}
          </span>

          {/* Qty stepper */}
          <div className="flex items-center border border-white/10 rounded-xl bg-zinc-900/80 overflow-hidden">
            {qty === 1 ? (
              <button
                onClick={() => onRemove(product._id)}
                className="w-7 h-7 flex items-center justify-center text-rose-400 hover:bg-rose-950/40 transition"
                aria-label="Remove item"
              >
                <Trash2 size={12} />
              </button>
            ) : (
              <button
                onClick={() => onQtyChange(product._id, qty - 1)}
                className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                aria-label="Decrease quantity"
              >
                <Minus size={12} />
              </button>
            )}

            <span className="w-6 text-center text-xs font-bold font-mono text-white select-none">
              {qty}
            </span>

            <button
              onClick={() => onQtyChange(product._id, qty + 1)}
              className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

// ---------------------------------------------------------------------------
// Price summary row helper
// ---------------------------------------------------------------------------
const SummaryRow = ({ label, value, bold = false, accent = false }) => (
  <div className={`flex items-center justify-between text-xs sm:text-sm ${bold ? 'font-bold' : 'font-medium'}`}>
    <span className={accent ? 'text-zinc-200' : 'text-zinc-400 font-mono'}>{label}</span>
    <span className={accent ? 'text-cyan-300 text-base font-mono font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-zinc-200 font-mono'}>{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
const EmptyCart = ({ onClose }) => (
  <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
    <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      <ShoppingBag size={36} className="text-cyan-400" />
    </div>
    <h3 className="text-base font-bold font-display text-white mb-1">Your cart is empty</h3>
    <p className="text-xs text-zinc-400 mb-6 max-w-xs">
      No cyber drops added yet. Explore our discovery feed and grab the latest gear.
    </p>
    <button
      onClick={onClose}
      className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-full text-xs font-bold font-mono transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
    >
      Start Shopping
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Main CartDrawer
// ---------------------------------------------------------------------------
const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    items, isOpen, closeCart,
    updateQty, removeItem, subtotalUsd, totalItems,
  } = useCart();
  const { format } = useCurrency();

  const drawerRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeCart(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeCart]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Focus trap */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => drawerRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const taxUsd   = subtotalUsd * GST_RATE;
  const totalUsd = subtotalUsd + taxUsd;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {/* ── Dimmed Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`
          fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* ── Drawer Panel ── */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
        className={`
          fixed top-0 right-0 h-full w-full max-w-md
          bg-[#09090b]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <h2 className="text-sm font-bold font-display text-white">
              Cyber Cart
            </h2>
            {totalItems > 0 && (
              <span className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Free Delivery Status Bar ── */}
        {items.length > 0 && (
          <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center gap-2 text-xs font-mono text-emerald-300">
            <Sparkles size={13} className="text-emerald-400 shrink-0" />
            <span>Eligible for Free Cyber Express Delivery!</span>
          </div>
        )}

        {/* ── Body ── */}
        {items.length === 0 ? (
          <EmptyCart onClose={closeCart} />
        ) : (
          <>
            {/* Item list — scrollable */}
            <ul className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-white/[0.04]">
              {items.map((item) => (
                <CartItem
                  key={item.product._id}
                  item={item}
                  onQtyChange={updateQty}
                  onRemove={removeItem}
                  format={format}
                />
              ))}
            </ul>

            {/* ── Footer — Price summary + CTA ── */}
            <div className="border-t border-white/[0.08] px-6 py-5 space-y-3.5 bg-zinc-950/80">
              <SummaryRow
                label="Subtotal"
                value={format(subtotalUsd)}
              />
              <SummaryRow
                label={`GST (${(GST_RATE * 100).toFixed(0)}%)`}
                value={format(taxUsd)}
              />
              <SummaryRow
                label="Delivery"
                value="FREE"
              />
              <div className="border-t border-dashed border-white/10 pt-3">
                <SummaryRow
                  label="Total Payable"
                  value={format(totalUsd)}
                  bold
                  accent
                />
              </div>
              <p className="text-[10px] font-mono text-zinc-500 text-center">
                🔒 Inclusive of all taxes · 256-bit Encrypted Checkout
              </p>

              <button
                onClick={handleCheckout}
                className="
                  btn-shimmer w-full flex items-center justify-center gap-2
                  py-3.5 rounded-2xl font-bold text-sm font-mono
                  bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700
                  hover:from-cyan-400 hover:via-indigo-500 hover:to-indigo-600
                  text-white shadow-[0_0_25px_rgba(6,182,212,0.4)]
                  active:scale-[0.98] transition-all duration-200 cursor-pointer
                "
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
