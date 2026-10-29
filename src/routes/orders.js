const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const STATUSES = ['pending','confirmed','processing','ready_for_pickup','picked_up','dispatched','delivered','cancelled'];
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerPhone, customerEmail = '', items, deliveryMethod = 'pickup', deliveryAddress = '', notes = '', paymentMethod = 'bank_transfer', deliveryFee = 0 } = req.body;
    if (!customerName || !customerPhone || !Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Customer name, phone number, and at least one cart item are required.' });
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) return res.status(400).json({ message: 'Enter a delivery address.' });
    const ids = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids }, active: true });
    const productMap = new Map(products.map(p => [String(p._id), p]));
    const safeItems = [];
    for (const item of items) {
      const p = productMap.get(String(item.productId)); const quantity = Number(item.quantity);
      if (!p || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ message: 'One or more cart items are invalid. Refresh the shop and try again.' });
      if (p.stock > 0 && quantity > p.stock) return res.status(409).json({ message: `${p.name} has only ${p.stock} left in stock.` });
      safeItems.push({ product: p._id, name: p.name, image: p.images[0]?.url || '', unitPrice: p.price, quantity, lineTotal: p.price * quantity });
    }
    const subtotal = safeItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const fee = Math.max(0, Number(deliveryFee) || 0);
    const order = await Order.create({ customer: req.user?._id, customerName, customerPhone, customerEmail, items: safeItems, subtotal, deliveryFee: fee, total: subtotal + fee, deliveryMethod, deliveryAddress, notes, paymentMethod, statusHistory: [{ status: 'pending', note: 'Order received' }] });
    res.status(201).json({ order, whatsappUrl: buildWhatsAppUrl(order) });
  } catch (e) { next(e); }
});
function buildWhatsAppUrl(order) {
  const number = (process.env.WHATSAPP_NUMBER || '2348064797147').replace(/\D/g, '');
  const lines = [`Hello RHODANIKKY BOUTIQUE AND ACCESSORIES, I want to confirm order ${order.orderNumber}.`, `Customer: ${order.customerName}`, `Phone: ${order.customerPhone}`, ...order.items.map(i => `• ${i.name} x${i.quantity} — ₦${i.lineTotal.toLocaleString('en-NG')}`), `Subtotal: ₦${order.subtotal.toLocaleString('en-NG')}`, `Delivery/pickup: ${order.deliveryMethod}`, ...(order.deliveryAddress ? [`Address: ${order.deliveryAddress}`] : []), `TOTAL: ₦${order.total.toLocaleString('en-NG')}`, `Payment: ${order.paymentMethod.replaceAll('_', ' ')}`, ...(order.notes ? [`Notes: ${order.notes}`] : []), 'Please confirm availability and payment/delivery details.'];
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}
router.get('/mine', protect, async (req, res, next) => { try { const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }); res.json({ orders }); } catch (e) { next(e); } });
router.get('/admin/all', protect, adminOnly, async (req, res, next) => { try { const filter = {}; if (req.query.status) filter.status = req.query.status; const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300); res.json({ orders }); } catch (e) { next(e); } });
router.patch('/admin/:id/status', protect, adminOnly, async (req, res, next) => {
  try { const { status, note = '' } = req.body; if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid order status.', allowed: STATUSES }); const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: 'Order not found.' }); order.status = status; order.statusHistory.push({ status, note: String(note).slice(0, 500) }); await order.save(); res.json({ order }); } catch (e) { next(e); }
});
router.patch('/admin/:id/payment', protect, adminOnly, async (req, res, next) => {
  try { const allowed = ['unpaid','proof_submitted','paid','refunded']; if (!allowed.includes(req.body.paymentStatus)) return res.status(400).json({ message: 'Invalid payment status.' }); const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus, ...(req.body.transferReference ? { transferReference: String(req.body.transferReference).slice(0, 150) } : {}) }, { new: true, runValidators: true }); if (!order) return res.status(404).json({ message: 'Order not found.' }); res.json({ order }); } catch (e) { next(e); }
});
module.exports = router;
