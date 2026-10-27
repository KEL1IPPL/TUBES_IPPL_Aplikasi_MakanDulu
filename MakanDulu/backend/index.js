const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/autentikasiperan');

if (!process.env.JWT_SECRET) {
    throw new Error('Konfigurasi JWT_SECRET belum diatur pada file .env.');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:3000'
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

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
