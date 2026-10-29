const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', maxlength: 5000 },
  category: { type: String, default: 'Accessories', trim: true, maxlength: 100 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  images: [{ url: { type: String, required: true }, publicId: { type: String, default: '' } }],
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text', category: 'text' });
module.exports = mongoose.model('Product', productSchema);
