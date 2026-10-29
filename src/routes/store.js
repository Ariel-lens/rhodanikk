const router = require('express').Router();
router.get('/config', (_req, res) => res.json({ storeName: 'RHODANIKKY BOUTIQUE AND ACCESSORIES', currency: 'NGN', whatsappNumber: (process.env.WHATSAPP_NUMBER || '2348064797147').replace(/\D/g, ''), bankTransfer: { bankName: process.env.BANK_NAME || '', accountName: process.env.BANK_ACCOUNT_NAME || '', accountNumber: process.env.BANK_ACCOUNT_NUMBER || '' } }));
module.exports = router;
