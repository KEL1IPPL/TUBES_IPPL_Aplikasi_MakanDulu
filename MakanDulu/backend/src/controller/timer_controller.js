'use strict';

const db = require('../config/db');

/**
 * Control Object: timer_controller
 *
 * Mengelola batas waktu konfirmasi penjual selama 10 menit sesuai Diagram Sequence:
 * - Main Flow: stop_timer(idPesanan) -> "timer dihentikan"
 * - Alternative Flow #1 Auto Cancel: Waktu habis -> memanggil pesanan_controller.autoCancelPesanan(idPesanan)
 */

const DURASI_KONFIRMASI_MS = 10 * 60 * 1000; // 10 menit
const activeTimers = new Map();

const tanganiWaktuHabis = async (idPesanan) => {
  const id = Number(idPesanan);
  activeTimers.delete(id);
  console.log(`[timer_controller] Waktu habis untuk Pesanan #${id}. Memicu autoCancelPesanan...`);

  try {
    // Lazy require untuk mencegah circular dependency dengan pesanan_controller
    const { autoCancelPesanan } = require('./pesanan_controller');
    await autoCancelPesanan(id);
  } catch (err) {
    console.error(`[timer_controller] Gagal memproses auto-cancel Pesanan #${id}:`, err.message);
  }
};

/**
 * Memulai hitung mundur 10 menit untuk pesanan yang baru masuk ke penjual.
 */
const start_timer = (idPesanan, durationMs = DURASI_KONFIRMASI_MS) => {
  const id = Number(idPesanan);
  if (!id) return null;

  if (activeTimers.has(id)) {
    clearTimeout(activeTimers.get(id).timeoutId);
    activeTimers.delete(id);
  }

  const safeDuration = Math.max(1000, Number(durationMs) || DURASI_KONFIRMASI_MS);
  const expiresAt = Date.now() + safeDuration;

  const timeoutId = setTimeout(() => {
    tanganiWaktuHabis(id);
  }, safeDuration);

  // Jangan halangi Node process exit jika hanya timer testing
  if (typeof timeoutId.unref === 'function') {
    timeoutId.unref();
  }

  activeTimers.set(id, { timeoutId, idPesanan: id, expiresAt });
  console.log(
    `[timer_controller] Timer dimulai untuk Pesanan #${id} (durasi ${Math.round(safeDuration / 1000)} dtk)`
  );

  return { idPesanan: id, expiresAt, durationMs: safeDuration };
};

/**
 * Main Flow: stop_timer(idPesanan) -> "timer dihentikan"
 */
const stop_timer = (idPesanan) => {
  const id = Number(idPesanan);
  const entry = activeTimers.get(id);
  if (entry) {
    clearTimeout(entry.timeoutId);
    activeTimers.delete(id);
  }
  console.log(`[timer_controller] stop_timer(${id}) -> timer dihentikan`);
  return {
    stopped: true,
    idPesanan: id,
    message: 'timer dihentikan',
  };
};

/**
 * Simulasi "Waktu habis" secara instan (untuk keperluan pengujian Alternative Flow #1 Auto Cancel)
 */
const triggerWaktuHabis = async (idPesanan) => {
  const id = Number(idPesanan);
  const entry = activeTimers.get(id);
  if (entry) {
    clearTimeout(entry.timeoutId);
    activeTimers.delete(id);
  }
  const { autoCancelPesanan } = require('./pesanan_controller');
  return await autoCancelPesanan(id);
};

const getSisaDetik = (idPesanan, sisaDetikDb = null) => {
  if (sisaDetikDb !== null && sisaDetikDb !== undefined) {
    return Math.max(0, Number(sisaDetikDb));
  }
  const entry = activeTimers.get(Number(idPesanan));
  if (entry) {
    return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
  }
  return 600;
};

/**
 * Pulihkan timer yang belum selesai saat server backend di-restart.
 */
const pulihkanTimerSaatStartup = async () => {
  try {
    const [rows] = await db.execute(
      `SELECT p.idPesanan, p.batasKonfirmasiAt,
              TIMESTAMPDIFF(SECOND, NOW(), p.batasKonfirmasiAt) AS sisaDetikDb,
              b.metodePembayaran, b.statusPembayaran
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       WHERE p.statusPesanan = 'Menunggu Konfirmasi Penjual'`
    );

    for (const row of rows) {
      const isCod =
        String(row.metodePembayaran || '').toUpperCase().includes('COD') &&
        !String(row.metodePembayaran || '').toUpperCase().includes('NON-COD');
      const isPaid = row.statusPembayaran === 'Pembayaran Berhasil';

      // Hanya pesanan COD atau Non-COD yang sudah dibayar yang punya timer konfirmasi penjual
      if (!isCod && !isPaid) continue;

      if (!row.batasKonfirmasiAt) {
        await db.execute(
          `UPDATE Pesanan SET batasKonfirmasiAt = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE idPesanan = ?`,
          [row.idPesanan]
        );
        start_timer(row.idPesanan, DURASI_KONFIRMASI_MS);
      } else {
        const sisaDetik = Number(row.sisaDetikDb ?? 0);
        if (sisaDetik <= 0) {
          await tanganiWaktuHabis(row.idPesanan);
        } else {
          start_timer(row.idPesanan, sisaDetik * 1000);
        }
      }
    }
  } catch (err) {
    console.warn('[timer_controller] Gagal memulihkan timer startup:', err.message);
  }
};

module.exports = {
  DURASI_KONFIRMASI_MS,
  start_timer,
  stop_timer,
  startTimer: start_timer,
  stopTimer: stop_timer,
  triggerWaktuHabis,
  getSisaDetik,
  pulihkanTimerSaatStartup,
};
