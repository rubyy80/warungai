import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function RestockScreen() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantityAdded, setQuantityAdded] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
      if (res.data.length > 0) {
        setSelectedProductId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestock = async () => {
    if (!selectedProductId || !quantityAdded || !modalPrice) {
      Alert.alert('Perhatian', 'Semua kolom wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/restock', {
        product_id: selectedProductId,
        quantity_added: parseInt(quantityAdded, 10),
        modal_price: parseFloat(modalPrice)
      });

      Alert.alert('Berhasil! 🚚', `Stok barang berhasil ditambah. Stok baru: ${res.data.new_stock}`);
      setQuantityAdded('');
      setModalPrice('');
      loadProducts();
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', e.response?.data?.error || 'Gagal menyimpan restock.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catat Kulakan / Restock 📦</Text>
      <Text style={styles.sub}>
        Modal dicatat per restock agar keuntungan masa lalu tetap akurat saat harga pasar berubah.
      </Text>

      {/* Product Selection List */}
      <Text style={styles.label}>Pilih Barang:</Text>
      <View style={styles.productPicker}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedProductId;
            return (
              <TouchableOpacity
                style={[styles.pill, isSelected && styles.activePill]}
                onPress={() => setSelectedProductId(item.id)}
              >
                <Text style={[styles.pillText, isSelected && styles.activePillText]}>
                  {item.name} ({item.stock})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {selectedProduct && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Kulakan: {selectedProduct.name}</Text>
          <Text style={styles.currentStockText}>Stok saat ini di warung: {selectedProduct.stock} pcs</Text>

          <Text style={styles.label}>Jumlah Barang Datang (Pcs / Bks)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 40"
            keyboardType="numeric"
            value={quantityAdded}
            onChangeText={setQuantityAdded}
          />

          <Text style={styles.label}>Harga Modal per Satuan dari Agen (Rp)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 2800"
            keyboardType="numeric"
            value={modalPrice}
            onChangeText={setModalPrice}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRestock}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Simpan Riwayat Kulakan</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  sub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6
  },
  productPicker: {
    marginBottom: 16
  },
  pill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8
  },
  activePill: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a'
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize'
  },
  activePillText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'capitalize'
  },
  currentStockText: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 2,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa'
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

