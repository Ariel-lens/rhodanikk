const multer = require('multer');
const storage = multer.memoryStorage();
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024, files: 30 }, fileFilter: (_req, file, cb) => {
  if (!allowed.has(file.mimetype)) return cb(new Error('Only JPG, PNG, WEBP, and AVIF image files are accepted.'));
  cb(null, true);
}});
module.exports = upload;
