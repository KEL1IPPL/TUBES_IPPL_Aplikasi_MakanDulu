import React, { useState } from 'react';
import { PaymentMethod } from '../types';

interface PaymentTransactionResult {
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: 'BERHASIL' | 'MENUNGGU' | 'GAGAL';
  providerName: string;
  authCode: string;
  timestamp: string;
}

interface LayananPembayaranProps {
  onProcessPayment?: (result: PaymentTransactionResult) => void;
  showToast?: (title: string, message: string, isError?: boolean) => void;
}

const LayananPembayaran: React.FC<LayananPembayaranProps> = ({
  onProcessPayment,
  showToast
}) => {
  const [gatewayStatus, setGatewayStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [lastTransaction, setLastTransaction] = useState<PaymentTransactionResult | null>(null);

  const executePaymentGateway = (method: PaymentMethod, amount: number, provider: string) => {
    setGatewayStatus('PROCESSING');
    setTimeout(() => {
      const result: PaymentTransactionResult = {
        transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentMethod: method,
        amount,
        status: 'BERHASIL',
        providerName: provider,
        authCode: `AUTH-MD-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleTimeString('id-ID')
      };
      setLastTransaction(result);
      setGatewayStatus('SUCCESS');
      if (showToast) {
        showToast('Gateway Pembayaran Terverifikasi', `Transaksi ${result.transactionId} telah diautentikasi.`);
      }
      if (onProcessPayment) {
        onProcessPayment(result);
      }
    }, 600);
  };

  return (
    <div className="w-full bg-[#f9f9ff] rounded-2xl p-4 border border-[#dee8ff] text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[#006c49]">lock</span>
          <span className="font-extrabold text-[#111c2d]">
            Boundary Sistem Eksternal: Layanan Pembayaran
          </span>
        </div>
        <span className="text-[10px] bg-[#6ffbbe]/30 text-[#004d33] px-2 py-0.5 rounded-full font-bold">
          256-bit SSL Terenkripsi
        </span>
      </div>

      <p className="text-[11px] text-[#5a4138] leading-relaxed">
        Boundary ini menghubungkan aplikasi ke gateway perbankan nasional (BCA/BNI/Mandiri VA) serta ekosistem e-wallet (GoPay, DANA, OVO) untuk menjamin keabsahan transaksi instan dan validasi COD.
      </p>

      {lastTransaction && (
        <div className="p-3 bg-[#6ffbbe]/20 rounded-xl border border-[#006c49]/30 text-[#004d33] text-[11px] font-mono space-y-1">
          <p className="font-bold">Verifikasi Gateway Terakhir:</p>
          <p>• Transaksi: {lastTransaction.transactionId}</p>
          <p>• Metode: {lastTransaction.providerName} ({lastTransaction.paymentMethod})</p>
          <p>• Nominal: Rp {lastTransaction.amount.toLocaleString('id-ID')}</p>
          <p>• Status Token: {lastTransaction.status} • AuthCode: {lastTransaction.authCode}</p>
        </div>
      )}
    </div>
  );
};

export default LayananPembayaran;
