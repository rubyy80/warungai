const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(authMiddleware);
// Laporan diutamakan untuk Owner
router.use(roleCheck(['owner']));

// GET /reports/daily?date=2024-01-15
// Response: { date, total_revenue, total_profit, total_transactions, top_products, busiest_hour }
router.get('/daily', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    // 1. Overall totals for the day
    const totalsRes = await db.query(
      `SELECT
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(ti.price_at_sale * ti.quantity), 0) as total_revenue,
        COALESCE(SUM((ti.price_at_sale - ti.modal_at_sale) * ti.quantity), 0) as total_profit
       FROM transactions t
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       WHERE t.store_id = $1 AND DATE(t.created_at) = $2`,
      [req.user.store_id, date]
    );

    const totals = totalsRes.rows[0];

    // 2. Top Products for the day
    const topProdRes = await db.query(
      `SELECT
        p.name,
        SUM(ti.quantity)::INTEGER as qty_sold,
        SUM(ti.price_at_sale * ti.quantity) as revenue,
        SUM((ti.price_at_sale - ti.modal_at_sale) * ti.quantity) as profit
       FROM transactions t
       JOIN transaction_items ti ON t.id = ti.transaction_id
       JOIN products p ON ti.product_id = p.id
       WHERE t.store_id = $1 AND DATE(t.created_at) = $2
       GROUP BY p.name
       ORDER BY qty_sold DESC
       LIMIT 5`,
      [req.user.store_id, date]
    );

    // 3. Busiest hour of the day
    const busyHourRes = await db.query(
      `SELECT
        EXTRACT(HOUR FROM t.created_at)::INTEGER as hour,
        COUNT(t.id) as count
       FROM transactions t
       WHERE t.store_id = $1 AND DATE(t.created_at) = $2
       GROUP BY hour
       ORDER BY count DESC
       LIMIT 1`,
      [req.user.store_id, date]
    );

    const busiestHour = busyHourRes.rows.length > 0 ? busyHourRes.rows[0].hour : null;

    return res.json({
      date,
      total_revenue: parseFloat(totals.total_revenue),
      total_profit: parseFloat(totals.total_profit),
      total_transactions: parseInt(totals.total_transactions, 10),
      top_products: topProdRes.rows.map(r => ({
        name: r.name,
        qty_sold: parseInt(r.qty_sold, 10),
        revenue: parseFloat(r.revenue),
        profit: parseFloat(r.profit)
      })),
      busiest_hour: busiestHour
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// GET /reports/weekly?start=2024-01-08
// Response: { days: [ { date, revenue, profit, transactions } ], total_revenue, total_profit }
router.get('/weekly', async (req, res) => {
  let startDate = req.query.start;
  if (!startDate) {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    startDate = d.toISOString().split('T')[0];
  }

  try {
    const dailyBreakdown = await db.query(
      `SELECT
        DATE(t.created_at)::TEXT as date,
        COUNT(DISTINCT t.id)::INTEGER as transactions,
        COALESCE(SUM(ti.price_at_sale * ti.quantity), 0) as revenue,
        COALESCE(SUM((ti.price_at_sale - ti.modal_at_sale) * ti.quantity), 0) as profit
       FROM transactions t
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       WHERE t.store_id = $1
         AND DATE(t.created_at) >= $2
         AND DATE(t.created_at) <= ($2::DATE + INTERVAL '6 days')
       GROUP BY DATE(t.created_at)
       ORDER BY date ASC`,
      [req.user.store_id, startDate]
    );

    let totalRevenue = 0;
    let totalProfit = 0;

    const days = dailyBreakdown.rows.map(row => {
      const rev = parseFloat(row.revenue);
      const prof = parseFloat(row.profit);
      totalRevenue += rev;
      totalProfit += prof;
      return {
        date: row.date,
        revenue: rev,
        profit: prof,
        transactions: row.transactions
      };
    });

    return res.json({
      days,
      total_revenue: totalRevenue,
      total_profit: totalProfit
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    return res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

// GET /reports/products
// Response: [ { name, total_sold, total_revenue, total_profit, avg_daily_sold } ]
router.get('/products', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        p.name,
        COALESCE(SUM(ti.quantity), 0)::INTEGER as total_sold,
        COALESCE(SUM(ti.price_at_sale * ti.quantity), 0) as total_revenue,
        COALESCE(SUM((ti.price_at_sale - ti.modal_at_sale) * ti.quantity), 0) as total_profit,
        ROUND(COALESCE(SUM(ti.quantity)::NUMERIC / GREATEST(COUNT(DISTINCT DATE(t.created_at)), 1), 0), 2) as avg_daily_sold
       FROM products p
       LEFT JOIN transaction_items ti ON p.id = ti.product_id
       LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.store_id = $1
       WHERE p.store_id = $1
       GROUP BY p.id, p.name
       ORDER BY total_sold DESC`,
      [req.user.store_id]
    );

    return res.json(
      result.rows.map(r => ({
        name: r.name,
        total_sold: parseInt(r.total_sold, 10),
        total_revenue: parseFloat(r.total_revenue),
        total_profit: parseFloat(r.total_profit),
        avg_daily_sold: parseFloat(r.avg_daily_sold)
      }))
    );
  } catch (error) {
    console.error('Product report error:', error);
    return res.status(500).json({ error: 'Failed to generate product report' });
  }
});

module.exports = router;

