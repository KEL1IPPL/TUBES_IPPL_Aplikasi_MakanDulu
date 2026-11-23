const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper untuk decode token secara opsional (bisa guest atau pembeli login)
const extractUserFromToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return null;
    }
  }
  return null;
};

// Helper parse JSON array dari DB
const parseJsonArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof val === 'string' ? val.split(',').map((s) => s.trim().toLowerCase()) : [];
  }
};

// Helper normalisasi kategori untuk pencocokan fleksibel
const normalizeCategory = (cat) => {
  return String(cat || '')
    .toLowerCase()
    .replace(/[_\s&-]+/g, '');
};

const mapMenuRow = (m) => {
  const rasaList = m.rasaKarakter
    ? m.rasaKarakter.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    id: `menu-${m.idMenu}`,
    idMenu: m.idMenu,
    idPenjual: m.idPenjual,
    name: m.namaMenu,
    restaurant: m.namaToko || 'Mitra MakanDulu',
    restaurantAddress: m.alamatToko || '',
    restaurantPhone: m.nomorTelepon || '',
    distance: '1.2 km',
    price: Number(m.harga),
    originalPrice: m.hargaNormal ? Number(m.hargaNormal) : undefined,
    discountPercentage:
      m.diskonPersen ||
      (m.hargaNormal && Number(m.hargaNormal) > Number(m.harga)
        ? Math.round(((Number(m.hargaNormal) - Number(m.harga)) / Number(m.hargaNormal)) * 100)
        : undefined),
    rating: 4.8,
    reviewCount: '100+ ulasan',
    tag: m.diskonPersen ? `Diskon ${m.diskonPersen}%` : 'Menu Mitra',
    tasteCategory: rasaList,
    category: m.kategori || 'Makanan Utama',
    description: m.deskripsi || '',
    imageUrl:
      m.fotoUrl ||
      m.foto ||
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    isAvailable: Boolean(m.statusAktif),
    salesCount: '50+ porsi',
    modifier: m.modifier || undefined,
    createdAt: m.createdAt,
  };
};

const mapTokoRow = (p) => {
  return {
    id: `store-${p.idPenjual}`,
    idPenjual: p.idPenjual,
    name: p.namaToko,
    ownerName: p.namaPemilik || '',
    phone: p.nomorTelepon || '',
    address: p.alamatToko || '',
    tagline: 'Mitra Kuliner Terpercaya Pilihan MakanDulu',
    cuisineType: 'Kuliner Nusantara & Aneka Rasa',
    rating: 4.8,
    reviewCount: '250+ ulasan',
    distance: '1.2 km',
    deliveryTime: '15-25 mnt',
    openingHours: '08:00 - 21:00 WIB',
    bannerUrl:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    logoUrl:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=80',
    promoText: 'Menu Segar Dimasak Langsung Saat Dipesan',
    description: `Mitra kuliner resmi MakanDulu: ${p.namaToko}, berlokasi di ${p.alamatToko || 'Indonesia'}.`,
    verified: true,
  };
};

//ambil preferensi pembeli dari Entity PreferensiMakanan
const ambilPreferensiPembeli = async (idPembeli) => {
  if (!idPembeli) {
    return { rasaFavorit: ['pedas', 'gurih'], kategoriFavorit: [], polaMakan: [] };
  }

  try {
    const [rows] = await db.execute(
      `SELECT rasaFavorit, kategoriFavorit, polaMakan
       FROM PreferensiMakanan
       WHERE idPembeli = ?
       LIMIT 1`,
      [idPembeli]
    );

    if (rows.length > 0) {
      return {
        rasaFavorit: parseJsonArray(rows[0].rasaFavorit),
        kategoriFavorit: parseJsonArray(rows[0].kategoriFavorit),
        polaMakan: parseJsonArray(rows[0].polaMakan),
      };
    }
  } catch (err) {
    console.error('[ambilPreferensiPembeli] Error:', err.message);
  }

  return { rasaFavorit: ['pedas', 'gurih'], kategoriFavorit: [], polaMakan: [] };
};

// Helper internal: hitung rekomendasi menu berdasarkan preferensi
const filterMenuRekomendasi = (allMenus, preferensi) => {
  const { rasaFavorit = [], kategoriFavorit = [] } = preferensi;
  const targetTastes = rasaFavorit.map((r) => String(r).toLowerCase());
  const targetCats = kategoriFavorit.map(normalizeCategory);

  const matched = allMenus.filter((item) => {
    // Cek kecocokan rasa
    const tasteMatch = item.tasteCategory?.some((t) =>
      targetTastes.includes(String(t).toLowerCase())
    );
    // Cek kecocokan kategori
    const catNorm = normalizeCategory(item.category);
    const catMatch = targetCats.some((c) => catNorm.includes(c) || c.includes(catNorm));

    return tasteMatch || catMatch;
  });

  // Jika ada yang cocok, kembalikan yang cocok; jika sedikit, gabungkan dengan menu teratas
  if (matched.length >= 3) {
    return matched;
  }

  const resultIds = new Set(matched.map((m) => m.id));
  const fallback = allMenus.filter((m) => !resultIds.has(m.id));
  return [...matched, ...fallback].slice(0, 6);
};

const getKatalogRekomendasi = async (req, res) => {
  const user = extractUserFromToken(req);
  const idPembeli = user?.role === 'Pembeli' ? user.id : req.query.idPembeli;

  try {
    // 1. ambil_preferensi -> Entity Preferensi_makanan
    const preferensi = await ambilPreferensiPembeli(idPembeli);

    // 2. ambil_menu -> Entity Menu JOIN Penjual
    const [menuRows] = await db.execute(
      `SELECT m.idMenu, m.idPenjual, m.namaMenu, m.harga, m.hargaNormal, m.diskonPersen,
              m.kategori, COALESCE(m.fotoUrl, m.foto) AS fotoUrl, m.deskripsi,
              m.rasaKarakter, m.modifier, m.statusAktif, m.createdAt,
              p.namaToko, p.alamatToko, p.nomorTelepon
       FROM Menu m
       JOIN Penjual p ON m.idPenjual = p.idPenjual
       WHERE m.statusAktif = 1
       ORDER BY m.idMenu DESC`
    );

    const allMenus = menuRows.map(mapMenuRow);

    // 3. Entity Penjual -> daftar resto mitra yang ada di database
    const [tokoRows] = await db.execute(
      `SELECT idPenjual, namaToko, namaPemilik, alamatToko, nomorTelepon
       FROM Penjual
       ORDER BY idPenjual ASC`
    );
    const tokoList = tokoRows.map(mapTokoRow);

    // 4. Hitung rekomendasi berdasarkan preferensi
    const rekomendasi = filterMenuRekomendasi(allMenus, preferensi);

    // 5. tampilkan_katalog_rekomendasi -> Boundary halaman_dashboard
    return res.status(200).json({
      success: true,
      data: {
        menus: allMenus,
        rekomendasi,
        tokoList,
        preferensi,
      },
    });
  } catch (error) {
    console.error('[KatalogController.getKatalogRekomendasi] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memuat katalog hidangan.',
    });
  }
};

const getDetailMenu = async (req, res) => {
  const { idMenu } = req.params;

  try {
    // ambil_detail -> Entity Menu
    const [rows] = await db.execute(
      `SELECT m.idMenu, m.idPenjual, m.namaMenu, m.harga, m.hargaNormal, m.diskonPersen,
              m.kategori, COALESCE(m.fotoUrl, m.foto) AS fotoUrl, m.deskripsi,
              m.rasaKarakter, m.modifier, m.statusAktif, m.createdAt,
              p.namaToko, p.alamatToko, p.nomorTelepon
       FROM Menu m
       JOIN Penjual p ON m.idPenjual = p.idPenjual
       WHERE m.idMenu = ? AND m.statusAktif = 1`,
      [idMenu]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu tidak ditemukan atau sedang tidak aktif.',
      });
    }

    const detailMenu = mapMenuRow(rows[0]);

    // menampilkan_detail_menu() -> Boundary halaman_detail_menu
    return res.status(200).json({
      success: true,
      data: detailMenu,
    });
  } catch (error) {
    console.error('[KatalogController.getDetailMenu] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail menu.',
    });
  }
};

const searchKatalog = async (req, res) => {
  const query = String(req.query.q || req.query.kataKunci || '').trim();
  const kategori = String(req.query.kategori || '').trim();
  const user = extractUserFromToken(req);
  const idPembeli = user?.role === 'Pembeli' ? user.id : req.query.idPembeli;

  try {
    let sql = `
      SELECT m.idMenu, m.idPenjual, m.namaMenu, m.harga, m.hargaNormal, m.diskonPersen,
             m.kategori, COALESCE(m.fotoUrl, m.foto) AS fotoUrl, m.deskripsi,
             m.rasaKarakter, m.modifier, m.statusAktif, m.createdAt,
             p.namaToko, p.alamatToko, p.nomorTelepon
      FROM Menu m
      JOIN Penjual p ON m.idPenjual = p.idPenjual
      WHERE m.statusAktif = 1
    `;
    const params = [];

    if (query) {
      sql += ` AND (m.namaMenu LIKE ? OR m.deskripsi LIKE ? OR p.namaToko LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (kategori && kategori !== 'all') {
      sql += ` AND (m.kategori = ? OR m.kategori LIKE ?)`;
      params.push(kategori, `%${kategori}%`);
    }

    sql += ` ORDER BY m.idMenu DESC`;

    const [rows] = await db.execute(sql, params);

    // Alternative Flow #1: Hasil Ditemukan
    if (rows.length > 0) {
      const hasil = rows.map(mapMenuRow);
      return res.status(200).json({
        success: true,
        ditemukan: true,
        kataKunci: query,
        totalHasil: hasil.length,
        data: hasil,
      });
    }

    // Alternative Flow #2: Hasil Tidak Ditemukan
    // Control -> ambil_rekomendasi_menu_berdasarkan_preferensi -> Entity Preferensi_makanan
    const preferensi = await ambilPreferensiPembeli(idPembeli);

    // Ambil semua menu aktif untuk dijadikan alternatif rekomendasi
    const [allRows] = await db.execute(
      `SELECT m.idMenu, m.idPenjual, m.namaMenu, m.harga, m.hargaNormal, m.diskonPersen,
              m.kategori, COALESCE(m.fotoUrl, m.foto) AS fotoUrl, m.deskripsi,
              m.rasaKarakter, m.modifier, m.statusAktif, m.createdAt,
              p.namaToko, p.alamatToko, p.nomorTelepon
       FROM Menu m
       JOIN Penjual p ON m.idPenjual = p.idPenjual
       WHERE m.statusAktif = 1
       ORDER BY m.idMenu DESC`
    );

    const allMenus = allRows.map(mapMenuRow);
    const rekomendasiAlternatif = filterMenuRekomendasi(allMenus, preferensi);

    // menampilkan "menu tidak ditemukan" dan menampilkan beberapa menu rekomendasi lainnya berdasarkan preferensi
    return res.status(200).json({
      success: true,
      ditemukan: false,
      kataKunci: query,
      message: 'Menu tidak ditemukan',
      data: [],
      rekomendasiAlternatif,
      preferensi,
    });
  } catch (error) {
    console.error('[KatalogController.searchKatalog] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses pencarian katalog.',
    });
  }
};

const getDaftarToko = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT idPenjual, namaToko, namaPemilik, alamatToko, nomorTelepon
       FROM Penjual
       ORDER BY idPenjual ASC`
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapTokoRow),
    });
  } catch (error) {
    console.error('[KatalogController.getDaftarToko] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memuat daftar mitra toko.',
    });
  }
};

module.exports = {
  getKatalogRekomendasi,
  getDetailMenu,
  searchKatalog,
  getDaftarToko,
};
