const db = require('../config/db');
const dataMocks = require('../data/data-mocks');

async function importDataMocks() {
    try {
        for (const menu of dataMocks) {
            const sql = `
                INSERT INTO Menu
                (namaMenu, harga, kategori, deskripsi)
                VALUES (?, ?, ?, ?)
            `;

            const values = [
                menu.namaMenu,
                menu.harga,
                menu.kategori,
                menu.deskripsi
            ];

            await db.query(sql, values);
        }

        console.log('Data mock berhasil dimasukkan ke database!');
    } catch (error) {
        console.error('Gagal memasukkan data mock:', error);
    } finally {
        await db.end();
    }
}

importDataMocks();