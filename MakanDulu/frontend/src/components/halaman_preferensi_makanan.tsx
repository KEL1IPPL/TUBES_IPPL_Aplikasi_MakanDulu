import React, { useState } from 'react';
import { UserPreferences } from '../types';
import apiClient from '../services/apiClient';

interface HalamanPreferensiMakananProps {
  currentPreferences?: UserPreferences;
  onSavePreferences?: (updated: UserPreferences) => void;
  onComplete?: (updated?: UserPreferences) => void;
  onSkip?: () => void;
  onClose?: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  isPostRegistration?: boolean;
}

const HalamanPreferensiMakanan: React.FC<HalamanPreferensiMakananProps> = ({
  currentPreferences,
  onSavePreferences,
  onComplete,
  onSkip,
  onClose,
  showToast,
  isPostRegistration = false,
}) => {
  const [selectedTastes, setSelectedTastes] = useState<string[]>(
    currentPreferences?.tastes || ['pedas', 'gurih']
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentPreferences?.categories || ['ayam_bebek', 'nasi_bakar']
  );
  const [selectedDietary, setSelectedDietary] = useState<string[]>(
    currentPreferences?.dietary || ['aman_lambung']
  );
  const [isSaving, setIsSaving] = useState(false);

  const tasteOptions = [
    { id: 'pedas', label: 'Pedas Nendang', icon: 'local_fire_department', desc: 'Bumbu rica, balado, cabai rawit merah' },
    { id: 'gurih', label: 'Gurih Sedap', icon: 'lunch_dining', desc: 'Santan kental, kaldu rempah, bawang goreng' },
    { id: 'manis', label: 'Manis Legit', icon: 'icecream', desc: 'Kecap manis kedelai hitam, saus madu, gula aren' },
    { id: 'asam', label: 'Segar Asam', icon: 'local_florist', desc: 'Jeruk limau, sambal mangga muda, kuah asam' },
    { id: 'asin', label: 'Asin Renyah', icon: 'bakery_dining', desc: 'Garam laut gurih, kriuk serundeng renyah' }
  ];

  const categoryOptions = [
    { id: 'ayam_bebek', label: 'Ayam & Bebek Goreng' },
    { id: 'mie_bakso', label: 'Mie & Bakso Sapi' },
    { id: 'nasi_bakar', label: 'Aneka Nasi Nusantara' },
    { id: 'martabak', label: 'Martabak & Camilan' },
    { id: 'minuman', label: 'Minuman Segar Tradisional' }
  ];

  const dietaryOptions = [
    { id: 'aman_lambung', label: 'Pedas Ramah Lambung' },
    { id: 'halal_certified', label: '100% Halal Terjamin' },
    { id: 'less_oil', label: 'Rendah Minyak / Tiris Maksimal' }
  ];

  const toggleTaste = (id: string) => {
    setSelectedTastes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  /**
   * Main Flow:
   * 3. Pembeli: klik simpan dan lanjut
   * 4. halaman_preferensi_makanan -> preferensi_makanan_controller: simpan preferensi makanan
   * 5. preferensi_makanan_controller -> PreferensiMakanan: simpat data
   * 6. PreferensiMakanan -> preferensi_makanan_controller: data disimpan
   * 7. preferensi_makanan_controller -> halaman_dashboard_pembeli: Tampilkan dashboard Pembeli
   */
  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    const updated: UserPreferences = {
      tastes: selectedTastes,
      categories: selectedCategories,
      dietary: selectedDietary
    };

    try {
      // Panggil preferensi_makanan_controller untuk menyimpan ke entitas database PreferensiMakanan
      await apiClient.simpanPreferensiMakanan(updated);
      showToast('Preferensi Selera Disimpan', 'Katalog kini menampilkan rekomendasi makanan sesuai selera Anda.');
    } catch (err: any) {
      console.warn('Gagal menyimpan preferensi makanan ke backend:', err?.message);
      showToast('Info Preferensi', 'Preferensi tersimpan untuk sesi saat ini.');
    } finally {
      setIsSaving(false);
    }

    if (onSavePreferences) onSavePreferences(updated);
    if (onComplete) onComplete(updated);
    if (onClose) onClose();
  };

  /**
   * Alternative Flow:
   * 2. Pembeli: klik tombol "Lewati"
   * 3. halaman_preferensi_makanan -> preferensi_makanan_controller: lewati pemilihan preferensi makanan
   * 4. preferensi_makanan_controller -> halaman_dashboard_pembeli: Tampilkan halaman dashboard Pembeli
   */
  const handleSkip = async () => {
    try {
      await apiClient.lewatiPreferensiMakanan();
    } catch (err) {
      console.warn('Gagal kirim status lewati ke backend:', err);
    }

    showToast('Pemilihan Dilewati', 'Menampilkan rekomendasi kuliner terpopuler.');
    if (onSkip) onSkip();
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between pb-4 border-b border-[#f0f3ff] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#a33900] bg-[#ffdbce] px-2.5 py-0.5 rounded-full inline-block mb-1">
              {isPostRegistration ? 'Langkah Terakhir Registrasi' : 'Kustomisasi Selera'}
            </span>
            <h2 className="text-xl font-extrabold text-[#111c2d]">Preferensi Selera Makanan</h2>
            <p className="text-xs text-[#5a4138]">Kustomisasi rekomendasi hidangan berdasarkan cita rasa favorit Anda</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Pilihan Rasa Utama */}
        <div>
          <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider block mb-3">
            1. Cita Rasa Dominan Favorit
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasteOptions.map((taste) => {
              const active = selectedTastes.includes(taste.id);
              return (
                <div
                  key={taste.id}
                  onClick={() => toggleTaste(taste.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer border-2 transition-all flex items-start gap-3 ${
                    active
                      ? 'border-[#a33900] bg-[#ffdbce]/30 shadow-xs'
                      : 'border-[#dee8ff] bg-white hover:bg-[#f9f9ff]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${active ? 'text-[#a33900]' : 'text-[#5a4138]'}`}>
                    {taste.icon}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#111c2d] block">{taste.label}</span>
                    <span className="text-[11px] text-[#5a4138] block mt-0.5 leading-tight">{taste.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kategori Makanan Favorit */}
        <div>
          <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider block mb-3">
            2. Kategori Hidangan Populer
          </span>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-[#a33900] text-white border-[#a33900] shadow-xs'
                      : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Catatan Diet / Kebutuhan Khusus */}
        <div>
          <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider block mb-3">
            3. Catatan Khusus & Standar Mutu
          </span>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((diet) => {
              const active = selectedDietary.includes(diet.id);
              return (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => toggleDietary(diet.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-[#006c49] text-white border-[#006c49] shadow-xs'
                      : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
                  }`}
                >
                  {diet.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tombol Aksi Sesuai Sequence Diagram */}
      <div className="mt-8 pt-4 border-t border-[#f0f3ff] flex items-center justify-between gap-3">
        {/* Tombol Lewati (Alternative Flow) */}
        <button
          type="button"
          onClick={handleSkip}
          className="px-5 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff] hover:text-[#111c2d] transition-colors"
        >
          Lewati
        </button>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff]"
            >
              Batal
            </button>
          )}

          {/* Tombol Simpan dan Lanjut (Main Flow) */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndContinue}
            className="px-6 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">check</span>
            <span>{isSaving ? 'Menyimpan...' : 'Simpan dan Lanjut'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HalamanPreferensiMakanan;
