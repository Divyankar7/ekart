import { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, Zap, Loader2, AlertCircle, CheckCircle2, Sparkles, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Shared input component
// ---------------------------------------------------------------------------
const Field = ({ label, id, type = 'text', value, onChange, error, autoComplete, placeholder, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-mono font-semibold text-zinc-300">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`
          w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-zinc-950/80 text-zinc-100 placeholder-zinc-500
          focus:outline-none focus:ring-2 transition font-mono
          ${error
            ? 'border-rose-500/60 focus:ring-rose-500/20 text-rose-200'
            : 'border-white/10 focus:border-cyan-500/60 focus:ring-cyan-500/20'}
        `}
      />
      {children}
    </div>
    {error && (
      <p className="text-xs text-rose-400 font-mono flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Login form
// ---------------------------------------------------------------------------
const LoginForm = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim())         e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!password)             e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setApiError(err.message ?? 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestUser = (testEmail) => {
    setEmail(testEmail);
    setPassword('password123');
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {apiError && (
        <div className="flex items-center gap-2 bg-rose-950/60 text-rose-300 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-rose-500/30">
          <AlertCircle size={14} className="shrink-0 text-rose-400" /> {apiError}
        </div>
      )}

      <Field
        label="Cyber ID / Email" id="login-email" type="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        error={errors.email} autoComplete="email"
        placeholder="user@ekart.dev"
      />

      <Field
        label="Security Key / Password" id="login-password"
        type={showPw ? 'text' : 'password'}
        value={password} onChange={(e) => setPassword(e.target.value)}
        error={errors.password} autoComplete="current-password"
        placeholder="••••••••"
      >
        <button
          type="button" tabIndex={-1}
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
          aria-label={showPw ? 'Hide password' : 'Show password'}
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </Field>

      {/* Quick-fill Test Credentials */}
      <div className="bg-zinc-950/80 border border-white/[0.08] rounded-xl p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Quick Auth Presets
          </span>
          <span className="text-[9px] font-mono text-zinc-500">password123</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fillTestUser('alice@ekart.dev')}
            className="flex-1 py-1 px-2 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 text-[11px] font-mono font-semibold text-indigo-300 transition text-center cursor-pointer"
          >
            Alice (Tech)
          </button>
          <button
            type="button"
            onClick={() => fillTestUser('bob@ekart.dev')}
            className="flex-1 py-1 px-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-300 transition text-center cursor-pointer"
          >
            Bob (Audio)
          </button>
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="
          btn-shimmer w-full py-3 rounded-xl font-bold text-xs sm:text-sm font-mono text-white
          bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700
          hover:from-cyan-400 hover:via-indigo-500 hover:to-indigo-600
          shadow-[0_0_20px_rgba(6,182,212,0.35)]
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer
        "
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Authenticating…' : 'Access eKart Core'}
      </button>

      <p className="text-center text-xs font-mono text-zinc-400">
        New to eKart?{' '}
        <button
          type="button" onClick={onSwitch}
          className="text-cyan-400 font-semibold hover:underline cursor-pointer"
        >
          Initialize Profile
        </button>
      </p>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Register form
// ---------------------------------------------------------------------------
const RegisterForm = ({ onSwitch }) => {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim())          e.name     = 'Full name is required.';
    if (!email.trim())         e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!password)             e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Minimum 6 characters.';
    if (password !== confirm)  e.confirm  = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      setSuccess(true);
    } catch (err) {
      setApiError(err.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <CheckCircle2 size={36} className="text-emerald-400" />
        </div>
        <h3 className="text-base font-bold font-display text-white">Profile Initialized!</h3>
        <p className="text-xs font-mono text-zinc-400">Welcome to next-gen shopping. You are now logged in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
      {apiError && (
        <div className="flex items-center gap-2 bg-rose-950/60 text-rose-300 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-rose-500/30">
          <AlertCircle size={14} className="shrink-0 text-rose-400" /> {apiError}
        </div>
      )}

      <Field
        label="Display Name" id="reg-name"
        value={name} onChange={(e) => setName(e.target.value)}
        error={errors.name} autoComplete="name"
        placeholder="Alex Mercer"
      />
      <Field
        label="Email Address" id="reg-email" type="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        error={errors.email} autoComplete="email"
        placeholder="alex@domain.com"
      />
      <Field
        label="Password" id="reg-password"
        type={showPw ? 'text' : 'password'}
        value={password} onChange={(e) => setPassword(e.target.value)}
        error={errors.password} autoComplete="new-password"
        placeholder="Min 6 chars"
      >
        <button
          type="button" tabIndex={-1}
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
          aria-label={showPw ? 'Hide password' : 'Show password'}
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </Field>
      <Field
        label="Confirm Password" id="reg-confirm"
        type={showPw ? 'text' : 'password'}
        value={confirm} onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm} autoComplete="new-password"
        placeholder="Repeat password"
      />

      <button
        type="submit" disabled={loading}
        className="
          btn-shimmer w-full py-3 mt-1 rounded-xl font-bold text-xs sm:text-sm font-mono text-white
          bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700
          hover:from-cyan-400 hover:via-indigo-500 hover:to-indigo-600
          shadow-[0_0_20px_rgba(6,182,212,0.35)]
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer
        "
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Creating Profile…' : 'Register Profile'}
      </button>

      <p className="text-center text-xs font-mono text-zinc-400">
        Already registered?{' '}
        <button
          type="button" onClick={onSwitch}
          className="text-cyan-400 font-semibold hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </p>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------
const AuthModal = () => {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal } = useAuth();
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeAuthModal(); };
    if (authModalOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [authModalOpen, closeAuthModal]);

  useEffect(() => {
    document.body.style.overflow = authModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  useEffect(() => {
    if (authModalOpen) setTimeout(() => panelRef.current?.focus(), 50);
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const isLogin = authModalTab === 'login';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={isLogin ? 'Sign in' : 'Create account'}
        className="
          relative w-full max-w-sm bg-[#0e1017]/95 backdrop-blur-2xl
          border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)]
          flex flex-col overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="font-extrabold font-display text-lg text-white">
              e<span className="text-cyan-400">Kart</span>
            </span>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-6 mt-4 mb-5 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 p-1 gap-1">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              onClick={() => openAuthModal(tab)}
              className={`
                flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer
                ${authModalTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-zinc-400 hover:text-white'}
              `}
            >
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="px-6 pb-6">
          {isLogin
            ? <LoginForm  onSwitch={() => openAuthModal('register')} />
            : <RegisterForm onSwitch={() => openAuthModal('login')} />
          }
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
