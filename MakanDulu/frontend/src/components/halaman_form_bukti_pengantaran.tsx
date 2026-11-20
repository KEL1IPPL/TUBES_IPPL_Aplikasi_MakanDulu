import React, { useState } from 'react';
import { POD_PHOTO_URL } from '../data/dataMock';

interface HalamanFormBuktiPengantaranProps {
  orderNumber: string;
  onSaveProof: (proofUrl: string) => void;
  onCancel: () => void;
}

const HalamanFormBuktiPengantaran: React.FC<HalamanFormBuktiPengantaranProps> = ({
  orderNumber,
  onSaveProof,
  onCancel
}) => {
  const [photoUrl, setPhotoUrl] = useState(POD_PHOTO_URL);
  const [recipientNote, setRecipientNote] = useState('Diterima langsung oleh pemesan di meja resepsionis.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSaveProof(photoUrl);
    }, 500);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dee8ff] space-y-5 animate-in zoom-in-95">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#6ffbbe]/30 text-[#006c49] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">camera_alt</span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#111c2d]">
              Unggah Bukti Pengantaran (POD)
            </h3>
            <p className="text-[11px] text-[#5a4138]">
              Dokumentasi serah terima pesanan #{orderNumber}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg text-[#5a4138] hover:bg-[#f0f3ff]"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#111c2d] uppercase tracking-wider">
            Foto Bukti Serah Terima Hidangan
          </label>
          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#cfdaf2] border border-[#dee8ff]">
            <img src={photoUrl} alt="Bukti Serah Terima" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold">
              ✓ GPS Tagged • Jakarta Selatan
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">URL Foto Bukti / Kamera</label>
          <input
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Keterangan Penerima</label>
          <input
            type="text"
            required
            placeholder="misal: Diterima oleh satpam / pemesan langsung"
            value={recipientNote}
            onChange={(e) => setRecipientNote(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
          />
        </div>

        <div className="pt-3 border-t border-[#f0f3ff] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Selesai Diantar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HalamanFormBuktiPengantaran;
