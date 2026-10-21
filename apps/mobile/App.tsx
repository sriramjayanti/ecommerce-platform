import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Product,
  ProductVariant,
  CartItem,
  Order,
  resolveUnitPrice,
  INITIAL_PRODUCTS,
} from '@ecommerce/shared';

// Dynamic host resolution: 10.0.2.2 for Android emulator, localhost for iOS/web, or direct LAN IP
const API_BASE = Platform.select({
  android: 'http://10.0.2.2:3001/api',
  ios: 'http://localhost:3001/api',
  default: 'http://localhost:3001/api',
});

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Checkout inputs
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState('9812345678');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Green Valley Apartments, Bengaluru');
  const [pincode, setPincode] = useState('560034');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'home_delivery' | 'takeaway'>('home_delivery');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length) {
          setProducts(data.data);
        }
      })
      .catch((err) => {
        console.log('Backend offline, using fallback catalog:', err.message);
      });
  }, []);

  // Cart operations with wholesale tier pricing resolution
  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.variantId === variant.id
      );

      if (existingIdx > -1) {
        const item = prev[existingIdx];
        const newQty = item.quantity + 1;
        const { unitPrice, appliedTier } = resolveUnitPrice(variant, newQty, product.isWholesaleEnabled);
        const lineTotal = unitPrice * newQty;
        const savings = Math.max(0, variant.mrp * newQty - lineTotal);

        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          unitPrice,
          lineTotal,
          savings,
          appliedTierLabel: appliedTier?.label,
        };
        return updated;
      } else {
        const { unitPrice, appliedTier } = resolveUnitPrice(variant, 1, product.isWholesaleEnabled);
        const lineTotal = unitPrice;
        const savings = Math.max(0, variant.mrp - lineTotal);

        const newItem: CartItem = {
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          variantName: variant.name,
          image: variant.images?.[0] || product.images[0] || '',
          quantity: 1,
          unitPrice,
          basePrice: variant.basePrice,
          mrp: variant.mrp,
          lineTotal,
          savings,
          maxStock: variant.stock,
          appliedTierId: appliedTier?.id,
          appliedTierLabel: appliedTier?.label,
          pricingTiers: variant.pricingTiers || [],
          isWholesaleEnabled: product.isWholesaleEnabled,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (productId: string, variantId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;

            const dummyVariant: ProductVariant = {
              id: item.variantId,
              name: item.variantName,
              sku: '',
              weightOrSize: '',
              mrp: item.mrp,
              basePrice: item.basePrice,
              stock: item.maxStock,
              lowStockThreshold: 5,
              pricingTiers: item.pricingTiers || [],
            };

            const { unitPrice, appliedTier } = resolveUnitPrice(
              dummyVariant,
              newQty,
              item.isWholesaleEnabled !== false
            );
            const lineTotal = unitPrice * newQty;
            const savings = Math.max(0, item.mrp * newQty - lineTotal);

            return {
              ...item,
              quantity: newQty,
              unitPrice,
              lineTotal,
              savings,
              appliedTierLabel: appliedTier?.label,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const cartSavings = cart.reduce((sum, i) => sum + i.savings, 0);
  const deliveryFee = fulfillmentMethod === 'takeaway' || cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 40;
  const grandTotal = cartSubtotal + deliveryFee;

  // Place order
  const handlePlaceOrder = async () => {
    if (!customerName || !customerPhone || !deliveryAddress) {
      Alert.alert('Incomplete Address', 'Please provide your Name, Phone and Delivery Address.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload = {
        userId: `mobile-${customerPhone}`,
        customerName,
        customerPhone,
        shippingAddress: {
          id: `addr-mob-${Date.now()}`,
          userId: `mobile-${customerPhone}`,
          fullName: customerName,
          phone: customerPhone,
          line1: deliveryAddress,
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode,
          addressType: 'home' as const,
          isDefault: true,
        },
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        paymentMethod: 'cod' as const,
        fulfillmentMethod,
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success || !json.data?.order) {
        throw new Error(json.error || 'Order placement failed');
      }

      const confirmedOrder: Order = json.data.order;
      setCart([]);
      setCheckoutVisible(false);
      setCartVisible(false);
      setTrackingOrder(confirmedOrder);
      Alert.alert('Order Confirmed!', `Your Order #${confirmedOrder.orderNumber} has been placed successfully.`);
    } catch (err: any) {
      Alert.alert('Order Error', err.message || 'Could not place order. Please check backend connection.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DailyFresh Mart</Text>
          <Text style={styles.headerSubtitle}>⚡ Instant Delivery • Wholesale Slabs</Text>
        </View>
        <TouchableOpacity style={styles.cartBadge} onPress={() => setCartVisible(true)}>
          <Text style={styles.cartBadgeText}>Cart ({cartItemCount})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wholesale Promotion Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>WHOLESALE SLAB PRICING ACTIVE</Text>
          <Text style={styles.bannerTitle}>Buy 5+ or 10+ Packs & Save Extra</Text>
          <Text style={styles.bannerText}>
            Unit prices drop automatically when increasing quantity. Verified server-side.
          </Text>
        </View>

        {/* Catalog List */}
        <Text style={styles.sectionHeading}>Marketplace Essentials & Munchies</Text>

        {products.map((item) => {
          const variant = item.variants[0];
          const inCart = cart.find((c) => c.productId === item.id && c.variantId === variant.id);
          const currentQty = inCart ? inCart.quantity : 1;
          const { unitPrice, appliedTier } = resolveUnitPrice(variant, currentQty, item.isWholesaleEnabled);

          return (
            <View key={item.id} style={styles.productCard}>
              <Image
                source={{ uri: item.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.brand || 'ESSENTIALS'}</Text>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.variantName}>{variant.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{unitPrice}</Text>
                  {variant.mrp > unitPrice && <Text style={styles.mrpText}>₹{variant.mrp}</Text>}
                  {item.isWholesaleEnabled && (
                    <View style={styles.wholesalePill}>
                      <Text style={styles.wholesalePillText}>Bulk Slabs</Text>
                    </View>
                  )}
                </View>

                {inCart ? (
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.id, variant.id, -1)}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{inCart.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.id, variant.id, 1)}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart(item, variant)}
                  >
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomBarCount}>{cartItemCount} items in cart</Text>
            <Text style={styles.bottomBarTotal}>₹{grandTotal}</Text>
          </View>
          <TouchableOpacity style={styles.bottomBarBtn} onPress={() => setCartVisible(true)}>
            <Text style={styles.bottomBarBtnText}>View Cart →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CART MODAL */}
      <Modal visible={cartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart ({cartItemCount})</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {cart.map((i) => (
                <View key={`${i.productId}-${i.variantId}`} style={styles.cartItemRow}>
                  <Image source={{ uri: i.image }} style={styles.cartItemImg} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cartItemTitle} numberOfLines={1}>{i.title}</Text>
                    <Text style={styles.cartItemVariant}>{i.variantName}</Text>
                    <Text style={styles.cartItemPrice}>
                      ₹{i.unitPrice} × {i.quantity} = <Text style={{ fontWeight: '800' }}>₹{i.lineTotal}</Text>
                    </Text>
                    {i.appliedTierLabel && (
                      <Text style={styles.cartTierLabel}>⚡ {i.appliedTierLabel}</Text>
                    )}
                  </View>
                  <View style={styles.cartItemStepper}>
                    <TouchableOpacity
                      style={styles.cartStepBtn}
                      onPress={() => updateQuantity(i.productId, i.variantId, -1)}
                    >
                      <Text style={styles.cartStepText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cartQtyText}>{i.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartStepBtn}
                      onPress={() => updateQuantity(i.productId, i.variantId, 1)}
                    >
                      <Text style={styles.cartStepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Bill Details */}
              <View style={styles.billBox}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal</Text>
                  <Text style={styles.billVal}>₹{cartSubtotal}</Text>
                </View>
                {cartSavings > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: '#059669' }]}>Wholesale Savings</Text>
                    <Text style={[styles.billVal, { color: '#059669' }]}>- ₹{cartSavings}</Text>
                  </View>
                )}
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Text style={styles.billVal}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
                </View>
                <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6 }]}>
                  <Text style={styles.billTotalLabel}>Grand Total</Text>
                  <Text style={styles.billTotalVal}>₹{grandTotal}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => {
                setCartVisible(false);
                setCheckoutVisible(true);
              }}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout (₹{grandTotal})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CHECKOUT MODAL */}
      <Modal visible={checkoutVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkout & Delivery</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} />

              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>Delivery Address</Text>
              <TextInput style={styles.input} value={deliveryAddress} onChangeText={setDeliveryAddress} />

              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput style={styles.input} value={pincode} onChangeText={setPincode} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Fulfillment Method</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.toggleBtn, fulfillmentMethod === 'home_delivery' && styles.toggleBtnActive]}
                  onPress={() => setFulfillmentMethod('home_delivery')}
                >
                  <Text style={[styles.toggleBtnText, fulfillmentMethod === 'home_delivery' && styles.toggleBtnTextActive]}>
                    🚚 Home Delivery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, fulfillmentMethod === 'takeaway' && styles.toggleBtnActive]}
                  onPress={() => setFulfillmentMethod('takeaway')}
                >
                  <Text style={[styles.toggleBtnText, fulfillmentMethod === 'takeaway' && styles.toggleBtnTextActive]}>
                    🏪 Store Pickup
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.paymentMethodNotice}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>Payment: Cash / UPI on Delivery</Text>
                <Text style={{ fontSize: 11, color: '#065f46', marginTop: 2 }}>
                  Pay cash or scan QR upon delivery at your doorstep.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.checkoutBtn} disabled={isPlacingOrder} onPress={handlePlaceOrder}>
              {isPlacingOrder ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkoutBtnText}>Confirm Order (₹{grandTotal})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ORDER TRACKING MODAL */}
      {trackingOrder && (
        <Modal visible={!!trackingOrder} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order #{trackingOrder.orderNumber}</Text>
                <TouchableOpacity onPress={() => setTrackingOrder(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.statusCard}>
                  <Text style={styles.statusBadge}>Status: {trackingOrder.orderStatus}</Text>
                  <Text style={styles.statusSubtitle}>
                    {trackingOrder.fulfillmentMethod === 'takeaway'
                      ? 'Ready for Store Pickup in 30 mins'
                      : 'Doorstep Delivery by Tomorrow'}
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>Items Ordered ({trackingOrder.items.length})</Text>
                {trackingOrder.items.map((it, idx) => (
                  <View key={idx} style={styles.trackedItemRow}>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: '#0f172a' }}>{it.title}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>
                      {it.quantity} × ₹{it.unitPrice} = ₹{it.lineTotal}
                    </Text>
                  </View>
                ))}

                <View style={styles.billBox}>
                  <View style={styles.billRow}>
                    <Text style={styles.billTotalLabel}>Total Amount Paid/Due</Text>
                    <Text style={styles.billTotalVal}>₹{trackingOrder.finalTotal}</Text>
                  </View>
                </View>

                {/* WhatsApp Support Action */}
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => {
                    const text = `Hello DailyFresh Mart, I need assistance with my Order #${trackingOrder.orderNumber} (Total: ₹${trackingOrder.finalTotal}).`;
                    Linking.openURL(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`);
                  }}
                >
                  <Text style={styles.whatsappBtnText}>💬 WhatsApp Store Support</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '600',
  },
  cartBadge: {
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  banner: {
    backgroundColor: '#065f46',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  bannerTag: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  bannerText: {
    color: '#d1fae5',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  variantName: {
    fontSize: 11,
    color: '#64748b',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  mrpText: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  wholesalePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wholesalePillText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: '#059669',
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 6,
  },
  stepBtn: {
    backgroundColor: '#e2e8f0',
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#0f172a',
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  bottomBarTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  bottomBarBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bottomBarBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 18,
    color: '#94a3b8',
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cartItemImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cartItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  cartItemVariant: {
    fontSize: 10,
    color: '#64748b',
  },
  cartItemPrice: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  cartTierLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  cartItemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartStepBtn: {
    backgroundColor: '#f1f5f9',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartStepText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cartQtyText: {
    fontSize: 12,
    fontWeight: '800',
  },
  billBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  billTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  checkoutBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#047857',
  },
  paymentMethodNotice: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  statusCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065f46',
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  trackedItemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  whatsappBtn: {
    backgroundColor: '#25d366',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
