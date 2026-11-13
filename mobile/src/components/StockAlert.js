import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function StockAlert({ alert, onDismiss }) {
  return (
    <View style={styles.banner}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>⚠️ Stok Menipis!</Text>
        <Text style={styles.desc}>
          <Text style={styles.bold}>{alert.product_name}</Text> sisa{' '}
          <Text style={styles.bold}>{alert.current_stock}</Text> (Batas min: {alert.min_stock})
        </Text>
      </View>
      {onDismiss && (
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissText}>Sudah Tahu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textContainer: {
    flex: 1
  },
  title: {
    color: '#b45309',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2
  },
  desc: {
    color: '#92400e',
    fontSize: 13
  },
  bold: {
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  dismissBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  }
});

