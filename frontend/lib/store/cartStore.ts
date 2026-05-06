import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  categoryId?: string;
  categorySlug?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
  type: string;
  slug: string;
}

interface CartState {
  items: CartItem[];
  couponCode: string;
  discount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

interface PersistedCartData {
  items: CartItem[];
  couponCode: string;
  discount: number;
}

const userCartKey = (userId: string) => `cart-storage-${userId}`;

export function saveUserCart(userId: string) {
  const { items, couponCode, discount } = useCartStore.getState();
  localStorage.setItem(userCartKey(userId), JSON.stringify({ items, couponCode, discount }));
}

export function loadUserCart(userId: string) {
  try {
    const raw = localStorage.getItem(userCartKey(userId));
    if (!raw) return;
    const data: PersistedCartData = JSON.parse(raw);
    useCartStore.setState({ items: data.items ?? [], couponCode: data.couponCode ?? '', discount: data.discount ?? 0 });
  } catch {
    // corrupted data — start fresh
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: '',
      discount: 0,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variant === item.variant
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variant === item.variant
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId, variant) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variant === variant)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variant) => {
        if (quantity <= 0) {
          get().removeItem(productId, variant);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variant === variant ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: '', discount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, discount }),

      removeCoupon: () => set({ couponCode: '', discount: 0 }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = subtotal > 100 ? 0 : 10;
        const tax = subtotal * 0.1;
        return subtotal + shipping + tax - get().discount;
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);
