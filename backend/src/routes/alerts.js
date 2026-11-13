const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /alerts
// Response: [ { id, product_name, current_stock, min_stock, triggered_at } ]
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        sa.id,
        p.name as product_name,
        p.stock as current_stock,
        p.min_stock,
        sa.triggered_at,
        sa.is_read
       FROM stock_alerts sa
       JOIN products p ON sa.product_id = p.id
       WHERE p.store_id = $1 AND sa.is_read = FALSE
       ORDER BY sa.triggered_at DESC`,
      [req.user.store_id]
    );

    return res.json(
      result.rows.map(row => ({
        id: row.id,
        product_name: row.product_name,
        current_stock: row.current_stock,
        min_stock: row.min_stock,
        triggered_at: row.triggered_at
      }))
    );
  } catch (error) {
    console.error('Fetch alerts error:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PATCH /alerts/:id/read
// Response: { message }
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.query(
      `SELECT sa.id
       FROM stock_alerts sa
       JOIN products p ON sa.product_id = p.id
       WHERE sa.id = $1 AND p.store_id = $2`,
      [id, req.user.store_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await db.query('UPDATE stock_alerts SET is_read = TRUE WHERE id = $1', [id]);

    return res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Update alert error:', error);
    return res.status(500).json({ error: 'Failed to update alert' });
  }
});

module.exports = router;

