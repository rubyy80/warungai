const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(authMiddleware);

// GET /products
// Response: [ { id, name, selling_price, stock, min_stock } ]
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, selling_price, stock, min_stock, created_at
       FROM products
       WHERE store_id = $1
       ORDER BY name ASC`,
      [req.user.store_id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /products (Owner only)
// Body: { name, selling_price, stock, min_stock }
// Response: { product }
router.post('/', roleCheck(['owner']), async (req, res) => {
  const { name, selling_price, stock = 0, min_stock = 5 } = req.body;

  if (!name || selling_price === undefined) {
    return res.status(400).json({ error: 'Product name and selling_price are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO products (store_id, name, selling_price, stock, min_stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, selling_price, stock, min_stock, created_at`,
      [req.user.store_id, name.trim().toLowerCase(), selling_price, stock, min_stock]
    );

    return res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /products/:id (Owner only)
// Body: { name?, selling_price?, min_stock? }
// Response: { product }
router.put('/:id', roleCheck(['owner']), async (req, res) => {
  const { id } = req.params;
  const { name, selling_price, min_stock } = req.body;

  try {
    // Check product ownership
    const prodCheck = await db.query(
      'SELECT id, name, selling_price, min_stock FROM products WHERE id = $1 AND store_id = $2',
      [id, req.user.store_id]
    );

    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const current = prodCheck.rows[0];
    const updatedName = name !== undefined ? name.trim().toLowerCase() : current.name;
    const updatedPrice = selling_price !== undefined ? selling_price : current.selling_price;
    const updatedMinStock = min_stock !== undefined ? min_stock : current.min_stock;

    const result = await db.query(
      `UPDATE products
       SET name = $1, selling_price = $2, min_stock = $3
       WHERE id = $4 AND store_id = $5
       RETURNING id, name, selling_price, stock, min_stock, created_at`,
      [updatedName, updatedPrice, updatedMinStock, id, req.user.store_id]
    );

    return res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /products/:id (Owner only)
// Response: { message }
router.delete('/:id', roleCheck(['owner']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id',
      [id, req.user.store_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product. Ensure it has no dependent transaction history.' });
  }
});

module.exports = router;

