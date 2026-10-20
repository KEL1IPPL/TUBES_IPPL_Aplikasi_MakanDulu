require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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

db.getConnection((err, connection) => {
    if (err){
        console.error('Ngga Connect Ke Database Bjir')
    } else{
        console.log('Berhasil Connect ke Database MySQL')
        connection.release();
    }
});

module.exports = db.promise();