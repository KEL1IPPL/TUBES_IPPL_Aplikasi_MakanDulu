class DetailPesanan {
    constructor(
        idDetailPesanan,
        idPesanan,
        idMenu,
        jumlah,
        hargaSatuan
    ) {
        this.idDetailPesanan = idDetailPesanan;
        this.idPesanan = idPesanan;
        this.idMenu = idMenu;
        this.jumlah = jumlah;
        this.hargaSatuan = hargaSatuan;
        this.subtotal = this.hitungSubtotal();
    }

    hitungSubtotal() {
        //TODO: Implementasi perhitungan subtotal
    }
}