"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Product, ProductVariant } from "@/data/mockProducts";
import { formatPrice } from "@/data/mockProducts";

// =============================================
// TYPES
// =============================================

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  cartOpen: boolean;
  checkoutOpen: boolean;
  directCheckoutItem: CartItem | null;
  totalQuantity: number;
  totalPrice: number;
  formattedTotal: string;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCheckout: (item?: CartItem) => void;
  closeCheckout: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
}

// =============================================
// CONTEXT
// =============================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// =============================================
// PROVIDER
// =============================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);

  // ---- Valores derivados ----
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );
  const formattedTotal = formatPrice(totalPrice);

  // ---- Acciones del drawer de carrito ----
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const toggleCart = useCallback(() => setCartOpen((prev) => !prev), []);

  // ---- Acciones del checkout de pago con tarjeta / pasarela ----
  const openCheckout = useCallback((item?: CartItem) => {
    if (item) {
      setDirectCheckoutItem(item);
    } else {
      setDirectCheckoutItem(null);
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false);
    setDirectCheckoutItem(null);
  }, []);

  // ---- Agregar al carrito ----
  const addItem = useCallback(
    (product: Product, variant: ProductVariant, quantity: number = 1) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.variant.id === variant.id
        );

        if (existingIndex > -1) {
          // Si ya existe, sumar cantidad
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }

        // Si no existe, agregar nuevo
        return [...prev, { product, variant, quantity }];
      });

      setCartOpen(true); // Abrir drawer al agregar
    },
    []
  );

  // ---- Actualizar cantidad ----
  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((item) => item.variant.id !== variantId));
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.variant.id === variantId ? { ...item, quantity } : item
        )
      );
    },
    []
  );

  // ---- Eliminar item ----
  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variant.id !== variantId));
  }, []);

  // ---- Vaciar carrito ----
  const clearCart = useCallback(() => {
    setItems([]);
    setCartOpen(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        cartOpen,
        checkoutOpen,
        directCheckoutItem,
        totalQuantity,
        totalPrice,
        formattedTotal,
        openCart,
        closeCart,
        toggleCart,
        openCheckout,
        closeCheckout,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// =============================================
// HOOK
// =============================================

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un <CartProvider>");
  }
  return context;
}
