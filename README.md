# WarungAI 🏪🤖

Aplikasi kasir pintar dan pemantau laba warung kelontong berbasis suara (**Voice-to-Transaction**) dengan bantuan AI, dirancang khusus agar semudah mencatat di buku bagi pemilik warung tradisional di Indonesia.

---

## 📌 Latar Belakang & Masalah

> *"Data transaksi ada — dicatat di buku — tapi tidak pernah jadi keputusan bisnis."*

Pemilik warung kelontong (seperti Pak Hasan) umumnya mencatat penjualan di buku dan menghitung keuntungan dengan kalkulator secara manual. Banyak aplikasi kasir POS di Play Store ditinggalkan karena terlalu rumit: harus memilih dropdown, mengetik barcode, atau mencari barang satu per satu di layar ponsel saat pelanggan sedang antre ramai.

**WarungAI hadir sebagai solusi:**
1. **Pencatatan Berbasis Suara (*Voice Input*)**: Cukup tekan mikrofon dan ucapkan: *"indomie tiga, aqua dua, teh botol satu"*. AI secara otomatis memecahnya menjadi daftar transaksi dan menghitung total belanja dalam hitungan detik.
2. **Kalkulasi Laba Akurat (*Snapshot Pattern*)**: Harga modal barang grosir selalu berubah setiap restock. Modal dicatat per riwayat kulakan dan dikunci nilainya saat transaksi terjadi (`modal_at_sale`), sehingga laporan keuntungan masa lalu tidak akan pernah rusak saat harga distributor naik.
3. **Pemberitahuan Stok Otomatis (*Stock Alert*)**: Sistem otomatis mengingatkan pemilik saat stok barang berada di bawah batas minimum.
4. **Rekomendasi AI Sederhana**: Memberikan saran bisnis berbahasa Indonesia yang mudah dipahami tanpa istilah teknis rumit (contoh: *"Indomie goreng habis tiap 3 hari, sebaiknya stok minimal 30 pcs"*).

---

## 🏛️ Arsitektur Sistem

```
┌─────────────────────────┐             ┌─────────────────────────┐
│     Aplikasi Mobile     │             │       Backend API       │
│  React Native + Expo    │◄───────────►│    Node.js + Express    │
└─────────────────────────┘    HTTPS    └────────────┬────────────┘
                                                     │
                             ┌───────────────────────┼───────────────────────┐
                             ▼                       ▼                       ▼
                    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                    │   PostgreSQL    │     │   Gemini API    │     │    JWT Auth     │
                    │   (Database)    │     │   (AI & NLP)    │     │ (Owner/Cashier) │
                    └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan Pemilihan |
|---|---|---|
| **Mobile** | React Native + Expo | Multiplatform (Android & iOS) dengan satu codebase |
| **Backend** | Node.js + Express | Arsitektur RESTful yang cepat, modular, dan ringan |
| **Database** | PostgreSQL | Relasional, integritas referensial kuat, dan transaksi ACID |
| **AI / NLP** | Google Gemini API (`@google/genai`) | Model canggih untuk structured JSON parsing & business insight |
| **Autentikasi** | JSON Web Token (JWT) + `bcryptjs` | Stateless auth dengan pembagian peran (Owner vs Cashier) |

---

## 📂 Struktur Direktori Proyek

```text
warungai/
├── backend/
│   ├── migrations/
│   │   ├── 001_init_schema.sql    # DDL skema database PostgreSQL
│   │   └── migrate.js             # Skrip eksekusi migrasi otomatis
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Konfigurasi connection pool pg
│   │   │   └── env.js             # Validasi variabel environment
│   │   ├── middleware/
│   │   │   ├── auth.js            # Verifikasi Bearer token JWT
│   │   │   └── roleCheck.js       # Kontrol akses Owner vs Kasir
│   │   ├── routes/
│   │   │   ├── auth.js            # Register, Login, & Invite Kasir
│   │   │   ├── products.js        # CRUD katalog produk toko
│   │   │   ├── restock.js         # Pencatatan stok masuk & modal batch
│   │   │   ├── transactions.js    # Transaksi kasir & snapshot modal
│   │   │   ├── reports.js         # Laporan harian, mingguan, & produk
│   │   │   ├── alerts.js          # Notifikasi stok menipis
│   │   │   └── ai.js              # Endpoint voice-to-JSON & insight
│   │   ├── services/
│   │   │   ├── aiService.js       # Abstraksi Gemini API + regex fallback
│   │   │   └── alertService.js    # Logika deteksi stok kritis
│   │   └── index.js               # Entry point Express server
│   ├── .env.example
│   └── package.json
│
└── mobile/
    ├── src/
    │   ├── components/
    │   │   ├── CartItem.js        # Komponen item keranjang belanja
    │   │   ├── StockAlert.js      # Banner notifikasi stok kritis
    │   │   └── VoiceInput.js      # Input transaksi berbasis suara AI
    │   ├── context/
    │   │   └── AuthContext.js     # Global state autentikasi & session
    │   ├── navigation/
    │   │   └── AppNavigator.js    # Navigasi tab & stack berdasarkan peran
    │   ├── screens/
    │   │   ├── AlertsScreen.js     # Layar daftar notifikasi stok
    │   │   ├── HomeScreen.js       # Beranda rangkuman omzet & saran AI
    │   │   ├── LoginScreen.js      # Layar masuk & daftar warung
    │   │   ├── ProductsScreen.js   # Katalog produk & modal tambah barang
    │   │   ├── ReportsScreen.js    # Grafik tren penjualan & produk terlaris
    │   │   ├── RestockScreen.js    # Formulir kulakan barang & modal
    │   │   └── TransactionScreen.js# Layar kasir belanjaan
    │   └── services/
    │       ├── api.js             # Axios client & request interceptor
    │       └── storage.js         # AsyncStorage helper untuk JWT token
    ├── App.js
    ├── app.json
    └── package.json
```

---

## 🗄️ Skema Database (PostgreSQL)

* **`stores`**: Data toko warung (`id`, `name`, `owner_id`, `created_at`).
* **`users`**: Akun pengguna dengan peran `owner` atau `cashier` (`store_id`, `phone`, `password_hash`, `role`).
* **`products`**: Katalog barang dagangan (`store_id`, `name`, `selling_price`, `stock`, `min_stock`).
* **`restock_logs`**: Riwayat kulakan barang masuk beserta harga modalnya (`product_id`, `quantity_added`, `modal_price`).
* **`transactions`**: Header transaksi penjualan (`store_id`, `cashier_id`, `created_at`).
* **`transaction_items`**: Rincian transaksi dengan penguncian modal saat itu (`transaction_id`, `product_id`, `quantity`, `price_at_sale`, `modal_at_sale`).
* **`stock_alerts`**: Peringatan stok di bawah batas aman (`product_id`, `triggered_at`, `is_read`).

---

## 🚀 Panduan Menjalankan Proyek

### 1. Menjalankan Backend API

1. Masuk ke direktori backend:
   ```bash
   cd backend
   npm install
   ```

2. Buat file konfigurasi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi konfigurasi database dan kredensial Gemini API:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/warungai
   JWT_SECRET=rahasia_jwt_anda
   GEMINI_API_KEY=api_key_google_gemini
   ```

3. Jalankan migrasi tabel database:
   ```bash
   npm run migrate
   ```

4. Jalankan backend server:
   ```bash
   npm run dev
   # API siap melayani di http://localhost:3000/api
   ```

---

### 2. Menjalankan Aplikasi Mobile

1. Masuk ke direktori mobile:
   ```bash
   cd ../mobile
   npm install
   ```

2. Konfigurasi alamat server backend di `src/services/api.js`:
   * Untuk **Android Emulator**: gunakan `http://10.0.2.2:3000/api`
   * Untuk **Perangkat Fisik (HP)**: gunakan IP lokal komputer Anda (contoh: `http://192.168.1.10:3000/api`)

3. Jalankan server Expo:
   ```bash
   npx expo start
   ```
   Pindai QR code yang tampil di terminal menggunakan aplikasi **Expo Go** pada ponsel Android atau iOS Anda.

---

## 🛡️ Aturan Keamanan & Transaksi Data

* **Pessimistic Row Locking (`FOR UPDATE`)**: Mencegah stok menjadi minus jika ada transaksi simultan pada detik yang sama.
* **Isolasi Multi-Tenant**: Setiap query database selalu divalidasi terhadap `store_id` yang diekstrak langsung dari token JWT terverifikasi.
* **Pembatasan Hak Akses (RBAC)**: Kasir hanya dapat mencatat transaksi, sedangkan laporan omzet, laporan keuntungan, dan riwayat modal hanya dapat diakses oleh Pemilik Warung (*Owner*).