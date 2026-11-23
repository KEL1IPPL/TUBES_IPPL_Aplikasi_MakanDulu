const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2');

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
});

const requiredConfig = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingConfig = requiredConfig.filter((key) => !process.env[key]);

if (missingConfig.length > 0) {
    throw new Error(`Konfigurasi database belum lengkap: ${missingConfig.join(', ')}`);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

// Cegah unhandled error event jika koneksi idle diputus oleh cloud server (Aiven)
pool.on('error', (err) => {
    console.error('[db pool error]', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.warn('[db pool] Koneksi idle terputus dari server database. Pool akan membuat koneksi baru saat ada query berikutnya.');
    }
});

const db = pool.promise();

module.exports = db;