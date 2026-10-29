const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, default: '', trim: true },
  deliveryMethod: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
  deliveryAddress: { type: String, default: '' },
  notes: { type: String, default: '' },
  items: { type: [itemSchema], validate: v => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['bank_transfer', 'pay_on_pickup', 'pay_on_delivery'], default: 'bank_transfer' },
  paymentStatus: { type: String, enum: ['unpaid', 'proof_submitted', 'paid', 'refunded'], default: 'unpaid' },
  transferReference: { type: String, default: '' },
  transferProofUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'dispatched', 'delivered', 'cancelled'], default: 'pending' },
  statusHistory: [{ status: String, note: String, changedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });
orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) this.orderNumber = `RNB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  next();
});
module.exports = mongoose.model('Order', orderSchema);
