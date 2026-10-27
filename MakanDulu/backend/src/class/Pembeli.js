const db = require('../config/db');
const bcrypt = require('bcrypt');

class Pembeli {
    #idPembeli;
    #nama;
    #email;
    #password;
    #nomorTelepon;
    #alamat;

    constructor(idPembeli, nama, email, password, nomorTelepon, alamat) {
        this.#idPembeli = idPembeli;
        this.#nama = nama;
        this.#email = email;
        this.#password = password;
        this.#nomorTelepon = nomorTelepon;
        this.#alamat = alamat;
    }

    get idPembeli() { return this.#idPembeli; }
    get idRole() { return 'Pembeli'; }
    get nama() { return this.#nama; }
    get email() { return this.#email; }
    get password() { return this.#password; }
    get nomorTelepon() { return this.#nomorTelepon; }
    get alamat() { return this.#alamat; }

    async registrasi() {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [existingBuyer] = await connection.execute(
                `SELECT idPembeli
                 FROM Pembeli
                 WHERE email = ? OR nomorTelepon = ?
                 LIMIT 1`,
                [this.#email, this.#nomorTelepon]
            );

            if (existingBuyer.length > 0) {
                throw new Error('Email atau nomor telepon sudah terdaftar.');
            }

            const hashedPassword = await bcrypt.hash(this.#password, 10);
            const [buyerResult] = await connection.execute(
                `INSERT INTO Pembeli (email, password, nama, nomorTelepon, alamat)
                 VALUES (?, ?, ?, ?, ?)`,
                [this.#email, hashedPassword, this.#nama, this.#nomorTelepon, this.#alamat]
            );
            await connection.execute(
                `INSERT INTO Role (idPembeli, role)
                 VALUES (?, 'Pembeli')`,
                [buyerResult.insertId]
            );

            await connection.commit();
            this.#idPembeli = buyerResult.insertId;
            return this.#idPembeli;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async login(password = this.#password) {
        const [rows] = await db.execute(
            `SELECT *
             FROM Pembeli
             WHERE email = ?`,
            [this.#email]
        );

        if (rows.length === 0) {
            return false;
        }

        let passwordValid = await bcrypt.compare(password, rows[0].password);
        if (!passwordValid && rows[0].password === password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute(
                'UPDATE Pembeli SET password = ? WHERE idPembeli = ?',
                [hashedPassword, rows[0].idPembeli]
            );
            passwordValid = true;
        }

        if (!passwordValid) {
            return false;
        }

        return new Pembeli(
            rows[0].idPembeli,
            rows[0].nama,
            rows[0].email,
            null,
            rows[0].nomorTelepon,
            rows[0].alamat
        );
    }

    async buatPesanan(data) {
        if (!data || !data.idPenjual || !data.alamatPengantaran) {
            throw new Error('idPenjual dan alamat pengantaran wajib diisi.');
        }

        const [result] = await db.execute(
            `INSERT INTO Pesanan
             (idPembeli, idPenjual, idVoucher, kodeVoucher, alamatPengantaran, totalHarga, totalDiskon)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                this.#idPembeli,
                data.idPenjual,
                data.idVoucher || null,
                data.kodeVoucher || null,
                data.alamatPengantaran,
                data.totalHarga || 0,
                data.totalDiskon || 0
            ]
        );
        return result.insertId;
    }

    async pakaiVoucher(kodeVoucher, idPenjual) {
        const [rows] = await db.execute(
            `SELECT * FROM Voucher
             WHERE kodeVoucher = ? AND idPenjual = ?
             AND kuota > 0 AND tanggalBerakhir >= NOW()`,
            [kodeVoucher, idPenjual]
        );
        return rows[0] || false;
    }

    async konfirmasiPesanan(idPesanan) {
        const [result] = await db.execute(
            `UPDATE Pesanan
             SET statusPesanan = 'Pesanan Selesai'
             WHERE idPesanan = ? AND idPembeli = ?
             AND statusPesanan = 'Pesanan Diantar'`,
            [idPesanan, this.#idPembeli]
        );
        return result.affectedRows > 0;
    }

    async beriUlasan(idPesanan, rating, komentar, fotoUlasan = null) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('Rating harus berupa angka antara 1 sampai 5.');
        }

        const [result] = await db.execute(
            `INSERT INTO Ulasan (idPembeli, idPesanan, rating, komentar, fotoUlasan)
             SELECT ?, idPesanan, ?, ?, ?
             FROM Pesanan
             WHERE idPesanan = ? AND idPembeli = ? AND statusPesanan = 'Pesanan Selesai'`,
            [this.#idPembeli, rating, komentar || null, fotoUlasan, idPesanan, this.#idPembeli]
        );
        return result.insertId;
    }

    async resetPassword(newPassword) {
        if (!newPassword) {
            throw new Error('Password baru wajib diisi.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.execute(
            'UPDATE Pembeli SET password = ? WHERE idPembeli = ?',
            [hashedPassword, this.#idPembeli]
        );

        if (result.affectedRows === 0) {
            throw new Error('Pembeli tidak ditemukan.');
        }
        this.#password = newPassword;
        return true;
    }

    logout() {
        return true;
    }
}

module.exports = Pembeli;
