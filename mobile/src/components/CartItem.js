import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>Rp {Number(item.selling_price).toLocaleString('id-ID')}</Text>
      </View>

      <View style={styles.counter}>
        <TouchableOpacity style={styles.btn} onPress={onDecrease}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity style={styles.btn} onPress={onIncrease}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize'
  },
  price: {
    fontSize: 14,
    color: '#16a34a',
    marginTop: 2
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginHorizontal: 8
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151'
  },
  qty: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    color: '#111827'
  },
  removeBtn: {
    padding: 8
  },
  removeText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold'
  }
});

