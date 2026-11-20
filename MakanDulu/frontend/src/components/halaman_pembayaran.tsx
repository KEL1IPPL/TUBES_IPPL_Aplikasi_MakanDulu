import React, { useState } from 'react';
import { PaymentMethod, EWalletProvider, BankProvider } from '../types';

interface HalamanPembayaranProps {
  totalAmount: number;
  discountAmount?: number;
  onConfirmPayment: (method: PaymentMethod, provider?: string) => void;
  onBackToCheckout: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanPembayaran: React.FC<HalamanPembayaranProps> = ({
  totalAmount,
  discountAmount = 0,
  onConfirmPayment,
  onBackToCheckout,
  showToast
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ewallet');
  const [selectedEWallet, setSelectedEWallet] = useState<EWalletProvider>('GoPay');
  const [selectedBank, setSelectedBank] = useState<BankProvider>('Bank BCA');
  const [isProcessing, setIsProcessing] = useState(false);

  const ewalletOptions: { id: EWalletProvider; name: string; balance: string }[] = [
    { id: 'GoPay', name: 'GoPay', balance: 'Saldo: Rp 245.000' },
    { id: 'DANA', name: 'DANA', balance: 'Saldo: Rp 120.000' },
    { id: 'OVO', name: 'OVO Cash', balance: 'Saldo: Rp 85.500' }
  ];

  const bankOptions: BankProvider[] = [
    'Bank BCA',
    'Bank BNI',
    'Bank Mandiri',
    'Bank Lainnya'
  ];

  const handlePay = () => {
    setIsProcessing(true);
    const provider =
      selectedMethod === 'ewallet'
        ? selectedEWallet
        : selectedMethod === 'bank_va'
        ? selectedBank
        : 'Tunai di Tempat (COD)';

    setTimeout(() => {
      setIsProcessing(false);
      showToast('Pembayaran Dikonfirmasi!', `Metode ${provider} berhasil diproses.`);
      onConfirmPayment(selectedMethod, provider);
    }, 700);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCheckout}
            className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-[#111c2d]">Metode Pembayaran</h1>
            <p className="text-xs text-[#5a4138]">Tentukan cara pembayaran yang Anda inginkan</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#006c49]/20 text-[#006c49] text-xs font-black">
          Langkah 2 dari 2
        </span>
      </div>

      {/* Tagihan Banner */}
      <div className="bg-gradient-to-r from-[#a33900] to-[#cc4900] rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs text-white/80 block">Total yang Harus Dibayar</span>
          <span className="text-2xl sm:text-3xl font-black">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
          {discountAmount > 0 && (
            <span className="text-[11px] text-white/90 block mt-1 font-semibold">
              (Sudah termasuk potongan diskon Rp {discountAmount.toLocaleString('id-ID')})
            </span>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
        </div>
      </div>

      {/* Payment Options Accordion */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-4">
        {/* Option 1: E-Wallet */}
        <div
          onClick={() => setSelectedMethod('ewallet')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedMethod === 'ewallet'
              ? 'border-[#a33900] bg-[#ffdbce]/20 shadow-xs'
              : 'border-[#dee8ff] bg-white hover:bg-[#f9f9ff]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[#a33900]">smartphone</span>
              <div>
                <span className="text-xs font-black text-[#111c2d] block">E-Wallet (Instan & Tanpa Biaya)</span>
                <span className="text-[11px] text-[#5a4138]">GoPay, DANA, OVO Terhubung</span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'ewallet' ? 'border-[#a33900] bg-[#a33900]' : 'border-[#cfdaf2]'
            }`}>
              {selectedMethod === 'ewallet' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {selectedMethod === 'ewallet' && (
            <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-[#dee8ff]">
              {ewalletOptions.map((ew) => (
                <div
                  key={ew.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEWallet(ew.id);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedEWallet === ew.id
                      ? 'bg-white border-[#a33900] ring-2 ring-[#a33900]/20 shadow-xs'
                      : 'bg-[#f0f3ff] border-[#dee8ff]'
                  }`}
                >
                  <span className="text-xs font-black text-[#111c2d] block">{ew.name}</span>
                  <span className="text-[10px] text-[#006c49] font-bold block mt-0.5">{ew.balance}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Option 2: Virtual Account */}
        <div
          onClick={() => setSelectedMethod('bank_va')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedMethod === 'bank_va'
              ? 'border-[#a33900] bg-[#ffdbce]/20 shadow-xs'
              : 'border-[#dee8ff] bg-white hover:bg-[#f9f9ff]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[#a33900]">account_balance</span>
              <div>
                <span className="text-xs font-black text-[#111c2d] block">Virtual Account (Bank Transfer)</span>
                <span className="text-[11px] text-[#5a4138]">BCA, BNI, Mandiri otomatis diverifikasi</span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'bank_va' ? 'border-[#a33900] bg-[#a33900]' : 'border-[#cfdaf2]'
            }`}>
              {selectedMethod === 'bank_va' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {selectedMethod === 'bank_va' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#dee8ff]">
              {bankOptions.map((bank) => (
                <button
                  key={bank}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBank(bank);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedBank === bank
                      ? 'bg-white text-[#a33900] border-[#a33900] shadow-xs'
                      : 'bg-[#f0f3ff] text-[#5a4138] border-[#dee8ff]'
                  }`}
                >
                  {bank}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Option 3: COD */}
        <div
          onClick={() => setSelectedMethod('cod')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedMethod === 'cod'
              ? 'border-[#a33900] bg-[#ffdbce]/20 shadow-xs'
              : 'border-[#dee8ff] bg-white hover:bg-[#f9f9ff]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[#a33900]">payments</span>
              <div>
                <span className="text-xs font-black text-[#111c2d] block">Bayar Tunai di Tempat (COD)</span>
                <span className="text-[11px] text-[#5a4138]">Bayar tunai ke kurir saat pesanan tiba</span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'cod' ? 'border-[#a33900] bg-[#a33900]' : 'border-[#cfdaf2]'
            }`}>
              {selectedMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={handlePay}
        className="w-full py-4 px-6 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {isProcessing ? (
          <>
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            <span>Memproses Pembayaran...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">lock</span>
            <span>Konfirmasi & Bayar Rp {totalAmount.toLocaleString('id-ID')}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default HalamanPembayaran;
