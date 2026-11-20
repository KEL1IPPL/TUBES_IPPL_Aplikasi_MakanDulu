import React from 'react';

interface PopUpKonfirmasiNonaktifProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PopUpKonfirmasiNonaktif: React.FC<PopUpKonfirmasiNonaktifProps> = ({
  isOpen,
  title,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dee8ff] text-center space-y-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-3xl bg-[#ffddb8] text-[#825100] flex items-center justify-center mx-auto shadow-xs">
          <span className="material-symbols-outlined text-3xl">do_not_disturb_on</span>
        </div>

        <div>
          <h3 className="text-lg font-black text-[#111c2d]">Tandai Stok Habis?</h3>
          <p className="text-xs text-[#5a4138] mt-1.5 leading-relaxed">
            Menu <strong className="text-[#825100]">"{title}"</strong> akan disembunyikan dari pilihan pemesanan pembeli sampai Anda mengaktifkan stoknya kembali.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff] transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[#825100] hover:bg-[#a36700] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">check</span>
            <span>Nonaktifkan Stok</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopUpKonfirmasiNonaktif;
