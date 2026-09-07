import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'ekart_cart';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage quota exceeded — silently ignore
  }
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Hydrate from localStorage on first render
  const [items,  setItems]  = useState(loadFromStorage);
  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  // ── Drawer controls ────────────────────────────────────────────────────
  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // ── Cart mutations ─────────────────────────────────────────────────────

  /** Add one unit of a product; open drawer automatically */
  const addToCart = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    setIsOpen(true); // open drawer on every add
  }, []);

  /** Set an item's quantity directly; remove if qty drops to 0 */
  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product._id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product._id === productId ? { ...i, qty } : i
        )
      );
    }
  }, []);

  /** Remove an item entirely */
  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product._id !== productId));
  }, []);

  /** Empty the cart */
  const clearCart = useCallback(() => setItems([]), []);

  // ── Derived values ─────────────────────────────────────────────────────
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  /** Subtotal in USD (base currency) */
  const subtotalUsd = items.reduce(
    (sum, i) => sum + i.product.price * i.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        totalItems,
        subtotalUsd,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
};
