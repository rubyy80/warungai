const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { checkAndTriggerStockAlert } = require('../services/alertService');

const router = express.Router();
router.use(authMiddleware);

// POST /transactions
// Body: { "items": [ { "product_id": 1, "quantity": 3 }, ... ] }
// Response: { transaction_id, total_revenue, total_profit, items: [...] }
router.post('/', async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and cannot be empty' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Transaction Header
    const txRes = await client.query(
      `INSERT INTO transactions (store_id, cashier_id)
       VALUES ($1, $2)
       RETURNING id, store_id, cashier_id, created_at`,
      [req.user.store_id, req.user.id]
    );
    const transactionId = txRes.rows[0].id;

    let totalRevenue = 0;
    let totalProfit = 0;
    const itemSummaries = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        throw new Error(`Invalid item payload for product_id: ${product_id}`);
      }

      // Lock product row to prevent race conditions on stock
      const prodRes = await client.query(
        'SELECT id, name, selling_price, stock FROM products WHERE id = $1 AND store_id = $2 FOR UPDATE',
        [product_id, req.user.store_id]
      );

      if (prodRes.rows.length === 0) {
        throw new Error(`Product ${product_id} not found in this store`);
      }

      const product = prodRes.rows[0];

      // Ambil modal terkini dari restock_logs terbaru, fallback ke 0 jika belum ada log restock
      const modalRes = await client.query(
        `SELECT modal_price FROM restock_logs
         WHERE product_id = $1
         ORDER BY restocked_at DESC LIMIT 1`,
        [product_id]
      );
      const modalAtSale = modalRes.rows.length > 0 ? parseFloat(modalRes.rows[0].modal_price) : 0;
      const priceAtSale = parseFloat(product.selling_price);

      // Kurangi stok produk
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [quantity, product_id]
      );

      // Simpan transaction_item dengan snapshot modal_at_sale
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_sale, modal_at_sale)
         VALUES ($1, $2, $3, $4, $5)`,
        [transactionId, product_id, quantity, priceAtSale, modalAtSale]
      );

      // Cek apakah stok menipis untuk trigger alert
      await checkAndTriggerStockAlert(client, product_id);

      const subtotal = priceAtSale * quantity;
      const profit = (priceAtSale - modalAtSale) * quantity;

      totalRevenue += subtotal;
      totalProfit += profit;

      itemSummaries.push({
        name: product.name,
        qty: quantity,
        subtotal,
        profit
      });
    }

    await client.query('COMMIT');

    return res.status(201).json({
      transaction_id: transactionId,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      items: itemSummaries
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction creation error:', error);
    return res.status(400).json({ error: error.message || 'Transaction processing failed' });
  } finally {
    client.release();
  }
});

// GET /transactions
// Query: ?date=2024-01-15&limit=20&offset=0
// Response: [ { id, total_revenue, total_profit, created_at, cashier } ]
router.get('/', async (req, res) => {
  const { date, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT
        t.id,
        t.created_at,
        u.name as cashier,
        COALESCE(SUM(ti.price_at_sale * ti.quantity), 0) AS total_revenue,
        COALESCE(SUM((ti.price_at_sale - ti.modal_at_sale) * ti.quantity), 0) AS total_profit
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE t.store_id = $1
    `;

    const params = [req.user.store_id];

    if (date) {
      params.push(date);
      query += ` AND DATE(t.created_at) = $${params.length}`;
    }

    query += `
      GROUP BY t.id, t.created_at, u.name
      ORDER BY t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await db.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Fetch transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /transactions/:id
// Response: { transaction + items detail }
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const txRes = await db.query(
      `SELECT t.id, t.created_at, u.name as cashier
       FROM transactions t
       LEFT JOIN users u ON t.cashier_id = u.id
       WHERE t.id = $1 AND t.store_id = $2`,
      [id, req.user.store_id]
    );

    if (txRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = txRes.rows[0];

    const itemsRes = await db.query(
      `SELECT
        ti.id,
        p.name,
        ti.quantity,
        ti.price_at_sale,
        ti.modal_at_sale,
        (ti.price_at_sale * ti.quantity) AS subtotal,
        ((ti.price_at_sale - ti.modal_at_sale) * ti.quantity) AS profit
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = $1`,
      [id]
    );

    let totalRevenue = 0;
    let totalProfit = 0;

    itemsRes.rows.forEach(item => {
      totalRevenue += parseFloat(item.subtotal);
      totalProfit += parseFloat(item.profit);
    });

    return res.json({
      transaction: {
        id: tx.id,
        cashier: tx.cashier,
        created_at: tx.created_at,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        items: itemsRes.rows
      }
    });
  } catch (error) {
    console.error('Fetch transaction detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

module.exports = router;

