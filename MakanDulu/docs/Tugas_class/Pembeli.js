const dataSimulasi = { pembeli: [], pesanan: [], voucher: [], ulasan: [], nomorBerikutnya: { pembeli: 1, pesanan: 1, ulasan: 1 } };

class Pembeli {
    #idPembeli;
    #idRole;
    #nama;
    #nomorTelepon;
    #alamat;

    constructor(idPembeli, idRole, nama, nomorTelepon, alamat) {
        this.#idPembeli = idPembeli;
        this.#idRole = idRole;
        this.#nama = nama;
        this.#nomorTelepon = nomorTelepon;
        this.#alamat = alamat;
    }

    get idPembeli() {
        return this.#idPembeli;
    }

    get idRole() {
        return this.#idRole;
    }

    get nama() {
        return this.#nama;
    }

    get nomorTelepon() {
        return this.#nomorTelepon;
    }

    get alamat() {
        return this.#alamat;
    }

    buatPesanan(data = {}) {
        if (!data.idPenjual || !data.namaMenu || !data.harga) {
            throw new Error('idPenjual, namaMenu, dan harga wajib diisi.');
        }

        const pesanan = {
            idPesanan: dataSimulasi.nomorBerikutnya.pesanan++,
            idPembeli: this.#idPembeli,
            idPenjual: data.idPenjual,
            namaMenu: data.namaMenu,
            jumlah: data.jumlah || 1,
            totalHarga: data.harga * (data.jumlah || 1),
            alamatPengantaran: data.alamatPengantaran || this.#alamat,
            statusPesanan: 'Menunggu Konfirmasi Penjual'
        };

        dataSimulasi.pesanan.push(pesanan);
        console.log(`Pesanan berhasil dibuat dengan ID: ${pesanan.idPesanan}.`);
        return pesanan;
    }

    pakaiVoucher(kodeVoucher) {
        const voucher = dataSimulasi.voucher.find((data) =>
            data.kodeVoucher === kodeVoucher &&
            data.kuota > 0 &&
            data.aktif
        );

        if (!voucher) {
            console.log('Voucher tidak ditemukan atau sudah tidak aktif.');
            return false;
        }

        voucher.kuota--;
        console.log(`Voucher ${kodeVoucher} berhasil digunakan.`);
        return voucher;
    }

    konfirmasiPesanan(idPesanan) {
        const pesanan = dataSimulasi.pesanan.find((data) =>
            data.idPesanan === idPesanan &&
            data.idPembeli === this.#idPembeli
        );

        if (!pesanan) {
            console.log('Pesanan tidak ditemukan.');
            return false;
        }

        pesanan.statusPesanan = 'Pesanan Selesai';
        console.log(`Pesanan ${idPesanan} berhasil dikonfirmasi selesai.`);
        return true;
    }

    beriUlasan(idPesanan, rating, komentar) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('Rating harus berupa angka antara 1 sampai 5.');
        }

        const pesanan = dataSimulasi.pesanan.find((data) =>
            data.idPesanan === idPesanan &&
            data.idPembeli === this.#idPembeli &&
            data.statusPesanan === 'Pesanan Selesai'
        );

        if (!pesanan) {
            console.log('Ulasan hanya dapat diberikan untuk pesanan yang selesai.');
            return false;
        }

        const ulasan = {
            idUlasan: dataSimulasi.nomorBerikutnya.ulasan++,
            idPembeli: this.#idPembeli,
            idPesanan,
            rating,
            komentar: komentar || ''
        };

        dataSimulasi.ulasan.push(ulasan);
        console.log(`Ulasan untuk pesanan ${idPesanan} berhasil diberikan.`);
        return ulasan;
    }
}

module.exports = Pembeli;

if (require.main === module) {
    const pembeli = new Pembeli(
        dataSimulasi.nomorBerikutnya.pembeli++,
        2,
        'Budi Santoso',
        '081234567890',
        'Jl. Merdeka No. 10'
    );

    dataSimulasi.pembeli.push(pembeli);
    dataSimulasi.voucher.push({
        kodeVoucher: 'MAKANHEMAT',
        kuota: 2,
        aktif: true
    });

    const pesanan = pembeli.buatPesanan({
        idPenjual: 1,
        namaMenu: 'Ayam Geprek',
        harga: 18000,
        jumlah: 2
    });

    pembeli.pakaiVoucher('MAKANHEMAT');
    pesanan.statusPesanan = 'Pesanan Diantar';
    pembeli.konfirmasiPesanan(pesanan.idPesanan);
    pembeli.beriUlasan(pesanan.idPesanan, 5, 'Makanannya enak dan cepat.');

    console.log('=== SIMULASI PEMBELI ===');
    console.log({
        idPembeli: pembeli.idPembeli,
        idRole: pembeli.idRole,
        nama: pembeli.nama,
        nomorTelepon: pembeli.nomorTelepon,
        alamat: pembeli.alamat
    });
    console.table(dataSimulasi.pesanan);
    console.table(dataSimulasi.ulasan);
    console.log('Simulasi selesai.');
}
