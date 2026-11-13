import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import StockAlert from '../components/StockAlert';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [dailyData, setDailyData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Ambil alerts stok
      const alertRes = await api.get('/alerts');
      setAlerts(alertRes.data);

      // Jika role owner, ambil ringkasan harian & rekomendasi AI
      if (user?.role === 'owner') {
        const dailyRes = await api.get('/reports/daily');
        setDailyData(dailyRes.data);

        const aiRes = await api.post('/ai/insight', {});
        setAiInsight(aiRes.data);
      }
    } catch (e) {
      console.error('Home fetch error', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleDismissAlert = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (e) {
      console.error('Dismiss alert error', e);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Profile Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {user?.name} 👋</Text>
          <Text style={styles.badge}>{user?.role === 'owner' ? '👑 Pemilik Warung' : '🛒 Kasir'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Stock Alerts Section */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          {alerts.map(a => (
            <StockAlert key={a.id} alert={a} onDismiss={() => handleDismissAlert(a.id)} />
          ))}
        </View>
      )}

      {/* Daily Overview (Owner Only) */}
      {user?.role === 'owner' && dailyData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Hari Ini</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#ecfdf5' }]}>
              <Text style={styles.statLabel}>Pendapatan</Text>
              <Text style={styles.statVal}>Rp {dailyData.total_revenue.toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.statLabel}>Keuntungan</Text>
              <Text style={[styles.statVal, { color: '#0284c7' }]}>
                Rp {dailyData.total_profit.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* AI Recommendation Card */}
      {aiInsight && (
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiSparkle}>✨</Text>
            <Text style={styles.aiTitle}>Saran AI Warung</Text>
          </View>
          <Text style={styles.aiBody}>{aiInsight.insight}</Text>
          {aiInsight.recommendations?.map((rec, i) => (
            <Text key={i} style={styles.aiBullet}>• {rec}</Text>
          ))}
        </View>
      )}

      {/* Quick Action Buttons */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Transaction')}
        >
          <Text style={styles.actionIcon}>⚡</Text>
          <Text style={styles.actionText}>Catat Kasir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <Text style={styles.actionText}>Daftar Produk</Text>
        </TouchableOpacity>

        {user?.role === 'owner' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Restock')}
          >
            <Text style={styles.actionIcon}>🚚</Text>
            <Text style={styles.actionText}>Kulakan / Restock</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  badge: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fee2e2'
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 4
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500'
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 4
  },
  aiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff'
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  aiSparkle: {
    fontSize: 18,
    marginRight: 6
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4338ca'
  },
  aiBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8
  },
  aiBullet: {
    fontSize: 13,
    color: '#4b5563',
    marginVertical: 2
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 24
  },
  actionBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: 6
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937'
  }
});

