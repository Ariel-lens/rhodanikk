require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean), credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'RHODANIKKY BOUTIQUE AND ACCESSORIES API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/store', require('./routes/store'));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format.' });
  if (err.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 8 MB or smaller.' : err.message });
  if (err.message?.includes('image files')) return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Server error. Please try again.' });
});
const port = Number(process.env.PORT || 5000);
async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD in .env first.');
  await mongoose.connect(process.env.MONGODB_URI);
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email }).select('+passwordHash');
  if (!existing) await User.create({ name: 'Store Admin', email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' });
  else if (existing.role !== 'admin') { existing.role = 'admin'; await existing.save(); }
  app.listen(port, () => console.log(`RHODANIKKY API running on port ${port}`));
}
start().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
