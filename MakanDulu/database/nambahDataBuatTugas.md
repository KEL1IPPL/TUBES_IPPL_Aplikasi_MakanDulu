``` sql
-- query nambah data

INSERT INTO AkunPengguna (email, password, role) VALUES
('asep123@gmail.com', 'pass123', 'Pembeli'),
('neuvillete345@gmail.com', 'pass345', 'Pembeli'),
('karbit567@gmail.com', 'pass567', 'Pembeli'),
('tukangclaim890@gmail.com', 'pass890', 'Pembeli'),
('fireflycaelus@gmail.com', 'karbit123', 'Pembeli'),
('nasgor_cakmin@gmail.com', 'pass123', 'Penjual'),
('ayam_geprek_juara@gmail.com', 'pass123', 'Penjual'),
('kopi_senja@gmail.com', 'pass123', 'Penjual'),
('sate_madura_jaya@gmail.com', 'pass123', 'Penjual'),
('martabak_bangka@gmail.com', 'pass123', 'Penjual');

INSERT INTO Pembeli (idAkun, nama, nomorTelepon, alamat) VALUES
(1, 'Asep Keren', '081234567890', 'Jl. Merdeka No. 1, Surabaya'),
(2, 'Neuvillete', '081234567891', 'Jl. Focalor No. 2, Fontaine'),
(3, 'Kiko Samara', '081234567892', 'Jl. Thamrin No. 3, Surabaya'),
(4, 'Udin Racing', '081234567893', 'Jl. Gatot Subroto No. 4, Surabaya'),
(5, 'FireFly', '081234567894', 'Jl. Trailblazer No. 5, Amporeus');

INSERT INTO Penjual (idAkun, namaPemilik, namaToko, nomorTelepon, alamatToko, NIB, NPWP, KTP) VALUES
(6, 'Cak Min', 'Nasgor Cak Min', '085234567890', 'Jl. Pahlawan 1', '1234567890123', '123456789012345678901', '1234567890123456'),
(7, 'Pak Juara', 'Ayam Geprek Juara', '085234567891', 'Jl. Pahlawan 2', '1234567890124', '123456789012345678902', '1234567890123457'),
(8, 'Mas Senja', 'Kopi Senja', '085234567892', 'Jl. Pahlawan 3', '1234567890125', '123456789012345678903', '1234567890123458'),
(9, 'Cak Mad', 'Sate Madura Jaya', '085234567893', 'Jl. Pahlawan 4', '1234567890126', '123456789012345678904', '1234567890123459'),
(10, 'Koh Bangka', 'Martabak Bangka', '085234567894', 'Jl. Pahlawan 5', '1234567890127', '123456789012345678905', '1234567890123460');


INSERT INTO Menu (idPenjual, namaMenu, harga, kategori, foto, deskripsi, statusAktif) VALUES
(1, 'Nasi Goreng Spesial', 25000.00, 'Makanan Utama', 'https://share.google/LznOwXEfkmhrOb668', 'Nasi goreng dengan telur dan ayam', TRUE),
(2, 'Ayam Geprek Level 5', 20000.00, 'Makanan Utama', 'https://share.google/1m4AEB7jUvFyxiG5h', 'Ayam geprek pedas mampus', TRUE),
(3, 'Es Kopi Susu', 15000.00, 'Minuman', 'https://share.google/huz7Tc14maG057uvi', 'Kopi susu gula aren', TRUE),
(4, 'Sate Ayam 10 Tusuk', 30000.00, 'Makanan Utama', 'https://share.google/16uFnLL0j3nDFet60', 'Sate ayam dengan bumbu kacang', TRUE),
(5, 'Martabak Manis Coklat', 35000.00, 'Camilan', 'https://share.google/CTTrzfJp2PlEGTnla', 'Martabak manis topping coklat', TRUE);


INSERT INTO PreferensiMakanan (idPembeli, rasaFavorit, kategoriFavorit) VALUES
(1, 'Pedas', 'Makanan Utama'),
(2, 'Manis', 'Camilan'),
(3, 'Gurih', 'Makanan Utama'),
(4, 'Pahit', 'Minuman'),
(5, 'Asin', 'Camilan');



INSERT INTO Keranjang (idPembeli, totalHarga) VALUES
(1, 25000.00),
(2, 20000.00),
(3, 15000.00),
(4, 60000.00),
(5, 35000.00);


INSERT INTO ItemKeranjang (idKeranjang, idMenu, jumlah, hargaSatuan, subtotal) VALUES
(1, 1, 1, 25000.00, 25000.00), -- Asep beli Nasi Goreng
(2, 2, 1, 20000.00, 20000.00), -- Neuvillete beli Ayam Geprek
(3, 3, 1, 15000.00, 15000.00), -- Kiko beli Kopi
(4, 4, 2, 30000.00, 60000.00), -- Udin beli 2 porsi Sate
(5, 5, 1, 35000.00, 35000.00); -- FireFly beli Martabak

INSERT INTO Voucher (idPenjual, kodeVoucher, jenisDiskon, nilaiDiskon, kuota, tanggalBerakhir) VALUES
(1, 'NASGORHEMAT', 'Nominal', 5000.00, 100, '2026-12-31 23:59:59'),
(2, 'GEPREKPEDAS', 'Persentase', 10.00, 50, '2026-12-31 23:59:59'),
(3, 'KOPIENAK', 'Nominal', 3000.00, 200, '2026-12-31 23:59:59'),
(4, 'SATEPUAS', 'Nominal', 10000.00, 20, '2026-12-31 23:59:59'),
(5, 'MARTABAKMANIS', 'Persentase', 15.00, 30, '2026-12-31 23:59:59');

INSERT INTO Pesanan (idPembeli, idPenjual, idVoucher, kodeVoucher, alamatPengantaran, statusPesanan, totalHarga, totalDiskon) VALUES
(1, 1, 1, 'NASGORHEMAT', 'Jl. Merdeka No. 1', 'Pesanan Selesai', 25000.00, 5000.00),
(2, 2, NULL, NULL, 'Jl. Focalor No. 2', 'Pesanan Selesai', 20000.00, 0),
(3, 3, 3, 'KOPIENAK', 'Jl. Thamrin No. 3', 'Pesanan Selesai', 30000.00, 3000.00),
(4, 4, NULL, NULL, 'Jl. Gatot Subroto No. 4', 'Pesanan Selesai', 60000.00, 0),
(5, 5, 5, 'MARTABAKMANIS', 'Jl. Trailblaze No. 5', 'Pesanan Selesai', 35000.00, 5250.00),
(1, 2, 2, 'GEPREKPEDAS', 'Jl. Merdeka No. 1', 'Pesanan Selesai', 40000.00, 4000.00),
(2, 3, NULL, NULL, 'Jl. Focalor No. 2', 'Pesanan Diantar', 15000.00, 0),
(3, 4, 4, 'SATEPUAS', 'Jl. Thamrin No. 3', 'Pesanan Disiapkan', 30000.00, 10000.00),
(4, 5, NULL, NULL, 'Jl. Gatot Subroto No. 4', 'Pesanan Diterima oleh Penjual', 70000.00, 0),
(5, 1, NULL, NULL, 'Jl. Trailblaze No. 5', 'Menunggu Konfirmasi Penjual', 25000.00, 0);

INSERT INTO DetailPesanan (idPesanan, idMenu, jumlah, hargaSatuan, subtotal) VALUES
(1, 1, 1, 25000.00, 25000.00),
(2, 2, 1, 20000.00, 20000.00),
(3, 3, 2, 15000.00, 30000.00),
(4, 4, 2, 30000.00, 60000.00),
(5, 5, 1, 35000.00, 35000.00),
(6, 2, 2, 20000.00, 40000.00),
(7, 3, 1, 15000.00, 15000.00),
(8, 4, 1, 30000.00, 30000.00),
(9, 5, 2, 35000.00, 70000.00),
(10, 1, 1, 25000.00, 25000.00);

INSERT INTO Pembayaran (idPesanan, metodePembayaran, statusPembayaran, totalBayar, tanggalPembayaran) VALUES
(1, 'eWallet', 'Pembayaran Berhasil', 20000.00, '2026-10-15 10:00:00'),
(2, 'eWallet', 'Pembayaran Berhasil', 20000.00, '2026-10-16 11:00:00'),
(3, 'eWallet', 'Pembayaran Berhasil', 27000.00, '2026-10-17 12:00:00'),
(4, 'eWallet', 'Pembayaran Berhasil', 60000.00, '2026-10-18 13:00:00'),
(5, 'eWallet', 'Pembayaran Berhasil', 29750.00, '2026-10-19 14:00:00'),
(6, 'mBanking', 'Pembayaran Berhasil', 36000.00, '2026-10-20 15:00:00'),
(7, 'mBanking', 'Pembayaran Berhasil', 15000.00, '2026-10-20 16:00:00'),
(8, 'mBanking', 'Pembayaran Berhasil', 20000.00, '2026-10-20 17:00:00'),
(9, 'mBanking', 'Pembayaran Berhasil', 70000.00, '2026-10-20 18:00:00'),
(10, 'mBanking', 'Menunggu Pembayaran', 25000.00, NULL);

INSERT INTO eWallet (idPembayaran, idTransaksi, namaEwallet) VALUES
(1, 'EW-001', 'Gopay'),
(2, 'EW-002', 'OVO'),
(3, 'EW-003', 'Dana'),
(4, 'EW-004', 'ShopeePay'),
(5, 'EW-005', 'LinkAja');

INSERT INTO mBanking (idPembayaran, idTransaksi, namaBank) VALUES
(6, 'MB-001', 'BCA'),
(7, 'MB-002', 'Mandiri'),
(8, 'MB-003', 'BNI'),
(9, 'MB-004', 'BRI'),
(10, 'MB-005', 'BSI');

INSERT INTO Ulasan (idPembeli, idPesanan, rating, komentar, fotoUlasan) VALUES
(1, 1, 5, 'Enak banget nasi gorengnya!', 'ulasan_nasgor.jpg'),
(2, 2, 4, 'Ayamnya pedas mantap tapi agak keras', 'ulasan_geprek.jpg'),
(3, 3, 5, 'Kopinya pas rasa manisnya', 'ulasan_kopi.jpg'),
(4, 4, 5, 'Satenya daging semua, recommended!', 'ulasan_sate.jpg'),
(5, 5, 5, 'Martabaknya tebel dan manisnya pas', 'ulasan_martabak.jpg');

INSERT INTO LaporanPenjual (idPenjual, periodeAwal, periodeAkhir, totalPesanan, totalPendapatan, totalDiskon) VALUES
(1, '2026-10-01', '2026-10-31', 2, 50000.00, 5000.00),
(2, '2026-10-01', '2026-10-31', 2, 60000.00, 4000.00),
(3, '2026-10-01', '2026-10-31', 2, 45000.00, 3000.00),
(4, '2026-10-01', '2026-10-31', 1, 60000.00, 0),
(5, '2026-10-01', '2026-10-31', 2, 105000.00, 5250.00);
```