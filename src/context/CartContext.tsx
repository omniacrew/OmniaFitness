"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Cart } from "@/lib/shopify-cart";

type CartContextType = {
  cart: Cart | null;
  count: number;
  isOpen: boolean;
  busy: boolean;
  error: string | null;
  open: () => void;
  close: () => void;
  addItem: (merchandiseId: string, quantity?: number) => Promise<boolean>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

async function call(method: string, body?: unknown): Promise<Cart | null> {
  const res = await fetch("/api/cart", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong");
  return json.cart ?? null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing cart once (cheap no-op when there's no cart cookie).
  useEffect(() => {
    call("GET").then(setCart).catch(() => {});
  }, []);

  const addItem = useCallback(async (merchandiseId: string, quantity = 1) => {
    setBusy(true);
    setError(null);
    try {
      setCart(await call("POST", { merchandiseId, quantity }));
      setIsOpen(true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    setBusy(true);
    setError(null);
    try {
      setCart(await call("PATCH", { lineId, quantity }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        count: cart?.totalQuantity ?? 0,
        isOpen,
        busy,
        error,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        addItem,
        updateItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
