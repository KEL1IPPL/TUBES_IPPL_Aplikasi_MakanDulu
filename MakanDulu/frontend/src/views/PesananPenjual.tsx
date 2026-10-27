import React, { useState, useEffect } from 'react';

interface IncomingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  items: { name: string; qty: number; modifier: string; price: number }[];
  totalPrice: number;
  remainingSeconds: number;
  status: 'menunggu' | 'dimasak' | 'siap_diambil' | 'auto_batal_10mnt';
  paymentType: string;
  orderTime: string;
}

interface PesananPenjualProps {
  showToast: (title: string, message: string, isError?: boolean) => void;
  onNavigateToDashboard?: () => void;
}

export const PesananPenjual: React.FC<PesananPenjualProps> = ({
  showToast,
  onNavigateToDashboard
}) => {
  const [activeFilter, setActiveFilter] = useState<'semua' | 'menunggu' | 'dimasak' | 'siap' | 'batal'>('semua');
  const [orders, setOrders] = useState<IncomingOrder[]>([
    {
      id: 'ord-m-1',
      orderNumber: 'MKD-998214',
      customerName: 'Siti Rahmawati',
      customerAddress: 'Jl. Sudirman No. 42 (Gedung B Lt. 3), Kebayoran Baru',
      items: [
        { name: 'Nasi Bebek Sinjay Madura Krispi', qty: 2, modifier: 'Pedas Sedang • Sambal Terpisah', price: 38000 },
        { name: 'Es Jeruk Nipis Madu Selasih', qty: 1, modifier: 'Kurang Manis • Es Sedang', price: 12000 }
      ],
      totalPrice: 88000,
      remainingSeconds: 490, // ~8 min
      status: 'dimasak',
      paymentType: 'E-Wallet GoPay (Lunas)',
      orderTime: '12:45 WIB'
    },
    {
      id: 'ord-m-2',
      orderNumber: 'MKD-998215',
      customerName: 'Dimas Prasetyo',
      customerAddress: 'Jl. Senopati No. 18, Jakarta Selatan',
      items: [
        { name: 'Ayam Geprek Sambal Korek Level 5', qty: 1, modifier: 'Ekstrem Pedas Level 5', price: 26000 }
      ],
      totalPrice: 26000,
      remainingSeconds: 580, // ~9 min 40 sec
      status: 'menunggu',
      paymentType: 'COD (Bayar Tunai)',
      orderTime: '12:51 WIB'
    },
    {
      id: 'ord-m-3',
      orderNumber: 'MKD-998216',
      customerName: 'Bunga Citra',
      customerAddress: 'Apartemen Sudirman Park Tower A Lt. 12',
      items: [
        { name: 'Nasi Bakar Cumi Cabe Ijo', qty: 2, modifier: 'Ekstra Kemangi Harum', price: 32000 }
      ],
      totalPrice: 64000,
      remainingSeconds: 310,
      status: 'siap_diambil',
      paymentType: 'Virtual Account BCA (Lunas)',
      orderTime: '12:35 WIB'
    }
  ]);

  // Real-time 10-minute countdown with automatic rejection when time expires
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.status === 'menunggu') {
            const nextSecs = order.remainingSeconds - 1;
            if (nextSecs <= 0) {
              // Otomatis ditolak oleh sistem karena penjual tidak konfirmasi dalam 10 menit
              showToast(
                'Pesanan Otomatis Dibatalkan',
                `Pesanan #${order.orderNumber} otomatis dibatalkan sistem karena batas 10 menit berakhir tanpa konfirmasi penjual.`,
                true
              );
              return {
                ...order,
                remainingSeconds: 0,
                status: 'auto_batal_10mnt'
              };
            }
            return { ...order, remainingSeconds: nextSecs };
          }
          return order;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Penjual can ONLY confirm the order, NO manual reject button!
  const handleConfirmOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, status: 'dimasak' } : ord))
    );
    showToast('Pesanan Dikonfirmasi!', 'Pesanan berhasil diterima dan diteruskan ke dapur untuk dimasak.');
  };

  const handleReadyForCourier = (id: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, status: 'siap_diambil' } : ord))
    );
    showToast('Makanan Siap!', 'Notifikasi dikirim ke kurir pengantar untuk segera melakukan serah terima.');
  };

  // Simulation tool to instantly test auto-cancellation after 10 min
  const simulateAutoCancelTimer = (id: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === id
          ? {
              ...ord,
              remainingSeconds: 0,
              status: 'auto_batal_10mnt'
            }
          : ord
      )
    );
    showToast(
      'Simulasi Auto-Batal 10 Mnt',
      'Waktu 10 menit habis tanpa konfirmasi penjual. Sistem otomatis menolak pesanan!',
      true
    );
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeFilter === 'menunggu') return ord.status === 'menunggu';
    if (activeFilter === 'dimasak') return ord.status === 'dimasak';
    if (activeFilter === 'siap') return ord.status === 'siap_diambil';
    if (activeFilter === 'batal') return ord.status === 'auto_batal_10mnt';
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#dee8ff] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#825100] text-xs font-bold uppercase">
              Mode Penjual (Merchant)
            </span>
            <span className="text-xs text-[#006c49] font-bold bg-[#6ffbbe]/40 px-2.5 py-0.5 rounded-full">
              Sistem Otomatis 10 Menit Aktif
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
            Menu Pesanan Resto Bebek Juara
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4138] mt-1">
            Kelola antrean pesanan masuk. <strong>Penjual tidak dapat menolak pesanan secara manual</strong>. Konfirmasi sebelum timer 10 menit habis, atau sistem akan otomatis membatalkan pesanan.
          </p>
        </div>

        {onNavigateToDashboard && (
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-4 py-2.5 bg-[#825100] hover:bg-[#a36700] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-sm">monitoring</span>
            <span>Dashboard & Kelola Stok</span>
          </button>
        )}
      </div>

      {/* Rules Notice Banner */}
      <div className="my-5 p-4 rounded-2xl bg-[#ffddb8]/40 border border-[#ffb95f] flex items-start gap-3">
        <span className="material-symbols-outlined text-[#825100] text-xl mt-0.5 shrink-0">
          info
        </span>
        <div className="text-xs text-[#5a4138] leading-relaxed">
          <strong className="text-[#111c2d]">Kebijakan Operasional Pesanan:</strong> Penjual tidak memiliki tombol tolak manual. Sistem timer 10 menit berjalan secara otomatis. Jika penjual tidak menekan tombol <strong>"Konfirmasi & Siapkan"</strong> sampai hitung mundur 0:00, sistem secara otomatis menolak pesanan pelanggan demi menjaga kepastian layanan.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto my-4 pb-1">
        {[
          { id: 'semua', label: `Semua Pesanan (${orders.length})` },
          { id: 'menunggu', label: `Perlu Konfirmasi (${orders.filter((o) => o.status === 'menunggu').length})` },
          { id: 'dimasak', label: `Sedang Dimasak (${orders.filter((o) => o.status === 'dimasak').length})` },
          { id: 'siap', label: `Siap Diambil Kurir (${orders.filter((o) => o.status === 'siap_diambil').length})` },
          { id: 'batal', label: `Batal Otomatis 10 Mnt (${orders.filter((o) => o.status === 'auto_batal_10mnt').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              activeFilter === tab.id
                ? 'bg-[#825100] text-white border-[#825100] shadow-xs'
                : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className={`rounded-3xl p-6 border transition-all shadow-sm flex flex-col justify-between ${
              ord.status === 'auto_batal_10mnt'
                ? 'bg-[#f0f3ff] border-[#dee8ff] opacity-80'
                : 'bg-white border-[#dee8ff] hover:shadow-md'
            }`}
          >
            <div>
              {/* Order Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-[#111c2d] bg-[#f0f3ff] px-2 py-0.5 rounded-lg border border-[#dee8ff]">
                    #{ord.orderNumber}
                  </span>
                  <span className="text-[11px] text-[#5a4138]">{ord.orderTime}</span>
                </div>

                {/* Status Badges */}
                {ord.status === 'menunggu' && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold animate-pulse">
                    <span className="material-symbols-outlined text-xs">alarm</span>
                    <span>Sisa: {formatTimer(ord.remainingSeconds)}</span>
                  </div>
                )}
                {ord.status === 'dimasak' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#825100] text-[11px] font-bold">
                    Sedang Dimasak
                  </span>
                )}
                {ord.status === 'siap_diambil' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-[11px] font-bold">
                    Siap Diambil Kurir
                  </span>
                )}
                {ord.status === 'auto_batal_10mnt' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold">
                    Otomatis Dibatalkan Sistem
                  </span>
                )}
              </div>

              {/* Customer Info */}
              <div className="py-3">
                <span className="text-xs font-bold text-[#111c2d] block">{ord.customerName}</span>
                <span className="text-[11px] text-[#5a4138] line-clamp-1 mt-0.5">{ord.customerAddress}</span>
              </div>

              {/* Ordered Menu Items */}
              <div className="bg-[#f0f3ff] p-3 rounded-2xl border border-[#dee8ff] space-y-2">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-[#111c2d]">{it.qty}x {it.name}</span>
                      <span className="block text-[11px] text-[#a33900]">{it.modifier}</span>
                    </div>
                    <span className="font-semibold text-[#111c2d]">
                      Rp {(it.price * it.qty).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Payment */}
              <div className="pt-3 flex justify-between items-center text-xs">
                <span className="text-[#5a4138]">{ord.paymentType}</span>
                <span className="text-sm font-extrabold text-[#a33900]">
                  Rp {ord.totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Buttons - NO MANUAL REJECT BUTTON */}
            <div className="pt-4 mt-3 border-t border-[#f0f3ff]">
              {ord.status === 'menunggu' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmOrder(ord.id)}
                    className="w-full py-3 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">soup_kitchen</span>
                    <span>Konfirmasi & Siapkan Pesanan</span>
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#5a4138]">
                      Auto-batal jika 10 mnt habis
                    </span>
                    <button
                      type="button"
                      onClick={() => simulateAutoCancelTimer(ord.id)}
                      className="text-[10px] text-[#ba1a1a] font-bold hover:underline"
                    >
                      Uji Simulasi Auto-Batal
                    </button>
                  </div>
                </div>
              )}

              {ord.status === 'dimasak' && (
                <button
                  type="button"
                  onClick={() => handleReadyForCourier(ord.id)}
                  className="w-full py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">moped</span>
                  <span>Makanan Selesai Dimasak (Panggil Kurir)</span>
                </button>
              )}

              {ord.status === 'siap_diambil' && (
                <div className="w-full py-2.5 rounded-xl bg-[#6ffbbe]/30 text-[#006c49] text-xs font-bold text-center border border-[#6cf8bb]">
                  Kurir sedang dalam perjalanan menuju resto
                </div>
              )}

              {ord.status === 'auto_batal_10mnt' && (
                <div className="w-full p-2.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs text-center border border-[#ffb4ab]">
                  <p className="font-bold">Pesanan Ditolak Otomatis oleh Sistem</p>
                  <p className="text-[10px] mt-0.5">Batas 10 menit berakhir tanpa konfirmasi penjual.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MerchantOrdersView = PesananPenjual;
export const TampilanPesananPenjual = PesananPenjual;
export default PesananPenjual;
