const db = require('../db');
const bcrypt = require('bcrypt');

class AkunPengguna {
    #idAkun;
    #email;
    #password;
    #role;

    constructor(idAkun, email, password, role){
        this.#email =email;
        this.#idAkun = idAkun;
        this.#password = password;
        this.#role = role;
    }

    getIdAkun(){
        return this.#idAkun;
    }
    
    getEmail(){
        return this.#email;
    }
    
    getPassword(){
        return this.#password;
    }
    
    getRole(){
        return this.#role;
    }

    async registrasi(){
        try{
            const [existingUser] = await db.execute('SELECT idAkun = ?')
        }
    }

    
}