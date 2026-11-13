import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, register } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');

  const handleSubmit = async () => {
    if (!phone || !password) {
      Alert.alert('Perhatian', 'Nomor telepon dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!name || !storeName) {
          Alert.alert('Perhatian', 'Nama dan Nama Warung wajib diisi saat daftar.');
          setLoading(false);
          return;
        }
        await register(name, phone, password, storeName);
      } else {
        await login(phone, password);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Terjadi kesalahan, periksa koneksi Anda.';
      Alert.alert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>WarungAI 🏪</Text>
        <Text style={styles.appSubtitle}>Catat Kasir & Pantau Untung Semudah Suara</Text>
      </View>

      <View style={styles.form}>
        {isRegister && (
          <>
            <Text style={styles.label}>Nama Pemilik</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Pak Hasan"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Nama Warung</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Warung Berkah"
              value={storeName}
              onChangeText={setStoreName}
            />
          </>
        )}

        <Text style={styles.label}>Nomor Telepon (WhatsApp)</Text>
        <TextInput
          style={styles.input}
          placeholder="08123456789"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Kata Sandi</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimal 6 karakter"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.mainBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.mainBtnText}>{isRegister ? 'Daftar Warung Baru' : 'Masuk ke Kasir'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.toggleText}>
            {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar warung baru'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  appSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 6,
    textAlign: 'center'
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fcfcfc'
  },
  mainBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  mainBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  toggleBtn: {
    marginTop: 14,
    alignItems: 'center'
  },
  toggleText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '500'
  }
});

