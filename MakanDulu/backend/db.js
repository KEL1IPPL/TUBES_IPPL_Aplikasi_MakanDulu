const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2');

dotenv.config({ path: path.join(__dirname, '.env') });

const requiredConfig = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
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
    ssl:{
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

module.exports = db;