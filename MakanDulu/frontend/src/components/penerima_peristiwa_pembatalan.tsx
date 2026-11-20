import React, { useEffect, useState } from 'react';

interface CancellationEventPayload {
  orderId: string;
  orderNumber: string;
  reason: string;
  triggeredBy: 'timer_10_minutes' | 'system_webhook' | 'buyer_cancel' | 'merchant_rejection';
  timestamp: string;
  refundStatus: 'diproses' | 'selesai' | 'tidak_ada';
}

interface PenerimaPeristiwaPembatalanProps {
  onCancelEventReceived?: (payload: CancellationEventPayload) => void;
  showToast?: (title: string, message: string, isError?: boolean) => void;
}

const PenerimaPeristiwaPembatalan: React.FC<PenerimaPeristiwaPembatalanProps> = ({
  onCancelEventReceived,
  showToast
}) => {
  const [lastEvent, setLastEvent] = useState<CancellationEventPayload | null>(null);
  const [isListening, setIsListening] = useState(true);

  // Listener boundary simulasi Sequence 08D event webhook pembatalan otomatis
  useEffect(() => {
    const handleWebhookMessage = (e: CustomEvent<CancellationEventPayload>) => {
      if (e.detail) {
        setLastEvent(e.detail);
        if (showToast) {
          showToast(
            'Peristiwa Pembatalan Diterima (Sequence 08D)',
            `Pesanan #${e.detail.orderNumber} otomatis dibatalkan: ${e.detail.reason}`,
            true
          );
        }
        if (onCancelEventReceived) {
          onCancelEventReceived(e.detail);
        }
      }
    };

    window.addEventListener('makandulu:cancel_event' as any, handleWebhookMessage);
    return () => {
      window.removeEventListener('makandulu:cancel_event' as any, handleWebhookMessage);
    };
  }, [onCancelEventReceived, showToast]);

  return (
    <div className="w-full bg-[#f9f9ff] rounded-2xl p-4 border border-[#dee8ff] text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-[#006c49] animate-pulse' : 'bg-gray-400'}`} />
          <span className="font-extrabold text-[#111c2d]">
            Boundary Penerima Peristiwa Pembatalan (Sequence 08D Webhook)
          </span>
        </div>
        <span className="text-[10px] text-[#5a4138] font-mono">
          Status: {isListening ? 'Aktif Menyimak Event' : 'Nonaktif'}
        </span>
      </div>

      <p className="text-[11px] text-[#5a4138] leading-relaxed">
        Boundary ini bertanggung jawab menerima payload peristiwa pembatalan otomatis sistem saat timer 10 menit penjual kedaluwarsa atau terjadi kendala pengantaran.
      </p>

      {lastEvent && (
        <div className="p-3 bg-[#ffdad6]/40 rounded-xl border border-[#ffb4ab] text-[#ba1a1a] text-[11px] font-mono space-y-1">
          <p className="font-bold">Peristiwa Pembatalan Terakhir Diterima:</p>
          <p>• ID Pesanan: #{lastEvent.orderNumber}</p>
          <p>• Alasan: {lastEvent.reason}</p>
          <p>• Pemicu: {lastEvent.triggeredBy}</p>
          <p>• Pengembalian Dana: {lastEvent.refundStatus}</p>
          <p>• Waktu: {lastEvent.timestamp}</p>
        </div>
      )}
    </div>
  );
};

export default PenerimaPeristiwaPembatalan;
