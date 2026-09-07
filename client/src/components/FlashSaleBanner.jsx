import { useEffect, useState } from 'react';
import { Zap, Clock, Sparkles, Flame } from 'lucide-react';

/* ── Flash-sale countdown ─────────────────────────────────────────────────── */
const useCountdown = (endMs) => {
  const calc = () => {
    const diff = Math.max(0, endMs - Date.now());
    const h = String(Math.floor(diff / 3_600_000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60_000) / 1_000)).padStart(2, '0');
    return { h, m, s, done: diff === 0 };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  });
  return time;
};

/* ── Ticker deals ─────────────────────────────────────────────────────────── */
const DEALS = [
  '⚡ Up to 45% off Noise-Cancelling Spatial Audio',
  '🔥 Cyber Drop: RTX 4080 Laptops — Limited Stock',
  '💥 Instant ₹5,000 off on Apple & Samsung Flagships',
  '✨ Next-Gen Mechanical Keyboards & OLED Monitors',
  '🎁 Free Express Cyber Delivery on orders above ₹999',
];

const Ticker = () => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % DEALS.length);
        setVisible(true);
      }, 300);
    }, 4_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`text-xs sm:text-sm font-medium text-zinc-200 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      }`}
    >
      {DEALS[idx]}
    </span>
  );
};

/* ── Flash sale ends 6 hours from page load ──────────────────────────────── */
const SALE_END = Date.now() + 6 * 3_600_000;

const TimeDigit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="relative px-2 py-1 min-w-[2.4rem] bg-zinc-950/80 border border-cyan-500/30 rounded-lg text-center shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]">
      <span className="text-sm sm:text-base font-bold font-mono text-cyan-300 leading-none">
        {value}
      </span>
    </div>
    <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 mt-0.5">{label}</span>
  </div>
);

const FlashSaleBanner = () => {
  const { h, m, s } = useCountdown(SALE_END);

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 border border-cyan-500/20 bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-zinc-950 shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.1)]">
      {/* Ambient background glow line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />

      <div className="relative px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">

        {/* Left: Live status + Deal ticker */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          {/* Animated Zap Icon with Pulse Halo */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Zap size={16} className="text-white fill-white animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Lightning Deals
              </span>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">|</span>
              <span className="text-[11px] text-zinc-400 hidden sm:inline flex items-center gap-1">
                <Flame size={12} className="text-amber-400" /> Hot Discounts
              </span>
            </div>
            <Ticker />
          </div>
        </div>

        {/* Right: Futuristic Countdown Timer */}
        <div className="flex items-center gap-2.5 shrink-0 bg-zinc-900/60 border border-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock size={14} className="text-cyan-400" />
            <span className="text-xs font-medium font-mono text-zinc-300">Resets in</span>
          </div>
          <div className="flex items-center gap-1">
            <TimeDigit value={h} label="hr" />
            <span className="text-cyan-400 font-bold font-mono -mt-3 animate-pulse">:</span>
            <TimeDigit value={m} label="min" />
            <span className="text-cyan-400 font-bold font-mono -mt-3 animate-pulse">:</span>
            <TimeDigit value={s} label="sec" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlashSaleBanner;
