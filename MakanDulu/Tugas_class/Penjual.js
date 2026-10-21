const dataSimulasi = { penjual: [], menu: [], pesanan: [], nomorBerikutnya: { penjual: 1, menu: 1 } };

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
    get namaToko() { return this.#namaToko; }
    get nomorTelepon() { return this.#nomorTelepon; }
    get alamatToko() { return this.#alamatToko; }

    registrasi() {
        const sudahTerdaftar = dataSimulasi.penjual.some((penjual) =>
            penjual.email === this.#email ||
            penjual.nomorTelepon === this.#nomorTelepon ||
            penjual.NIB === this.#NIB ||
            penjual.NPWP === this.#NPWP ||
            penjual.KTP === this.#KTP
        );

        if (sudahTerdaftar) {
            throw new Error('Email, nomor telepon, NIB, NPWP, atau KTP sudah terdaftar.');
        }

        this.#idPenjual = dataSimulasi.nomorBerikutnya.penjual++;
        dataSimulasi.penjual.push({
            idPenjual: this.#idPenjual,
            idRole: this.#idRole,
            namaPemilik: this.#namaPemilik,
            email: this.#email,
            password: this.#password,
            namaToko: this.#namaToko,
            nomorTelepon: this.#nomorTelepon,
            alamatToko: this.#alamatToko,
            NIB: this.#NIB,
            NPWP: this.#NPWP,
            KTP: this.#KTP
        });

        return this.#idPenjual;
    }

    login(password = this.#password) {
        const penjual = dataSimulasi.penjual.find((data) =>
            data.email === this.#email && data.password === password
        );

        if (!penjual) {
            return false;
        }

        return new Penjual(
            penjual.idPenjual,
            penjual.namaPemilik,
            penjual.email,
            undefined,
            penjual.namaToko,
            penjual.nomorTelepon,
            penjual.alamatToko,
            penjual.NIB,
            penjual.NPWP,
            penjual.KTP,
            penjual.idRole
        );
    }

    resetPassword(newPassword) {
        if (!newPassword) {
            throw new Error('Password baru wajib diisi.');
        }

        const penjual = dataSimulasi.penjual.find(
            (data) => data.idPenjual === this.#idPenjual
        );

        if (!penjual) {
            throw new Error('Penjual tidak ditemukan.');
        }

        penjual.password = newPassword;
        this.#password = newPassword;
        return true;
    }

    kelolaMenu(aksi, data = {}) {
        if (aksi === 'lihat') {
            return dataSimulasi.menu.filter(
                (menu) => menu.idPenjual === this.#idPenjual
            );
        }

        if (aksi === 'tambah') {
            const menuBaru = {
                idMenu: dataSimulasi.nomorBerikutnya.menu++,
                idPenjual: this.#idPenjual,
                namaMenu: data.namaMenu,
                harga: data.harga,
                kategori: data.kategori || null,
                foto: data.foto || null,
                deskripsi: data.deskripsi || null,
                statusAktif: data.statusAktif !== false
            };

            dataSimulasi.menu.push(menuBaru);
            return menuBaru.idMenu;
        }

        if (aksi === 'ubah') {
            const menu = dataSimulasi.menu.find((item) =>
                item.idMenu === data.idMenu &&
                item.idPenjual === this.#idPenjual
            );

            if (!menu) {
                return false;
            }

            Object.assign(menu, {
                namaMenu: data.namaMenu,
                harga: data.harga,
                kategori: data.kategori || null,
                foto: data.foto || null,
                deskripsi: data.deskripsi || null,
                statusAktif: data.statusAktif !== false
            });
            return true;
        }

        if (aksi === 'hapus') {
            const index = dataSimulasi.menu.findIndex((menu) =>
                menu.idMenu === data.idMenu &&
                menu.idPenjual === this.#idPenjual
            );

            if (index === -1) {
                return false;
            }

            dataSimulasi.menu.splice(index, 1);
            return true;
        }

        throw new Error('Aksi kelola menu tidak valid.');
    }

    konfirmasiPesanan(idPesanan, status = 'Pesanan Diterima oleh Penjual') {
        if (!STATUS_PESANAN.includes(status)) {
            throw new Error('Status pesanan tidak valid.');
        }

        const pesanan = dataSimulasi.pesanan.find((data) =>
            data.idPesanan === idPesanan &&
            data.idPenjual === this.#idPenjual
        );

        if (!pesanan) {
            return false;
        }

        pesanan.statusPesanan = status;
        return true;
    }

    ubahStatusPesanan(idPesanan, status) {
        return this.konfirmasiPesanan(idPesanan, status);
    }

    logout() {
        return true;
    }
}

module.exports = Penjual;

//simulasinya
if (require.main === module) {
    const penjual = new Penjual(
        null,
        'Asep Racing',
        'semangatsehat@mail.com',
        '12345',
        'Warung Makan',
        '08123456789',
        'Surabaya',
        'NIB001',
        'NPWP001',
        'KTP001'
    );

    const idPenjual = penjual.registrasi();
    const hasilLogin = penjual.login('12345');
    hasilLogin.kelolaMenu('tambah', {
        namaMenu: 'Nasi Goreng',
        harga: 15000,
        kategori: 'Makanan',
        foto: 'https://share.google/ARFrIs1LYPK18mREK',
        deskripsi: 'Nasi goreng spesial'
    });

    console.log('=== SIMULASI MAKAN DULU ===');
    console.log(`Registrasi berhasil dengan ID: ${idPenjual}`);
    console.log(`Login berhasil sebagai ${hasilLogin.namaToko}`);
    console.table(hasilLogin.kelolaMenu('lihat'));
    console.log('Simulasi selesai.');
}
