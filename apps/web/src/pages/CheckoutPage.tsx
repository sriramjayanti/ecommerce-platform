import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Address, dataStore } from '@ecommerce/shared';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Lock,
  Truck,
  Clock,
  Sparkles,
  ChevronRight,
  Radio,
  QrCode,
  Smartphone,
  Building,
  Store,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, totals, clearCart, settings } = useCart();
  const { user, addresses, addAddress, defaultAddress } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress?.id || (addresses[0]?.id ?? '')
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(addresses.length === 0);
  const [fulfilmentMethod, setFulfilmentMethod] = useState<'delivery' | 'takeaway'>('delivery');
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('express');
  
  // Payment methods: 'upi' | 'card' | 'netbanking' | 'cod'
  const [paymentType, setPaymentType] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [upiMethod, setUpiMethod] = useState<'qr' | 'id'>('qr');
  const [upiId, setUpiId] = useState('9812345678@paytm');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('phonepe');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('834');
  const [cardName, setCardName] = useState(user?.displayName || 'Rahul Sharma');
  
  // Netbanking
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

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
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-700 hover:to-teal-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let shippingAddress: Address;

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

      // Authoritative order placement using unified data store
      const payload = {
        userId: user?.id || `guest-${phone}`,
        customerName: shippingAddress.fullName,
        customerPhone: shippingAddress.phone,
        customerEmail: user?.email || `${phone}@guest.shop`,
        fulfilmentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: fulfilmentMethod === 'takeaway' ? {
          ...shippingAddress,
          line1: 'Store Pickup / Takeaway Hub (Gate #4)',
          line2: 'DailyFresh Mart Central Wholesale Warehouse',
          city: 'Wholesale Hub',
        } : shippingAddress,
        paymentMethod: paymentType as any,
        paymentDetails: {
          method: paymentType,
          upiId: paymentType === 'upi' ? upiId : undefined,
          bank: paymentType === 'netbanking' ? selectedBank : undefined,
          cardLast4: paymentType === 'card' ? cardNumber.slice(-4) : undefined,
        },
      };

      const result = await dataStore.placeOrder(payload as any);

      if (!result.success || !result.data?.order) {
        throw new Error(result.error || 'Failed to place order. Please try again.');
      }

      clearCart();

      // Navigate to order confirmation / tracking page
      navigate(`/order/${result.data.order.orderNumber}`);
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
        
        {/* Simple Back Navigation Bar */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 border border-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>← Back to Shopping</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Cart</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-emerald-700 font-bold">Secure Checkout</span>
            <ChevronRight className="h-3 w-3" />
            <span>Order Confirmation</span>
          </div>
        </div>

        {/* Checkout Top Security Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Amazon & Flipkart Style Checkout</h1>
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
            
            {/* STEP 1: Delivery Address */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#131921] text-xs font-black text-white">
                    1
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Delivery Address
                  </h2>
                </div>
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

              <div className="p-6">
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
            </div>

            {/* STEP 2: Fulfilment Method & Delivery Speed */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#131921] text-xs font-black text-white">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Fulfilment Method & Delivery Speed
                  </h2>
                  <p className="text-[11px] text-slate-500">Choose between Doorstep Delivery or Warehouse Hub Pickup (Takeaway)</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Method Tabs */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfilmentMethod('delivery')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition border ${
                      fulfilmentMethod === 'delivery'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span>🚚 Home Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfilmentMethod('takeaway')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition border ${
                      fulfilmentMethod === 'takeaway'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="h-4 w-4 text-emerald-600" />
                    <span>🏬 Store Pickup / Takeaway</span>
                  </button>
                </div>

                {fulfilmentMethod === 'takeaway' ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block">Pickup Hub: DailyFresh Mart Wholesale Center</span>
                    <p className="text-slate-600">APMC Wholesale Market Yard, Sector 19, Warehouse Gate #4</p>
                    <p className="text-[11px] text-emerald-700 font-bold">✓ Ready for pickup in 45 minutes • ₹0 Delivery Fee</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                )}
              </div>
            </div>

            {/* STEP 3: Payment Method */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Select Payment Method
                  </h2>
                  <p className="text-[11px] text-slate-500">Choose your preferred payment method: UPI, Credit/Debit Card, Net Banking, or Cash on Delivery</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* 1. UPI Option */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    paymentType === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentType === 'upi'}
                        onChange={() => setPaymentType('upi')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            UPI (Google Pay, PhonePe, Paytm, QR Code)
                          </span>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            Fastest • ₹0 Fee
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Instant verification via any UPI App or QR code scanner.
                        </p>
                      </div>
                    </div>
                    <Smartphone className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  </label>

                  {paymentType === 'upi' && (
                    <div className="mt-4 pt-4 border-t border-emerald-100 space-y-3">
                      {/* UPI Mode Tabs */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUpiMethod('qr')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                            upiMethod === 'qr'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Scan UPI QR Code</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiMethod('id')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                            upiMethod === 'id'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Enter UPI ID / VPA</span>
                        </button>
                      </div>

                      {upiMethod === 'qr' ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-emerald-200">
                          <div className="h-28 w-28 bg-slate-900 p-2 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                            <QrCode className="h-24 w-24 text-emerald-400" />
                          </div>
                          <div className="space-y-1 text-center sm:text-left">
                            <span className="text-xs font-black text-slate-900">Scan & Pay ₹{totals.finalTotal}</span>
                            <p className="text-[11px] text-slate-500">
                              Use PhonePe, Google Pay, Paytm or any BHIM UPI app to scan and pay instantly.
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> Auto-detects payment on submit
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 bg-white p-3.5 rounded-xl border border-emerald-200">
                          <label className="block text-xs font-bold text-slate-700">Enter your UPI ID / Mobile</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="9876543210@paytm or user@okhdfcbank"
                              className="flex-1 rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                            />
                            <span className="flex items-center text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 rounded-xl">
                              Verified
                            </span>
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            {['@paytm', '@ybl', '@okhdfcbank', '@okaxis'].map((handle) => (
                              <button
                                key={handle}
                                type="button"
                                onClick={() => setUpiId((prev) => (prev.split('@')[0] || 'user') + handle)}
                                className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 px-2 py-1 rounded-lg transition"
                              >
                                {handle}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Credit / Debit Card Option */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    paymentType === 'card'
                      ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentType === 'card'}
                        onChange={() => setPaymentType('card')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            Credit / Debit Cards
                          </span>
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                            Visa, MasterCard, RuPay
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bank-grade 256-bit encryption. All Indian & International cards accepted.
                        </p>
                      </div>
                    </div>
                    <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  </label>

                  {paymentType === 'card' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4532 0000 0000 0000"
                          maxLength={19}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Name as printed on card"
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Net Banking */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    paymentType === 'netbanking'
                      ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentType === 'netbanking'}
                        onChange={() => setPaymentType('netbanking')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900">Net Banking</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          All major banks supported (HDFC, SBI, ICICI, Axis, Kotak, PNB).
                        </p>
                      </div>
                    </div>
                    <Building className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  </label>

                  {paymentType === 'netbanking' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2">
                      {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                            selectedBank === bank
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Cash on Delivery */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    paymentType === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <label className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentType === 'cod'}
                        onChange={() => setPaymentType('cod')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900">Cash on Delivery (COD)</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pay cash or scan courier UPI QR at your doorstep upon order delivery.
                        </p>
                      </div>
                    </div>
                    <Banknote className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Order Summary & Price Breakdown */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sticky top-24">
              
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Summary ({totals.itemCount} Items)
              </h3>

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

              {/* Selected Preferences Badges */}
              <div className="py-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-bold text-emerald-800">
                  {fulfilmentMethod === 'delivery' ? '🚚 Home Delivery' : '🏬 Store Takeaway'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-bold text-blue-800 uppercase">
                  {paymentType === 'cod' ? 'Cash on Delivery' : paymentType}
                </span>
              </div>

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
                    {fulfilmentMethod === 'takeaway' || totals.deliveryCharge === 0 ? (
                      <span className="font-bold text-emerald-700">FREE</span>
                    ) : (
                      `₹${totals.deliveryCharge}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes & Packaging</span>
                  <span className="text-slate-700">₹{totals.taxAmount}</span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-blue-700 text-lg">
                    ₹{fulfilmentMethod === 'takeaway' ? totals.finalTotal - totals.deliveryCharge : totals.finalTotal}
                  </span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fb641b] to-[#f57c00] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 hover:from-[#f4511e] hover:to-[#e65100] active:scale-98 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Initiating Order...</span>
                ) : (
                  <>
                    <span>
                      {paymentType !== 'cod' ? 'Proceed to Secure Payment' : 'Confirm Order via COD'}
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
