-- Schema Migrations for WarungAI
-- Matches Blueprint Lapisan 4

-- Stores (Toko)
CREATE TABLE IF NOT EXISTS stores (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  owner_id    INTEGER,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Users (Owner & Kasir)
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  store_id       INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  phone          VARCHAR(20) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  role           VARCHAR(20) DEFAULT 'cashier', -- 'owner' | 'cashier'
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Foreign key back-reference for stores.owner_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_stores_owner'
  ) THEN
    ALTER TABLE stores ADD CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  store_id       INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  selling_price  NUMERIC(10,2) NOT NULL,
  stock          INTEGER DEFAULT 0,
  min_stock      INTEGER DEFAULT 5,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Restock Logs (Modal dicatat per restock, bukan di master produk)
CREATE TABLE IF NOT EXISTS restock_logs (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_added  INTEGER NOT NULL,
  modal_price     NUMERIC(10,2) NOT NULL,
  restocked_at    TIMESTAMP DEFAULT NOW()
);

-- Header Transaksi
CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  store_id    INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  cashier_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Item per Transaksi (Menyimpan snapshot modal_at_sale untuk kalkulasi profit akurat)
CREATE TABLE IF NOT EXISTS transaction_items (
  id              SERIAL PRIMARY KEY,
  transaction_id  INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL,
  price_at_sale   NUMERIC(10,2) NOT NULL,
  modal_at_sale   NUMERIC(10,2) NOT NULL
);

-- Alert Stok Menipis
CREATE TABLE IF NOT EXISTS stock_alerts (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  triggered_at  TIMESTAMP DEFAULT NOW(),
  is_read       BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_date ON transactions(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_prod ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_logs_prod ON restock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_prod ON stock_alerts(product_id, is_read);

