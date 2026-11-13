const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { parseVoiceToItems, generateBusinessInsight } = require('../services/aiService');

const router = express.Router();
router.use(authMiddleware);

// POST /ai/parse-voice
// Body: { "text": "indomie tiga aqua dua teh botol satu" }
// Response: { items: [ { product_name: "indomie", quantity: 3 }, ... ] }
router.post('/parse-voice', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text string is required' });
  }

  try {
    const items = await parseVoiceToItems(text);
    return res.json({ items });
  } catch (error) {
    console.error('AI parse voice error:', error);
    return res.status(500).json({ error: 'Failed to parse voice input' });
  }
});

// POST /ai/insight
// Body: {} (sistem ambil data toko otomatis dari token)
// Response: { insight, recommendations }
router.post('/insight', async (req, res) => {
  try {
    // 1. Ambil rangkuman penjualan 7 hari terakhir
    const salesSummary = await db.query(
      `SELECT
        p.name,
        SUM(ti.quantity)::INTEGER as qty_sold,
        SUM(ti.price_at_sale * ti.quantity) as revenue
       FROM transactions t
       JOIN transaction_items ti ON t.id = ti.transaction_id
       JOIN products p ON ti.product_id = p.id
       WHERE t.store_id = $1 AND t.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY p.name
       ORDER BY qty_sold DESC
       LIMIT 10`,
      [req.user.store_id]
    );

    // 2. Ambil produk yang stoknya menipis
    const lowStock = await db.query(
      `SELECT name, stock, min_stock
       FROM products
       WHERE store_id = $1 AND stock <= min_stock`,
      [req.user.store_id]
    );

    const storeData = {
      top_sold_7_days: salesSummary.rows,
      low_stock_products: lowStock.rows
    };

    const aiResult = await generateBusinessInsight(storeData);
    return res.json(aiResult);
  } catch (error) {
    console.error('AI insight error:', error);
    return res.status(500).json({ error: 'Failed to generate insight' });
  }
});

module.exports = router;

