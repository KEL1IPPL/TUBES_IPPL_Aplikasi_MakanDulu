'use strict';

const layananNotifikasi = require('../services/layanan_notifikasi');

/**
 * Control Object: notif_pesananan_controller
 * Menyediakan endpoint pembacaan notifikasi pemesanan untuk Penjual dan Pembeli.
 */
const getNotifikasiPengguna = async (req, res) => {
  try {
    const role = req.user?.role || req.query.role;
    const idUser = req.user?.id || req.query.idUser;

    if (!role || !idUser) {
      return res.status(200).json({
        success: true,
        data: [],
        unreadCount: 0,
      });
    }

    const daftar = await layananNotifikasi.ambilNotifikasi({ role, idUser });
    const unreadCount = daftar.filter((n) => !n.sudahDibaca).length;

    return res.status(200).json({
      success: true,
      data: daftar,
      unreadCount,
    });
  } catch (error) {
    console.error('[NotifController.getNotifikasiPengguna] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat notifikasi.',
    });
  }
};

const tandaiNotifikasiDibaca = async (req, res) => {
  try {
    const role = req.user?.role || req.body?.role;
    const idUser = req.user?.id || req.body?.idUser;
    const { idNotifikasi } = req.body || {};

    if (!role || !idUser) {
      return res.status(400).json({ success: false, message: 'Identitas pengguna diperlukan.' });
    }

    await layananNotifikasi.tandaiNotifikasiDibaca({ role, idUser, idNotifikasi });
    return res.status(200).json({
      success: true,
      message: 'Notifikasi ditandai sudah dibaca.',
    });
  } catch (error) {
    console.error('[NotifController.tandaiNotifikasiDibaca] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status notifikasi.',
    });
  }
};

module.exports = {
  getNotifikasiPengguna,
  tandaiNotifikasiDibaca,
};
