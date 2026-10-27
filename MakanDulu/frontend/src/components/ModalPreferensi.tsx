import React, { useState } from 'react';
import { UserPreferences } from '../types';

interface PreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences;
  onSavePreferences: (updated: UserPreferences) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const PreferenceModal: React.FC<PreferenceModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
  showToast
}) => {
  const [tastes, setTastes] = useState<string[]>(currentPreferences.tastes || ['pedas', 'gurih']);
  const [categories, setCategories] = useState<string[]>(currentPreferences.categories || ['ayam_bebek', 'nasi_bakar']);
  const [dietary, setDietary] = useState<string[]>(currentPreferences.dietary || ['aman_lambung']);

  if (!isOpen) return null;

  const tasteOptions = [
    { id: 'pedas', label: 'Pedas Nampol 🔥', desc: 'Sambal korek, rica, balado & mercon' },
    { id: 'gurih', label: 'Gurih Sedap 🍗', desc: 'Bumbu rempah kuning, serundeng & lengkuas' },
    { id: 'manis', label: 'Manis Legit 🍯', desc: 'Kecap manis, semur, bacem & bumbu manis' },
    { id: 'asam_segar', label: 'Asam Segar 🍋', desc: 'Sayur asem, asam pedas & jeruk limau' },
    { id: 'asin_gurih', label: 'Asin Renyah 🧂', desc: 'Goreng tepung krispi & taburan asin gurih' }
  ];

  const categoryOptions = [
    { id: 'ayam_bebek', label: 'Ayam & Bebek', icon: 'restaurant' },
    { id: 'nasi_bakar', label: 'Aneka Nasi & Rempah', icon: 'rice_bowl' },
    { id: 'mie_bakso', label: 'Mie & Bakso', icon: 'ramen_dining' },
    { id: 'sambal', label: 'Aneka Sambal Tradisional', icon: 'whatshot' },
    { id: 'minuman', label: 'Minuman Segar Dingin', icon: 'local_drink' },
    { id: 'martabak', label: 'Martabak & Cemilan', icon: 'bakery_dining' },
    { id: 'seafood', label: 'Seafood & Ikan Bakar', icon: 'set_meal' }
  ];

  const dietaryOptions = [
    { id: 'aman_lambung', label: 'Aman Lambung / Non-Pedas Ekstrem', icon: 'health_and_safety' },
    { id: 'halal_terjamin', label: '100% Halal Terjamin', icon: 'verified' },
    { id: 'rendah_lemak', label: 'Rendah Lemak / Sehat', icon: 'eco' },
    { id: 'vegetarian', label: 'Sayuran & Vegetarian', icon: 'spa' }
  ];

  const toggleTaste = (id: string) => {
    setTastes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleDietary = (id: string) => {
    setDietary((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    if (tastes.length === 0 && categories.length === 0) {
      showToast('Pilih Minimal 1', 'Pilih minimal satu cita rasa atau kategori kuliner.', true);
      return;
    }
    const updated: UserPreferences = {
      tastes,
      categories,
      dietary
    };
    onSavePreferences(updated);
    showToast('Preferensi Diperbarui!', 'Rekomendasi menu di beranda langsung disesuaikan dengan selera Anda.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="relative bg-[#f9f9ff] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dee8ff]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#dee8ff]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">tune</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111c2d]">Ubah Preferensi Makanan</h2>
              <p className="text-xs text-[#5a4138]">
                Sesuaikan selera rasa dan kategori favorit Anda untuk memfilter menu di beranda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#5a4138] hover:text-[#111c2d] border border-[#dee8ff] shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="py-5 space-y-6">
          {/* Section 1: Cita Rasa */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#a33900]">restaurant</span>
                Cita Rasa Pilihan ({tastes.length} Dipilih)
              </span>
              <span className="text-[10px] text-[#5a4138]">Bisa pilih lebih dari satu</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tasteOptions.map((taste) => {
                const isSelected = tastes.includes(taste.id);
                return (
                  <button
                    key={taste.id}
                    type="button"
                    onClick={() => toggleTaste(taste.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#ffdbce]/40 border-[#a33900] shadow-xs'
                        : 'bg-white border-[#dee8ff] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#a33900] text-white font-bold' : 'border border-[#dee8ff] bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-[#111c2d] block">{taste.label}</span>
                      <span className="text-[10px] text-[#5a4138] block mt-0.5">{taste.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Kategori Hidangan */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#006c49]">category</span>
                Kategori Makanan Favorit ({categories.length} Dipilih)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => {
                const isSelected = categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#263143] text-white border-[#263143] shadow-xs'
                        : 'bg-white text-[#111c2d] border-[#dee8ff] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                    <span>{cat.label}</span>
                    {isSelected && <span className="ml-0.5 text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Kriteria Khusus */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#825100]">health_and_safety</span>
                Kriteria Khusus / Pola Makan
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dietaryOptions.map((diet) => {
                const isSelected = dietary.includes(diet.id);
                return (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => toggleDietary(diet.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#6ffbbe]/30 border-[#006c49] text-[#004d33] font-bold'
                        : 'bg-white border-[#dee8ff] text-[#5a4138] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{diet.icon}</span>
                    <span className="text-xs flex-1">{diet.label}</span>
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#dee8ff] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold border border-[#dee8ff] transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Simpan & Terapkan ke Beranda</span>
            <span className="material-symbols-outlined text-base">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModalPreferensi = PreferenceModal;
