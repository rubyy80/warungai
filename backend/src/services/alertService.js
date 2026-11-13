const db = require('../config/database');

async function checkAndTriggerStockAlert(client, productId) {
  // Query product stock & min_stock
  const res = await client.query(
    'SELECT id, name, stock, min_stock FROM products WHERE id = $1',
    [productId]
  );

  if (res.rows.length === 0) return null;

  const product = res.rows[0];

  if (product.stock <= product.min_stock) {
    // Check if an unread alert already exists to prevent duplicate spam
    const existing = await client.query(
      'SELECT id FROM stock_alerts WHERE product_id = $1 AND is_read = FALSE',
      [productId]
    );

    if (existing.rows.length === 0) {
      const alert = await client.query(
        `INSERT INTO stock_alerts (product_id)
         VALUES ($1)
         RETURNING id, product_id, triggered_at, is_read`,
        [productId]
      );
      return alert.rows[0];
    }
  }

  return null;
}

module.exports = {
  checkAndTriggerStockAlert
};

