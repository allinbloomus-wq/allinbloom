"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  priceCents: number;
  image: string;
  quantity: number;
  meta?: {
    colors?: string[];
    note?: string;
    style?: string;
    basePriceCents?: number;
    bouquetDiscountPercent?: number;
    bouquetDiscountNote?: string;
    flowerType?: string;
    bouquetStyle?: string;
    bouquetFlowerTypes?: string;
    isMixed?: boolean;
    bouquetColors?: string;
    isFlowerQuantityEnabled?: boolean;
    isCustom?: boolean;
    details?: string;
  };
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "hydrate"; payload: CartState }
  | { type: "add"; payload: CartItem }
  | { type: "update"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

const CART_KEY = "all-in-bloom-cart";
const CHECKOUT_FORM_KEY = "all-in-bloom-checkout-form";

export type CheckoutFormStorage = {
  guestEmail: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressFloor?: string;
  addressCity?: string;
  addressState?: string;
  postalCode?: string;
  country?: string;
  orderComment?: string;
  phoneLocal: string;
  quote: {
    feeCents: number;
    miles: number;
    distanceText: string;
    address: string;
  } | null;
};

export function loadCheckoutFormStorage(): CheckoutFormStorage | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_FORM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutFormStorage;
  } catch {
    return null;
  }
}

export function saveCheckoutFormStorage(payload: CheckoutFormStorage) {
  try {
    sessionStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors (e.g., disabled cookies).
  }
}

export function clearCheckoutFormStorage() {
  try {
    sessionStorage.removeItem(CHECKOUT_FORM_KEY);
  } catch {
    // Ignore storage errors (e.g., disabled cookies).
  }
}

const reducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "add": {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case "update":
      return {
        items: state.items
          .map((item) =>
            item.id === action.id
              ? { ...item, quantity: action.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case "remove":
      return { items: state.items.filter((item) => item.id !== action.id) };
    case "clear":
      return { items: [] };
    default:
      return state;
  }
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function clearCartStorage() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    // Ignore storage errors (e.g., disabled cookies).
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CartState;
        dispatch({ type: "hydrate", payload: parsed });
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "add", payload: item });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "update", id, quantity });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
    clearCartStorage();
  }, []);

  const value = useMemo(() => {
    const itemCount = state.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const subtotalCents = state.items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );
    return {
      items: state.items,
      itemCount,
      subtotalCents,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    };
  }, [state.items, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
