import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import VoiceInput from '../components/VoiceInput';
import CartItem from '../components/CartItem';
import api from '../services/api';

export default function TransactionScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // [ { id, name, selling_price, quantity } ]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (e) {
      console.error('Failed to load products', e);
    }
  };

  // Tangani hasil voice recognition dari AI
  // items: [ { product_name: "indomie", quantity: 3 }, ... ]
  const handleVoiceParsed = (parsedItems) => {
    const updatedCart = [...cart];

    parsedItems.forEach(({ product_name, quantity }) => {
      // Fuzzy matching sederhana: cocokkan nama produk
      const match = products.find(p =>
        p.name.toLowerCase().includes(product_name.toLowerCase()) ||
        product_name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (match) {
        const existingIdx = updatedCart.findIndex(c => c.id === match.id);
        if (existingIdx > -1) {
          updatedCart[existingIdx].quantity += quantity;
        } else {
          updatedCart.push({
            id: match.id,
            name: match.name,
            selling_price: match.selling_price,
            quantity: quantity
          });
        }
      } else {
        Alert.alert('Produk Tidak Ditemukan', `"${product_name}" belum ada di daftar produk toko.`);
      }
    });

    setCart(updatedCart);
  };

  const handleIncrease = (id) => {
    setCart(cart.map(c => c.id === id ? { ...c, quantity: c.quantity + 1 } : c));
  };

  const handleDecrease = (id) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        return c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const handleRemove = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.quantity), 0);
  };

  const handleSubmitTransaction = async () => {
    if (cart.length === 0) {
      Alert.alert('Keranjang Kosong', 'Ucapkan atau tambahkan produk sebelum simpan.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/transactions', payload);
      const { transaction_id, total_revenue, total_profit } = res.data;

      Alert.alert(
        'Transaksi Berhasil! 🎉',
        `No: #${transaction_id}\nTotal: Rp ${total_revenue.toLocaleString('id-ID')}\nUntung: Rp ${total_profit.toLocaleString('id-ID')}`,
        [{ text: 'Selesai', onPress: () => setCart([]) }]
      );
    } catch (e) {
      console.error('Submit transaction error', e);
      const msg = e.response?.data?.error || 'Gagal menyimpan transaksi.';
      Alert.alert('Transaksi Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Voice Assistant Input Header */}
      <VoiceInput onParsed={handleVoiceParsed} />

      {/* Cart Items List */}
      <View style={styles.cartSection}>
        <Text style={styles.sectionTitle}>Barang Belanjaan ({cart.length})</Text>
        {cart.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Keranjang masih kosong.</Text>
            <Text style={styles.emptySub}>Tekan tombol mikrofon hijau di atas lalu ucapkan belanjaan.</Text>
          </View>
        ) : (
          <FlatList
            data={cart}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onIncrease={() => handleIncrease(item.id)}
                onDecrease={() => handleDecrease(item.id)}
                onRemove={() => handleRemove(item.id)}
              />
            )}
          />
        )}
      </View>

      {/* Checkout Footer */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pembayaran:</Text>
            <Text style={styles.totalVal}>Rp {calculateTotal().toLocaleString('id-ID')}</Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={handleSubmitTransaction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>Selesaikan & Cetak Nota</Text>
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
  cartSection: {
    flex: 1,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280'
  },
  emptySub: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 6
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  totalLabel: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500'
  },
  totalVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  payBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

