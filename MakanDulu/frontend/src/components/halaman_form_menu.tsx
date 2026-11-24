import React, { useState, useRef } from 'react';
import { MenuItem } from '../types';
import apiClient, { ApiError } from '../services/apiClient';

interface HalamanFormMenuProps {
  restaurantName?: string;
  onSaveMenu: (newMenu: MenuItem) => void;
  onCancel: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanFormMenu: React.FC<HalamanFormMenuProps> = ({
  restaurantName = 'Resto Bebek Juara',
  onSaveMenu,
  onCancel,
  showToast
}) => {
  const [name, setName]                   = useState('');
  const [category, setCategory]           = useState('ayam-bebek');
  const [price, setPrice]                 = useState<number>(35000);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [description, setDescription]     = useState('');
  const [tasteCategory, setTasteCategory] = useState<string[]>(['pedas', 'gurih']);
  const [modifier, setModifier]           = useState('');
  const [isAvailable, setIsAvailable]     = useState(true);

  // State Berkas Foto Menu (Memasukkan File Gambar)
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string>('');
  const [fileDetails, setFileDetails]     = useState<{ name: string; size: string } | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // State loading & error (untuk integrasi API)
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [fieldErrors, setFieldErrors]     = useState<string[]>([]);

  const tasteOptions    = ['pedas', 'gurih', 'manis', 'asam', 'asin'];
  const categoryOptions = [
    { id: 'ayam-bebek',  label: 'Ayam & Bebek' },
    { id: 'mie-bakso',   label: 'Mie & Bakso' },
    { id: 'nasi-bakar',  label: 'Nasi Nusantara' },
    { id: 'camilan',     label: 'Camilan & Martabak' },
    { id: 'minuman',     label: 'Minuman Segar' }
  ];

  const toggleTaste = (t: string) => {
    setTasteCategory((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  // Handler pemilihan berkas file foto dari perangkat pengguna
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Format Tidak Didukung', 'Harap pilih file gambar (JPG, PNG, atau WebP).', true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran Terlalu Besar', 'Maksimal ukuran file foto adalah 10 MB.', true);
      return;
    }

    setSelectedFile(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setFileDetails({
      name: file.name,
      size: `${sizeInMb} MB`,
    });

    // Buat pratinjau lokal foto
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * handleSubmit — Langkah 5 pada diagram:
   * halaman_form_menu (Boundary) → tambah_menu → menu_controller (Control)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors([]);

    // Validasi ringan di sisi klien sebelum hit API
    if (!name.trim()) {
      showToast('Nama Menu Kosong', 'Harap isi nama menu makanan.', true);
      return;
    }
    if (price <= 0) {
      showToast('Harga Tidak Valid', 'Harga harus lebih besar dari 0.', true);
      return;
    }

    if (!selectedFile && !previewUrl) {
      showToast('Foto Menu Wajib', 'Harap masukkan file foto menu hidangan.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalFotoUrl = previewUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';

      // Jika ada berkas file foto yang dipilih, unggah ke server melalui API upload
      if (selectedFile) {
        try {
          const uploadRes = await apiClient.uploadFotoMenu(selectedFile);
          if (uploadRes.success && uploadRes.data?.fotoUrl) {
            finalFotoUrl = uploadRes.data.fotoUrl;
          }
        } catch (uploadErr) {
          console.warn('[HalamanFormMenu] Upload berkas foto fallback ke data URL lokal:', uploadErr);
          // Jika upload gagal, tetap gunakan data URL lokal pratinjau
        }
      }

      // Langkah 5→6→7: Kirim ke menu_controller → validasi → simpan ke DB
      const response = await apiClient.tambahMenu({
        namaMenu:     name.trim(),
        kategori:     category,
        harga:        price,
        hargaNormal:  originalPrice,
        deskripsi:    description.trim() || undefined,
        fotoUrl:      finalFotoUrl,
        rasaKarakter: tasteCategory,
        modifier:     modifier.trim() || undefined,
        statusAktif:  isAvailable,
      });

      // Langkah 8-9: menu_ditambahkan → tampilkan pesan "Menu Berhasil Ditambahkan"
      const apiItem = response.data;

      // Konversi response API ke tipe MenuItem lokal
      const newMenuItem: MenuItem = {
        id:                 apiItem.id,
        name:               apiItem.name,
        restaurant:         restaurantName,
        distance:           apiItem.distance,
        price:              apiItem.price,
        originalPrice:      apiItem.originalPrice,
        discountPercentage: apiItem.discountPercentage,
        rating:             apiItem.rating,
        reviewCount:        apiItem.reviewCount,
        tag:                apiItem.tag,
        tasteCategory:      apiItem.tasteCategory,
        category:           apiItem.category,
        description:        apiItem.description,
        imageUrl:           apiItem.imageUrl || finalFotoUrl,
        isAvailable:        apiItem.isAvailable,
        modifier:           apiItem.modifier,
        salesCount:         apiItem.salesCount,
      };

      onSaveMenu(newMenuItem);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.responseBody as { errors?: string[]; message?: string } | undefined;
        if (body?.errors && body.errors.length > 0) {
          setFieldErrors(body.errors);
          showToast('Validasi Gagal', body.errors[0], true);
        } else {
          showToast('Gagal Menyimpan', body?.message || 'Terjadi kesalahan.', true);
        }
      } else {
        showToast(
          'Gagal Menyimpan',
          err instanceof Error ? err.message : 'Koneksi ke backend gagal.',
          true
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#f0f3ff] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#111c2d]">Tambah Menu Baru</h2>
            <p className="text-xs text-[#5a4138]">Publikasikan hidangan baru ke katalog pembeli MakanDulu</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff] transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {fieldErrors.length > 0 && (
        <div className="mb-4 p-3.5 bg-[#ffdad6] text-[#ba1a1a] rounded-2xl text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">error</span>
            Validasi Gagal — Periksa kembali data berikut:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {fieldErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nama Hidangan *</label>
          <input
            type="text"
            required
            placeholder="misal: Bebek Bakar Madu Pedas Gurih"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Kategori Menu *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Harga Jual (Rp) *</label>
            <input
              type="number"
              min={1000}
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Harga Normal Coret (Opsional Promo)</label>
            <input
              type="number"
              min={price}
              placeholder="Kosongkan jika tidak ada diskon"
              value={originalPrice || ''}
              onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Modifier / Varian Khusus</label>
            <input
              type="text"
              placeholder="misal: Sambal Terasi Ekstra / Keju Leleh"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Karakter Rasa (Pilih yang sesuai)</label>
          <div className="flex flex-wrap gap-2">
            {tasteOptions.map((t) => {
              const active = tasteCategory.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTaste(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-[#825100] text-white border-[#825100] shadow-2xs'
                      : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
                  }`}
                >
                  {active && '✓ '}
                  {t.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Deskripsi Makanan</label>
          <textarea
            rows={2}
            placeholder="Jelaskan kelezatan hidangan, bumbu rahasia, dan porsi penyajian..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
          />
        </div>

        {/* INPUT BERKAS FOTO MENU (MEMASUKKAN FILE BUKAN LINK) */}
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
            Foto Menu Hidangan (Masukkan File Foto) *
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="input-berkas-foto-menu"
          />

          {!previewUrl ? (
            <label
              htmlFor="input-berkas-foto-menu"
              className="w-full border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f9f9ff] hover:bg-[#ffddb8]/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-[#111c2d] block">
                  Klik untuk Memilih File Foto Makanan
                </span>
                <span className="text-[11px] text-[#5a4138] block mt-0.5">
                  Format didukung: JPG, PNG, atau WebP (Maksimal 10 MB)
                </span>
              </div>
            </label>
          ) : (
            <div className="p-3 bg-[#f9f9ff] rounded-2xl border border-[#dee8ff] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Pratinjau Foto Menu"
                  className="w-16 h-16 rounded-xl object-cover border border-[#dee8ff] shadow-xs"
                />
                <div>
                  <span className="text-xs font-bold text-[#111c2d] block truncate max-w-[200px] sm:max-w-xs">
                    {fileDetails?.name || 'Foto Menu Terpilih'}
                  </span>
                  {fileDetails?.size && (
                    <span className="text-[10px] text-[#5a4138] block mt-0.5">
                      Ukuran file: {fileDetails.size}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006c49] mt-0.5">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    File siap diunggah
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#dee8ff] transition-colors"
                >
                  Ganti File
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                  title="Hapus foto terpilih"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="menu-available"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="rounded border-[#dee8ff] text-[#825100] focus:ring-[#825100]"
          />
          <label htmlFor="menu-available" className="text-xs text-[#111c2d] font-bold cursor-pointer">
            Stok Langsung Tersedia di Katalog
          </label>
        </div>

        <div className="pt-4 border-t border-[#f0f3ff] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#825100] hover:bg-[#a36700] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                <span>Menyimpan Menu...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                <span>Simpan & Terbitkan Menu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HalamanFormMenu;
