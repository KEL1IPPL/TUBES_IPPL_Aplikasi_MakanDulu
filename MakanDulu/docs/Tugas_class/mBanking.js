class MBanking {
    constructor(idBank, idPembayaran, idTransaksi, namaBank) {
        this.idBank = idBank;
        this.idPembayaran = idPembayaran;
        this.idTransaksi = idTransaksi;
        this.namaBank = namaBank;
    }

    prosesPembayaran() {
        if (!this.namaBank) {
            return false;
        }

        return true;
    }

    getIdTransaksi() {
        return this.idTransaksi;
    }
}