import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { Product, resolveUnitPrice } from '@ecommerce/shared';

const API_BASE = 'http://10.0.2.2:3001/api'; // Android Emulator alias to localhost

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.data);
      })
      .catch((err) => console.log('Network note:', err));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#047857" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DailyFresh Mart</Text>
          <Text style={styles.headerSubtitle}>⚡ 2-Hour Delivery • Wholesale Slabs</Text>
        </View>
        <TouchableOpacity style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>Cart ({cartCount})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>WHOLESALE SLAB PRICING</Text>
          <Text style={styles.bannerTitle}>Buy 5+ or 25+ Packs & Save Extra</Text>
          <Text style={styles.bannerText}>Direct wholesale discount automatically computed per item.</Text>
        </View>

        {/* Catalog List */}
        <Text style={styles.sectionHeading}>Daily Essentials & Munchies</Text>

        {products.map((item) => {
          const variant = item.variants[0];
          const { unitPrice } = resolveUnitPrice(variant, 1, item.isWholesaleEnabled);

          return (
            <View key={item.id} style={styles.productCard}>
              <Image
                source={{ uri: item.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.brand || 'ESSENTIALS'}</Text>
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.variantName}>{variant.name}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{unitPrice}</Text>
                  {variant.mrp > unitPrice && (
                    <Text style={styles.mrpText}>₹{variant.mrp}</Text>
                  )}
                  {item.isWholesaleEnabled && (
                    <View style={styles.wholesalePill}>
                      <Text style={styles.wholesalePillText}>Bulk Slabs</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setCartCount((c) => c + 1)}
                >
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#059669',
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
    color: '#d1fae5',
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
    backgroundColor: '#064e3b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  bannerTag: {
    color: '#fbbf24',
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
    color: '#a7f3d0',
    fontSize: 11,
    marginTop: 2,
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
});
