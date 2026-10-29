/* Add this file to the frontend and load it with <script src="frontend-integration.js"></script>.
   Set API_BASE to your deployed backend URL before publishing. */
const RHODANIKKY_API_BASE = 'https://onrender.com';
const RHODANIKKY_WHATSAPP = '2348064797147';
const RhodanikkyAPI = {
  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('rhodanikky_token');
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${RHODANIKKY_API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  async products(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  },
  async register(name, email, password) {
    const data = await this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    localStorage.setItem('rhodanikky_token', data.token); return data.user;
  },
  async login(email, password) {
    const data = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('rhodanikky_token', data.token); return data.user;
  },
  logout() { localStorage.removeItem('rhodanikky_token'); },
  // cartItems format: [{ productId: product._id, quantity: 2 }]
  async placeOrder(form, cartItems) {
    const data = await this.request('/orders', { method: 'POST', body: JSON.stringify({ ...form, items: cartItems }) });
    // Opens WhatsApp with itemised order details; the customer must tap Send in WhatsApp.
    window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
    return data.order;
  },
  // Admin only: FormData fields name, description, category, price, stock, featured and repeated files named "images".
  async addProduct(formData) {
    return this.request('/products', { method: 'POST', body: formData });
  },
  async updateProduct(id, formData) {
    return this.request(`/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: formData });
  },
  async adminOrders(status = '') {
    return this.request(`/orders/admin/all${status ? `?status=${encodeURIComponent(status)}` : ''}`);
  },
  async updateOrderStatus(id, status, note = '') {
    return this.request(`/orders/admin/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) });
  },
  async updatePaymentStatus(id, paymentStatus, transferReference = '') {
    return this.request(`/orders/admin/${encodeURIComponent(id)}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentStatus, transferReference }) });
  }
};
