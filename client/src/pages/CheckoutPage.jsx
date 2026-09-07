import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, CreditCard, Truck,
  ShoppingBag, Loader2, AlertCircle, CheckCircle2,
  Banknote, Smartphone, ShieldCheck, Sparkles,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../api/orders';

const GST_RATE      = 0.18;
const EXPRESS_FEE   = 4.99; // USD

// ---------------------------------------------------------------------------
// Controlled input field (Dark Theme)
// ---------------------------------------------------------------------------
const Field = ({ label, id, type = 'text', value, onChange, error, placeholder, autoComplete }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-zinc-300">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? label}
      autoComplete={autoComplete}
      className={`
        w-full px-4 py-3 text-sm rounded-xl border bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-500
        focus:outline-none focus:ring-2 focus:bg-zinc-800/90 transition-all duration-200
        ${error
          ? 'border-red-500/60 focus:ring-red-500/20 focus:border-red-400'
          : 'border-zinc-700/60 focus:ring-cyan-500/20 focus:border-cyan-400'}
      `}
    />
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
        <AlertCircle size={12} className="shrink-0" /> {error}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Payment method card (Dark Theme)
// ---------------------------------------------------------------------------
const PaymentCard = ({ id, value, current, onChange, icon: Icon, title, subtitle, badge }) => {
  const isSelected = current === value;
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden group ${
        isSelected
          ? 'border-cyan-500/80 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.12)]'
          : 'border-white/10 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/40'
      }`}
    >
      <input
        id={id} type="radio" name="payment"
        value={value} checked={isSelected}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        isSelected
          ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
          : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
      }`}>
        <Icon size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
            {title}
          </p>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
      </div>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        isSelected ? 'border-cyan-400 bg-cyan-500/20' : 'border-zinc-600'
      }`}>
        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />}
      </span>
    </label>
  );
};

// ---------------------------------------------------------------------------
// Mock Razorpay payment UI (Dark Futuristic Modal)
// ---------------------------------------------------------------------------
const MockPaymentModal = ({ amount, onSuccess, onCancel }) => {
  const [step,    setStep]    = useState('form'); // 'form' | 'processing' | 'done'
  const [cardNum, setCardNum] = useState('');
  const [expiry,  setExpiry]  = useState('');
  const [cvv,     setCvv]     = useState('');
  const [error,   setError]   = useState('');

  const handlePay = () => {
    if (cardNum.replace(/\s/g, '').length < 16) { setError('Enter a valid 16-digit card number.'); return; }
    if (expiry.length < 5) { setError('Enter expiry as MM/YY.'); return; }
    if (cvv.length < 3)    { setError('Enter a valid CVV.'); return; }
    setError('');
    setStep('processing');
    // Simulate payment gateway delay
    setTimeout(() => {
      setStep('done');
      setTimeout(() => onSuccess(`mock_rzp_${Date.now()}`), 800);
    }, 1800);
  };

  const formatCard   = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCancel} aria-hidden />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl shadow-2xl shadow-indigo-950/50 overflow-hidden text-zinc-100">

        {/* Razorpay cyber header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-700 p-6 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-200/90 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
              <ShieldCheck size={13} /> Secured by Razorpay
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              TEST MODE
            </span>
          </div>
          <p className="text-2xl font-black tracking-tight text-white">{amount}</p>
          <p className="text-xs text-indigo-200/80 mt-0.5">eKart HyperSecure Checkout</p>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Card Simulation
                </p>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Lock size={12} /> 256-bit encrypted
                </span>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3.5 py-2.5 rounded-xl border border-red-500/30">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Card Number</label>
                <input
                  value={cardNum} onChange={(e) => setCardNum(formatCard(e.target.value))}
                  placeholder="4111 1111 1111 1111"
                  className="w-full px-4 py-3 text-sm border border-zinc-700/70 rounded-xl bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-mono tracking-widest"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Expiry</label>
                  <input
                    value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 text-sm border border-zinc-700/70 rounded-xl bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">CVV</label>
                  <input
                    value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••"
                    type="password"
                    className="w-full px-4 py-3 text-sm border border-zinc-700/70 rounded-xl bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
                🔒 Sandbox Card: <span className="font-mono font-bold text-cyan-300">4111 1111 1111 1111</span>, any future date, any CVV.
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePay}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> Pay {amount}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
                >
                  Cancel &amp; Return
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="relative">
                <Loader2 size={48} className="text-cyan-400 animate-spin" />
                <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white mb-1">Authorizing Payment…</p>
                <p className="text-xs text-zinc-400">Communicating with payment gateway node.</p>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={36} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">Payment Verified!</p>
                <p className="text-xs text-emerald-400/90 mt-0.5">Finalizing order confirmation…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main CheckoutPage
// ---------------------------------------------------------------------------
const INITIAL_ADDR = { fullName: '', street: '', city: '', pincode: '', phone: '' };

const CheckoutPage = () => {
  const navigate             = useNavigate();
  const { items, subtotalUsd, clearCart } = useCart();
  const { format }           = useCurrency();
  const { authUser }         = useAuth();

  // ── Form state ────────────────────────────────────────────────────────────
  const [addr,     setAddr]     = useState({ ...INITIAL_ADDR, fullName: authUser?.name ?? '' });
  const [addrErr,  setAddrErr]  = useState({});
  const [payment,  setPayment]  = useState('cod');
  const [delivery, setDelivery] = useState('standard');
  const [showMockPay, setShowMockPay] = useState(false);

  // ── Submission state ──────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState('');

  // ── Pricing ───────────────────────────────────────────────────────────────
  const shippingUsd = delivery === 'express' ? EXPRESS_FEE : 0;
  const taxUsd      = subtotalUsd * GST_RATE;
  const totalUsd    = subtotalUsd + taxUsd + shippingUsd;

  // ── Validation ────────────────────────────────────────────────────────────
  const validateAddr = () => {
    const e = {};
    if (!addr.fullName.trim())                          e.fullName = 'Full name is required.';
    if (!addr.street.trim())                            e.street   = 'Street address is required.';
    if (!addr.city.trim())                              e.city     = 'City is required.';
    if (!/^\d{4,10}$/.test(addr.pincode.trim()))        e.pincode  = 'Enter a valid PIN code.';
    if (!/^\+?\d{7,15}$/.test(addr.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid phone number.';
    return e;
  };

  // ── Submit order after optional payment ───────────────────────────────────
  const submitOrder = async (mockPaymentId) => {
    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        items: items.map(({ product, qty }) => ({
          productId: product._id,
          name:      product.name,
          image:     product.images?.[0] ?? '',
          category:  product.category,
          brand:     product.brand ?? '',
          price:     product.price,
          qty,
        })),
        shippingAddress: {
          fullName: addr.fullName.trim(),
          street:   addr.street.trim(),
          city:     addr.city.trim(),
          pincode:  addr.pincode.trim(),
          phone:    addr.phone.trim(),
        },
        paymentMethod:  payment,
        deliveryOption: delivery,
        ...(mockPaymentId && { mockPaymentId }),
      };

      const res = await placeOrder(payload);
      clearCart();
      navigate(`/order-success/${res.data._id}`);
    } catch (err) {
      setApiError(err.message ?? 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Place order button handler ─────────────────────────────────────────────
  const handlePlaceOrder = () => {
    const e = validateAddr();
    if (Object.keys(e).length) { setAddrErr(e); return; }
    setAddrErr({});

    if (payment === 'online') {
      setShowMockPay(true);
    } else {
      submitOrder();
    }
  };

  const field = (key, label, opts = {}) => (
    <Field
      id={key} label={label}
      value={addr[key]}
      onChange={(ev) => setAddr((p) => ({ ...p, [key]: ev.target.value }))}
      error={addrErr[key]}
      {...opts}
    />
  );

  return (
    <>
      {/* Mock Razorpay modal */}
      {showMockPay && (
        <MockPaymentModal
          amount={format(totalUsd)}
          onSuccess={(id) => { setShowMockPay(false); submitOrder(id); }}
          onCancel={() => setShowMockPay(false)}
        />
      )}

      <main className="min-h-screen bg-[#09090b] text-zinc-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-400 font-medium mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Secure Checkout
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Review your details and finalize your order</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full font-medium">
              <ShieldCheck size={14} /> End-to-End Encrypted
            </div>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-3.5 rounded-2xl mb-6 shadow-lg shadow-red-950/20">
              <AlertCircle size={18} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left column (Details) ── */}
            <div className="lg:col-span-7 space-y-6">

              {/* Shipping address */}
              <section className="bg-zinc-900/70 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
                  <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <MapPin size={16} />
                  </span>
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    {field('fullName', 'Full Name', { autoComplete: 'name' })}
                  </div>
                  <div className="sm:col-span-2">
                    {field('street', 'Street / Flat / Area', { autoComplete: 'street-address', placeholder: 'e.g. 42, MG Road, Indiranagar' })}
                  </div>
                  {field('city',    'City',     { autoComplete: 'address-level2' })}
                  {field('pincode', 'PIN Code', { autoComplete: 'postal-code', placeholder: '400001' })}
                  <div className="sm:col-span-2">
                    {field('phone', 'Phone Number', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98765 43210' })}
                  </div>
                </div>
              </section>

              {/* Delivery option */}
              <section className="bg-zinc-900/70 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Truck size={16} />
                  </span>
                  Delivery Speed
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      value: 'standard',
                      title: 'Standard Delivery',
                      subtitle: 'Delivered in 5–7 business days',
                      price: 'Free',
                      priceClass: 'text-emerald-400 font-bold',
                    },
                    {
                      value: 'express',
                      title: 'Express Delivery (Priority Dispatch)',
                      subtitle: 'Delivered in 1–2 business days',
                      price: format(EXPRESS_FEE),
                      priceClass: 'text-cyan-400 font-bold',
                    },
                  ].map(({ value, title, subtitle, price, priceClass }) => {
                    const isSelected = delivery === value;
                    return (
                      <label
                        key={value}
                        className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-indigo-500/80 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                            : 'border-white/10 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/40'
                        }`}
                      >
                        <span className="flex items-center gap-3.5">
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-indigo-400 bg-indigo-500/20' : 'border-zinc-600'
                          }`}>
                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />}
                          </span>
                          <span>
                            <p className={`text-sm font-semibold transition-colors ${isSelected ? 'text-white' : 'text-zinc-200'}`}>{title}</p>
                            <p className="text-xs text-zinc-400">{subtitle}</p>
                          </span>
                        </span>
                        <span className={`text-sm ${priceClass}`}>{price}</span>
                        <input type="radio" name="delivery" value={value} checked={isSelected} onChange={() => setDelivery(value)} className="sr-only" />
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Payment method */}
              <section className="bg-zinc-900/70 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <CreditCard size={16} />
                  </span>
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <PaymentCard
                    id="pay-cod" value="cod" current={payment} onChange={setPayment}
                    icon={Banknote} title="Cash on Delivery"
                    subtitle="Pay with cash or UPI on delivery arrival."
                    badge="Zero Fee"
                  />
                  <PaymentCard
                    id="pay-online" value="online" current={payment} onChange={setPayment}
                    icon={Smartphone} title="Online Instant Payment"
                    subtitle="Credit/Debit Cards, UPI, NetBanking via Razorpay."
                    badge="Recommended"
                  />
                </div>
              </section>
            </div>

            {/* ── Right column (Order summary) ── */}
            <div className="lg:col-span-5">
              <div className="bg-zinc-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl sticky top-24">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
                  <span className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <ShoppingBag size={16} />
                  </span>
                  Order Summary
                  <span className="ml-auto text-xs font-medium text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-white/5">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </h2>

                {/* Items list */}
                <ul className="space-y-3.5 mb-5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {items.map(({ product, qty }) => (
                    <li key={product._id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-800/30 border border-white/5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                        <img
                          src={product.images?.[0] ?? `https://placehold.co/48x48/18181b/71717a?text=Item`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-200 line-clamp-1">{product.name}</p>
                        <p className="text-[11px] text-zinc-400">Qty: <span className="font-semibold text-zinc-300">{qty}</span></p>
                      </div>
                      <span className="text-xs font-bold text-cyan-400 shrink-0">
                        {format(product.price * qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Price breakdown */}
                <div className="space-y-2.5 border-t border-white/5 pt-4 text-sm">
                  <div className="flex justify-between text-zinc-400 text-xs">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-200">{format(subtotalUsd)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-xs">
                    <span>GST (18% inclusive)</span>
                    <span className="font-semibold text-zinc-200">{format(taxUsd)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-xs">
                    <span>Shipping</span>
                    <span className={`font-semibold ${shippingUsd === 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {shippingUsd === 0 ? 'Free Shipping' : format(shippingUsd)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-dashed border-zinc-700 pt-3 text-white">
                    <span>Total Payable</span>
                    <span className="text-xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                      {format(totalUsd)}
                    </span>
                  </div>
                </div>

                {/* CTA button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={items.length === 0 || submitting}
                  className="
                    mt-6 w-full py-4 rounded-2xl font-bold text-sm text-white
                    bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400
                    active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    transition-all duration-200 shadow-xl shadow-orange-500/25
                  "
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting
                    ? 'Processing Order…'
                    : payment === 'online'
                      ? `Pay Now · ${format(totalUsd)}`
                      : `Place Order · ${format(totalUsd)}`}
                </button>

                {items.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center mt-2.5">
                    Your shopping cart is currently empty.
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-zinc-500 text-center">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Guaranteed safe checkout &amp; encrypted processing
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CheckoutPage;
