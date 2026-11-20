/**
 * @typedef {
 *   "Menunggu Konfirmasi Penjual" |
 *   "Pesanan Diterima oleh Penjual" |
 *   "Pesanan Disiapkan" |
 *   "Pesanan Diantar" |
 *   "Pesanan Selesai"
 * } StatusPesanan
 */

class Pesanan {
    // Atribut private
    #idPesanan;
    #idPembeli;
    #idPenjual;
    #idVoucher;
    #tanggalPesanan;
    #kodeVoucher;
    #alamatPengantaran;
    #statusPesanan;
    #totalHarga;
    #totalDiskon;

    constructor(
        idPesanan,
        idPembeli,
        idPenjual,
        idVoucher,
        tanggalPesanan,
        kodeVoucher,
        alamatPengantaran,
        statusPesanan,
        totalHarga,
        totalDiskon
    ) {
        this.#idPesanan = idPesanan;
        this.#idPembeli = idPembeli;
        this.#idPenjual = idPenjual;
        this.#idVoucher = idVoucher;
        this.#tanggalPesanan = tanggalPesanan;
        this.#kodeVoucher = kodeVoucher;
        this.#alamatPengantaran = alamatPengantaran;
        this.#statusPesanan = statusPesanan;
        this.#totalHarga = totalHarga;
        this.#totalDiskon = totalDiskon;
    }

    // Method public
    get idPesanan() { 
        return this.#idPesanan; 
    }
    get idPembeli() { 
        return this.#idPembeli; 
    }
    get idPenjual() { 
        return this.#idPenjual; 
    }
    get idVoucher() { 
        return this.#idVoucher; 
    }
    get tanggalPesanan() { 
        return this.#tanggalPesanan; 
    }
    get kodeVoucher() { 
        return this.#kodeVoucher; 
    }
    get alamatPengantaran() { 
        return this.#alamatPengantaran; 
    }
    get statusPesanan() { 
        return this.#statusPesanan; 
    }
    get totalHarga() { 
        return this.#totalHarga; 
    }
    get totalDiskon() { 
        return this.#totalDiskon; 
    }

    hitungTotal() {
        // TODO: Implementasi perhitungan total pesanan
    }

    ubahStatus() {
        // TODO: Implementasi perubahan status pesanan
    }

    batalkanPesanan() {
        // TODO: Implementasi pembatalan pesanan
    }
}