import React, { useState } from 'react';
import { MenuItem } from '../types';

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ayam-bebek');
  const [price, setPrice] = useState<number>(35000);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
  );
  const [tasteCategory, setTasteCategory] = useState<string[]>(['pedas', 'gurih']);
  const [modifier, setModifier] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const tasteOptions = ['pedas', 'gurih', 'manis', 'asam', 'asin'];
  const categoryOptions = [
    { id: 'ayam-bebek', label: 'Ayam & Bebek' },
    { id: 'mie-bakso', label: 'Mie & Bakso' },
    { id: 'nasi-bakar', label: 'Nasi Nusantara' },
    { id: 'camilan', label: 'Camilan & Martabak' },
    { id: 'minuman', label: 'Minuman Segar' }
  ];

  const toggleTaste = (t: string) => {
    setTasteCategory((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama Menu Kosong', 'Harap isi nama menu makanan.', true);
      return;
    }
    if (price <= 0) {
      showToast('Harga Tidak Valid', 'Harga harus lebih besar dari 0.', true);
      return;
    }

    const newMenuItem: MenuItem = {
      id: `menu-custom-${Date.now()}`,
      name: name.trim(),
      restaurant: restaurantName,
      distance: '1.2 km',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discountPercentage: originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined,
      rating: 5.0,
      reviewCount: '1 ulasan baru',
      tag: 'Menu Baru',
      tasteCategory,
      category,
      description: description.trim() || 'Menu istimewa racikan bumbu khas dapur resto.',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      isAvailable,
      modifier: modifier.trim() || undefined,
      salesCount: '0 porsi'
    };

    onSaveMenu(newMenuItem);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl">
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
          className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff]"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nama Hidangan</label>
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
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Kategori Menu</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Harga Jual (Rp)</label>
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

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">URL Foto Hidangan</label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
          />
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
            className="px-5 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#825100] hover:bg-[#a36700] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Simpan & Terbitkan Menu</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HalamanFormMenu;
