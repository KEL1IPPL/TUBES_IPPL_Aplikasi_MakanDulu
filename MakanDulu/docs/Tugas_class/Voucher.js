const jenisDiskon = Object.freeze({
    
})

class Voucher {
    // Atribut private

    #idVoucher;
    #idPenjual;
    #kodeVoucher;
    #jenisDiskon;
    #nilaiDiskon;
    #kuota;
    #tanggalBerakhir;

    // Constructor public
    constructor(
        idVoucher,
        idPenjual,
        kodeVoucher,
        jenisDiskon,
        nilaiDiskon,
        kuota,
        tanggalBerakhir
    ) {
        this.#idVoucher = idVoucher;
        this.#idPenjual = idPenjual;
        this.#kodeVoucher = kodeVoucher;
        this.#jenisDiskon = jenisDiskon;
        this.#nilaiDiskon = nilaiDiskon;
        this.#kuota = kuota;
        this.#tanggalBerakhir = tanggalBerakhir;
    }

    // Method public
    get idVoucher() { 
        return this.#idVoucher; 
    }
    get idPenjual() { 
        return this.#idPenjual; 
    }
    get kodeVoucher() { 
        return this.#kodeVoucher; 
    }
    get jenisDiskon() { 
        return this.#jenisDiskon; 
    }
    get nilaiDiskon() { 
        return this.#nilaiDiskon; 
    }
    get kuota() { 
        return this.#kuota; 
    }
    get tanggalBerakhir() { 
        return this.#tanggalBerakhir; 
    }

    buatVoucher() {
        // TODO: Implementasi pembuatan voucher
    }

    ubahVoucher() {
        // TODO: Implementasi perubahan voucher
    }

    hapusVoucher() {
        // TODO: Implementasi penghapusan voucher
    }

    validasiVoucher() {
        // TODO: Implementasi validasi voucher
    }

    hitungDiskon() {
        // TODO: Implementasi perhitungan diskon
    }
}