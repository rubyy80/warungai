# WarungAI 🏪🤖

Aplikasi kasir pintar dan pemantau laba warung kelontong berbasis suara (*Voice-to-Transaction*) dan asisten AI, dirancang khusus untuk kenyamanan pemilik warung tradisional di Indonesia.

---

## 🎯 Masalah & Solusi

Aplikasi kasir POS konvensional di Play Store umumnya terlalu rumit bagi pemilik warung: harus mencari nama barang di dropdown, mengetik barcode, atau menavigasi menu yang bertingkat-tingkat. Saat warung sedang ramai pembeli, pemilik warung frustrasi dan kembali mencatat di buku kertas.

**WarungAI** menyelesaikan ini dengan:
1. **Pencatatan Berbasis Suara (*Voice Input*)**: Kasir cukup menekan satu tombol mikrofon dan mengucapkan *"indomie tiga aqua dua teh botol satu"*. AI langsung mengubahnya menjadi daftar belanja dan total nota secara instan.
2. **Kalkulasi Laba Akurat (*Snapshot Pattern*)**: Harga modal barang grosir selalu naik-turun. WarungAI mencatat modal saat restock/kulakan dan mengunci nilai modal per transaksi, sehingga keuntungan masa lalu tetap 100% akurat.
3. **Pemberitahuan Stok Otomatis**: Alert muncul otomatis ketika stok berada di bawah batas aman.
4. **Insight Bisnis Sederhana**: AI memberikan rekomendasi konkret berbahasa Indonesia (misal: *"Indomie goreng cepat habis tiap 3 hari, tambah stok minimal 30 pcs"*).

---

## 🏗️ Tech Stack & Arsitektur

* **Mobile**: React Native, Expo, React Navigation (Tabs & Stacks), Axios, AsyncStorage.
* **Backend**: Node.js, Express.js, JSON Web Token (JWT), `bcryptjs`.
* **Database**: PostgreSQL dengan transaksi ACID dan *Pessimistic Row Locking* (`SELECT ... FOR UPDATE`).
* **AI & NLP**: Google Gemini API (`@google/genai`) dengan model `gemini-2.5-flash` dan fallback parser lokal.

---

## 📁 Struktur Direktori

```
warungai/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection pool & env validation
│   │   ├── middleware/      # JWT auth & role check (owner vs cashier)
│   │   ├── routes/          # REST endpoints (auth, products, restock, transactions, reports, alerts, ai)
│   │   ├── services/        # AI Service (Gemini API) & Alert Service
│   │   └── index.js         # Entry point backend Express
│   ├── migrations/          # SQL DDL Schema & migration script
│   └── .env.example
│
└── mobile/
    ├── src/
    │   ├── components/      # VoiceInput, CartItem, StockAlert
    │   ├── context/         # AuthContext (State login, register, token)
    │   ├── navigation/      # AppNavigator (Tab & Stack Navigation)
    │   ├── screens/         # Login, Home, Transaction, Products, Restock, Reports, Alerts
    │   └── services/        # Axios API client & AsyncStorage
    ├── App.js
    └── app.json
```

---

## 🚀 Panduan Menjalankan Proyek

### 1. Menjalankan Backend API

1. Masuk ke direktori backend:
   ```bash
   cd backend
   npm install
   ```

2. Buat file `.env` dari template `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan `DATABASE_URL`, `JWT_SECRET`, dan `GEMINI_API_KEY`.

3. Jalankan migrasi database:
   ```bash
   npm run migrate
   ```

4. Jalankan backend server:
   ```bash
   npm run dev
   # Server berjalan di http://localhost:3000/api
   ```

---

### 2. Menjalankan Mobile App (Expo)

1. Masuk ke direktori mobile:
   ```bash
   cd ../mobile
   npm install
   ```

2. Buka file `src/services/api.js` dan sesuaikan IP address backend jika menjalankan di perangkat fisik Android/iOS:
   ```javascript
   const DEFAULT_BASE_URL = 'http://<IP-KOMPUTER-ANDA>:3000/api';
   ```

3. Jalankan Expo:
   ```bash
   npm start
   ```
   Pindai QR code menggunakan aplikasi **Expo Go** pada smartphone Android/iOS Anda.

