"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

export const VAT_RATE = 0.15;

type CouponState = {
  code: string;
  discount: number;
} | null;

type CartState = {
  items: CartItem[];
  coupon: CouponState;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCoupon: (coupon: CouponState) => void;
  clearCoupon: () => void;
  getSubtotal: () => number;
  getVat: () => number;
  getTotal: () => number;
  getItemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], coupon: null }),

      setCoupon: (coupon) => set({ coupon }),

      clearCoupon: () => set({ coupon: null }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      // ==== إضافة جديدة: حساب ضريبة القيمة المضافة (15%) على الصافي بعد الخصم ====
      getVat: () => {
        const subtotal = get().getSubtotal();
        const discount = get().coupon?.discount ?? 0;
        const netBeforeVat = Math.max(0, subtotal - discount);
        return Math.round(netBeforeVat * VAT_RATE * 100) / 100;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().coupon?.discount ?? 0;
        const vat = get().getVat();
        return Math.max(0, subtotal - discount + vat);
      },

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "hit-cart",
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
      }),
    }
  )
);
