class LaporanPenjual {
    // Atribut private
    #idLaporan;
    #idPenjual;
    #periodeAwal;
    #periodeAkhir;
    #totalPesanan;
    #totalPendapatan;
    #totalDiskon;

    // Constructor public
    constructor(
        idLaporan,
        idPenjual,
        periodeAwal,
        periodeAkhir,
        totalPesanan,
        totalPendapatan,
        totalDiskon
    ) {
        this.#idLaporan = idLaporan;
        this.#idPenjual = idPenjual;
        this.#periodeAwal = periodeAwal;
        this.#periodeAkhir = periodeAkhir;
        this.#totalPesanan = totalPesanan;
        this.#totalPendapatan = totalPendapatan;
        this.#totalDiskon = totalDiskon;
    }

    // Getter public
    get idLaporan() {
        return this.#idLaporan;
    }

    get idPenjual() {
        return this.#idPenjual;
    }

    get periodeAwal() {
        return this.#periodeAwal;
    }

    get periodeAkhir() {
        return this.#periodeAkhir;
    }

    get totalPesanan() {
        return this.#totalPesanan;
    }

    get totalPendapatan() {
        return this.#totalPendapatan;
    }

    get totalDiskon() {
        return this.#totalDiskon;
    }

    // Method public
    buatLaporan() {
        // TODO: Implementasi pembuatan laporan penjualan
    }
}