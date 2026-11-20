import React from 'react';
import { OrderRecord } from '../types';

interface HalamanRiwayatPesananProps {
  orderHistory?: OrderRecord[];
  onReorder?: (order: OrderRecord) => void;
  onBackToCatalog: () => void;
}

const HalamanRiwayatPesanan: React.FC<HalamanRiwayatPesananProps> = ({
  orderHistory = [],
  onReorder,
  onBackToCatalog
}) => {
  const mockPastOrders: OrderRecord[] = orderHistory.length > 0 ? orderHistory : [
    {
      id: 'ord-hist-1',
      orderNumber: 'MKD-98124',
      items: [
        {
          id: 'c1',
          menuId: 'menu-1',
          name: 'Bebek Goreng Bumbu Hitam Madura',
          price: 38000,
          qty: 2,
          sublabel: 'Bebek Rempah Hitam Gurih',
          restaurant: 'Resto Bebek Juara'
        },
        {
          id: 'c2',
          menuId: 'menu-4',
          name: 'Es Jeruk Nipis Madu Murni',
          price: 12000,
          qty: 2,
          sublabel: 'Manis Asam Segar',
          restaurant: 'Resto Bebek Juara'
        }
      ],
      subtotal: 100000,
      shippingFee: 10000,
      serviceFee: 2000,
      discount: 25000,
      total: 87000,
      paymentMethod: 'ewallet',
      selectedProvider: 'GoPay',
      address: {
        label: 'Rumah',
        street: 'Jl. Sudirman No. 42 (Gedung B Lt. 3)',
        details: 'Kebayoran Baru, Jakarta Selatan',
        notes: 'Titip di resepsionis'
      },
      status: 'selesai',
      orderTime: '18 Oktober 2026, 12:45 WIB',
      estimatedDeliveryTime: 'Selesai',
      driverName: 'Ahmad Fauzi',
      driverPhone: '0812-9981-2231',
      driverPlate: 'B 4821 KOP',
      driverRating: 4.9,
      merchantTimerSeconds: 0
    },
    {
      id: 'ord-hist-2',
      orderNumber: 'MKD-97301',
      items: [
        {
          id: 'c3',
          menuId: 'menu-2',
          name: 'Bakso Urat Granat Pedas Spesial',
          price: 28000,
          qty: 1,
          sublabel: 'Pedas Nendang',
          restaurant: 'Warung Bakso Mas Joko'
        }
      ],
      subtotal: 28000,
      shippingFee: 10000,
      serviceFee: 2000,
      discount: 0,
      total: 40000,
      paymentMethod: 'cod',
      selectedProvider: 'Tunai di Tempat',
      address: {
        label: 'Kantor',
        street: 'Gedung Menara Mandiri Lt. 14',
        details: 'Gatot Subroto, Jakarta Selatan',
        notes: 'Panggil saat sampai lobi'
      },
      status: 'selesai',
      orderTime: '12 Oktober 2026, 19:10 WIB',
      estimatedDeliveryTime: 'Selesai',
      driverName: 'Bambang Supriyadi',
      driverPhone: '0857-1122-3344',
      driverPlate: 'B 3190 ZZA',
      driverRating: 4.8,
      merchantTimerSeconds: 0
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">history</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-[#111c2d]">Riwayat Pesanan Anda</h1>
            <p className="text-xs text-[#5a4138]">Daftar riwayat transaksi kuliner sebelumnya</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToCatalog}
          className="px-4 py-2 rounded-xl bg-[#a33900] text-white text-xs font-bold shadow-xs hover:bg-[#cc4900] transition-colors"
        >
          Pesan Lagi
        </button>
      </div>

      <div className="space-y-4">
        {mockPastOrders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm hover:shadow-md transition-shadow space-y-4"
          >
            <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#f0f3ff] gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-[#a33900] block">
                  Pesanan #{ord.orderNumber}
                </span>
                <span className="text-[11px] text-[#5a4138]">{ord.orderTime}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                ord.status === 'selesai'
                  ? 'bg-[#6ffbbe]/30 text-[#004d33]'
                  : 'bg-[#ffdad6] text-[#ba1a1a]'
              }`}>
                {ord.status === 'selesai' ? 'Pesanan Selesai' : 'Dibatalkan'}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#111c2d]">
                {ord.items[0]?.restaurant}
              </span>
              <div className="divide-y divide-[#f9f9ff]">
                {ord.items.map((it) => (
                  <div key={it.id} className="py-1.5 flex justify-between text-xs text-[#5a4138]">
                    <span>{it.qty}x {it.name}</span>
                    <span className="font-bold text-[#111c2d]">
                      Rp {(it.price * it.qty).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#dee8ff] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#5a4138] block">Total Pembayaran ({ord.paymentMethod.toUpperCase()})</span>
                <span className="text-base font-black text-[#a33900]">
                  Rp {ord.total.toLocaleString('id-ID')}
                </span>
              </div>

              {onReorder && (
                <button
                  type="button"
                  onClick={() => onReorder(ord)}
                  className="px-4 py-2 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dee8ff]"
                >
                  <span className="material-symbols-outlined text-sm">replay</span>
                  <span>Pesan Ulang</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HalamanRiwayatPesanan;
