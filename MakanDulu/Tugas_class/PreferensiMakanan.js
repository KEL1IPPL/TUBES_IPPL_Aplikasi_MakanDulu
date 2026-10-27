class PreferensiMakanan {
    // Atribut private
    #idPreferensi;
    #idPembeli;
    #rasaFavorit;
    #kategoriFavorit;

    // Constructor public
    constructor(idPreferensi, idPembeli, rasaFavorit, kategoriFavorit) {
        this.#idPreferensi = idPreferensi;
        this.#idPembeli = idPembeli;
        this.#rasaFavorit = rasaFavorit;
        this.#kategoriFavorit = kategoriFavorit;
    }

    // Getter public
    get idPreferensi() {
        return this.#idPreferensi;
    }

    get idPembeli() {
        return this.#idPembeli;
    }

    get rasaFavorit() {
        return this.#rasaFavorit;
    }

    get kategoriFavorit() {
        return this.#kategoriFavorit;
    }

    // Method public
    simpanPreferensi() {
        // TODO: Implementasi penyimpanan preferensi makanan
    }
}