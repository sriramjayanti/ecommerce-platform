import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  CartItem,
  CartTotals,
  Product,
  ProductVariant,
  resolveUnitPrice,
  calculateCartTotals,
  DEFAULT_STORE_SETTINGS,
  StoreSettings,
  safeApiFetch,
} from '@ecommerce/shared';

interface CartContextType {
  items: CartItem[];
  totals: CartTotals;
  settings: StoreSettings;
  wishlistIds: string[];
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dailyfresh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dailyfresh_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    safeApiFetch<StoreSettings>('/api/settings')
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyfresh_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('dailyfresh_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const totals = useMemo(() => {
    return calculateCartTotals(items, settings);
  }, [items, settings]);

  const addItem = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    if (!variant || variant.stock <= 0) {
      return;
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.variantId === variant.id
      );

      const isWholesale = settings.featureFlags.wholesalePricing && product.isWholesaleEnabled;

      if (existingIdx > -1) {
        const currentItem = prev[existingIdx];
        const newQty = Math.min(variant.stock, currentItem.quantity + quantity);
        const { unitPrice, appliedTier } = resolveUnitPrice(variant, newQty, isWholesale);
        const lineTotal = unitPrice * newQty;
        const savings = Math.max(0, variant.mrp * newQty - lineTotal);

        const updated = [...prev];
        updated[existingIdx] = {
          ...currentItem,
          quantity: newQty,
          unitPrice,
          lineTotal,
          savings,
          appliedTierId: appliedTier?.id,
        };
        return updated;
      } else {
        const { unitPrice, appliedTier } = resolveUnitPrice(variant, quantity, isWholesale);
        const lineTotal = unitPrice * quantity;
        const savings = Math.max(0, variant.mrp * quantity - lineTotal);

        const newItem: CartItem = {
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          variantName: variant.name,
          image: variant.images?.[0] || product.images[0] || '',
          quantity,
          unitPrice,
          basePrice: variant.basePrice,
          mrp: variant.mrp,
          lineTotal,
          savings,
          maxStock: variant.stock,
          appliedTierId: appliedTier?.id,
        };

        return [...prev, newItem];
      }
    });

    setDrawerOpen(true);
  };

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prev) => {
      return prev.map((item) => {
        if (item.productId === productId && item.variantId === variantId) {
          const qty = Math.min(item.maxStock, quantity);
          // Dummy variant reconstruction to run pricing engine
          const dummyVariant: ProductVariant = {
            id: item.variantId,
            name: item.variantName,
            sku: '',
            weightOrSize: '',
            mrp: item.mrp,
            basePrice: item.basePrice,
            stock: item.maxStock,
            lowStockThreshold: 5,
            pricingTiers: [], // Resolved directly or via original tiers
          };

          // Re-fetch product tiers from memory/API or assume proportional reduction
          const unitPrice = item.unitPrice; // Or recalculate
          const lineTotal = unitPrice * qty;
          const savings = Math.max(0, item.mrp * qty - lineTotal);

          return {
            ...item,
            quantity: qty,
            lineTotal,
            savings,
          };
        }
        return item;
      });
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <CartContext.Provider
      value={{
        items,
        totals,
        settings,
        wishlistIds,
        isDrawerOpen,
        setDrawerOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
