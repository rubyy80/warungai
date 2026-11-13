import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

export default function VoiceInput({ onParsed }) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState('');
  const [showManual, setShowManual] = useState(false);

  // Simulasi speech recognition native atau kirim teks hasil transkrip ke backend
  const handleSimulateVoice = async (spokenText) => {
    setLoading(true);
    try {
      const res = await api.post('/ai/parse-voice', { text: spokenText });
      if (res.data && res.data.items) {
        onParsed(res.data.items);
      }
    } catch (err) {
      console.error('Error parsing voice', err);
      Alert.alert('Gagal Memproses', 'Pastikan koneksi internet dan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  const submitManual = () => {
    if (!manualText.trim()) return;
    handleSimulateVoice(manualText.trim());
    setManualText('');
    setShowManual(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.voiceBtn, isRecording && styles.recording]}
        onPress={() => {
          // Toggle input suara cepat
          Alert.prompt
            ? Alert.prompt(
                'Suara Kasir',
                'Ucapkan atau ketik transaksi (Contoh: indomie tiga aqua dua):',
                (text) => text && handleSimulateVoice(text)
              )
            : setShowManual(!showManual);
        }}
      >
        <Text style={styles.micIcon}>🎙️</Text>
        <Text style={styles.voiceBtnText}>
          {loading ? 'Memproses Suara AI...' : 'Tekan & Ucapkan Transaksi'}
        </Text>
      </TouchableOpacity>

      {showManual && (
        <View style={styles.manualBox}>
          <TextInput
            style={styles.input}
            placeholder="Contoh: indomie tiga aqua dua"
            value={manualText}
            onChangeText={setManualText}
            autoFocus
          />
          <TouchableOpacity style={styles.submitBtn} onPress={submitManual} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Kirim AI</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10
  },
  voiceBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  recording: {
    backgroundColor: '#dc2626'
  },
  micIcon: {
    fontSize: 22,
    marginRight: 8
  },
  voiceBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  manualBox: {
    flexDirection: 'row',
    marginTop: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8
  },
  submitText: {
    color: '#ffffff',
    fontWeight: 'bold'
  }
});

