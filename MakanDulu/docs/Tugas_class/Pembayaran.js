const statusPembayaran = Object.freeze({
    MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
    BELUM_DIBAYAR_COD: "Belum Dibayar (COD)",
    PEMBAYARAN_BERHASIL: "Pembayaran Berhasil",
    PEMBAYARAN_GAGAL: "Pembayaran Gagal"
});

class Pembayaran {
    constructor(
        idPembayaran,
        idPesanan,
        metodePembayaran,
        statusPembayaran,
        totalBayar,
        tanggalPembayaran = null
    ) {
        this.idPembayaran = idPembayaran;
        this.idPesanan = idPesanan;
        this.metodePembayaran = metodePembayaran;
        this.statusPembayaran = statusPembayaran;
        this.totalBayar = totalBayar;
        this.tanggalPembayaran = tanggalPembayaran;
    }

    prosesPembayaran() {
	// TODO: Implementasi proses pembayaran
    }

    verifikasiPembayaran() {
	// TODO: Implementasi memverifikasi pembayaran
    }
}