# RHODANIKKY BOUTIQUE AND ACCESSORIES — Backend

Node.js + Express + MongoDB + Cloudinary backend designed for the white/pink boutique frontend. Store WhatsApp: **+234 806 479 7147** (international WhatsApp format `2348064797147`).

## Features
- Customer registration/login with hashed passwords and JWT sessions.
- Admin-only product create/update/hide endpoints.
- Upload up to 30 images per product request, 8 MB per image; upload more images in later edits. Images are stored in Cloudinary, not browser storage.
- Product listing/search/category filters and pagination.
- Server-calculated order prices (never trusts prices sent by the browser).
- WhatsApp order summary opens with product names, quantities, totals, customer contact, pickup/delivery choice and notes.
- Order status tracking: pending → confirmed → processing → ready_for_pickup → picked_up, or dispatched → delivered. Admin can also cancel.
- Bank transfer payment status is recorded separately and must be marked paid by the shop after verifying the transfer in the bank account.

## 1. Requirements
Install Node.js 20+ and create accounts for MongoDB Atlas and Cloudinary. The app will not run fully until those credentials are supplied.

## 2. Configure
1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI`, a long random `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Set the Cloudinary credentials; these are required for image uploads.
4. Set `CLIENT_ORIGIN` to the actual frontend origin. During local testing, include the origin where your frontend is served (for example `http://localhost:5500`).
5. `WHATSAPP_NUMBER` is already set to `2348064797147`. Enter bank details only if you want the API to show them to customers.

Do not commit `.env` or expose Cloudinary API secrets in frontend JavaScript.

## 3. Run locally
```bash
npm install
npm run dev
```
Health check: `http://localhost:5000/api/health`.

## 4. API overview
- `GET /api/store/config` — public store and transfer instructions.
- `POST /api/auth/register` — customer account creation.
- `POST /api/auth/login` — sign in.
- `GET /api/products` — public catalogue; supports `q`, `category`, `featured=true`, `page`, `limit`.
- `GET /api/products/:id` — product details.
- `POST /api/products` — admin only; multipart/form-data; repeat `images` file field.
- `PATCH /api/products/:id` — admin only; can append images and set `removeImageIds` to a JSON array of Cloudinary public IDs.
- `DELETE /api/products/:id` — admin only; hides the product without deleting order history.
- `POST /api/orders` — creates an order using product IDs and quantities; response contains `whatsappUrl`.
- `GET /api/orders/mine` — signed-in customer's orders.
- `GET /api/orders/admin/all` — admin order dashboard data; optional `?status=pending`.
- `PATCH /api/orders/admin/:id/status` — admin updates fulfillment status.
- `PATCH /api/orders/admin/:id/payment` — admin marks payment `unpaid`, `proof_submitted`, `paid`, or `refunded`.

### Example create-order body
```json
{
  "customerName": "Customer Name",
  "customerPhone": "+2348012345678",
  "customerEmail": "customer@example.com",
  "deliveryMethod": "pickup",
  "paymentMethod": "bank_transfer",
  "items": [{ "productId": "PRODUCT_MONGODB_ID", "quantity": 2 }],
  "notes": "Please confirm before dispatch"
}
```
For delivery, use `"deliveryMethod":"delivery"` and provide `deliveryAddress`. Delivery fee can be supplied by the checkout, but for a production shop you should replace this with server-side delivery pricing.

## 5. Connect to the existing frontend
Copy `frontend-integration.js` next to the existing HTML. Change `RHODANIKKY_API_BASE` to the deployed API URL after hosting. The current frontend previously used browser-stored sample products and a placeholder WhatsApp number; to use this real backend, its product renderer, admin upload form, login form, and checkout must call the integration methods instead of local demo storage. The exact final wiring requires the frontend HTML file to be available in the same workspace; this package includes the adapter, but cannot silently patch an HTML file that was not provided here.

The integration checkout expects cart entries shaped like `[{ productId: product._id, quantity: 1 }]`, and form fields such as `customerName`, `customerPhone`, `deliveryMethod`, `deliveryAddress`, `paymentMethod`, and `notes`.

## Payment and delivery safety
WhatsApp checkout opens a prefilled message; the customer must press Send. This backend does not send WhatsApp messages by itself. Bank transfers must be verified manually in the bank account before marking an order paid. Status `picked_up` means customer collection; `dispatched` and `delivered` cover delivery orders. Do not ask customers to send bank PINs, OTPs, or passwords.
