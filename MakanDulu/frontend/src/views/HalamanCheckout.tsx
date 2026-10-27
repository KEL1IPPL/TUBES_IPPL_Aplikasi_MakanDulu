import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, CartItem, DeliveryAddress, PaymentMethod, EWalletProvider, BankProvider, UserPreferences } from '../types';
import { STORE_PROFILES } from '../data/dataMock';

interface HalamanCheckoutProps {
  menuList: MenuItem[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currentAddress: DeliveryAddress;
  onOpenAddressModal: () => void;
  onOrderSuccess: (items: CartItem[], total: number, paymentMethod: PaymentMethod, selectedProvider?: string) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  onNavigateToCartCheckout?: () => void;
  onOpenStoreProfile?: (storeName: string) => void;
  isStoreOpen?: boolean;
  userPreferences?: UserPreferences;
  onOpenPreferenceModal?: () => void;
}

export const HalamanCheckout: React.FC<HalamanCheckoutProps> = ({
  menuList,
  cart,
  setCart,
  currentAddress,
  onOpenAddressModal,
  onOrderSuccess,
  showToast,
  onNavigateToCartCheckout,
  onOpenStoreProfile,
  isStoreOpen = true,
  userPreferences,
  onOpenPreferenceModal
}) => {
  // Status pencarian dan penyaringan katalog
  const [kataKunciPencarian, setKataKunciPencarian] = useState('Nasi Bebek Madura');
  const [filterKategoriAktif, setFilterKategoriAktif] = useState('all');
  const [statusKuponDiterapkan, setStatusKuponDiterapkan] = useState(false);
  const [metodePembayaranDipilih, setMetodePembayaranDipilih] = useState<PaymentMethod>('ewallet');
  const [ewalletDipilih, setEwalletDipilih] = useState<EWalletProvider>('GoPay');
  const [bankDipilih, setBankDipilih] = useState<BankProvider>('Bank BCA');
  const [alamatTervalidasi, setAlamatTervalidasi] = useState(true);
  const [sedangProsesPesanan, setSedangProsesPesanan] = useState(false);
  const [pemberitahuanPeringatan, setPemberitahuanPeringatan] = useState<{ teks: string; tipe: 'error' | 'warning' } | null>(null);
  const [simulasiHasilPencarianKosong, setSimulasiHasilPencarianKosong] = useState(false);

  // Status Modal Peringatan Ganti Toko (1 Toko per Pesanan)
  const [modalGantiToko, setModalGantiToko] = useState<{
    tokoLama: string;
    tokoBaru: string;
    menuBaru: MenuItem;
  } | null>(null);

  // Status Keranjang Mengambang (Floating Draggable Cart)
  const [posisiYKeranjang, setPosisiYKeranjang] = useState(240);
  const [sedangMenggeser, setSedangMenggeser] = useState(false);
  const [drawerKeranjangTerbuka, setDrawerKeranjangTerbuka] = useState(false);
  const referensiGeser = useRef<{ mulaiY: number; posisiAwalY: number; sudahPindah: boolean }>({
    mulaiY: 0,
    posisiAwalY: 240,
    sudahPindah: false
  });

  const biayaOngkir = 10000;
  const biayaLayanan = 2000;

  // Perhitungan total belanja
  const subtotalHargaMenu = cart.reduce((total, item) => total + item.price * item.qty, 0);
  const totalJumlahItem = cart.reduce((total, item) => total + item.qty, 0);
  const potonganDiskonKupon = statusKuponDiterapkan ? Math.round(subtotalHargaMenu * 0.35) : 0;
  const totalPembayaran = cart.length > 0 ? Math.max(0, subtotalHargaMenu + biayaOngkir + biayaLayanan - potonganDiskonKupon) : 0;

  // Perubahan kuantitas menu
  const ubahJumlahMenu = (id: string, selisih: number) => {
    setCart((sebelumnya) => {
      return sebelumnya
        .map((item) => {
          if (item.id === id) {
            const jumlahBaru = item.qty + selisih;
            return { ...item, qty: jumlahBaru };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const hapusMenuDariKeranjang = (id: string) => {
    const itemDihapus = cart.find((x) => x.id === id);
    setCart((sebelumnya) => sebelumnya.filter((x) => x.id !== id));
    if (itemDihapus) {
      showToast('Menu Dihapus', `${itemDihapus.name} dikeluarkan dari keranjang pesanan.`);
    }
  };

  // Fungsi internal menambahkan item ke keranjang
  const eksekusiTambahMenu = (menu: MenuItem, timpaKeranjang = false) => {
    setCart((sebelumnya) => {
      const daftarDasar = timpaKeranjang ? [] : sebelumnya;
      const sudahAda = daftarDasar.find((x) => x.menuId === menu.id || x.name === menu.name);
      if (sudahAda) {
        return daftarDasar.map((x) =>
          x.id === sudahAda.id ? { ...x, qty: x.qty + 1 } : x
        );
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

  // Menambahkan menu dengan aturan 1 Pesanan = 1 Toko
  const tambahMenuKeKeranjang = (menu: MenuItem) => {
    if (!isStoreOpen) {
      showToast('Toko Sedang Tutup', `${menu.restaurant} sedang tutup dan tidak menerima pesanan saat ini.`, true);
      return;
    }

    if (!menu.isAvailable) {
      showToast('Stok Habis', `${menu.name} sedang tidak tersedia di resto.`, true);
      return;
    }

    // Cek apakah keranjang sudah berisi menu dari resto lain
    if (cart.length > 0) {
      const tokoSaatIni = cart[0].restaurant;
      if (tokoSaatIni && tokoSaatIni.trim().toLowerCase() !== menu.restaurant.trim().toLowerCase()) {
        setModalGantiToko({
          tokoLama: tokoSaatIni,
          tokoBaru: menu.restaurant,
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

  const alihkanStatusKupon = () => {
    const statusBaru = !statusKuponDiterapkan;
    setStatusKuponDiterapkan(statusBaru);
    if (statusBaru) {
      showToast('Kupon Berhasil Diterapkan!', 'Diskon 35% SELERA35PEDAS memotong tagihan menu.');
    } else {
      showToast('Kupon Dilepas', 'Potongan diskon 35% dibatalkan.');
    }
  };

  // Simulator pengujian UC #6 & UC #7
  const pemicuPencarianKosong = () => {
    setSimulasiHasilPencarianKosong(true);
    showToast('Simulasi Pencarian Kosong', 'Sistem mensimulasikan hasil pencarian menu tidak ditemukan.');
  };

  const pemicuPeringatanPesanan = (tipe: 'stok' | 'tutup' | 'alamat') => {
    if (tipe === 'stok') {
      setPemberitahuanPeringatan({
        teks: '<strong>Pemberitahuan Dapur:</strong> Stok Bebek Madura pedas habis! Sistem menyesuaikan ketersediaan.',
        tipe: 'error'
      });
      showToast('Peringatan Stok', 'Stok menu terpilih sedang habis.', true);
    } else if (tipe === 'tutup') {
      setPemberitahuanPeringatan({
        teks: '<strong>Resto Tutup Sementara:</strong> Jam operasional resto mitra telah berakhir.',
        tipe: 'warning'
      });
      showToast('Resto Tutup', 'Resto tidak menerima pesanan saat ini.', true);
    } else {
      setAlamatTervalidasi(false);
      setPemberitahuanPeringatan({
        teks: '<strong>Alamat Kosong:</strong> Tentukan alamat pengantaran sebelum melanjutkan checkout.',
        tipe: 'error'
      });
      showToast('Alamat Belum Lengkap', 'Silakan lengkapi alamat tujuan.', true);
    }
  };

  const resetSemuaSimulasi = () => {
    setSimulasiHasilPencarianKosong(false);
    setPemberitahuanPeringatan(null);
    setAlamatTervalidasi(true);
    setKataKunciPencarian('');
    setFilterKategoriAktif('all');
    showToast('Simulasi Direset', 'Kondisi aplikasi dikembalikan ke status normal.');
  };

  const kirimPesananSelesai = () => {
    if (cart.length === 0) {
      showToast('Keranjang Kosong', 'Pilih menu favorit Anda sebelum checkout.', true);
      return;
    }

    if (!alamatTervalidasi) {
      showToast('Alamat Belum Diisi', 'Silakan tentukan alamat pengantaran yang valid.', true);
      onOpenAddressModal();
      return;
    }

    if (!isStoreOpen) {
      showToast('Toko Sedang Tutup', 'Resto sedang tutup dan tidak menerima pesanan.', true);
      return;
    }

    const namaPenyedia =
      metodePembayaranDipilih === 'ewallet'
        ? `E-Wallet (${ewalletDipilih})`
        : metodePembayaranDipilih === 'bank_va'
        ? `Transfer Bank (${bankDipilih})`
        : 'COD (Bayar Tunai di Tempat)';

    setSedangProsesPesanan(true);
    setTimeout(() => {
      setSedangProsesPesanan(false);
      setDrawerKeranjangTerbuka(false);
      onOrderSuccess(cart, totalPembayaran, metodePembayaranDipilih, namaPenyedia);
      showToast('Pesanan Berhasil Masuk Dapur!', 'Pesanan Anda langsung diteruskan ke resto mitra. Mengalihkan ke Live Tracking...');
    }, 1200);
  };

  // Logika Drag Vertikal untuk Keranjang Mengambang
  const mulaiGeser = (clientY: number) => {
    setSedangMenggeser(true);
    referensiGeser.current = {
      mulaiY: clientY,
      posisiAwalY: posisiYKeranjang,
      sudahPindah: false
    };
  };

  useEffect(() => {
    const tanganiPergerakan = (e: MouseEvent | TouchEvent) => {
      if (!sedangMenggeser) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - referensiGeser.current.mulaiY;
      if (Math.abs(deltaY) > 5) {
        referensiGeser.current.sudahPindah = true;
      }
      const batasAtas = 100; // di bawah menu bar
      const batasBawah = window.innerHeight - 130;
      const posisiBaru = Math.min(batasBawah, Math.max(batasAtas, referensiGeser.current.posisiAwalY + deltaY));
      setPosisiYKeranjang(posisiBaru);
    };

    const tanganiSelesaiGeser = () => {
      setSedangMenggeser(false);
    };

    if (sedangMenggeser) {
      window.addEventListener('mousemove', tanganiPergerakan);
      window.addEventListener('mouseup', tanganiSelesaiGeser);
      window.addEventListener('touchmove', tanganiPergerakan);
      window.addEventListener('touchend', tanganiSelesaiGeser);
    }

    return () => {
      window.removeEventListener('mousemove', tanganiPergerakan);
      window.removeEventListener('mouseup', tanganiSelesaiGeser);
      window.removeEventListener('touchmove', tanganiPergerakan);
      window.removeEventListener('touchend', tanganiSelesaiGeser);
    };
  }, [sedangMenggeser]);

  // Penyaringan Preferensi Selera Pembeli
  const seleraDipilihPengguna = userPreferences?.tastes && userPreferences.tastes.length > 0
    ? userPreferences.tastes
    : [];
  const kategoriDipilihPengguna = userPreferences?.categories && userPreferences.categories.length > 0
    ? userPreferences.categories
    : [];

  const normalisasiKunciRasa = (t: string) => {
    const s = t.toLowerCase();
    if (s.includes('manis')) return 'manis';
    if (s.includes('pedas')) return 'pedas';
    if (s.includes('gurih')) return 'gurih';
    if (s.includes('asam')) return 'asam';
    if (s.includes('asin')) return 'asin';
    return s;
  };

  const menuSesuaiPreferensi = menuList.filter((item) => {
    if (seleraDipilihPengguna.length === 0 && kategoriDipilihPengguna.length === 0) return false;
    const rasaItem = (item.tasteCategory || []).map((t) => normalisasiKunciRasa(t));

    if (seleraDipilihPengguna.length > 0) {
      const cocokRasa = seleraDipilihPengguna.some((t) => {
        const norm = normalisasiKunciRasa(t);
        return rasaItem.includes(norm);
      });
      if (!cocokRasa) return false;
    }

    if (kategoriDipilihPengguna.length > 0) {
      const cocokKategori = kategoriDipilihPengguna.some((c) => {
        const itemCat = item.category.toLowerCase().replace('-', '_');
        const cNorm = c.toLowerCase().replace('-', '_');
        if (cNorm === 'ayam_bebek') return itemCat === 'ayam_bebek' || item.name.toLowerCase().includes('ayam') || item.name.toLowerCase().includes('bebek');
        if (cNorm === 'mie_bakso') return itemCat === 'mie_bakso' || item.name.toLowerCase().includes('mie') || item.name.toLowerCase().includes('bakso');
        if (cNorm === 'nasi_bakar') return itemCat === 'nasi_bakar' || item.name.toLowerCase().includes('nasi');
        if (cNorm === 'minuman') return itemCat === 'minuman' || item.name.toLowerCase().includes('es') || item.name.toLowerCase().includes('teh') || item.name.toLowerCase().includes('jeruk') || item.name.toLowerCase().includes('cendol');
        if (cNorm === 'martabak' || cNorm === 'camilan') return itemCat === 'camilan' || item.name.toLowerCase().includes('martabak') || item.name.toLowerCase().includes('pisang');
        if (cNorm === 'sambal') return item.name.toLowerCase().includes('sambal');
        return itemCat.includes(cNorm) || cNorm.includes(itemCat);
      });
      if (seleraDipilihPengguna.length > 0) return true;
      return cocokKategori;
    }

    return true;
  });

  const daftarRekomendasi = menuSesuaiPreferensi.length > 0
    ? menuSesuaiPreferensi
    : menuList.filter((x) => x.rating >= 4.8).slice(0, 4);

  // Randomisasi menu seluruh mitra resto
  const [benihAcak, setBenihAcak] = useState(1);
  const menuAcakToko = React.useMemo(() => {
    const salinan = [...menuList];
    return salinan.sort((a, b) => {
      const hashA = ((a.id.charCodeAt(a.id.length - 1) * 37) + (a.name.charCodeAt(0) * 19) + benihAcak * 13) % 97;
      const hashB = ((b.id.charCodeAt(b.id.length - 1) * 37) + (b.name.charCodeAt(0) * 19) + benihAcak * 13) % 97;
      return hashA - hashB;
    });
  }, [menuList, benihAcak]);

  // Menu tersaring pencarian & tombol filter
  const menuTersaring = menuAcakToko.filter((item) => {
    if (simulasiHasilPencarianKosong) return false;
    const cocokPencarian =
      !kataKunciPencarian.trim() ||
      item.name.toLowerCase().includes(kataKunciPencarian.toLowerCase()) ||
      item.description.toLowerCase().includes(kataKunciPencarian.toLowerCase()) ||
      item.restaurant.toLowerCase().includes(kataKunciPencarian.toLowerCase());
    if (!cocokPencarian) return false;

    if (filterKategoriAktif === 'promo') {
      return Boolean(
        (item.originalPrice && item.originalPrice > item.price) ||
        (item.discountPercentage && item.discountPercentage > 0) ||
        item.tag.toLowerCase().includes('diskon')
      );
    }
    if (filterKategoriAktif === 'ayam-bebek') return item.category === 'ayam-bebek';
    if (filterKategoriAktif === 'sambal') return item.tasteCategory.includes('pedas');
    if (filterKategoriAktif === 'mie-bakso') return item.category === 'mie-bakso';
    if (filterKategoriAktif === 'rating') return item.rating >= 4.8;
    if (filterKategoriAktif === 'harga') return item.price < 30000;
    return true;
  });

  return (
    <div className="flex flex-col w-full relative">
      {/* ========================================================================= */}
      {/* 1. BILAH PENCARIAN & FILTER DI BAWAH MENU BAR (STICKY, TIDAK IKUT TURUN KETIKA DI-SCROLL) */}
      {/* ========================================================================= */}
      <div className="sticky top-[112px] z-30 bg-[#f9f9ff]/95 backdrop-blur-xl border-b border-[#dee8ff] py-3 px-4 sm:px-6 lg:px-12 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          {/* Baris Input Pencarian */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138]">
                search
              </span>
              <input
                type="text"
                value={kataKunciPencarian}
                onChange={(e) => {
                  setKataKunciPencarian(e.target.value);
                  if (simulasiHasilPencarianKosong) setSimulasiHasilPencarianKosong(false);
                }}
                placeholder="Cari makanan favorit, bebek bumbu hitam, bakso, nama resto..."
                className="w-full pl-11 pr-10 py-2.5 bg-white text-[#111c2d] rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#cc4900] transition-all border border-[#dee8ff] shadow-2xs"
              />
              {kataKunciPencarian && (
                <button
                  onClick={() => {
                    setKataKunciPencarian('');
                    if (simulasiHasilPencarianKosong) setSimulasiHasilPencarianKosong(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d] p-1 rounded-full transition-colors"
                  title="Bersihkan Pencarian"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!kataKunciPencarian.trim()) {
                  showToast('Input Kosong', 'Ketik kata kunci nama makanan atau resto.', true);
                } else {
                  showToast('Pencarian Diproses', `Mencari menu '${kataKunciPencarian}' dari resto terdekat...`);
                }
              }}
              className="px-4 sm:px-5 py-2.5 bg-[#a33900] text-white rounded-2xl text-xs sm:text-sm font-bold hover:bg-[#cc4900] shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">manage_search</span>
              <span className="hidden sm:inline">Cari Makanan</span>
            </button>

            {/* Quick Button ke Checkout */}
            {onNavigateToCartCheckout && (
              <button
                type="button"
                onClick={onNavigateToCartCheckout}
                className="px-3.5 py-2.5 bg-[#f0f3ff] hover:bg-[#ffdbce] text-[#a33900] rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dee8ff] shrink-0"
                title="Buka Halaman Checkout Lengkap"
              >
                <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
                <span className="hidden md:inline">Checkout</span>
                {totalJumlahItem > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#cc4900] text-white text-[10px] font-bold flex items-center justify-center">
                    {totalJumlahItem}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Baris Filter Chips Cepat */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'promo', label: 'Promo Diskon Penjual 🔥', icon: 'local_fire_department' },
              { id: 'ayam-bebek', label: 'Ayam & Bebek', icon: 'restaurant' },
              { id: 'sambal', label: 'Aneka Sambal', icon: 'whatshot' },
              { id: 'mie-bakso', label: 'Mie & Bakso', icon: 'ramen_dining' },
              { id: 'rating', label: 'Rating 4.8+', icon: 'star' },
              { id: 'harga', label: 'Harga < Rp 30.000' }
            ].map((chip) => {
              const aktif = filterKategoriAktif === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setFilterKategoriAktif(chip.id);
                    setSimulasiHasilPencarianKosong(false);
                    showToast('Filter Diterapkan', `Katalog disaring berdasarkan ${chip.label}.`);
                  }}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                    aktif
                      ? 'bg-[#a33900] text-white shadow-xs'
                      : 'bg-white text-[#5a4138] hover:bg-[#e7eeff] border border-[#dee8ff]'
                  }`}
                >
                  {chip.icon && (
                    <span className="material-symbols-outlined text-xs">
                      {chip.icon}
                    </span>
                  )}
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REKOMENDASI DI BAWAH SEARCH (MENU PILIHAN SESUAI SELERA / RATING TERTINGGI) */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-12 pt-5 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-[#fff7f4] via-[#ffede6] to-[#f0f3ff] p-5 sm:p-7 border-2 border-[#ffdbce] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#ffdbce]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#cc4900] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    Rekomendasi Pilihan Untuk Anda
                  </span>
                  {seleraDipilihPengguna.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-white text-[#a33900] text-[10px] font-bold border border-[#ffdbce] shadow-2xs capitalize">
                      🌶️ Rasa: {t.replace('_', ' ')}
                    </span>
                  ))}
                  {kategoriDipilihPengguna.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full bg-white text-[#111c2d] text-[10px] font-bold border border-[#dee8ff] shadow-2xs capitalize">
                      🍽️ {c.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#111c2d] leading-tight">
                  Rekomendasi Hidangan Lezat Pilihan Hari Ini
                </h2>
                <p className="text-xs text-[#5a4138]">
                  Menampilkan hidangan terbaik dari mitra resto pilihan yang dikurasi khusus sesuai selera cita rasa Anda.
                </p>
              </div>

              {onOpenPreferenceModal && (
                <button
                  type="button"
                  onClick={onOpenPreferenceModal}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#ffdbce] text-[#a33900] text-xs font-bold border border-[#ffdbce] shadow-2xs transition-all flex items-center gap-1.5 self-start md:self-center"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>Ubah Preferensi</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>

            {/* Grid Menu Hasil Rekomendasi */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {daftarRekomendasi.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-3.5 border border-[#ffdbce] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#a33900] text-white text-[10px] font-extrabold uppercase">
                        Rekomendasi
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 mb-1">
                      <button
                        type="button"
                        onClick={() => onOpenStoreProfile && onOpenStoreProfile(item.restaurant)}
                        className="text-[11px] font-bold text-[#a33900] hover:underline flex items-center gap-1 truncate text-left"
                        title={`Lihat profil toko ${item.restaurant}`}
                      >
                        <span className="material-symbols-outlined text-xs">store</span>
                        <span className="truncate">{item.restaurant}</span>
                      </button>
                      <div className="flex items-center gap-0.5 text-[11px] font-bold text-[#825100] shrink-0">
                        <span className="material-symbols-outlined text-xs text-[#825100]">star</span>
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-[#111c2d] leading-snug line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-[#5a4138] mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f0f3ff] flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#111c2d]">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                    {!isStoreOpen ? (
                      <span className="text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-1 rounded-lg">
                        Toko Tutup
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => tambahMenuKeKeranjang(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#cc4900] text-white text-xs font-bold hover:bg-[#a33900] transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        <span>+ Keranjang</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. KERANJANG KECIL MENGAMBANG DI KANAN */}
      {/* ========================================================================= */}
      <div
        style={{ top: `${posisiYKeranjang}px` }}
        className="fixed right-3 sm:right-6 z-40 select-none transition-shadow"
      >
        {/* Tombol Keranjang: Fleksibel Digeser Langsung Seluruh Wadah */}
        <div
          onMouseDown={(e) => {
            if (e.button === 0) mulaiGeser(e.clientY);
          }}
          onTouchStart={(e) => mulaiGeser(e.touches[0].clientY)}
          onClick={(e) => {
            if (referensiGeser.current.sudahPindah) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setDrawerKeranjangTerbuka(!drawerKeranjangTerbuka);
          }}
          className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-[#ffdbce] hover:border-[#cc4900] transition-all p-2.5 gap-3 cursor-grab active:cursor-grabbing hover:shadow-2xl active:scale-[0.98]"
          title="Klik untuk membuka keranjang belanja atau geser ke atas/bawah"
        >
          {/* Hanya Ikon Keranjang dengan Badge Jumlah */}
          <div className="relative w-10 h-10 rounded-xl bg-[#cc4900] text-white flex items-center justify-center shadow-xs shrink-0 pointer-events-none">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            {totalJumlahItem > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#111c2d] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-2xs">
                {totalJumlahItem}
              </span>
            )}
          </div>

          {/* Keterangan Berapa Banyak Makanan yang Masuk Beserta Harga */}
          <div className="flex flex-col text-left pr-2 pointer-events-none">
            <span className="text-[11px] font-bold text-[#5a4138]">
              {totalJumlahItem > 0 ? `${totalJumlahItem} Makanan` : '0 Makanan'}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#111c2d] leading-tight">
              Rp {subtotalHargaMenu.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Panel Cepat Keranjang Mini (Bisa di-scroll) */}
        {drawerKeranjangTerbuka && (
          <div className="absolute right-0 top-16 w-80 sm:w-96 max-h-[80vh] flex flex-col bg-white rounded-3xl shadow-2xl border-2 border-[#dee8ff] p-4 z-50 animate-in fade-in zoom-in-95">
            {/* Header Keranjang dengan Informasi Resto Aktif */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e7eeff] shrink-0">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#cc4900] text-lg">shopping_bag</span>
                  <span className="text-sm font-bold text-[#111c2d]">Keranjang Pesanan</span>
                </div>
                {cart.length > 0 && (
                  <span className="text-[10px] text-[#006c49] font-bold mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">store</span>
                    <span>Toko: {cart[0].restaurant}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerKeranjangTerbuka(false)}
                className="w-7 h-7 rounded-full bg-[#f0f3ff] text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center shrink-0 cursor-pointer"
                title="Tutup Keranjang"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Area Daftar Item Keranjang Kecil yang BISA DI-SCROLL */}
            <div className="flex-1 overflow-y-auto max-h-64 sm:max-h-72 divide-y divide-[#f0f3ff] my-2 pr-1.5 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-[#5a4138] flex flex-col items-center gap-1.5">
                  <span className="material-symbols-outlined text-3xl text-[#cfdaf2]">remove_shopping_cart</span>
                  <span className="text-xs font-bold text-[#111c2d]">Keranjang Masih Kosong</span>
                  <span className="text-[11px]">Pilih menu lezat di katalog untuk mulai memesan.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex flex-col flex-1 text-left min-w-0">
                      <span className="text-xs font-bold text-[#111c2d] truncate">{item.name}</span>
                      <span className="text-[10px] text-[#cc4900] font-semibold truncate">{item.restaurant}</span>
                      <span className="text-xs font-bold text-[#111c2d] mt-0.5">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-[#f0f3ff] px-2 py-1 rounded-xl border border-[#dee8ff]">
                      <button
                        type="button"
                        onClick={() => ubahJumlahMenu(item.id, -1)}
                        className="w-5 h-5 rounded-md bg-white text-[#111c2d] flex items-center justify-center text-xs font-bold hover:bg-[#dee8ff] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold px-1">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => ubahJumlahMenu(item.id, 1)}
                        className="w-5 h-5 rounded-md bg-white text-[#111c2d] flex items-center justify-center text-xs font-bold hover:bg-[#dee8ff] cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => hapusMenuDariKeranjang(item.id)}
                      className="p-1 text-[#5a4138] hover:text-[#ba1a1a] cursor-pointer"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Total Pembayaran & Tombol Lanjut */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-[#dee8ff] flex flex-col gap-2.5 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#5a4138]">Total Tagihan Menu:</span>
                  <span className="font-extrabold text-sm text-[#cc4900]">
                    Rp {subtotalHargaMenu.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToCartCheckout && (
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerKeranjangTerbuka(false);
                        onNavigateToCartCheckout();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#cc4900] text-white text-xs font-bold hover:bg-[#a33900] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
                      <span>Halaman Checkout</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={kirimPesananSelesai}
                    disabled={sedangProsesPesanan}
                    className="py-2.5 px-3 rounded-xl bg-[#006c49] text-white text-xs font-bold hover:bg-[#005236] transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Bayar Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI GANTI TOKO (ATURAN 1 PESANAN = 1 TOKO) */}
      {/* ========================================================================= */}
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

      {/* Simulator Strip (UC #6 & UC #7 Testing) */}
      <div className="w-full bg-[#dee8ff] px-4 sm:px-6 lg:px-12 py-2 border-b border-[#cfdaf2]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#cc4900] text-[#fffbff] text-[10px] uppercase tracking-wider font-bold">
              Simulator Skenario UC #6 & UC #7
            </span>
            <span className="text-[#5a4138] hidden md:inline">
              Simulasi cepat kendala stok, status toko, atau hasil pencarian kosong:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={pemicuPencarianKosong}
              type="button"
              className="px-2.5 py-1 bg-white text-[#111c2d] hover:bg-[#f0f3ff] font-semibold rounded-lg shadow-2xs border border-[#cfdaf2] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">search_off</span>
              Pencarian Kosong
            </button>
            <button
              onClick={() => pemicuPeringatanPesanan('stok')}
              type="button"
              className="px-2.5 py-1 bg-white text-[#ba1a1a] hover:bg-[#ffdad6] font-semibold rounded-lg shadow-2xs border border-[#ffb4ab] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">warning</span>
              Stok Habis
            </button>
            <button
              onClick={resetSemuaSimulasi}
              type="button"
              className="px-2.5 py-1 bg-[#006c49] text-white font-semibold rounded-lg shadow-2xs hover:bg-[#005236] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Konteks Alamat & Metode Pembayaran Ringkas */}
      <div className="w-full bg-white shadow-2xs border-b border-[#dee8ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ffdbce] flex items-center justify-center text-[#a33900] shrink-0">
              <span className="material-symbols-outlined text-lg">location_on</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#5a4138] font-bold">
                  Alamat Pengantaran
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#6ffbbe] text-[#005236] text-[9px] font-extrabold uppercase">
                  {currentAddress.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#111c2d] truncate max-w-sm sm:max-w-md">
                  {currentAddress.street}, {currentAddress.details}
                </span>
                <button
                  type="button"
                  onClick={onOpenAddressModal}
                  className="text-xs text-[#a33900] font-bold hover:underline shrink-0"
                >
                  Ubah Alamat
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f3ff] rounded-xl border border-[#dee8ff]">
            <span className="material-symbols-outlined text-[#006c49] text-sm">verified_user</span>
            <span className="text-xs font-bold text-[#111c2d]">GoPay • DANA • OVO • Bank BCA • COD</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. KATALOG UTAMA (SEMUA MENU ACAK DARI SELURUH TOKO & PROFIL TOKO) */}
      {/* ========================================================================= */}
      <main className="w-full px-4 sm:px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Toko Tutup Banner Jika Ada */}
          {!isStoreOpen && (
            <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ffb4ab] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#ba1a1a]">store</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#ba1a1a]">Resto Bebek Juara Sedang Tutup</h4>
                  <p className="text-[11px] text-[#5a4138]">Menu tetap dapat dilihat, namun pemesanan sementara dinonaktifkan.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white text-[#ba1a1a] text-[10px] font-extrabold uppercase border border-[#ffb4ab]">
                Tutup
              </span>
            </div>
          )}

          {/* Header Semua Menu Acak */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dee8ff]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-[#cc4900]"></span>
              <div>
                <h2 className="text-lg font-extrabold text-[#111c2d]">
                  {filterKategoriAktif === 'promo' ? '🔥 Promo Diskon Spesial Mitra Penjual' : 'Semua Menu Lezat Pilihan (Acak dari Berbagai Mitra Toko)'}
                </h2>
                <span className="text-xs text-[#5a4138]">
                  Menampilkan hidangan populer dari berbagai resto mitra. Klik nama toko pada setiap menu untuk melihat profil resto.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setBenihAcak((prev) => prev + 1);
                  showToast('Menu Diacak Ulang', 'Daftar menu dari mitra resto telah diacak kembali.');
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f0f3ff] text-[#111c2d] text-xs font-bold border border-[#dee8ff] transition-all flex items-center gap-1 shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">shuffle</span>
                <span>Acak Menu Toko</span>
              </button>
            </div>
          </div>

          {/* Grid Menu Utama (Spacious Responsive Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {menuTersaring.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-white p-4 border border-[#dee8ff] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-3.5 bg-[#f0f3ff]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.discountPercentage && item.discountPercentage > 0 && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-[#ba1a1a] text-white text-[10px] font-extrabold uppercase shadow-xs">
                        Diskon {item.discountPercentage}%
                      </span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold">
                      {item.distance} • 15-20 mnt
                    </span>
                  </div>

                  {/* Keterangan Asal Toko & Nama Toko Bisa Dipencet */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenStoreProfile && onOpenStoreProfile(item.restaurant)}
                      className="text-xs font-bold text-[#a33900] hover:text-[#cc4900] hover:underline flex items-center gap-1 truncate text-left"
                      title={`Klik untuk melihat detail profil toko ${item.restaurant}`}
                    >
                      <span className="material-symbols-outlined text-sm text-[#a33900]">store</span>
                      <span className="truncate">{item.restaurant}</span>
                    </button>

                    <div className="flex items-center gap-0.5 text-xs font-bold text-[#825100] shrink-0">
                      <span className="material-symbols-outlined text-sm text-[#825100]">star</span>
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#111c2d] leading-snug line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#5a4138] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0f3ff] flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[11px] text-[#5a4138] line-through">
                        Rp {item.originalPrice.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className="text-base font-extrabold text-[#111c2d]">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {!isStoreOpen ? (
                    <span className="px-3 py-1.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold">
                      Toko Tutup
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => tambahMenuKeKeranjang(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#a33900] text-white text-xs font-bold hover:bg-[#cc4900] transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                      <span>+ Keranjang</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* DAFTAR PROFIL MITRA TOKO PILIHAN DI BAWAH SEMUA MENU */}
          {/* ========================================================================= */}
          <div className="mt-10 pt-6 border-t border-[#dee8ff]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#111c2d]">
                  🏪 Mitra Resto & Dapur Pilihan di Sekitar Anda
                </h3>
                <p className="text-xs text-[#5a4138]">
                  Klik pada nama atau kartu resto mitra untuk melihat katalog khusus seluruh menu toko tersebut.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(STORE_PROFILES).map((store) => (
                <div
                  key={store.id}
                  onClick={() => onOpenStoreProfile && onOpenStoreProfile(store.name)}
                  className="rounded-2xl bg-white p-3.5 border border-[#dee8ff] hover:border-[#cc4900] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#dee8ff]"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#111c2d] truncate group-hover:text-[#cc4900] transition-colors">
                        {store.name}
                      </span>
                      <span className="text-[10px] text-[#5a4138] truncate">{store.cuisineType}</span>
                      <div className="flex items-center gap-1 text-[10px] text-[#825100] font-bold mt-0.5">
                        <span className="material-symbols-outlined text-xs">star</span>
                        <span>{store.rating} ({store.reviewCount})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#f0f3ff] flex items-center justify-between text-[10px] text-[#5a4138]">
                    <span>📍 {store.distance}</span>
                    <span className="text-[#a33900] font-bold group-hover:underline">Buka Profil Toko →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Ekspor kompatibilitas
export const CatalogCheckoutView = HalamanCheckout;
export const TampilanKatalogKasir = HalamanCheckout;
export default HalamanCheckout;
