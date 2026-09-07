import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Search, ChevronDown, LogIn, LogOut, UserCircle2, Zap, Sparkles, Command } from 'lucide-react';
import { useAuth, USERS } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const Header = ({ onSearch }) => {
  const navigate = useNavigate();
  const { activeUser, switchUser, isAuthenticated, authUser, logout, openAuthModal } = useAuth();
  const { totalItems, openCart } = useCart();
  const { currency, changeCurrency, CURRENCY_OPTIONS } = useCurrency();

  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currencyRef = useRef(null);
  const searchInputRef = useRef(null);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Global keyboard shortcut: Ctrl+K or Cmd+K to focus search */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      onSearch?.(query.trim());
    }
  };

  const handleUserSwitch = (userId) => {
    switchUser(userId);
    setDropdownOpen(false);
  };

  /* Avatar gradients per user for futuristic neon look */
  const avatarGradients = {
    guest: 'from-zinc-600 to-zinc-800 text-zinc-300 border-zinc-500/40',
    alice: 'from-indigo-600 to-purple-600 text-indigo-100 border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]',
    bob:   'from-emerald-600 to-teal-600 text-emerald-100 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#09090b]/85 border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">

        {/* ── Brand Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 group select-none"
          aria-label="eKart home"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.55)] transition-all duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Zap size={18} className="text-cyan-400 fill-cyan-400 group-hover:text-indigo-300 transition-colors animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight font-display bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              eKart
            </span>
            <span className="text-[9px] font-mono tracking-widest text-cyan-400/80 uppercase font-semibold">
              Cyber Core
            </span>
          </div>
        </Link>

        {/* ── Search Bar ── */}
        <form
          onSubmit={handleSearch}
          className="flex-1 flex items-center max-w-xl mx-auto"
          role="search"
        >
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
              <Search size={16} />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, tech drops..."
              className="
                w-full pl-10 pr-24 py-2 text-sm rounded-full
                bg-zinc-900/80 text-zinc-100 placeholder-zinc-500
                border border-white/10
                focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/25
                focus:bg-zinc-900 focus:shadow-[0_0_20px_rgba(6,182,212,0.18)]
                transition-all duration-200
              "
              aria-label="Search products"
            />
            {/* Keyboard hint badge */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-800/90 border border-white/10 rounded-md">
                <Command size={10} /> K
              </span>
            </div>
          </div>
        </form>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">

          {/* Currency selector */}
          <div className="relative" ref={currencyRef}>
            <button
              onClick={() => setCurrencyOpen((o) => !o)}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-zinc-900/80 border border-white/10 hover:border-cyan-500/40
                text-xs sm:text-sm font-semibold text-zinc-200 hover:text-cyan-300
                shadow-sm transition-all duration-200 active:scale-95
              "
              aria-haspopup="listbox"
              aria-expanded={currencyOpen}
              aria-label="Select currency"
            >
              <span className="text-cyan-400 font-mono">₹</span>
              <span className="hidden xs:inline">{currency}</span>
              <ChevronDown
                size={13}
                className={`text-zinc-400 transition-transform duration-200 ${currencyOpen ? 'rotate-180 text-cyan-400' : ''}`}
              />
            </button>

            {currencyOpen && (
              <ul
                role="listbox"
                aria-label="Currency"
                className="absolute right-0 mt-2 w-36 glass-dropdown rounded-2xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <li key={opt.code} role="option" aria-selected={currency === opt.code}>
                    <button
                      onClick={() => { changeCurrency(opt.code); setCurrencyOpen(false); }}
                      className={`
                        w-full flex items-center justify-between px-3.5 py-2 text-xs text-left
                        transition-colors
                        ${currency === opt.code
                          ? 'text-cyan-400 font-semibold bg-cyan-500/10'
                          : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'}
                      `}
                    >
                      <span>{opt.label}</span>
                      {currency === opt.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" aria-hidden />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* User Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="
                flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-zinc-900/80 border border-white/10 hover:border-indigo-500/40
                text-sm text-zinc-200 hover:text-white
                shadow-sm transition-all duration-200 active:scale-95
              "
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              {/* Glowing Avatar */}
              <span
                className={`w-6 h-6 rounded-full bg-gradient-to-tr ${avatarGradients[activeUser.id] ?? 'from-zinc-700 to-zinc-900 text-zinc-200 border-white/10'} border flex items-center justify-center text-xs font-bold shrink-0`}
                aria-hidden
              >
                {activeUser.avatar}
              </span>
              <span className="hidden md:block font-medium text-xs text-zinc-200 max-w-[85px] truncate">
                {activeUser.name}
              </span>
              <ChevronDown
                size={13}
                className={`text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-indigo-400' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <ul
                role="listbox"
                aria-label="Switch user"
                className="
                  absolute right-0 mt-2 w-64 glass-dropdown
                  rounded-2xl py-2 z-50 overflow-hidden
                  animate-in fade-in zoom-in-95 duration-150
                "
              >
                <li className="px-3.5 py-1.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={11} className="text-cyan-400" /> Switch Profile
                </li>
                {Object.values(USERS).map((u) => (
                  <li key={u.id} role="option" aria-selected={activeUser.id === u.id}>
                    <button
                      onClick={() => handleUserSwitch(u.id)}
                      className={`
                        w-full flex items-center gap-3 px-3.5 py-2.5 text-left
                        transition-all duration-150
                        ${activeUser.id === u.id
                          ? 'bg-indigo-500/15 border-l-2 border-cyan-400 text-white'
                          : 'hover:bg-white/[0.05] text-zinc-300 hover:text-white'}
                      `}
                    >
                      <span
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradients[u.id] ?? 'from-zinc-700 to-zinc-900'} border flex items-center justify-center text-xs font-bold shrink-0`}
                      >
                        {u.avatar}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${activeUser.id === u.id ? 'text-cyan-300' : 'text-zinc-200'}`}>
                          {u.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{u.description}</p>
                      </div>
                      {activeUser.id === u.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" aria-hidden />
                      )}
                    </button>
                  </li>
                ))}

                {/* Auth actions */}
                <li className="px-3 py-2 mt-1 border-t border-white/[0.08]">
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                        <UserCircle2 size={11} className="text-cyan-400" /> Signed in as <span className="font-semibold text-zinc-300">{authUser?.email}</span>
                      </p>
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      >
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { openAuthModal('login'); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition"
                    >
                      <LogIn size={13} /> Sign In / Register
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>

          {/* Quick Login/Logout button */}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 hover:border-rose-500/40 hover:text-rose-400 text-xs font-medium text-zinc-300 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
              aria-label="Sign in"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Cart Trigger with Glowing Badge */}
          <button
            onClick={openCart}
            className="
              relative p-2.5 rounded-full bg-zinc-900/90 border border-white/10
              hover:border-cyan-500/50 hover:bg-zinc-800 text-zinc-200 hover:text-cyan-300
              transition-all duration-200 active:scale-95
            "
            aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          >
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span className="
                absolute -top-1 -right-1
                min-w-[20px] h-[20px] px-1
                bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-[10px] font-bold font-mono
                rounded-full flex items-center justify-center
                border-2 border-[#09090b] shadow-[0_0_12px_rgba(6,182,212,0.8)]
                animate-pulse
              ">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
