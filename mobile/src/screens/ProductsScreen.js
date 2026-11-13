import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function ProductsScreen() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form tambah produk
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', 'Tidak dapat mengambil daftar produk.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!name || !sellingPrice) {
      Alert.alert('Perhatian', 'Nama dan Harga Jual wajib diisi.');
      return;
    }

    try {
      await api.post('/products', {
        name,
        selling_price: parseFloat(sellingPrice),
        stock: parseInt(stock, 10) || 0,
        min_stock: parseInt(minStock, 10) || 5
      });

      setModalVisible(false);
      setName('');
      setSellingPrice('');
      setStock('0');
      setMinStock('5');
      loadProducts();
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', e.response?.data?.error || 'Gagal menambah produk.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Produk Toko</Text>
        {user?.role === 'owner' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.prodName}>{item.name}</Text>
                <Text style={styles.prodPrice}>
                  Rp {parseFloat(item.selling_price).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.stockBox}>
                <Text style={[styles.stockVal, item.stock <= item.min_stock && styles.lowStock]}>
                  Stok: {item.stock}
                </Text>
                <Text style={styles.minStockVal}>Min: {item.min_stock}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal Tambah Produk */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Produk Baru</Text>

            <Text style={styles.label}>Nama Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: indomie goreng"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Harga Jual (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="3500"
              keyboardType="numeric"
              value={sellingPrice}
              onChangeText={setSellingPrice}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.label}>Stok Awal</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.label}>Batas Min. Stok</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={minStock}
                  onChangeText={setMinStock}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e5e7eb' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#374151', fontWeight: 'bold' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#16a34a' }]}
                onPress={handleAddProduct}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  addBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  prodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize'
  },
  prodPrice: {
    fontSize: 14,
    color: '#16a34a',
    marginTop: 2
  },
  stockBox: {
    alignItems: 'flex-end'
  },
  stockVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  lowStock: {
    color: '#dc2626'
  },
  minStockVal: {
    fontSize: 11,
    color: '#9ca3af'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#111827'
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 10
  }
});

