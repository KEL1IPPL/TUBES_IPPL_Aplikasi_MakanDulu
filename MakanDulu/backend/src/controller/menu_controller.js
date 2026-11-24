const db = require('../config/db');

/** Kategori yang diperbolehkan sesuai frontend */
const KATEGORI_VALID = ['ayam-bebek', 'mie-bakso', 'nasi-bakar', 'camilan', 'minuman'];
const RASA_VALID     = ['pedas', 'gurih', 'manis', 'asam', 'asin'];


const validasiInputMenu = (body) => {
  const errors = [];

  const { namaMenu, kategori, harga, hargaNormal, deskripsi, fotoUrl, rasaKarakter } = body;

  if (!namaMenu || typeof namaMenu !== 'string' || !namaMenu.trim()) {
    errors.push('Nama menu wajib diisi.');
  } else if (namaMenu.trim().length < 3) {
    errors.push('Nama menu minimal 3 karakter.');
  } else if (namaMenu.trim().length > 100) {
    errors.push('Nama menu maksimal 100 karakter.');
  }

  if (!kategori || !KATEGORI_VALID.includes(kategori)) {
    errors.push(`Kategori tidak valid. Pilih salah satu: ${KATEGORI_VALID.join(', ')}.`);
  }

  const hargaNum = Number(harga);
  if (!harga || isNaN(hargaNum) || hargaNum < 1000) {
    errors.push('Harga jual minimal Rp 1.000.');
  }

  if (hargaNormal !== undefined && hargaNormal !== '' && hargaNormal !== null) {
    const hargaNormalNum = Number(hargaNormal);
    if (isNaN(hargaNormalNum) || hargaNormalNum <= hargaNum) {
      errors.push('Harga normal (coret) harus lebih besar dari harga jual.');
    }
  }

  if (deskripsi && deskripsi.length > 500) {
    errors.push('Deskripsi maksimal 500 karakter.');
  }

  if (fotoUrl && fotoUrl.trim()) {
    const trimmed = fotoUrl.trim();
    const isDataUrl = trimmed.startsWith('data:image/');
    const isRelative = trimmed.startsWith('/uploads/') || trimmed.startsWith('/');
    if (!isDataUrl && !isRelative) {
      try {
        new URL(trimmed);
      } catch {
        errors.push('Format foto tidak valid. Gunakan file gambar atau URL yang valid.');
      }
    }
  }

  if (rasaKarakter !== undefined) {
    if (!Array.isArray(rasaKarakter)) {
      errors.push('Karakter rasa harus berupa array.');
    } else {
      const invalid = rasaKarakter.filter((r) => !RASA_VALID.includes(r));
      if (invalid.length > 0) {
        errors.push(`Karakter rasa tidak valid: ${invalid.join(', ')}.`);
      }
    }
  }

  return errors;
};

const tambahMenu = async (req, res) => {
  // Ambil idPenjual dari JWT (di-inject oleh middleware authenticateToken)
  const idPenjual = req.user?.id;
  if (!idPenjual || req.user?.role !== 'Penjual') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Penjual yang dapat menambahkan menu.',
    });
  }

  // --- Langkah 6: Validasi Input ---
  const errors = validasiInputMenu(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal. Periksa kembali data menu Anda.',
      errors,
    });
  }

  const {
    namaMenu,
    kategori,
    harga,
    hargaNormal,
    deskripsi,
    fotoUrl,
    rasaKarakter,
    modifier,
    statusAktif,
  } = req.body;

  const hargaNum       = Number(harga);
  const hargaNormalNum = hargaNormal ? Number(hargaNormal) : null;
  const diskonPersen   = hargaNormalNum
    ? Math.round(((hargaNormalNum - hargaNum) / hargaNormalNum) * 100)
    : null;
  const rasaStr        = Array.isArray(rasaKarakter) ? rasaKarakter.join(',') : '';
  const aktif          = statusAktif === false ? 0 : 1; // default aktif

  try {
//nambah menu kedatabase
    const [result] = await db.execute(
      `INSERT INTO Menu
         (idPenjual, namaMenu, kategori, harga, hargaNormal, diskonPersen,
          deskripsi, foto, fotoUrl, rasaKarakter, modifier, statusAktif)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idPenjual,
        namaMenu.trim(),
        kategori,
        hargaNum,
        hargaNormalNum,
        diskonPersen,
        (deskripsi || '').trim() || null,
        (fotoUrl   || '').trim() || null,
        (fotoUrl   || '').trim() || null,
        rasaStr || null,
        (modifier  || '').trim() || null,
        aktif,
      ]
    );

    const idMenuBaru = result.insertId;

//ngambil menu didatabase
    const [rows] = await db.execute(
      `SELECT idMenu, idPenjual, namaMenu, kategori, harga, hargaNormal,
              diskonPersen, deskripsi, fotoUrl, rasaKarakter, modifier, statusAktif,
              createdAt
       FROM Menu WHERE idMenu = ?`,
      [idMenuBaru]
    );

    const menuBaru = rows[0];


    return res.status(201).json({
      success: true,
      message: 'Menu Berhasil Ditambahkan',
      data: {
        id:              `menu-${menuBaru.idMenu}`,
        idMenu:          menuBaru.idMenu,
        name:            menuBaru.namaMenu,
        category:        menuBaru.kategori,
        price:           Number(menuBaru.harga),
        originalPrice:   menuBaru.hargaNormal ? Number(menuBaru.hargaNormal) : undefined,
        discountPercentage: menuBaru.diskonPersen ?? undefined,
        description:     menuBaru.deskripsi || '',
        imageUrl:        menuBaru.fotoUrl   || '',
        tasteCategory:   menuBaru.rasaKarakter ? menuBaru.rasaKarakter.split(',') : [],
        modifier:        menuBaru.modifier  || undefined,
        isAvailable:     Boolean(menuBaru.statusAktif),
        restaurant:      '',       // diisi dari profil toko di frontend
        distance:        '—',
        rating:          0,
        reviewCount:     '0 ulasan',
        tag:             'Menu Baru',
        salesCount:      '0 porsi',
        createdAt:       menuBaru.createdAt,
      },
    });
  } catch (error) {
    console.error('[MenuController.tambahMenu] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menyimpan menu.',
    });
  }
};

//get menu
const getMenuPenjual = async (req, res) => {
  const idPenjual = req.user?.id;
  if (!idPenjual || req.user?.role !== 'Penjual') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Penjual yang dapat mengakses data menu.',
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT idMenu, namaMenu, kategori, harga, hargaNormal, diskonPersen,
              deskripsi, COALESCE(fotoUrl, foto) AS fotoUrl, rasaKarakter, modifier, statusAktif, createdAt
       FROM Menu
       WHERE idPenjual = ?
       ORDER BY createdAt DESC`,
      [idPenjual]
    );

    const menuList = rows.map((m) => ({
      id:                `menu-${m.idMenu}`,
      idMenu:            m.idMenu,
      name:              m.namaMenu,
      category:          m.kategori,
      price:             Number(m.harga),
      originalPrice:     m.hargaNormal ? Number(m.hargaNormal) : undefined,
      discountPercentage: m.diskonPersen ?? undefined,
      description:       m.deskripsi || '',
      imageUrl:          m.fotoUrl   || '',
      tasteCategory:     m.rasaKarakter ? m.rasaKarakter.split(',') : [],
      modifier:          m.modifier  || undefined,
      isAvailable:       Boolean(m.statusAktif),
      restaurant:        '',
      distance:          '—',
      rating:            0,
      reviewCount:       '0 ulasan',
      tag:               'Menu Aktif',
      salesCount:        '0 porsi',
    }));

    return res.status(200).json({
      success: true,
      data: menuList,
    });
  } catch (error) {
    console.error('[MenuController.getMenuPenjual] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil daftar menu.',
    });
  }
};

//update menu
const updateMenu = async (req, res) => {
  const idPenjual = req.user?.id;
  if (!idPenjual || req.user?.role !== 'Penjual') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  const { idMenu } = req.params;

  // Pastikan menu milik penjual ini
  const [ownerCheck] = await db.execute(
    'SELECT idMenu FROM Menu WHERE idMenu = ? AND idPenjual = ?',
    [idMenu, idPenjual]
  );
  if (ownerCheck.length === 0) {
    return res.status(404).json({ success: false, message: 'Menu tidak ditemukan.' });
  }

  const errors = validasiInputMenu(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validasi gagal.', errors });
  }

  const { namaMenu, kategori, harga, hargaNormal, deskripsi, fotoUrl, rasaKarakter, modifier, statusAktif } = req.body;
  const hargaNum       = Number(harga);
  const hargaNormalNum = hargaNormal ? Number(hargaNormal) : null;
  const diskonPersen   = hargaNormalNum ? Math.round(((hargaNormalNum - hargaNum) / hargaNormalNum) * 100) : null;
  const rasaStr        = Array.isArray(rasaKarakter) ? rasaKarakter.join(',') : '';
  const aktif          = statusAktif === false ? 0 : 1;

  try {
    await db.execute(
      `UPDATE Menu SET
         namaMenu=?, kategori=?, harga=?, hargaNormal=?, diskonPersen=?,
         deskripsi=?, foto=?, fotoUrl=?, rasaKarakter=?, modifier=?, statusAktif=?
       WHERE idMenu=? AND idPenjual=?`,
      [namaMenu.trim(), kategori, hargaNum, hargaNormalNum, diskonPersen,
       (deskripsi||'').trim()||null, (fotoUrl||'').trim()||null, (fotoUrl||'').trim()||null,
       rasaStr||null, (modifier||'').trim()||null, aktif, idMenu, idPenjual]
    );
    return res.status(200).json({ success: true, message: `Menu "${namaMenu.trim()}" berhasil diperbarui.` });
  } catch (error) {
    console.error('[MenuController.updateMenu] Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memperbarui menu.' });
  }
};

//status menu
const toggleStatusMenu = async (req, res) => {
  const idPenjual = req.user?.id;
  if (!idPenjual || req.user?.role !== 'Penjual') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  const { idMenu } = req.params;
  const { statusAktif } = req.body || {};

  try {
    const [rows] = await db.execute(
      'SELECT idMenu, statusAktif FROM Menu WHERE idMenu = ? AND idPenjual = ?',
      [idMenu, idPenjual]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan.' });
    }

    let statusBaru;
    if (statusAktif !== undefined) {
      statusBaru = statusAktif ? 1 : 0;
    } else {
      statusBaru = rows[0].statusAktif ? 0 : 1;
    }

    await db.execute('UPDATE Menu SET statusAktif=? WHERE idMenu=?', [statusBaru, idMenu]);
    return res.status(200).json({
      success: true,
      message: statusBaru ? 'Menu berhasil diaktifkan' : 'Menu berhasil dinonaktifkan',
      data: { isAvailable: Boolean(statusBaru), statusAktif: statusBaru },
    });
  } catch (error) {
    console.error('[MenuController.toggleStatusMenu] Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengubah status menu.' });
  }
};

//fungsi hapus menu
const hapusMenu = async (req, res) => {
  const idPenjual = req.user?.id;
  if (!idPenjual || req.user?.role !== 'Penjual') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  const { idMenu } = req.params;
  try {
    const [result] = await db.execute(
      'DELETE FROM Menu WHERE idMenu = ? AND idPenjual = ?',
      [idMenu, idPenjual]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'menu berhasil dihapus' });
  } catch (error) {
    console.error('[MenuController.hapusMenu] Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus menu.' });
  }
};

// Handler Upload File Foto Menu
const uploadFotoMenu = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada berkas file foto yang diunggah.',
    });
  }

  const fotoUrl = `/uploads/menu/${req.file.filename}`;
  return res.status(200).json({
    success: true,
    message: 'Foto menu berhasil diunggah.',
    data: {
      fotoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
};

module.exports = {
  tambahMenu,
  getMenuPenjual,
  updateMenu,
  toggleStatusMenu,
  hapusMenu,
  uploadFotoMenu,
};
