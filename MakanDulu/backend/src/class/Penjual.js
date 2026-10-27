const db = require('../config/db');
const bcrypt = require('bcrypt');

const STATUS_PESANAN = [
    'Menunggu Konfirmasi Penjual',
    'Pesanan Diterima oleh Penjual',
    'Pesanan Disiapkan',
    'Pesanan Diantar',
    'Pesanan Selesai'
];

class Penjual {
    #idPenjual;
    #idRole;
    #namaPemilik;
    #email;
    #password;
    #namaToko;
    #nomorTelepon;
    #alamatToko;
    #NIB;
    #NPWP;
    #KTP;

    constructor(
        idPenjual,
        namaPemilik,
        email,
        password,
        namaToko,
        nomorTelepon,
        alamatToko,
        NIB,
        NPWP,
        KTP,
        idRole = 'Penjual'
    ) {
        this.#idPenjual = idPenjual;
        this.#idRole = idRole;
        this.#namaPemilik = namaPemilik;
        this.#email = email;
        this.#password = password;
        this.#namaToko = namaToko;
        this.#nomorTelepon = nomorTelepon;
        this.#alamatToko = alamatToko;
        this.#NIB = NIB;
        this.#NPWP = NPWP;
        this.#KTP = KTP;
    }

    get idPenjual() { return this.#idPenjual; }
    get idRole() { return this.#idRole; }
    get namaPemilik() { return this.#namaPemilik; }
    get email() { return this.#email; }
    get password() { return this.#password; }
    get namaToko() { return this.#namaToko; }
    get nomorTelepon() { return this.#nomorTelepon; }
    get alamatToko() { return this.#alamatToko; }
    get NIB() { return this.#NIB; }
    get NPWP() { return this.#NPWP; }
    get KTP() { return this.#KTP; }

    async registrasi() {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [existingUser] = await connection.execute(
                `SELECT idPenjual
                 FROM Penjual
                 WHERE email = ? OR nomorTelepon = ? OR NIB = ? OR NPWP = ? OR KTP = ?
                 LIMIT 1`,
                [this.#email, this.#nomorTelepon, this.#NIB, this.#NPWP, this.#KTP]
            );

            if (existingUser.length > 0) {
                throw new Error('Email, nomor telepon, NIB, NPWP, atau KTP sudah terdaftar.');
            }

            const hashedPassword = await bcrypt.hash(this.#password, 10);
            const [penjualResult] = await connection.execute(
                `INSERT INTO Penjual
                 (namaPemilik, email, password, namaToko, nomorTelepon, alamatToko, NIB, NPWP, KTP)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.#namaPemilik,
                    this.#email,
                    hashedPassword,
                    this.#namaToko,
                    this.#nomorTelepon,
                    this.#alamatToko,
                    this.#NIB,
                    this.#NPWP,
                    this.#KTP
                ]
            );
            await connection.execute(
                `INSERT INTO Role (idPenjual, role)
                 VALUES (?, 'Penjual')`,
                [penjualResult.insertId]
            );

            await connection.commit();
            this.#idPenjual = penjualResult.insertId;
            return this.#idPenjual;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async login(password = this.#password) {
        const [rows] = await db.execute(
            'SELECT * FROM Penjual WHERE email = ?',
            [this.#email]
        );

        if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password))) {
            return false;
        }

        return new Penjual(
            rows[0].idPenjual,
            rows[0].namaPemilik,
            rows[0].email,
            undefined,
            rows[0].namaToko,
            rows[0].nomorTelepon,
            rows[0].alamatToko,
            rows[0].NIB,
            rows[0].NPWP,
            rows[0].KTP,
            'Penjual'
        );
    }

    async resetPassword(newPassword) {
        if (!newPassword) {
            throw new Error('Password baru wajib diisi.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.execute(
            'UPDATE Penjual SET password = ? WHERE idPenjual = ?',
            [hashedPassword, this.#idPenjual]
        );

        if (result.affectedRows === 0) {
            throw new Error('Penjual tidak ditemukan.');
        }
        this.#password = newPassword;
        return true;
    }

    async kelolaMenu(aksi, data = {}) {
        if (aksi === 'lihat') {
            const [rows] = await db.execute(
                'SELECT * FROM Menu WHERE idPenjual = ? ORDER BY idMenu',
                [this.#idPenjual]
            );
            return rows;
        }

        if (aksi === 'tambah') {
            const [result] = await db.execute(
                `INSERT INTO Menu (idPenjual, namaMenu, harga, kategori, foto, deskripsi, statusAktif)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [this.#idPenjual, data.namaMenu, data.harga, data.kategori || null,
                    data.foto || null, data.deskripsi || null, data.statusAktif !== false]
            );
            return result.insertId;
        }

        if (aksi === 'ubah') {
            const [result] = await db.execute(
                `UPDATE Menu
                 SET namaMenu = ?, harga = ?, kategori = ?, foto = ?, deskripsi = ?, statusAktif = ?
                 WHERE idMenu = ? AND idPenjual = ?`,
                [data.namaMenu, data.harga, data.kategori || null, data.foto || null,
                    data.deskripsi || null, data.statusAktif !== false, data.idMenu, this.#idPenjual]
            );
            return result.affectedRows > 0;
        }

        if (aksi === 'hapus') {
            const [result] = await db.execute(
                'DELETE FROM Menu WHERE idMenu = ? AND idPenjual = ?',
                [data.idMenu, this.#idPenjual]
            );
            return result.affectedRows > 0;
        }

        throw new Error('Aksi kelola menu tidak valid.');
    }

    async konfirmasiPesanan(idPesanan, status = 'Pesanan Diterima oleh Penjual') {
        if (!STATUS_PESANAN.includes(status)) {
            throw new Error('Status pesanan tidak valid.');
        }

        const [result] = await db.execute(
            'UPDATE Pesanan SET statusPesanan = ? WHERE idPesanan = ? AND idPenjual = ?',
            [status, idPesanan, this.#idPenjual]
        );
        return result.affectedRows > 0;
    }

    async kelolaVoucher(aksi, data = {}) {
        if (aksi === 'lihat') {
            const [rows] = await db.execute(
                'SELECT * FROM Voucher WHERE idPenjual = ? ORDER BY tanggalBerakhir',
                [this.#idPenjual]
            );
            return rows;
        }

        if (aksi === 'tambah') {
            const [result] = await db.execute(
                `INSERT INTO Voucher
                 (idPenjual, kodeVoucher, jenisDiskon, nilaiDiskon, kuota, tanggalBerakhir)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [this.#idPenjual, data.kodeVoucher, data.jenisDiskon, data.nilaiDiskon,
                    data.kuota, data.tanggalBerakhir]
            );
            return result.insertId;
        }

        if (aksi === 'hapus') {
            const [result] = await db.execute(
                'DELETE FROM Voucher WHERE idVoucher = ? AND idPenjual = ?',
                [data.idVoucher, this.#idPenjual]
            );
            return result.affectedRows > 0;
        }

        throw new Error('Aksi kelola voucher tidak valid.');
    }

    async ubahStatusPesanan(idPesanan, status) {
        return this.konfirmasiPesanan(idPesanan, status);
    }

    async unggahBuktiPengantaran() {
        throw new Error('Fitur bukti pengantaran belum didukung oleh skema database.');
    }

    async lihatLaporanPenjualan(periodeAwal, periodeAkhir) {
        let query = 'SELECT * FROM LaporanPenjual WHERE idPenjual = ?';
        const params = [this.#idPenjual];

        if (periodeAwal && periodeAkhir) {
            query += ' AND periodeAwal >= ? AND periodeAkhir <= ?';
            params.push(periodeAwal, periodeAkhir);
        }
        query += ' ORDER BY periodeAwal DESC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    logout() {
        return true;
    }
}

module.exports = Penjual;
