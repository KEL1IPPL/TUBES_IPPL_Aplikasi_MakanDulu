class EWallet {
    constructor(idEwallet, idPembayaran, idTransaksi, namaEwallet) {
        this.idEwallet = idEwallet;
        this.idPembayaran = idPembayaran;
        this.idTransaksi = idTransaksi;
        this.namaEwallet = namaEwallet;
    }

    prosesPembayaran() {
        if (!this.namaEwallet) {
            return false;
        }

        return true;
    }

    getIdTransaksi() {
        return this.idTransaksi;
    }
}