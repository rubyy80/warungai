const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// POST /auth/register
// Body: { name, phone, password, store_name }
// Response: { token, user, store }
router.post('/register', async (req, res) => {
  const { name, phone, password, store_name } = req.body;

  if (!name || !phone || !password || !store_name) {
    return res.status(400).json({ error: 'All fields (name, phone, password, store_name) are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Check if phone already registered
    const userCheck = await client.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create Store first
    const storeRes = await client.query(
      'INSERT INTO stores (name) VALUES ($1) RETURNING id, name, created_at',
      [store_name]
    );
    const store = storeRes.rows[0];

    // 2. Create User as owner
    const userRes = await client.query(
      `INSERT INTO users (store_id, name, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'owner')
       RETURNING id, store_id, name, phone, role, created_at`,
      [store.id, name, phone, passwordHash]
    );
    const user = userRes.rows[0];

    // 3. Update store with owner_id
    await client.query('UPDATE stores SET owner_id = $1 WHERE id = $2', [user.id, store.id]);

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, store_id: user.store_id },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({ token, user, store });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

// POST /auth/login
// Body: { phone, password }
// Response: { token, user }
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  try {
    const userRes = await db.query(
      'SELECT id, store_id, name, phone, password_hash, role, created_at FROM users WHERE phone = $1',
      [phone]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, store_id: user.store_id },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    delete user.password_hash;
    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/invite (Owner only)
// Body: { name, phone, role }
// Response: { message, invited_user }
router.post('/invite', authMiddleware, roleCheck(['owner']), async (req, res) => {
  const { name, phone, role = 'cashier', password = 'password123' } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    const userCheck = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (store_id, name, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, store_id, name, phone, role, created_at`,
      [req.user.store_id, name, phone, passwordHash, role]
    );

    return res.status(201).json({
      message: 'User invited successfully',
      invited_user: result.rows[0]
    });
  } catch (error) {
    console.error('Invite error:', error);
    return res.status(500).json({ error: 'Failed to invite user' });
  }
});

module.exports = router;

