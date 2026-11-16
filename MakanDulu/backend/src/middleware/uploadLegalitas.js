const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const uploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'legalitas');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${file.fieldname}-${crypto.randomBytes(16).toString('hex')}${extension}`);
  },
});

const uploadLegalitas = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 3,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Berkas legalitas harus berupa file gambar.'));
    }
    callback(null, true);
  },
});

module.exports = { uploadLegalitas };
