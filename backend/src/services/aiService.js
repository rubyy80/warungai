const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');

let aiClient = null;

function getClient() {
  if (!aiClient && env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Parse input teks / suara warung menjadi daftar item terstruktur JSON
 * Contoh: "indomie tiga aqua dua teh botol satu" -> [ { product_name: "indomie", quantity: 3 }, ... ]
 */
async function parseVoiceToItems(text) {
  const client = getClient();
  if (!client) {
    // Fallback parser sederhana jika API key belum dikonfigurasi
    console.warn('[AI Service] Gemini API key not set, using regex fallback.');
    return fallbackRegexParser(text);
  }

  const prompt = `
Kamu adalah asisten kasir warung kelontong Indonesia.
Tugasmu adalah mengubah teks input suara kasir menjadi daftar produk dan jumlahnya dalam format JSON terstruktur.
Format respons HARUS berupa array objek JSON:
[
  { "product_name": "<nama_produk>", "quantity": <angka_integer> }
]

Contoh input: "indomie tiga aqua dua teh botol satu"
Contoh output JSON:
[
  { "product_name": "indomie", "quantity": 3 },
  { "product_name": "aqua", "quantity": 2 },
  { "product_name": "teh botol", "quantity": 1 }
]

Teks input kasir:
"${text}"
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return Array.isArray(parsed) ? parsed : (parsed.items || []);
  } catch (error) {
    console.error('[AI Service] Error parsing voice with Gemini:', error);
    return fallbackRegexParser(text);
  }
}

/**
 * Menghasilkan business insight sederhana berbahasa Indonesia berdasarkan performa toko
 */
async function generateBusinessInsight(storeData) {
  const client = getClient();
  if (!client) {
    return {
      insight: 'Insight bisnis otomatis: Pantau stok produk terlaris Anda agar tidak kehabisan pembeli.',
      recommendations: [
        'Pastikan produk dengan penjualan tertinggi selalu tersedia stoknya.',
        'Periksa produk dengan stok di bawah batas minimum.'
      ]
    };
  }

  const prompt = `
Kamu adalah konsultan bisnis ramah untuk pemilik warung kelontong di Indonesia (seperti Pak Hasan).
Bahasa harus sederhana, jelas, dan memotivasi tanpa istilah teknis rumit.

Berdasarkan data performa toko berikut:
${JSON.stringify(storeData, null, 2)}

Berikan output JSON dengan format:
{
  "insight": "<penjelasan ringkas performa toko>",
  "recommendations": [
    "<rekomendasi aksi konkret 1>",
    "<rekomendasi aksi konkret 2>"
  ]
}
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error('[AI Service] Error generating insight with Gemini:', error);
    return {
      insight: 'Data penjualan telah dicatat dengan baik.',
      recommendations: [
        'Cek laporan mingguan untuk melihat tren produk yang paling diminati.'
      ]
    };
  }
}

// Fallback jika API key belum diisi atau offline
function fallbackRegexParser(text) {
  const numberMap = {
    satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5,
    enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10
  };

  const tokens = text.toLowerCase().split(/\s+/);
  const items = [];
  let currentWords = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let qty = null;

    if (!isNaN(parseInt(token, 10))) {
      qty = parseInt(token, 10);
    } else if (numberMap[token]) {
      qty = numberMap[token];
    }

    if (qty !== null && currentWords.length > 0) {
      items.push({
        product_name: currentWords.join(' '),
        quantity: qty
      });
      currentWords = [];
    } else if (qty === null) {
      currentWords.push(token);
    }
  }

  if (currentWords.length > 0) {
    items.push({
      product_name: currentWords.join(' '),
      quantity: 1
    });
  }

  return items;
}

module.exports = {
  parseVoiceToItems,
  generateBusinessInsight
};

