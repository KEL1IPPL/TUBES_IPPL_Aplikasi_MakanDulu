'use strict';

const midtransClient = require('midtrans-client');
require('dotenv').config();

const serverKey = (
  process.env.MIDTRANS_SERVER_KEY ||
  process.env.api_key_midtrans
).trim();

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Inisialisasi Midtrans Snap API Client
const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: (process.env.MIDTRANS_CLIENT_KEY || '').trim(),
});

/**
 * Buat transaksi Snap Midtrans untuk pembayaran online (E-Wallet, VA, QRIS, Kartu).
 * @param {Object} params
 * @param {string} params.orderId
 * @param {number} params.grossAmount
 * @param {Array} params.itemDetails
 * @param {Object} params.customerDetails
 * @returns {Promise<{token: string, redirect_url: string}>}
 */
const buatTransaksiSnap = async ({
  orderId,
  grossAmount,
  itemDetails = [],
  customerDetails = {},
}) => {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount),
    },
    customer_details: {
      first_name: customerDetails.nama || 'Pelanggan MakanDulu',
      email: customerDetails.email || 'pelanggan@makandulu.id',
      phone: customerDetails.nomorTelepon || customerDetails.phone || '081234567890',
      billing_address: {
        address: customerDetails.alamat || 'Indonesia',
      },
      shipping_address: {
        address: customerDetails.alamat || 'Indonesia',
      },
    },
  };

  if (itemDetails.length > 0) {
    parameter.item_details = itemDetails.map((item) => ({
      id: String(item.id || item.idMenu || 'item'),
      price: Math.round(item.price || item.hargaSatuan || 0),
      quantity: Math.max(1, Number(item.qty || item.jumlah || 1)),
      name: String(item.name || item.namaMenu || 'Hidangan').substring(0, 50),
    }));
  }

  const res = await snap.createTransaction(parameter);
  return {
    token: res.token,
    redirect_url: res.redirect_url,
  };
};

/**
 * Cek status transaksi pembayaran langsung dari server Midtrans.
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
const cekStatusTransaksi = async (orderId) => {
  return await snap.transaction.status(orderId);
};

/**
 * Verifikasi webhook/notifikasi HTTP POST yang dikirim oleh Midtrans.
 * @param {Object} notificationBody
 * @returns {Promise<Object>}
 */
const verifikasiNotifikasi = async (notificationBody) => {
  return await snap.transaction.notification(notificationBody);
};

module.exports = {
  snap,
  buatTransaksiSnap,
  cekStatusTransaksi,
  verifikasiNotifikasi,
};
