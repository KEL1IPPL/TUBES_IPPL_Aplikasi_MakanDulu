``` sql
CREATE TABLE AkunPengguna (
    idAkun INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Pembeli', 'Penjual') NOT NULL
);

CREATE TABLE Pembeli (
    idPembeli INT AUTO_INCREMENT PRIMARY KEY,
    idAkun INT NOT NULL UNIQUE,
    nama VARCHAR(25) NOT NULL,
    nomorTelepon VARCHAR(20) NOT NULL UNIQUE,
    alamat TEXT NOT NULL,

    CONSTRAINT fk_pembeli_akun
        FOREIGN KEY (idAkun) REFERENCES AkunPengguna(idAkun)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Penjual (
    idPenjual INT AUTO_INCREMENT PRIMARY KEY,
    idAkun INT NOT NULL UNIQUE,
    namaPemilik VARCHAR(25) NOT NULL,
    namaToko VARCHAR(30) NOT NULL,
    nomorTelepon VARCHAR(15) NOT NULL UNIQUE,
    alamatToko TEXT NOT NULL,
    NIB VARCHAR(13) NOT NULL UNIQUE,
    NPWP VARCHAR(21) NOT NULL UNIQUE,
    KTP VARCHAR(16) NOT NULL UNIQUE,

    CONSTRAINT fk_penjual_akun
        FOREIGN KEY (idAkun) REFERENCES AkunPengguna(idAkun)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Menu (
    idMenu INT AUTO_INCREMENT PRIMARY KEY,
    idPenjual INT NOT NULL,
    namaMenu VARCHAR(120) NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    kategori VARCHAR(80),
    foto TEXT,
    deskripsi TEXT,
    statusAktif BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_menu_penjual
        FOREIGN KEY (idPenjual) REFERENCES Penjual(idPenjual)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_menu_harga CHECK (harga >= 0)
);

CREATE TABLE PreferensiMakanan (
    idPreferensi INT AUTO_INCREMENT PRIMARY KEY,
    idPembeli INT NOT NULL,
    rasaFavorit VARCHAR(10),
    kategoriFavorit VARCHAR(20),

    CONSTRAINT fk_preferensi_pembeli
        FOREIGN KEY (idPembeli) REFERENCES Pembeli(idPembeli)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Keranjang (
    idKeranjang INT AUTO_INCREMENT PRIMARY KEY,
    idPembeli INT NOT NULL UNIQUE,
    totalHarga DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_keranjang_pembeli
        FOREIGN KEY (idPembeli) REFERENCES Pembeli(idPembeli)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_keranjang_total CHECK (totalHarga >= 0)
);

CREATE TABLE ItemKeranjang (
    idItemKeranjang INT AUTO_INCREMENT PRIMARY KEY,
    idKeranjang INT NOT NULL,
    idMenu INT NOT NULL,
    jumlah INT NOT NULL,
    hargaSatuan DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_itemkeranjang_keranjang
        FOREIGN KEY (idKeranjang)
        REFERENCES Keranjang(idKeranjang)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_itemkeranjang_menu
        FOREIGN KEY (idMenu)
        REFERENCES Menu(idMenu)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_itemkeranjang_jumlah CHECK (jumlah > 0),
    CONSTRAINT chk_itemkeranjang_harga CHECK (hargaSatuan >= 0),
    CONSTRAINT chk_itemkeranjang_subtotal CHECK (subtotal >= 0)
);

CREATE TABLE Voucher (
    idVoucher INT AUTO_INCREMENT PRIMARY KEY,
    idPenjual INT NOT NULL,
    kodeVoucher VARCHAR(50) NOT NULL,
    jenisDiskon ENUM('Persentase', 'Nominal') NOT NULL,
    nilaiDiskon DECIMAL(12,2) NOT NULL,
    kuota INT NOT NULL,
    tanggalBerakhir DATETIME NOT NULL,

    CONSTRAINT uq_voucher_penjual_kode
        UNIQUE (idPenjual, kodeVoucher),

    CONSTRAINT fk_voucher_penjual
        FOREIGN KEY (idPenjual)
        REFERENCES Penjual(idPenjual)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_voucher_nilai CHECK (nilaiDiskon > 0),
    CONSTRAINT chk_voucher_kuota CHECK (kuota >= 0)
);


CREATE TABLE Pesanan (
    idPesanan INT AUTO_INCREMENT PRIMARY KEY,
    idPembeli INT NOT NULL,
    idPenjual INT NOT NULL,
    idVoucher INT NULL,
    tanggalPemesanan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kodeVoucher VARCHAR(50),
    alamatPengantaran TEXT NOT NULL,

    statusPesanan ENUM(
        'Menunggu Konfirmasi Penjual',
        'Pesanan Diterima oleh Penjual',
        'Pesanan Disiapkan',
        'Pesanan Diantar',
        'Pesanan Selesai'
    ) NOT NULL DEFAULT 'Menunggu Konfirmasi Penjual',

    totalHarga DECIMAL(12,2) NOT NULL DEFAULT 0,
    totalDiskon DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_pesanan_pembeli
        FOREIGN KEY (idPembeli)
        REFERENCES Pembeli(idPembeli)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_pesanan_penjual
        FOREIGN KEY (idPenjual)
        REFERENCES Penjual(idPenjual)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_pesanan_voucher
        FOREIGN KEY (idVoucher)
        REFERENCES Voucher(idVoucher)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_pesanan_total CHECK (totalHarga >= 0),
    CONSTRAINT chk_pesanan_diskon CHECK (totalDiskon >= 0)
);


CREATE TABLE DetailPesanan (
    idDetailPesanan INT AUTO_INCREMENT PRIMARY KEY,
    idPesanan INT NOT NULL,
    idMenu INT NOT NULL,
    jumlah INT NOT NULL,
    hargaSatuan DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_detailpesanan_pesanan
        FOREIGN KEY (idPesanan)
        REFERENCES Pesanan(idPesanan)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detailpesanan_menu
        FOREIGN KEY (idMenu)
        REFERENCES Menu(idMenu)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detail_jumlah CHECK (jumlah > 0),
    CONSTRAINT chk_detail_harga CHECK (hargaSatuan >= 0),
    CONSTRAINT chk_detail_subtotal CHECK (subtotal >= 0)
);

CREATE TABLE Pembayaran (
    idPembayaran INT AUTO_INCREMENT PRIMARY KEY,
    idPesanan INT NOT NULL UNIQUE,
    metodePembayaran VARCHAR(30) NOT NULL,

    statusPembayaran ENUM(
        'Menunggu Pembayaran',
        'Belum Dibayar (COD)',
        'Pembayaran Berhasil',
        'Pembayaran Gagal'
    ) NOT NULL DEFAULT 'Menunggu Pembayaran',

    totalBayar DECIMAL(12,2) NOT NULL,
    tanggalPembayaran DATETIME NULL,

    CONSTRAINT fk_pembayaran_pesanan
        FOREIGN KEY (idPesanan) REFERENCES Pesanan(idPesanan)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_pembayaran_total CHECK (totalBayar >= 0)
);

CREATE TABLE eWallet (
    idEwallet INT AUTO_INCREMENT PRIMARY KEY,
    idPembayaran INT NOT NULL UNIQUE,
    idTransaksi VARCHAR(20),
    namaEwallet VARCHAR(10) NOT NULL,

    CONSTRAINT fk_ewallet_pembayaran
        FOREIGN KEY (idPembayaran) REFERENCES Pembayaran(idPembayaran)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE mBanking (
    idBank INT AUTO_INCREMENT PRIMARY KEY,
    idPembayaran INT NOT NULL UNIQUE,
    idTransaksi VARCHAR(20),
    namaBank VARCHAR(30) NOT NULL,
    CONSTRAINT fk_mbanking_pembayaran
        FOREIGN KEY (idPembayaran) REFERENCES Pembayaran(idPembayaran)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Ulasan (
    idUlasan INT AUTO_INCREMENT PRIMARY KEY,
    idPembeli INT NOT NULL,
    idPesanan INT NOT NULL,
    rating TINYINT NOT NULL,
    komentar TEXT,
    fotoUlasan TEXT,
    tanggalUlasan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ulasan_pembeli
        FOREIGN KEY (idPembeli) REFERENCES Pembeli(idPembeli)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_ulasan_pesanan
        FOREIGN KEY (idPesanan) REFERENCES Pesanan(idPesanan)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT chk_ulasan_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_ulasan_pembeli_pesanan UNIQUE (idPembeli, idPesanan)
);


CREATE TABLE LaporanPenjual (
    idLaporan INT AUTO_INCREMENT PRIMARY KEY,
    idPenjual INT NOT NULL,
    periodeAwal DATE NOT NULL,
    periodeAkhir DATE NOT NULL,
    totalPesanan INT NOT NULL DEFAULT 0,
    totalPendapatan DECIMAL(14,2) NOT NULL DEFAULT 0,
    totalDiskon DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_laporan_penjual
        FOREIGN KEY (idPenjual) REFERENCES Penjual(idPenjual)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_laporan_periode CHECK (periodeAkhir >= periodeAwal),
    CONSTRAINT chk_laporan_pesanan CHECK (totalPesanan >= 0),
    CONSTRAINT chk_laporan_pendapatan CHECK (totalPendapatan >= 0),
    CONSTRAINT chk_laporan_diskon CHECK (totalDiskon >= 0)
);

CREATE INDEX idx_menu_penjual
    ON Menu(idPenjual);

CREATE INDEX idx_pesanan_pembeli
    ON Pesanan(idPembeli);

CREATE INDEX idx_pesanan_penjual_tanggal
    ON Pesanan(idPenjual, tanggalPemesanan);

CREATE INDEX idx_pesanan_status
    ON Pesanan(statusPesanan);

CREATE INDEX idx_detailpesanan_pesanan
    ON DetailPesanan(idPesanan);

CREATE INDEX idx_voucher_tanggal
    ON Voucher(tanggalBerakhir);

CREATE INDEX idx_ulasan_pesanan
    ON Ulasan(idPesanan);

CREATE INDEX idx_laporan_penjual_periode
    ON LaporanPenjual(idPenjual, periodeAwal, periodeAkhir);
```