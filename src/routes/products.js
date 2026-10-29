const router = require('express').Router();
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadBuffer } = require('../utils/images');
router.get('/', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.featured = true;
    if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '24', 10)));
    const [products, total] = await Promise.all([Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Product.countDocuments(filter)]);
    res.json({ products, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try { const p = await Product.findOne({ _id: req.params.id, active: true }); if (!p) return res.status(404).json({ message: 'Product not found.' }); res.json({ product: p }); } catch (e) { next(e); }
});
router.post('/', protect, adminOnly, upload.array('images', 30), async (req, res, next) => {
  try {
    const { name, description = '', category = 'Accessories', price, compareAtPrice, stock = 0, featured = false } = req.body;
    if (!name || price === undefined || !Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: 'A product name and valid non-negative price are required.' });
    if (!req.files?.length) return res.status(400).json({ message: 'Upload at least one product image.' });
    const images = await Promise.all(req.files.map(f => uploadBuffer(f.buffer)));
    const product = await Product.create({ name, description, category, price: Number(price), compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined, stock: Number(stock), featured: featured === 'true', images });
    res.status(201).json({ product });
  } catch (e) { next(e); }
});
router.patch('/:id', protect, adminOnly, upload.array('images', 30), async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id); if (!p) return res.status(404).json({ message: 'Product not found.' });
    for (const key of ['name', 'description', 'category']) if (req.body[key] !== undefined) p[key] = req.body[key];
    for (const key of ['price', 'compareAtPrice', 'stock']) if (req.body[key] !== undefined && req.body[key] !== '') p[key] = Number(req.body[key]);
    for (const key of ['active', 'featured']) if (req.body[key] !== undefined) p[key] = req.body[key] === 'true' || req.body[key] === true;
    if (req.files?.length) p.images.push(...await Promise.all(req.files.map(f => uploadBuffer(f.buffer))));
    if (req.body.removeImageIds) {
      const ids = JSON.parse(req.body.removeImageIds);
      for (const img of p.images.filter(i => ids.includes(i.publicId))) if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
      p.images = p.images.filter(i => !ids.includes(i.publicId));
    }
    await p.save(); res.json({ product: p });
  } catch (e) { next(e); }
});
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try { const p = await Product.findById(req.params.id); if (!p) return res.status(404).json({ message: 'Product not found.' }); p.active = false; await p.save(); res.json({ message: 'Product hidden from the shop.' }); } catch (e) { next(e); }
});
module.exports = router;
