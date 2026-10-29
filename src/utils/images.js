const cloudinary = require('../config/cloudinary');
function uploadBuffer(buffer, folder = 'rhodanikky/products') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}
module.exports = { uploadBuffer };
