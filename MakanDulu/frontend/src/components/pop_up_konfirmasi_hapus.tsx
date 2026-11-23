import React from 'react';

interface PopupKonfirmasiHapusProps {
  isOpen: boolean;
  title: string;
  itemType?: 'menu' | 'voucher' | 'item';
  onConfirm: () => void;
  onCancel: () => void;
}

const PopupKonfirmasiHapus: React.FC<PopupKonfirmasiHapusProps> = ({
  isOpen,
  title,
  itemType = 'menu',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dee8ff] text-center space-y-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-3xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto shadow-xs">
          <span className="material-symbols-outlined text-3xl">delete_forever</span>
        </div>

        <div>
          <h3 className="text-lg font-black text-[#111c2d]">
            Hapus {itemType === 'menu' ? 'Menu' : itemType === 'voucher' ? 'Voucher' : 'Item'}?
          </h3>
          <p className="text-xs text-[#5a4138] mt-1.5 leading-relaxed">
            Apakah Anda yakin ingin menghapus <strong className="text-[#ba1a1a]">"{title}"</strong>?
            Tindakan ini permanen dan tidak dapat dibatalkan.
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
            className="flex-1 py-3 px-4 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span>Iya, Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupKonfirmasiHapus;
