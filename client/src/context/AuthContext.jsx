import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from 'react';
import { apiLogin, apiRegister, apiGetMe } from '../api/auth';

// ---------------------------------------------------------------------------
// Dev user-switcher profiles (tokens populated after first real login)
// ---------------------------------------------------------------------------
export const USERS = {
  guest: {
    id: 'guest', name: 'Guest', email: null,
    avatar: 'G', token: null,
    description: 'Cold-start feed — no history',
  },
  alice: {
    id: 'alice', name: 'Alice Sharma', email: 'alice@ekart.dev',
    avatar: 'A', token: null,
    description: 'Active shopper — electronics affinity',
  },
  bob: {
    id: 'bob', name: 'Bob Nair', email: 'bob@ekart.dev',
    avatar: 'B', token: null,
    description: 'New user — cold-start fallback',
  },
};

// localStorage keys
const TOKEN_KEY   = 'ekart_token';
const USER_KEY    = 'ekart_user';
const DEVUSER_KEY = 'ekart_active_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ── Core auth state ────────────────────────────────────────────────────
  // null  = not yet checked (loading)
  // false = definitely a guest
  // object = authenticated user
  const [authUser,    setAuthUser]    = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Dev switcher state (preserved for demo purposes) ───────────────────
  const [devUser, setDevUser] = useState(() => {
    const saved = localStorage.getItem(DEVUSER_KEY);
    return USERS[saved] ?? USERS.guest;
  });

  // ── Modal open/close (lifted here so Header can trigger it) ────────────
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab,  setAuthModalTab]  = useState('login'); // 'login' | 'register'

  const openAuthModal  = useCallback((tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  // ── On mount: rehydrate from localStorage ─────────────────────────────
  const bootRan = useRef(false);
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;

    const token    = localStorage.getItem(TOKEN_KEY);
    const cached   = localStorage.getItem(USER_KEY);

    if (!token) {
      setAuthLoading(false);
      return;
    }

    // Optimistically render cached profile while we verify the token
    if (cached) {
      try { setAuthUser(JSON.parse(cached)); } catch { /* ignore */ }
    }

    // Verify token with the backend
    apiGetMe()
      .then((res) => {
        setAuthUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      })
      .catch(() => {
        // Token invalid / expired — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAuthUser(false);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Sync token to localStorage whenever authUser changes ──────────────
  // (handled inside login/logout; this is just a safety net)
  const persistUser = (user, token) => {
    localStorage.setItem(TOKEN_KEY,   token);
    localStorage.setItem(USER_KEY,    JSON.stringify(user));
    setAuthUser(user);
  };

  // ── Auth actions ───────────────────────────────────────────────────────

  /**
   * login({ email, password }) → throws on failure so the modal can surface the error
   */
  const login = useCallback(async ({ email, password }) => {
    const res = await apiLogin({ email, password }); // throws on HTTP error
    persistUser(res.user, res.token);
    closeAuthModal();
    return res.user;
  }, [closeAuthModal]);

  /**
   * register({ name, email, password }) → throws on failure
   */
  const register = useCallback(async ({ name, email, password }) => {
    const res = await apiRegister({ name, email, password });
    persistUser(res.user, res.token);
    closeAuthModal();
    return res.user;
  }, [closeAuthModal]);

  /**
   * logout — clears all persisted auth state
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthUser(false);
  }, []);

  // ── Dev user-switcher (kept for personalisation demo) ──────────────────
  const switchUser = useCallback((userId) => {
    const user = USERS[userId];
    if (!user) return;
    setDevUser(user);
    localStorage.setItem(DEVUSER_KEY, userId);
    // Swap the token in localStorage so the feed API picks it up
    if (user.token) {
      localStorage.setItem(TOKEN_KEY, user.token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────
  // isAuthenticated is true only when a real JWT-backed user is present
  const isAuthenticated = Boolean(authUser && authUser !== false);

  // activeUser is what the rest of the app reads for personalisation:
  // prefer the real auth user; fall back to the dev-switcher profile
  const activeUser = isAuthenticated
    ? { ...authUser, token: localStorage.getItem(TOKEN_KEY) }
    : devUser;

  return (
    <AuthContext.Provider
      value={{
        // Auth state
        authUser,
        authLoading,
        isAuthenticated,
        activeUser,

        // Auth actions
        login,
        logout,
        register,

        // Modal control
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,

        // Dev switcher
        switchUser,
        USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
