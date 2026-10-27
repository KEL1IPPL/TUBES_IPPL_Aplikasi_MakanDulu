import React, { useState } from 'react';

export interface ModalIsiSaldoProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTopUpSuccess: (amount: number) => void;
}

export const ModalIsiSaldo: React.FC<ModalIsiSaldoProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onTopUpSuccess
}) => {
  const [nominalDipilih, setNominalDipilih] = useState<number>(50000);
  const [nominalKustom, setNominalKustom] = useState<string>('');
  const [metodeDipilih, setMetodeDipilih] = useState<string>('qris');
  const [sedangMemproses, setSedangMemproses] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  if (!isOpen) return null;

  const pilihanNominal = [25000, 50000, 100000, 200000, 500000];

  const nominalAkhir = nominalKustom ? parseInt(nominalKustom, 10) || nominalDipilih : nominalDipilih;

  const tanganiIsiSaldo = () => {
    if (nominalAkhir < 10000) {
      alert('Minimal pengisian saldo adalah Rp 10.000');
      return;
    }

    setSedangMemproses(true);
    setTimeout(() => {
      setSedangMemproses(false);
      setBerhasil(true);

      setTimeout(() => {
        onTopUpSuccess(nominalAkhir);
        setBerhasil(false);
        setNominalKustom('');
        onClose();
      }, 900);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 border border-[#dee8ff]">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#111c2d]">Top Up Saldo MakanPay</h3>
              <p className="text-xs text-[#5a4138]">
                Saldo saat ini: <strong className="text-[#a33900]">Rp {currentBalance.toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {berhasil ? (
          <div className="py-8 flex flex-col items-center text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#6ffbbe]/40 text-[#006c49] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
            </div>
            <h4 className="text-lg font-bold text-[#111c2d]">Top Up Berhasil!</h4>
            <p className="text-xs text-[#5a4138]">
              Saldo sebesar <strong>Rp {nominalAkhir.toLocaleString('id-ID')}</strong> telah ditambahkan ke dompet MakanPay Anda.
            </p>
          </div>
        ) : (
          <>
            {/* Pilihan Nominal Cepat */}
            <div>
              <span className="text-xs font-bold text-[#111c2d] mb-2 block uppercase tracking-wider">
                Pilih Nominal Pengisian
              </span>
              <div className="grid grid-cols-3 gap-2">
                {pilihanNominal.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setNominalDipilih(amount);
                      setNominalKustom('');
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border ${
                      nominalDipilih === amount && !nominalKustom
                        ? 'bg-[#a33900] text-white border-[#a33900] shadow-sm scale-102'
                        : 'bg-[#f9f9ff] text-[#111c2d] border-[#dee8ff] hover:bg-[#dee8ff]/50'
                    }`}
                  >
                    Rp {amount.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              {/* Input Nominal Kustom */}
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-[#5a4138] block mb-1">
                  Atau masukkan nominal lainnya (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5a4138]">Rp</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    placeholder="Contoh: 75000"
                    value={nominalKustom}
                    onChange={(e) => {
                      setNominalKustom(e.target.value);
                      if (e.target.value) {
                        setNominalDipilih(parseInt(e.target.value, 10) || 0);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-[#f9f9ff] border border-[#dee8ff] rounded-xl focus:border-[#a33900] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pilihan Metode Bayar Top Up */}
            <div>
              <span className="text-xs font-bold text-[#111c2d] mb-2 block uppercase tracking-wider">
                Metode Pembayaran Top Up
              </span>
              <div className="space-y-2">
                {[
                  { id: 'qris', label: 'QRIS Instan (GoPay, OVO, ShopeePay)', icon: 'qr_code_2' },
                  { id: 'bca_va', label: 'BCA Virtual Account', icon: 'account_balance' },
                  { id: 'mandiri_va', label: 'Mandiri Livin Virtual Account', icon: 'account_balance' },
                  { id: 'bri_va', label: 'BRImo Virtual Account', icon: 'account_balance' }
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      metodeDipilih === method.id
                        ? 'border-[#a33900] bg-[#ffdbce]/20'
                        : 'border-[#dee8ff] bg-[#f9f9ff] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="topup_method"
                        value={method.id}
                        checked={metodeDipilih === method.id}
                        onChange={() => setMetodeDipilih(method.id)}
                        className="accent-[#a33900]"
                      />
                      <span className="text-xs font-semibold text-[#111c2d]">{method.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#5a4138]">
                      {method.icon}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2">
              <button
                type="button"
                disabled={sedangMemproses || nominalAkhir < 10000}
                onClick={tanganiIsiSaldo}
                className={`w-full py-3 font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  nominalAkhir < 10000
                    ? 'bg-[#e7eeff] text-[#8e98aa] cursor-not-allowed'
                    : 'bg-[#a33900] hover:bg-[#cc4900] text-white active:scale-98'
                }`}
              >
                {sedangMemproses ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    <span>Konfirmasi Isi Saldo Rp {nominalAkhir.toLocaleString('id-ID')}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const TopUpModal = ModalIsiSaldo;
export default ModalIsiSaldo;
