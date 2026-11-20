import React, { useState } from 'react';

interface HalamanLaporanPenjualanProps {
  onBackToDashboard: () => void;
}

const HalamanLaporanPenjualan: React.FC<HalamanLaporanPenjualanProps> = ({ onBackToDashboard }) => {
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  const topDishes = [
    { name: 'Bebek Goreng Bumbu Hitam Madura', qty: 142, revenue: 5396000 },
    { name: 'Ayam Bakar Bumbu Rujak Pedas', qty: 98, revenue: 3136000 },
    { name: 'Es Cendol Nangka Gula Aren', qty: 85, revenue: 1275000 },
    { name: 'Bakso Urat Granat Pedas', qty: 74, revenue: 2072000 }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-[#111c2d]">Laporan Penjualan & Omzet</h1>
            <p className="text-xs text-[#5a4138]">Analisis performa penjualan, omzet kotor, dan hidangan terpopuler</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="inline-flex p-1 bg-[#f0f3ff] rounded-xl border border-[#dee8ff]">
          {(['harian', 'mingguan', 'bulanan'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                period === p
                  ? 'bg-[#825100] text-white shadow-2xs'
                  : 'text-[#5a4138] hover:text-[#111c2d]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Total Omzet Kotor
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#006c49]">Rp 11.879.000</span>
          <span className="text-[11px] text-[#006c49] font-bold block">▲ +14% vs periode sebelumnya</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Total Porsi Terjual
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#825100]">399 Porsi</span>
          <span className="text-[11px] text-[#5a4138] block">Dari 138 pesanan masuk</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Tingkat Sukses Pesanan
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#111c2d]">98.6%</span>
          <span className="text-[11px] text-[#006c49] font-bold block">Hanya 2 pembatalan kurir</span>
        </div>
      </div>

      {/* Top Dishes Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider pb-2 border-b border-[#f0f3ff]">
          Hidangan Terlaris Resto ({period})
        </h3>

        <div className="divide-y divide-[#f0f3ff]">
          {topDishes.map((dish, i) => (
            <div key={i} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#f0f3ff] text-[#825100] font-black text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <span className="font-extrabold text-[#111c2d] block">{dish.name}</span>
                  <span className="text-[11px] text-[#5a4138]">{dish.qty} porsi terjual</span>
                </div>
              </div>
              <span className="font-black text-[#006c49]">
                Rp {dish.revenue.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HalamanLaporanPenjualan;
