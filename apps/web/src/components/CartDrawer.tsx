import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, ShoppingBag, Trash2, X, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { items, totals, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, settings } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const freeDeliveryDelta = Math.max(0, totals.freeDeliveryThreshold - totals.subtotal);
  const progressPercent = Math.min(100, Math.round((totals.subtotal / totals.freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Your Cart</h3>
              <p className="text-xs text-slate-500">{totals.itemCount} items selected</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free Delivery Goal Bar */}
        <div className="border-b border-slate-100 bg-emerald-50/70 px-5 py-3">
          {freeDeliveryDelta > 0 ? (
            <div>
              <p className="text-xs font-semibold text-emerald-900">
                Add <span className="font-bold text-emerald-700">₹{freeDeliveryDelta}</span> more to unlock <span className="underline font-bold">FREE Delivery</span>!
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <span>Congratulations! You qualify for FREE Delivery</span>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-slate-800">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Explore our wholesale catalog and add groceries or snacks to start saving!
              </p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3 rounded-xl border border-slate-200/80 p-3 shadow-2xs hover:border-emerald-200 transition-colors"
              >
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                  alt={item.title}
                  className="h-20 w-20 flex-shrink-0 rounded-lg object-cover bg-slate-50"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.variantName}</span>
                    {item.appliedTierLabel && (
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                          <Zap className="h-3 w-3 fill-amber-600 text-amber-600" />
                          {item.appliedTierLabel}
                        </span>
                      </div>
                    )}

                    {/* Unit price indicator */}
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs font-extrabold text-emerald-800">₹{item.unitPrice}/unit</span>
                      {item.mrp > item.unitPrice && (
                        <span className="text-[10px] text-slate-400 line-through">₹{item.mrp}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Line Total */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">₹{item.lineTotal}</span>
                      {item.savings > 0 && (
                        <p className="text-[10px] font-bold text-emerald-600">Saved ₹{item.savings}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Bill Breakdown */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 p-5">
            {totals.totalSavings > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-100/90 px-3 py-2 text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                  Wholesale & MRP Savings
                </span>
                <span>- ₹{totals.totalSavings}</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>
                  {totals.deliveryCharge === 0 ? (
                    <span className="font-bold text-emerald-700">FREE</span>
                  ) : (
                    `₹${totals.deliveryCharge}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-emerald-700">₹{totals.finalTotal}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setDrawerOpen(false);
                navigate('/checkout');
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
