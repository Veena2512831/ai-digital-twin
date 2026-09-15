const express = require('express');
const cors = require('cors');
const db = require('./db');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Node.js Primary Backend API is running!' });
});

// Health check route connecting to PostgreSQL
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ status: 'error', message: 'Database connection failed', details: err.message });
  }
});

// API routes
app.use('/api', apiRoutes);

module.exports = app;