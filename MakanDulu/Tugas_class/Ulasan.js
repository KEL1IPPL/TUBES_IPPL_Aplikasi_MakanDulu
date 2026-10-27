class Ulasan {
    constructor(
        idUlasan,
        idPembeli,
        idPesanan,
        rating,
        komentar,
        fotoUlasan,
        tanggalUlasan = new Date()
    ) {
        this.idUlasan = idUlasan;
        this.idPembeli = idPembeli;
        this.idPesanan = idPesanan;
        this.rating = rating;
        this.komentar = komentar;
        this.fotoUlasan = fotoUlasan;
        this.tanggalUlasan = tanggalUlasan;
    }

    validasiRating() {
        //TODO: Implementasi validasi rating
    }

    simpanUlasan() {
        //TODO: Implementasi penyimpanan ulasan
    }
}