import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  color?: string;
  size?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, color?: string, size?: string) => void;
  updateQuantity: (productId: number, color: string | undefined, size: string | undefined, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) =>
            i.productId === item.productId &&
            i.color === item.color &&
            i.size === item.size
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId &&
              i.color === item.color &&
              i.size === item.size
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (productId, color, size) => {
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.color === color &&
                i.size === size
              )
          ),
        });
      },
      updateQuantity: (productId, color, size, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, color, size);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.color === color && i.size === size
              ? { ...i, quantity: qty }
              : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "abimod-cart" }
  )
);

interface LangStore {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: "en",
      dir: "ltr",
      setLang: (lang) => set({ lang, dir: lang === "ar" ? "rtl" : "ltr" }),
    }),
    { name: "abimod-lang" }
  )
);

interface AppStore {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  setToast: (v: { message: string; type: "success" | "error" | "info" } | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isMobileMenuOpen: false,
  setMobileMenuOpen: (v) => set({ isMobileMenuOpen: v }),
  toast: null,
  setToast: (v) => set({ toast: v }),
}));
