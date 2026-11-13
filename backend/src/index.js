const express = require('express');
const cors = require('cors');
const env = require('./config/env');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const restockRoutes = require('./routes/restock');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const alertRoutes = require('./routes/alerts');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(cors());
app.use(express.json());

// Base health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/restock', restockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`WarungAI backend listening on port ${env.PORT}`);
});

