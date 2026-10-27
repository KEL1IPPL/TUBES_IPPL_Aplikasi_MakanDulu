import React, { useState } from 'react';
import { DeliveryAddress } from '../types';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: DeliveryAddress;
  onSave: (address: DeliveryAddress) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSave
}) => {
  const [label, setLabel] = useState(currentAddress.label);
  const [street, setStreet] = useState(currentAddress.street);
  const [details, setDetails] = useState(currentAddress.details);
  const [notes, setNotes] = useState(currentAddress.notes);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) {
      alert('Alamat tidak boleh kosong!');
      return;
    }
    onSave({
      label: label || 'Rumah',
      street,
      details: details || 'Jakarta Selatan',
      notes: notes || 'Titip di resepsionis'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 border border-[#dee8ff]">
        <div className="flex items-center justify-between pb-2 border-b border-[#f0f3ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a33900] text-2xl">
              edit_location_alt
            </span>
            <h3 className="text-xl font-bold text-[#111c2d]">
              Ubah Alamat Pengantaran
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#111c2d] hover:bg-[#dee8ff] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-left">
            <span className="text-[12px] text-[#111c2d] font-semibold">Label Alamat</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-sm focus:outline-none focus:ring-2 focus:ring-[#a33900] border border-[#dee8ff]"
              placeholder="Contoh: Rumah Kebayoran / Kantor"
            />
          </label>

          <label className="flex flex-col gap-1 text-left">
            <span className="text-[12px] text-[#111c2d] font-semibold">Alamat Lengkap *</span>
            <textarea
              rows={3}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-sm focus:outline-none focus:ring-2 focus:ring-[#a33900] border border-[#dee8ff] resize-none"
              placeholder="Nama jalan, nomor rumah, RT/RW, gedung, atau patokan..."
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-left">
            <span className="text-[12px] text-[#111c2d] font-semibold">Kecamatan / Kota</span>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-sm focus:outline-none focus:ring-2 focus:ring-[#a33900] border border-[#dee8ff]"
              placeholder="Kebayoran Baru, Jakarta Selatan"
            />
          </label>

          <label className="flex flex-col gap-1 text-left">
            <span className="text-[12px] text-[#111c2d] font-semibold">Catatan untuk Kurir (Opsional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-sm focus:outline-none focus:ring-2 focus:ring-[#a33900] border border-[#dee8ff]"
              placeholder="Contoh: Gedung B Lt. 3, titip di resepsionis"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f3ff]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-sm font-semibold hover:bg-[#dee8ff] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#a33900] text-white text-sm font-semibold hover:bg-[#cc4900] shadow-md transition-all"
            >
              Simpan & Gunakan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModalAlamat = AddressModal;
