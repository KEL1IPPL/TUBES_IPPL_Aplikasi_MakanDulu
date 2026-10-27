import React, { useState } from 'react';
import { MenuItem, CartItem, StoreProfile } from '../types';

interface ProfilTokoProps {
  storeProfile: StoreProfile;
  menuList: MenuItem[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isStoreOpen: boolean;
  onBackToCatalog: () => void;
  onNavigateToCartCheckout: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const ProfilToko: React.FC<ProfilTokoProps> = ({
  storeProfile,
  menuList,
  cart,
  setCart,
  isStoreOpen,
  onBackToCatalog,
  onNavigateToCartCheckout,
  showToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Menus belonging to this store
  const storeMenus = menuList.filter(
    (item) => item.restaurant.toLowerCase() === storeProfile.name.toLowerCase()
  );

  // Filtered menus
  const filteredMenus = storeMenus.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory === 'promo') {
      return (item.discountPercentage && item.discountPercentage > 0) || item.originalPrice;
    }
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  // Calculate items from this store in cart
  const storeCartItems = cart.filter(
    (it) => it.restaurant.toLowerCase() === storeProfile.name.toLowerCase()
  );
  const storeCartCount = storeCartItems.reduce((acc, it) => acc + it.qty, 0);
  const storeCartSubtotal = storeCartItems.reduce((acc, it) => acc + it.price * it.qty, 0);

  const [modalGantiToko, setModalGantiToko] = useState<{
    tokoLama: string;
    tokoBaru: string;
    menuBaru: MenuItem;
  } | null>(null);

  const eksekusiTambahMenu = (menu: MenuItem, timpaKeranjang = false) => {
    setCart((prev) => {
      const daftarDasar = timpaKeranjang ? [] : prev;
      const existing = daftarDasar.find((x) => x.menuId === menu.id || x.name === menu.name);
      if (existing) {
        return daftarDasar.map((x) => (x.id === existing.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...daftarDasar,
        {
          id: `cart-${Date.now()}`,
          menuId: menu.id,
          name: menu.name,
          price: menu.price,
          qty: 1,
          sublabel: menu.modifier || 'Rasa Autentik Gurih',
          restaurant: menu.restaurant
        }
      ];
    });

    showToast('Berhasil Ditambahkan', `1x ${menu.name} telah masuk ke keranjang belanja.`);
  };

  const addToCart = (menu: MenuItem) => {
    if (!isStoreOpen) {
      showToast(
        'Toko Sedang Tutup',
        `${storeProfile.name} saat ini tutup dan tidak dapat menerima pesanan. Menu hanya dapat dilihat sebagai katalog harga.`,
        true
      );
      return;
    }

    if (!menu.isAvailable) {
      showToast('Stok Habis', `${menu.name} sedang tidak tersedia di dapur toko.`, true);
      return;
    }

    // Cek apakah keranjang saat ini berisi menu dari toko berbeda
    if (cart.length > 0) {
      const tokoSaatIni = cart[0].restaurant;
      if (tokoSaatIni && tokoSaatIni.trim().toLowerCase() !== storeProfile.name.trim().toLowerCase()) {
        setModalGantiToko({
          tokoLama: tokoSaatIni,
          tokoBaru: storeProfile.name,
          menuBaru: menu
        });
        return;
      }
    }

    eksekusiTambahMenu(menu, false);
  };

  const konfirmasiGantiToko = () => {
    if (modalGantiToko) {
      eksekusiTambahMenu(modalGantiToko.menuBaru, true);
      showToast('Resto Diganti', `Keranjang diperbarui dengan menu dari ${modalGantiToko.tokoBaru}.`);
      setModalGantiToko(null);
    }
  };

  const getCartItemQty = (menuId: string): number => {
    const item = cart.find((x) => x.menuId === menuId);
    return item ? item.qty : 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 pb-28">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all flex items-center gap-2 border border-[#dee8ff] shadow-xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Kembali ke Semua Resto</span>
        </button>

        {storeCartCount > 0 && (
          <button
            type="button"
            onClick={onNavigateToCartCheckout}
            className="px-4 py-2 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">shopping_cart</span>
            <span>Keranjang ({storeCartCount})</span>
          </button>
        )}
      </div>

      {/* Store Hero Banner */}
      <div className="relative h-48 sm:h-64 lg:h-72 w-full rounded-3xl overflow-hidden shadow-sm border border-[#dee8ff]">
        <img
          src={storeProfile.bannerUrl}
          alt={storeProfile.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1.5 ${
                isStoreOpen
                  ? 'bg-[#6ffbbe] text-[#002113]'
                  : 'bg-[#ffdad6] text-[#ba1a1a]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-[#006c49] animate-pulse' : 'bg-[#ba1a1a]'}`} />
              <span>{isStoreOpen ? 'Toko Buka • Menerima Pesanan' : 'Toko Tutup • Hanya Tampil Menu'}</span>
            </span>

            {storeProfile.verified && (
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#6ffbbe]">verified</span>
                <span>Mitra Terverifikasi NIB</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {storeProfile.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-2xl line-clamp-2">
            {storeProfile.tagline}
          </p>
        </div>
      </div>

      {/* Store Profile Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 mt-4 border border-[#dee8ff] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#dee8ff]">
          <div className="flex items-start gap-4">
            <img
              src={storeProfile.logoUrl}
              alt="Logo Toko"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#dee8ff] shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#111c2d]">{storeProfile.name}</h2>
                <span className="text-xs text-[#006c49] font-bold bg-[#6ffbbe]/30 px-2 py-0.5 rounded-full">
                  ★ {storeProfile.rating} ({storeProfile.reviewCount})
                </span>
              </div>
              <p className="text-xs text-[#5a4138] mt-1 font-medium">{storeProfile.cuisineType}</p>
              <p className="text-xs text-[#5a4138] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#a33900]">location_on</span>
                <span>{storeProfile.address}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] text-center">
              <span className="text-[10px] text-[#5a4138] font-bold uppercase block">Jarak Resto</span>
              <span className="text-sm font-extrabold text-[#111c2d]">{storeProfile.distance}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] text-center">
              <span className="text-[10px] text-[#5a4138] font-bold uppercase block">Estimasi Antar</span>
              <span className="text-sm font-extrabold text-[#111c2d]">{storeProfile.deliveryTime}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] text-center">
              <span className="text-[10px] text-[#5a4138] font-bold uppercase block">Jam Buka</span>
              <span className="text-sm font-extrabold text-[#111c2d]">{storeProfile.openingHours}</span>
            </div>
          </div>
        </div>

        {/* Store Closed Warning Banner */}
        {!isStoreOpen && (
          <div className="mt-5 p-4 rounded-2xl bg-[#ffdad6] border border-[#ffb4ab] text-xs text-[#ba1a1a] flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl shrink-0">storefront</span>
            <div>
              <p className="font-bold">
                Toko Sedang Tutup / Istirahat
              </p>
              <p className="text-[11px] text-[#93000a] mt-0.5">
                Penjual sedang tidak mengaktifkan jam operasional. Anda tetap dapat menjelajahi foto dan rincian harga menu olahan di bawah, namun tombol pemesanan dinonaktifkan sementara.
              </p>
            </div>
          </div>
        )}

        {/* Store Promo Announcement Banner */}
        {storeProfile.promoText && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#ffdbce] to-[#fffbff] border border-[#ffb599] flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-[#a33900] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">local_fire_department</span>
            </div>
            <div className="flex-1">
              <span className="font-extrabold text-[#a33900] block">Promo Diskon dari Penjual:</span>
              <span className="text-[#5a4138]">{storeProfile.promoText}</span>
            </div>
          </div>
        )}

        <div className="mt-5 text-xs text-[#5a4138] leading-relaxed">
          <strong className="text-[#111c2d]">Tentang Toko: </strong>
          {storeProfile.description}
        </div>
      </div>

      {/* Menu Catalog Section Header & Filter Tabs */}
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <h3 className="text-xl font-extrabold text-[#111c2d]">
            Daftar Menu {storeProfile.name} ({storeMenus.length} Menu)
          </h3>
          <p className="text-xs text-[#5a4138] mt-0.5">
            Semua menu dimasak langsung dari dapur resto dengan bumbu segar rempah nusantara
          </p>
        </div>

        {/* Store Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4138] text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu di toko ini..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#dee8ff] text-xs focus:ring-2 focus:ring-[#a33900] outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {[
          { id: 'all', label: `Semua Menu (${storeMenus.length})` },
          { id: 'promo', label: 'Promo Diskon Penjual 🔥', icon: 'percent' },
          { id: 'ayam-bebek', label: 'Olahan Utama', icon: 'restaurant' },
          { id: 'minuman', label: 'Minuman Segar', icon: 'local_cafe' },
          { id: 'camilan', label: 'Camilan & Tambahan', icon: 'lunch_dining' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
              selectedCategory === tab.id
                ? 'bg-[#111c2d] text-white border-[#111c2d] shadow-xs'
                : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
            }`}
          >
            {tab.icon && <span className="material-symbols-outlined text-sm">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Menu Cards Grid */}
      {filteredMenus.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#dee8ff] mt-4">
          <span className="material-symbols-outlined text-4xl text-[#5a4138]">restaurant_menu</span>
          <p className="text-sm font-bold text-[#111c2d] mt-2">Tidak ada menu yang sesuai kriteria</p>
          <p className="text-xs text-[#5a4138] mt-1">Coba bersihkan pencarian atau pilih kategori lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredMenus.map((item) => {
            const qtyInCart = getCartItemQty(item.id);
            const hasDiscount = Boolean(item.originalPrice && item.originalPrice > item.price);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl overflow-hidden border border-[#dee8ff] shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  !item.isAvailable ? 'opacity-85' : ''
                }`}
              >
                <div>
                  {/* Image with Badges */}
                  <div className="relative h-44 w-full bg-[#f0f3ff] overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                        !item.isAvailable || !isStoreOpen ? 'filter grayscale-[30%]' : ''
                      }`}
                    />

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#ba1a1a] text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">local_fire_department</span>
                        <span>Diskon {item.discountPercentage || Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)}%</span>
                      </span>
                    )}

                    {/* Stock Status Badge */}
                    {!item.isAvailable ? (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-[#ba1a1a] text-white text-[11px] font-bold shadow-sm">
                        Stok Habis
                      </span>
                    ) : (
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-mono">
                        Terjual: {item.salesCount || '100+'}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-[#5a4138] mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        {item.category}
                      </span>
                      <span className="font-bold text-amber-600 flex items-center gap-0.5">
                        ★ {item.rating}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-[#111c2d] leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[#5a4138] mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.modifier && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-[#a33900] bg-[#ffdbce] px-2 py-0.5 rounded-md">
                        {item.modifier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price and Cart Action */}
                <div className="p-5 pt-0 mt-2 flex items-center justify-between border-t border-[#f0f3ff] pt-3">
                  <div className="flex flex-col">
                    {hasDiscount && (
                      <span className="text-xs text-[#5a4138] line-through">
                        Rp {item.originalPrice!.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className="text-base font-extrabold text-[#a33900]">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Add to Cart button or Disabled State */}
                  {!isStoreOpen ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-gray-200 text-gray-500 text-xs font-bold cursor-not-allowed flex items-center gap-1"
                      title="Toko sedang tutup"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Toko Tutup</span>
                    </button>
                  ) : !item.isAvailable ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold cursor-not-allowed"
                    >
                      Stok Habis
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="px-4 py-2 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                      <span>{qtyInCart > 0 ? `Tambah (${qtyInCart})` : '+ Keranjang'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Checkout Bar when user has items from this store */}
      {storeCartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom duration-300">
          <div className="bg-[#111c2d] text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#a33900] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {storeCartCount}
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-300 block">{storeCartCount} Menu di Keranjang</span>
                <span className="text-sm font-extrabold text-white">
                  Rp {storeCartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToCartCheckout}
              className="px-5 py-2.5 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>Lanjut Checkout</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Ganti Toko (Aturan 1 Pesanan = 1 Toko) */}
      {modalGantiToko && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dee8ff] animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-[#ffdbce] text-[#cc4900] flex items-center justify-center mb-4 mx-auto shadow-xs">
              <span className="material-symbols-outlined text-3xl">swap_horiz</span>
            </div>

            <h3 className="text-lg font-black text-[#111c2d] text-center mb-1.5">
              Ganti Pesanan ke Resto Lain?
            </h3>

            <div className="bg-[#f0f3ff] p-4 rounded-2xl border border-[#dee8ff] text-xs text-[#5a4138] leading-relaxed my-3.5 text-left">
              <p>
                Keranjang Anda saat ini berisi menu dari <strong className="text-[#111c2d]">{modalGantiToko.tokoLama}</strong>.
              </p>
              <p className="mt-2 text-[#ba1a1a] font-bold">
                ⚠️ Satu pesanan hanya dapat diproses dari satu resto mitra dalam satu waktu.
              </p>
              <p className="mt-2">
                Jika memilih menu ini, maka seluruh menu di toko <strong>{modalGantiToko.tokoLama}</strong> yang ada di keranjang akan <strong>dihapus dan diganti</strong> dengan menu yang sedang Anda pilih di <strong>{modalGantiToko.tokoBaru}</strong>:
              </p>
              <div className="mt-3 p-2.5 bg-white rounded-xl border border-[#ffdbce] font-bold text-[#111c2d] flex items-center justify-between shadow-2xs">
                <span className="truncate pr-2">🍽️ {modalGantiToko.menuBaru.name}</span>
                <span className="text-[#cc4900] shrink-0">Rp {modalGantiToko.menuBaru.price.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setModalGantiToko(null)}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#5a4138] text-xs font-bold transition-colors cursor-pointer"
              >
                Tetap di {modalGantiToko.tokoLama}
              </button>
              <button
                type="button"
                onClick={konfirmasiGantiToko}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-[#cc4900] hover:bg-[#a33900] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Ganti Resto & Tambahkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StoreProfileView = ProfilToko;
export const TampilanProfilToko = ProfilToko;
export default ProfilToko;
