import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function ReportsScreen() {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const [dRes, wRes] = await Promise.all([
        api.get('/reports/daily'),
        api.get('/reports/weekly')
      ]);
      setDaily(dRes.data);
      setWeekly(wRes.data);
    } catch (e) {
      console.error('Reports fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Laporan Keuangan Warung 📊</Text>

      {/* Laporan Hari Ini */}
      {daily && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hari Ini ({daily.date})</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Omzet</Text>
              <Text style={styles.metricVal}>Rp {daily.total_revenue.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Keuntungan Bersih</Text>
              <Text style={[styles.metricVal, { color: '#16a34a' }]}>
                Rp {daily.total_profit.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
          <Text style={styles.txInfo}>Total Transaksi: {daily.total_transactions} pembeli</Text>
          {daily.busiest_hour !== null && (
            <Text style={styles.txInfo}>Jam Paling Ramai: Jam {daily.busiest_hour}:00 WIB</Text>
          )}

          {daily.top_products.length > 0 && (
            <View style={styles.topSection}>
              <Text style={styles.subTitle}>5 Produk Paling Laris Hari Ini:</Text>
              {daily.top_products.map((p, idx) => (
                <View key={idx} style={styles.prodRow}>
                  <Text style={styles.prodName}>{idx + 1}. {p.name}</Text>
                  <Text style={styles.prodQty}>{p.qty_sold} terjual</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Laporan Mingguan */}
      {weekly && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ringkasan 7 Hari Terakhir</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Omzet Mingguan</Text>
              <Text style={styles.metricVal}>Rp {weekly.total_revenue.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Keuntungan Mingguan</Text>
              <Text style={[styles.metricVal, { color: '#16a34a' }]}>
                Rp {weekly.total_profit.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          <View style={styles.topSection}>
            <Text style={styles.subTitle}>Tren Penjualan Harian:</Text>
            {weekly.days.map((d, idx) => (
              <View key={idx} style={styles.dayRow}>
                <Text style={styles.dayDate}>{d.date}</Text>
                <Text style={styles.dayRev}>Rp {d.revenue.toLocaleString('id-ID')}</Text>
                <Text style={styles.dayProf}>+Rp {d.profit.toLocaleString('id-ID')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  metricItem: {
    flex: 1
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  metricVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2
  },
  txInfo: {
    fontSize: 13,
    color: '#4b5563',
    marginVertical: 2
  },
  topSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6
  },
  prodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  prodName: {
    fontSize: 14,
    color: '#1f2937',
    textTransform: 'capitalize'
  },
  prodQty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a'
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb'
  },
  dayDate: {
    fontSize: 13,
    color: '#4b5563'
  },
  dayRev: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937'
  },
  dayProf: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a'
  }
});

