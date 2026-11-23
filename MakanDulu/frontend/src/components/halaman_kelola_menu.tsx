import React, { useState } from 'react';
import { MenuItem } from '../types';
import HalamanFormMenu from './halaman_form_menu';
import HalamanFormEditMenu from './halaman_form_edit_menu';
import PopupKonfirmasiHapus from './pop_up_konfirmasi_hapus';
import PopUpKonfirmasiNonaktif from './pop_up_konfirmasi_nonaktif';
import apiClient, { ApiError } from '../services/apiClient';

interface HalamanKelolaMenuProps {
  menuList: MenuItem[];
  onAddMenu: (menu: MenuItem) => void;
  onUpdateMenu: (menu: MenuItem) => void;
  onDeleteMenu: (menuId: string) => void;
  onToggleStock: (menuId: string) => void;
  onToggleDiscount?: (menuId: string) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanKelolaMenu: React.FC<HalamanKelolaMenuProps> = ({
  menuList,
  onAddMenu,
  onUpdateMenu,
  onDeleteMenu,
  onToggleStock,
  onToggleDiscount,
  showToast
}) => {
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingItem, setEditingItem]         = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete]       = useState<MenuItem | null>(null);
  const [itemToDeactivate, setItemToDeactivate] = useState<MenuItem | null>(null);
  const [search, setSearch]                   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  /** Ambil idMenu numerik dari id string "menu-123" atau "menu-local-..." */
  const getIdMenu = (item: MenuItem): number | null => {
    const match = item.id.match(/^menu-(\d+)$/);
    return match ? Number(match[1]) : null;
  };

  const filtered = menuList.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) return false;
    }
    if (selectedCategory !== 'all') return m.category === selectedCategory;
    return true;
  });

  /**
   * handleConfirmDelete — Hapus menu melalui MenuController.
   */
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const idMenu = getIdMenu(itemToDelete);
    if (idMenu) {
      try {
        await apiClient.hapusMenu(idMenu);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          onDeleteMenu(itemToDelete.id);
        } else {
          showToast(
            'Gagal Menghapus',
            err instanceof Error ? err.message : 'Terjadi kesalahan pada server.',
            true
          );
          setItemToDelete(null);
          return;
        }
      }
    }
    onDeleteMenu(itemToDelete.id);
    showToast('Menu Berhasil Dihapus', `Menu "${itemToDelete.name}" berhasil dihapus dari katalog.`);
    setItemToDelete(null);
  };

  /**
   * handleConfirmDeactivate — Toggle stok aktif/habis via API.
   */
  const handleConfirmDeactivate = async () => {
    if (!itemToDeactivate) return;
    const idMenu = getIdMenu(itemToDeactivate);
    if (idMenu) {
      try {
        await apiClient.toggleStokMenu(idMenu);
      } catch (err) {
        showToast(
          'Gagal Mengubah Stok',
          err instanceof Error ? err.message : 'Status tidak dapat diperbarui.',
          true
        );
        setItemToDeactivate(null);
        return;
      }
    }
    onToggleStock(itemToDeactivate.id);
    showToast('Menu Berhasil Dinonaktifkan', `Menu "${itemToDeactivate.name}" berhasil dinonaktifkan.`);
    setItemToDeactivate(null);
  };

  /**
   * handleToggleStokLangsung — Aktifkan stok langsung (tanpa popup konfirmasi).
   */
  const handleToggleStokLangsung = async (item: MenuItem) => {
    const idMenu = getIdMenu(item);
    if (idMenu) {
      try {
        await apiClient.toggleStokMenu(idMenu);
      } catch (err) {
        showToast(
          'Gagal Mengubah Stok',
          err instanceof Error ? err.message : 'Status tidak dapat diperbarui.',
          true
        );
        return;
      }
    }
    onToggleStock(item.id);
    showToast('Menu Berhasil Diaktifkan', `Menu "${item.name}" berhasil diaktifkan.`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Bar Header & Action */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="material-symbols-outlined text-[#825100] text-2xl">menu_book</span>
            <h1 className="text-xl font-black text-[#111c2d]">Kelola Menu Makanan</h1>
          </div>
          <p className="text-xs text-[#5a4138]">
            Kelola hidangan, sesuaikan harga promo, pantau stok, serta tambahkan varian menu baru
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#825100] hover:bg-[#a36700] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>+ Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#dee8ff] shadow-2xs">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5a4138]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu resto..."
            className="w-full pl-9 pr-8 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a4138]"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'ayam-bebek', label: 'Ayam/Bebek' },
            { id: 'mie-bakso', label: 'Mie/Bakso' },
            { id: 'nasi-bakar', label: 'Nasi' },
            { id: 'minuman', label: 'Minuman' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#825100] text-white border-[#825100]'
                  : 'bg-[#f0f3ff] text-[#5a4138] border-[#dee8ff] hover:bg-[#dee8ff]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => {
          const sedangDiskon = Boolean(item.originalPrice && item.originalPrice > item.price);
          return (
            <div
              key={item.id}
              className={`rounded-3xl bg-white border p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
                item.isAvailable ? 'border-[#dee8ff]' : 'border-[#ffdad6] bg-[#fffbff]'
              }`}
            >
              <div>
                <div className="flex gap-4 mb-3">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#f0f3ff] shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {!item.isAvailable && (
                      <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-black text-white">
                        HABIS
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825100]">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#111c2d] line-clamp-1">{item.name}</h3>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-black text-[#825100]">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      {sedangDiskon && (
                        <span className="text-[10px] text-[#5a4138] line-through">
                          Rp {item.originalPrice?.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.isAvailable ? 'bg-[#6ffbbe]/30 text-[#004d33]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}>
                      {item.isAvailable ? 'Stok Tersedia' : 'Stok Habis'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#5a4138] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#f0f3ff] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.isAvailable) {
                        setItemToDeactivate(item);
                      } else {
                        handleToggleStokLangsung(item);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      item.isAvailable
                        ? 'bg-white border-[#dee8ff] text-[#ba1a1a] hover:bg-[#ffdad6]'
                        : 'bg-[#006c49] text-white border-[#006c49]'
                    }`}
                  >
                    {item.isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>

                  {onToggleDiscount && (
                    <button
                      type="button"
                      onClick={() => onToggleDiscount(item.id)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        sedangDiskon
                          ? 'bg-[#cc4900] text-white border-[#cc4900]'
                          : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
                      }`}
                      title={sedangDiskon ? 'Matikan diskon' : 'Terapkan diskon 20%'}
                    >
                      {sedangDiskon ? 'Diskon On' : 'Beri Diskon'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded-xl text-[#5a4138] hover:text-[#825100] hover:bg-[#ffddb8]/30 transition-colors"
                    title="Edit menu"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 rounded-xl text-[#5a4138] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                    title="Hapus menu"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form Tambah Menu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <HalamanFormMenu
            onSaveMenu={(newM) => {
              onAddMenu(newM);
              setShowAddModal(false);
              // Langkah 9: tampilkan pesan "Menu Berhasil Ditambahkan"
              showToast('Menu Berhasil Ditambahkan! 🎉', `${newM.name} telah masuk ke katalog dan siap dipesan pembeli.`);
            }}
            onCancel={() => setShowAddModal(false)}
            showToast={showToast}
          />
        </div>
      )}

      {/* Modal Form Edit Menu */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <HalamanFormEditMenu
            menu={editingItem}
            onSaveEdit={(upd) => {
              onUpdateMenu(upd);
              setEditingItem(null);
            }}
            onCancel={() => setEditingItem(null)}
            showToast={showToast}
          />
        </div>
      )}

      {/* Popup Konfirmasi Hapus */}
      <PopupKonfirmasiHapus
        isOpen={Boolean(itemToDelete)}
        title={itemToDelete?.name || ''}
        itemType="menu"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Popup Konfirmasi Nonaktif */}
      <PopUpKonfirmasiNonaktif
        isOpen={Boolean(itemToDeactivate)}
        title={itemToDeactivate?.name || ''}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setItemToDeactivate(null)}
      />
    </div>
  );
};

export { HalamanKelolaMenu };
export default HalamanKelolaMenu;
