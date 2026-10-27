// Enumeration role
const ROLE = Object.freeze({
    PENJUAL: "Penjual",
    PEMBELI: "Pembeli"
});

class Role {
    // Atribut private
    #idRole;
    #idPenjual;
    #idPembeli;
    #role;

    // Constructor public
    constructor(idRole, idPenjual, idPembeli, role) {
        if (!Object.values(ROLE).includes(role)) {
            throw new Error("Role tidak valid");
        }

        this.#idRole = idRole;
        this.#idPenjual = idPenjual;
        this.#idPembeli = idPembeli;
        this.#role = role;
    }

    // Getter public
    get idRole() {
        return this.#idRole;
    }

    get idPenjual() {
        return this.#idPenjual;
    }

    get idPembeli() {
        return this.#idPembeli;
    }

    get role() {
        return this.#role;
    }

    // Method public
    buatRole() {
        // TODO: Implementasi pembuatan role
    }
}