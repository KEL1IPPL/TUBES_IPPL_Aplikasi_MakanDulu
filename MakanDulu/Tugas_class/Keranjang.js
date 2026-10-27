class Keranjang {
    // Atribut private
    #idKeranjang;
    #idPembeli;
    #totalHarga;

    // Constructor public
    constructor(idKeranjang, idPembeli, totalHarga) {
        this.#idKeranjang = idKeranjang;
        this.#idPembeli = idPembeli;
        this.#totalHarga = totalHarga;
    }

    // Getter public
    get idKeranjang() {
        return this.#idKeranjang;
    }

    get idPembeli() {
        return this.#idPembeli;
    }

    get totalHarga() {
        return this.#totalHarga;
    }

    // Method public
    tambahMenu() {
        // TODO: Implementasi penambahan menu ke keranjang
    }

    ubahJumlah() {
        // TODO: Implementasi perubahan jumlah menu
    }

    hapusMenu() {
        // TODO: Implementasi penghapusan menu dari keranjang
    }

    hitungTotal() {
        // TODO: Implementasi perhitungan total harga keranjang
    }
}