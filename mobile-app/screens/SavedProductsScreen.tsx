import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface SavedProductsScreenProps {
  navigation?: any;
}

function NutriScore({ grade }: { grade: string }) {
  if (!grade) return null;
  const colors: Record<string, string> = { a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63312' };
  const bg = colors[grade.toLowerCase()] || '#94A3B8';
  return (
    <View style={[styles.nutriPill, { backgroundColor: bg }]}>
      <Text style={styles.nutriText}>Nutri-Score {grade.toUpperCase()}</Text>
    </View>
  );
}

export default function SavedProductsScreen({ navigation }: SavedProductsScreenProps = {}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await userAPI.getSavedProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (!silent) Alert.alert('Error', 'Failed to load saved products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(true);
  }, []);

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      'Remove Product',
      `Remove "${name}" from your saved list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            setRemovingId(id);
            try {
              await userAPI.removeSavedProduct(id);
              setProducts((prev) => prev.filter((p) => p._id !== id));
            } catch {
              Alert.alert('Error', 'Could not remove product. Try again.');
            } finally {
              setRemovingId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Saved Products</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading saved products…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={products.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No saved products</Text>
              <Text style={styles.emptySub}>
                Scan a food product barcode and save it here for quick access and health info.
              </Text>
              {navigation && (
                <TouchableOpacity
                  style={styles.scanBtn}
                  onPress={() => navigation.navigate('Scan Food')}
                >
                  <Text style={styles.scanBtnText}>📷 Scan a Product</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            products.map((p) => (
              <View key={p._id} style={styles.card}>
                <View style={styles.cardLeft}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.productImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={{ fontSize: 30 }}>🛒</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                  {p.brand ? <Text style={styles.brand}>{p.brand}</Text> : null}
                  <NutriScore grade={p.nutriscoreGrade} />
                  <Text style={styles.barcode}>🔢 {p.barcode}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(p._id, p.name)}
                  disabled={removingId === p._id}
                >
                  {removingId === p._id ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Text style={styles.removeIcon}>🗑️</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, width: 36 },
  backArrow: { fontSize: 28, color: '#1E293B', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyState: { alignItems: 'center' },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  scanBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: Radius.full },
  scanBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardLeft: { width: 64, alignItems: 'center', justifyContent: 'center' },
  productImage: { width: 60, height: 60, borderRadius: 8 },
  imagePlaceholder: {
    width: 60, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  brand: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  nutriPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  nutriText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  barcode: { fontSize: 11, color: '#94A3B8' },
  removeBtn: { padding: 8 },
  removeIcon: { fontSize: 18 },
});
