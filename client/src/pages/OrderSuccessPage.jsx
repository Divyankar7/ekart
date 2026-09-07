import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, Package, Truck, MapPin, Home,
  ClipboardList, Loader2, AlertCircle, RefreshCw,
  Sparkles, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { fetchOrderById } from '../api/orders';
import { useCurrency } from '../context/CurrencyContext';

// ---------------------------------------------------------------------------
// Order status pipeline — all 4 stages always rendered
// ---------------------------------------------------------------------------
const STAGES = [
  {
    key:   'placed',
    label: 'Order Placed',
    icon:  ClipboardList,
    desc:  'Received & queued',
  },
  {
    key:   'processing',
    label: 'Processing',
    icon:  Package,
    desc:  'Packing & quality check',
  },
  {
    key:   'shipped',
    label: 'In Transit',
    icon:  Truck,
    desc:  'Dispatched with courier',
  },
  {
    key:   'delivered',
    label: 'Delivered',
    icon:  Home,
    desc:  'Arrived at your door',
  },
];

const STATUS_ORDER = ['placed', 'processing', 'shipped', 'delivered'];

const OrderTimeline = ({ currentStatus }) => {
  const currentIdx = Math.max(0, STATUS_ORDER.indexOf(currentStatus));

  return (
    <div className="relative pt-2 pb-4">
      {/* Connector line (Background track from Center of Col 1 to Center of Col 4) */}
      <div className="absolute top-[30px] left-[12.5%] right-[12.5%] h-1 bg-zinc-800 rounded-full hidden sm:block" aria-hidden />
      {/* Active glowing progress bar */}
      <div
        className="absolute top-[30px] left-[12.5%] h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 rounded-full hidden sm:block transition-all duration-700 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
        style={{ width: `${(currentIdx / (STAGES.length - 1)) * 75}%` }}
        aria-hidden
      />

      <ol className="relative grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-2">
        {STAGES.map((stage, i) => {
          const done    = i <= currentIdx;
          const active  = i === currentIdx;
          const Icon    = stage.icon;

          return (
            <li key={stage.key} className="flex flex-col items-center text-center gap-2.5">
              {/* Circle node */}
              <span className={`
                relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center
                border transition-all duration-300
                ${done
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 border-cyan-400/80 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-600'}
                ${active ? 'ring-4 ring-cyan-500/20 scale-105' : ''}
              `}>
                {done && i < currentIdx ? (
                  <CheckCircle2 size={19} className="text-white" />
                ) : (
                  <Icon size={19} />
                )}
                {active && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-ping" aria-hidden />
                )}
              </span>

              {/* Label & description */}
              <div className="px-1">
                <p className={`text-xs font-bold ${done ? 'text-cyan-300' : 'text-zinc-500'}`}>
                  {stage.label}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[110px] mx-auto leading-tight">
                  {stage.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skeleton (Dark theme)
// ---------------------------------------------------------------------------
const SuccessSkeleton = () => (
  <div className="min-h-screen bg-[#09090b] max-w-3xl mx-auto px-4 py-16 space-y-6">
    <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse mx-auto" />
    <div className="h-7 w-56 bg-zinc-800 animate-pulse rounded-lg mx-auto" />
    <div className="h-4 w-72 bg-zinc-800/60 animate-pulse rounded mx-auto" />
    <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
      <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-60 bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const OrderSuccessPage = () => {
  const { orderId }  = useParams();
  const navigate     = useNavigate();
  const { format }   = useCurrency();

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchOrderById(orderId)
      .then((res) => { if (!cancelled) setOrder(res.data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) return <SuccessSkeleton />;

  if (error) {
    return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <AlertCircle size={30} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Could Not Load Order</h2>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-semibold transition"
            >
              <Home size={15} /> Storefront
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:from-orange-400 hover:to-amber-400 transition"
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const {
    displayId, status, items, shippingAddress,
    subtotalUsd, taxUsd, shippingUsd, totalUsd,
    paymentMethod, estimatedDelivery, createdAt,
  } = order;

  const deliveryDate = estimatedDelivery
    ? new Date(estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '5–7 Business Days';

  const orderDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* ── Success header ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={42} />
            </div>
            <div className="absolute -inset-1 rounded-3xl bg-emerald-400/20 blur-xl -z-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-sm text-zinc-400 max-w-md">
            Thank you for shopping with eKart. A confirmation email and tracking link have been dispatched.
          </p>
        </div>

        {/* ── Order meta card ── */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Order Reference</p>
              <p className="font-bold text-cyan-400 font-mono text-xs">{displayId}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Date Placed</p>
              <p className="font-semibold text-zinc-200 text-xs">{orderDate}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Payment Method</p>
              <p className="font-semibold text-zinc-200 text-xs capitalize flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Settled)'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Estimated Arrival</p>
              <p className="font-bold text-amber-400 text-xs leading-snug">{deliveryDate}</p>
            </div>
          </div>
        </div>

        {/* ── Tracking timeline ── */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl mb-6">
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2.5 pb-3 border-b border-white/5">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Truck size={16} />
            </span>
            Shipment Pipeline
          </h2>
          <OrderTimeline currentStatus={status} />
        </div>

        {/* ── Delivery address ── */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl mb-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5 mb-4 pb-3 border-b border-white/5">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MapPin size={16} />
            </span>
            Delivery Address
          </h2>
          <div className="text-sm text-zinc-300 space-y-1">
            <p className="font-bold text-white text-base">{shippingAddress.fullName}</p>
            <p className="text-zinc-400">{shippingAddress.street}</p>
            <p className="text-zinc-400">{shippingAddress.city}, PIN {shippingAddress.pincode}</p>
            <p className="text-cyan-400 text-xs pt-1 font-mono">Contact: {shippingAddress.phone}</p>
          </div>
        </div>

        {/* ── Items ordered ── */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl mb-8">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package size={16} />
            </span>
            Purchased Items ({items.length})
          </h2>
          <ul className="space-y-3.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-800/40 border border-white/5">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                  <img
                    src={item.image || `https://placehold.co/56x56/18181b/71717a?text=Item`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-zinc-400 capitalize mt-0.5">{item.category} · Quantity: <span className="text-zinc-200 font-semibold">{item.qty}</span></p>
                </div>
                <span className="text-sm font-bold text-cyan-400 shrink-0">
                  {format(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          {/* Price summary */}
          <div className="space-y-2.5 border-t border-white/5 pt-4 mt-5 text-sm">
            <div className="flex justify-between text-zinc-400 text-xs">
              <span>Subtotal</span><span className="font-semibold text-zinc-200">{format(subtotalUsd)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-xs">
              <span>GST (18% inclusive)</span><span className="font-semibold text-zinc-200">{format(taxUsd)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-xs">
              <span>Delivery Charges</span>
              <span className={`font-semibold ${shippingUsd === 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {shippingUsd === 0 ? 'Free Delivery' : format(shippingUsd)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-dashed border-zinc-700 pt-3 text-white">
              <span>Total Paid</span>
              <span className="text-xl font-black bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                {format(totalUsd)}
              </span>
            </div>
          </div>
        </div>

        {/* ── CTA buttons ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/orders"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/15 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-200 font-bold text-sm transition-all duration-200 shadow-lg hover:border-cyan-500/40"
          >
            <ClipboardList size={16} className="text-cyan-400" /> View All Orders
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition-all duration-200 active:scale-[0.98]"
          >
            <Home size={16} /> Continue Shopping <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </main>
  );
};

export default OrderSuccessPage;
