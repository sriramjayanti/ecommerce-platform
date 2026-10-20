import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Address, PaymentMethod, safeApiFetch } from '@ecommerce/shared';
import { BackButton } from '../components/BackButton';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Plus,
  ArrowRight,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Lock,
  Truck,
  Clock,
  Sparkles,
  ChevronRight,
  Radio,
  Store,
  QrCode,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, totals, clearCart, settings } = useCart();
  const { user, addresses, addAddress, defaultAddress } = useAuth();
  const navigate = useNavigate();

  const [fulfillmentMethod, setFulfillmentMethod] = useState<'home_delivery' | 'takeaway'>('home_delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress?.id || (addresses[0]?.id ?? '')
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(addresses.length === 0);
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New address form fields
  const [fullName, setFullName] = useState(user?.displayName || 'Rahul Sharma');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [line1, setLine1] = useState('Flat 402, Green Valley Apartments');
  const [line2, setLine2] = useState('Near Central Park, Ring Road');
  const [landmark, setLandmark] = useState('Opposite State Bank');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560034');
  const [addressType, setAddressType] = useState<'home' | 'work' | 'other'>('home');

  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="mt-2 text-sm text-slate-500">Explore our mega catalog and add products before proceeding.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Calculate effective totals based on fulfillment method
  const effectiveDeliveryCharge = fulfillmentMethod === 'takeaway' ? 0 : totals.deliveryCharge;
  const effectivePayableTotal = totals.subtotal + effectiveDeliveryCharge;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let shippingAddress: Address;

      if (fulfillmentMethod === 'home_delivery') {
        if (isAddingNewAddress || !selectedAddressId) {
          if (!fullName || !phone || !line1 || !pincode) {
            setErrorMessage('Please fill in all mandatory address fields (Name, Phone, Address, Pincode).');
            setIsSubmitting(false);
            return;
          }
          shippingAddress = addAddress({
            fullName,
            phone,
            line1,
            line2,
            landmark,
            city,
            state,
            pincode,
            addressType,
            isDefault: true,
          });
        } else {
          const found = addresses.find((a) => a.id === selectedAddressId);
          if (!found) {
            setErrorMessage('Please select a valid delivery address.');
            setIsSubmitting(false);
            return;
          }
          shippingAddress = found;
        }
      } else {
        // Takeaway order address snapshot (Store Pickup)
        shippingAddress = {
          id: `takeaway-addr-${Date.now()}`,
          userId: user?.id || `guest-${phone}`,
          fullName: fullName || user?.displayName || 'Store Customer',
          phone: phone || user?.phone || '9876543210',
          line1: 'DailyMart Supercenter Store Pickup Counter',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
          addressType: 'other',
          isDefault: false,
        };
      }

      // Call authoritative backend API to place order
      const payload = {
        userId: user?.id || `guest-${phone}`,
        customerName: shippingAddress.fullName,
        customerPhone: shippingAddress.phone,
        customerEmail: user?.email || `${phone}@guest.shop`,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress,
        paymentMethod,
        fulfillmentMethod,
      };

      const result = await safeApiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!result.success || !result.data?.order) {
        throw new Error(result.error || 'Failed to place order. Please review your cart.');
      }

      // Clear cart ONLY after backend order confirmation
      clearCart();

      if (paymentMethod !== 'cod' && result.data.paymentUrl) {
        // Redirect to PhonePe payment simulation/gateway
        window.location.href = result.data.paymentUrl;
      } else {
        // COD order confirmed
        navigate(`/order/${result.data.order.orderNumber}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-[#eaeded]/60 py-8">
      <div className="mx-auto max-w-7xl px-4">
        
        {/* Navigation & Back Button */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton label="Back to Store" fallbackPath="/" />
          <span className="text-xs text-slate-500 font-medium">Checkout Progress: Final Review</span>
        </div>

        {/* Checkout Top Security Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Secure Order Checkout</h1>
              <p className="text-xs text-slate-500">Bank-Grade 256-bit Encryption • Direct Brand Assured Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Safe & Verified Order Processing</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Checkout Steps (Left Column) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STEP 1: Fulfilment Method & Address */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#131921] text-xs font-black text-white">
                    1
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Fulfilment & Delivery
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Fulfilment Method Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Choose Fulfilment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('home_delivery')}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                        fulfillmentMethod === 'home_delivery'
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Truck className={`h-5 w-5 mt-0.5 ${fulfillmentMethod === 'home_delivery' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Home Delivery</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">Doorstep</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Direct to your doorstep in 2 hours or next day.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('takeaway')}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                        fulfillmentMethod === 'takeaway'
                          ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Store className={`h-5 w-5 mt-0.5 ${fulfillmentMethod === 'takeaway' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Takeaway / Store Pickup</span>
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">FREE</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Collect order at store counter. Zero delivery fee.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {fulfillmentMethod === 'home_delivery' ? (
                  <div>
                    <div className="flex items-center justify-between mb-3 border-t border-slate-100 pt-4">
                      <span className="text-xs font-bold text-slate-800">Delivery Address</span>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{isAddingNewAddress ? 'Use Saved Address' : 'Add New Address'}</span>
                        </button>
                      )}
                    </div>

                    {!isAddingNewAddress && addresses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-xs font-bold text-slate-900">{addr.fullName}</span>
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                                    {addr.addressType}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {addr.line1}, {addr.line2 && `${addr.line2}, `}
                                  {addr.landmark && `Near ${addr.landmark}, `}
                                  {addr.city}, {addr.state} - <span className="font-bold text-slate-800">{addr.pincode}</span>
                                </p>
                                <p className="text-xs font-medium text-slate-500 mt-2">Mobile: <span className="text-slate-800 font-bold">{addr.phone}</span></p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-blue-600">
                                  {isSelected ? '✓ Deliver to this Address' : 'Select'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Mobile Phone (for delivery SMS) *</label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Flat / House No., Building Name, Street *</label>
                          <input
                            type="text"
                            required
                            value={line1}
                            onChange={(e) => setLine1(e.target.value)}
                            placeholder="e.g. Flat 304, Royal Palms"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Area / Locality / Landmark</label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="e.g. Near Metro Station"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                          <input
                            type="text"
                            required
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            placeholder="e.g. 560034"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 flex items-start gap-3">
                    <Store className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Store Pickup Location</p>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        DailyMart Central Superstore, Ground Floor Express Pickup Counter, Ring Road, Bengaluru 560034.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Order will be packed and ready for collection in 30 minutes. Delivery charge: ₹0.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: Delivery Speed & Slot (when Home Delivery is selected) */}
            {fulfillmentMethod === 'home_delivery' && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#131921] text-xs font-black text-white">
                    2
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Delivery Speed & Slot
                  </h2>
                </div>

                <div className="p-6 space-y-3">
                  <label
                    className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${
                      deliverySpeed === 'express'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliverySpeed"
                        checked={deliverySpeed === 'express'}
                        onChange={() => setDeliverySpeed('express')}
                        className="mt-1 text-emerald-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            Express Assured Priority Delivery
                          </span>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            ⚡ 2-Hour Window
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Dispatched immediately via verified local delivery partner hub.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700">FREE</span>
                  </label>

                  <label
                    className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${
                      deliverySpeed === 'standard'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliverySpeed"
                        checked={deliverySpeed === 'standard'}
                        onChange={() => setDeliverySpeed('standard')}
                        className="mt-1 text-emerald-600"
                      />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900">Standard Next-Day Delivery</span>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Delivered tomorrow between 9:00 AM – 2:00 PM.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700">FREE</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Method Selection */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#131921] text-xs font-black text-white">
                  3
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Select Payment Method
                </h2>
              </div>

              <div className="p-6 space-y-3">
                {/* 1. UPI */}
                <label
                  className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'upi'
                      ? 'border-purple-600 bg-purple-50/30 ring-1 ring-purple-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          UPI (PhonePe, Google Pay, Paytm, BHIM)
                        </span>
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                          Instant & Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Pay instantly via any UPI app or QR code scanner with zero convenience fee.
                      </p>
                    </div>
                  </div>
                  <QrCode className="h-5 w-5 text-purple-600 flex-shrink-0" />
                </label>

                {/* 2. Credit Card */}
                <label
                  className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'credit_card'
                      ? 'border-purple-600 bg-purple-50/30 ring-1 ring-purple-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">
                        Credit Card (Visa, MasterCard, RuPay, Amex)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Processed securely via 256-bit encrypted gateway. No raw card details stored.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
                </label>

                {/* 3. Debit Card */}
                <label
                  className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'debit_card'
                      ? 'border-purple-600 bg-purple-50/30 ring-1 ring-purple-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'debit_card'}
                      onChange={() => setPaymentMethod('debit_card')}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">
                        Debit Card (All Major Indian Banks)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Direct bank debit with verified OTP / 3D secure payment flow.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                </label>

                {/* 4. Cash on Delivery */}
                <label
                  className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 text-emerald-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">Cash on Delivery (COD)</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Doorstep</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Pay cash or scan courier UPI QR at your doorstep upon order arrival.
                      </p>
                    </div>
                  </div>
                  <Banknote className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Order Summary & Price Breakdown */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sticky top-24">
              
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Order Summary ({totals.itemCount} Items)
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 capitalize">
                  {fulfillmentMethod.replace('_', ' ')}
                </span>
              </div>

              {/* Items List Preview */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 py-3 space-y-2 pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 pt-2 text-xs">
                    <img
                      src={item.image}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-500">{item.variantName} × {item.quantity}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-emerald-700 font-bold">₹{item.unitPrice}/unit</span>
                        <span className="font-black text-slate-900">₹{item.lineTotal}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Wholesale Savings Banner */}
              {totals.totalSavings > 0 && (
                <div className="my-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3 text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                    Wholesale & Offer Savings
                  </span>
                  <span className="text-emerald-700 font-black">- ₹{totals.totalSavings}</span>
                </div>
              )}

              {/* Price Details */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Items MRP Total</span>
                  <span className="line-through text-slate-400">₹{totals.subtotal + totals.totalSavings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price After Discount</span>
                  <span className="font-bold text-slate-900">₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>
                    {effectiveDeliveryCharge === 0 ? (
                      <span className="font-bold text-emerald-700">FREE</span>
                    ) : (
                      `₹${effectiveDeliveryCharge}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-bold text-slate-800 uppercase text-[11px]">
                    {paymentMethod.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-blue-700 text-lg">₹{effectivePayableTotal}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fb641b] to-[#f57c00] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 hover:from-[#f4511e] hover:to-[#e65100] active:scale-98 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'cod'
                        ? 'Confirm Order via Cash on Delivery'
                        : paymentMethod === 'upi'
                        ? 'Proceed to UPI Payment'
                        : paymentMethod === 'credit_card'
                        ? 'Proceed to Credit Card Payment'
                        : 'Proceed to Debit Card Payment'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium text-center">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Safe and Secure Payments. 100% Authentic Products.</span>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

