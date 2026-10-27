class Menu {
    constructor(
        idMenu,
        idPenjual,
        namaMenu,
        harga,
        kategori,
        foto,
        deskripsi,
        statusAktif = true
    ) {
        this.idMenu = idMenu;
        this.idPenjual = idPenjual;
        this.namaMenu = namaMenu;
        this.harga = harga;
        this.kategori = kategori;
        this.foto = foto;
        this.deskripsi = deskripsi;
        this.statusAktif = statusAktif;
    }

    ubahMenu() {
        //TODO: Implementasi ubah menu
    }

    ubahStatusMenu() {
        //TODO: Implementasi ubah status menu
    }
}