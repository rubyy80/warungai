const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(authMiddleware);

// POST /restock (Owner only)
// Body: { product_id, quantity_added, modal_price }
// Response: { message, new_stock, restock_log }
router.post('/', roleCheck(['owner']), async (req, res) => {
  const { product_id, quantity_added, modal_price } = req.body;

  if (!product_id || !quantity_added || modal_price === undefined) {
    return res.status(400).json({ error: 'product_id, quantity_added, and modal_price are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify product belongs to store
    const prodRes = await client.query(
      'SELECT id, stock FROM products WHERE id = $1 AND store_id = $2 FOR UPDATE',
      [product_id, req.user.store_id]
    );

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    // 1. Insert restock log
    const logRes = await client.query(
      `INSERT INTO restock_logs (product_id, quantity_added, modal_price)
       VALUES ($1, $2, $3)
       RETURNING id, product_id, quantity_added, modal_price, restocked_at`,
      [product_id, quantity_added, modal_price]
    );

    // 2. Update product stock
    const updateRes = await client.query(
      `UPDATE products
       SET stock = stock + $1
       WHERE id = $2
       RETURNING stock`,
      [quantity_added, product_id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Restock recorded successfully',
      new_stock: updateRes.rows[0].stock,
      restock_log: logRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Restock error:', error);
    return res.status(500).json({ error: 'Failed to process restock' });
  } finally {
    client.release();
  }
});

// GET /restock/:product_id
// Response: [ { quantity_added, modal_price, restocked_at } ]
router.get('/:product_id', async (req, res) => {
  const { product_id } = req.params;

  try {
    // Check product ownership
    const prodCheck = await db.query(
      'SELECT id FROM products WHERE id = $1 AND store_id = $2',
      [product_id, req.user.store_id]
    );

    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const logs = await db.query(
      `SELECT id, quantity_added, modal_price, restocked_at
       FROM restock_logs
       WHERE product_id = $1
       ORDER BY restocked_at DESC`,
      [product_id]
    );

    return res.json(logs.rows);
  } catch (error) {
    console.error('Fetch restock logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch restock logs' });
  }
});

module.exports = router;

