process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

process.on('exit', (code) => {
  console.log('PROSES BERHENTI DENGAN CODE:', code);
});


const express = require('express');
const cors = require('cors');
require('dotenv').config();
const menuRoutes       = require('./routes/pencarianMenu');
const katalogRoutes    = require('./routes/katalog_routes');
const authRoutes       = require('./routes/autentikasiperan');
const preferenceRoutes = require('./routes/halaman_preferensi_makanan');
const ocrRoutes        = require('./routes/pembaca_foto');       // ← OCR dokumen legalitas
const { verifikasiMailer } = require('./services/mailtrap');

if (!process.env.JWT_SECRET) {
    throw new Error('Konfigurasi JWT_SECRET belum diatur pada file .env.');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend MakanDulu berhasil berjalan!');
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend MakanDulu berhasil terhubung',
  });
});

app.use('/api/auth',                      authRoutes);
app.use('/api/menu',                      menuRoutes);
app.use('/api/katalog',                   katalogRoutes);
app.use('/api/halaman-preferensi-makanan', preferenceRoutes);

// Rute OCR dokumen legalitas penjual (KTP, NPWP, NIB)
app.use('/api/dokumen',    ocrRoutes);
app.use('/api/v1/dokumen', ocrRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

app.listen(PORT, async () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
  try {
    await verifikasiMailer();
  } catch (error) {
    console.error('[mailer] SMTP Gmail tidak siap:', {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response,
    });
  }
});

