/* Add this file to the frontend and load it with <script src="frontend-integration.js"></script>
   Set API_BASE to your deployed backend URL before publishing. */
const RHODANIKKY_API_BASE = 'https://onrender.com';
const RHODANIKKY_WHATSAPP = '2348064797147';

const RhodanikkyAPI = {
  async request(path, options = {}) {
    const headers = { ...options.headers || {} };
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('rhodanikky_token');
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${RHODANIKKY_API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  // Auth Operations
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) localStorage.setItem('rhodanikky_token', data.token);
    return data;
  },

  async register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  // Product Inventory Operations
  async getProducts(category = '') {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/products${query}`);
  },

  async getProductDetails(id) {
    return this.request(`/products/${id}`);
  },

  // Order Handling & Pipeline
  async createOrder(items, totalAmount) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ items, totalAmount })
    });
  },

  // WhatsApp Checkout String Formatter
  buildWhatsAppLink(items, subtotal) {
    let message = `Hello Rhodanikky Boutique! 💗\nI'd like to place an order:\n\n`;
    items.forEach(item => {
      message += `• ${item.name} (${item.category}) - Qty: ${item.quantity || 1} @ ₦${item.price.toLocaleString()}\n`;
    });
    message += `\n🛍 Subtotal: ₦${subtotal.toLocaleString()}\n`;
    message += `📍 Please confirm stock availability and delivery options! ✨`;
    
    return `https://wa.me{RHODANIKKY_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }
};
