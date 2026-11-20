const express = require('express');
const multer = require('multer');

const router = express.Router();

const { readDocument } =
    require('../controllers/pembaca_foto_controller');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(new Error('Format gambar tidak didukung'));
        }

        cb(null, true);
    }
});

router.post('/read', upload.single('document'), readDocument);

module.exports = router;