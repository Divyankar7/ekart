const express = require('express');
const cors = require('cors');
const app = express();

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------
app.use(cors({
  origin: [
    'https://ekart-zwoj.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const userRoutes      = require('./routes/userRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const productRoutes   = require('./routes/productRoutes');
const authRoutes      = require('./routes/authRoutes');
const orderRoutes     = require('./routes/orderRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/orders',    orderRoutes);

// ---------------------------------------------------------------------------
// 404 handler — catch unmatched routes
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({ success: false, message });
});

module.exports = app;
