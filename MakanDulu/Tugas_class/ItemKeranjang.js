class ItemKeranjang {
    constructor(
        idItemKeranjang,
        idKeranjang,
        idMenu,
        jumlah,
        hargaSatuan
    ) {
        this.idItemKeranjang = idItemKeranjang;
        this.idKeranjang = idKeranjang;
        this.idMenu = idMenu;
        this.jumlah = jumlah;
        this.hargaSatuan = hargaSatuan;
        this.subtotal = this.hitungSubtotal();
    }

    hitungSubtotal() {
        //TODO: Implementasi perhitungan subtotal
    }
}