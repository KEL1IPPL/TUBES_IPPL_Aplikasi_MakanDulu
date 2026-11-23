import React, { useState, useEffect } from 'react';
import {
  UserRole,
  CartItem,
  DeliveryAddress,
  PaymentMethod,
  OrderRecord,
  PembeliTab,
  PenjualTab,
  UserProfile,
  MenuItem,
  StoreProfile
} from './types/tipeData';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_CART,
  DEFAULT_DELIVERY_ADDRESS,
  POD_PHOTO_URL,
  STORE_PROFILES
} from './data/dataMock';
import {
  muatDariPenyimpanan,
  simpanKePenyimpanan,
  resetSemuaPenyimpanan,
  KUNCI_STORAGE
} from './utils/penyimpananLokal';
import { NavigasiAtas } from './components/NavigasiAtas';
import { HalamanPilihPeran } from './components/halaman_utama';
import AlurAutentikasiPeran from './views/AlurAutentikasiPeran';
import { ModalAlamat } from './components/ModalAlamat';
import { ModalPreferensi } from './components/ModalPreferensi';
import { ModalProfil } from './components/ModalProfil';
import { HalamanCheckout } from './views/HalamanCheckout';
import { KeranjangPembeli } from './views/KeranjangPembeli';
import { PelacakanPesanan } from './views/PelacakanPesanan';
import HalamanDashboardPenjual from './components/halaman_dashboard_penjual';
import HalamanPesananPenjual from './components/halaman_pesanan_penjual';
import HalamanKelolaMenu from './components/halaman_kelola_menu';
import HalamanKelolaVoucher from './components/halaman_kelola_voucher';
import HalamanLaporanPenjualan from './components/halaman_laporan_penjualan';
import { ProfilToko } from './views/ProfilToko';
import { usePreferensiMakanan } from './hooks/usePreferensiMakanan';
import apiClient, { getMenus, toggleMenuStatus, updateMenu, MenuApiItem, getProfilPengguna } from './services/apiClient';

export default function AplikasiUtama() {
  const { simpan: simpanPreferensi } = usePreferensiMakanan();
  // Tahap Aplikasi: 'select_role' (Halaman Depan) -> 'auth' (Daftar / Login) -> 'app' (Workspace)
  const [tahapAplikasi, setTahapAplikasi] = useState<'select_role' | 'auth' | 'app'>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.TAHAP_APLIKASI, 'select_role')
  );
  const [peranPengguna, setPeranPengguna] = useState<'Pembeli' | 'Penjual' | null>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.PERAN, null)
  );

  // Profil Pengguna (menyimpan detail akun login langsung dari database)
  const [profilPengguna, setProfilPengguna] = useState<UserProfile | null>(() => {
    const tersimpan = muatDariPenyimpanan<UserProfile | null>(KUNCI_STORAGE.PROFIL, null);
    // Bersihkan data profil lokal mock jika tersisa
    if (tersimpan && tersimpan.email === 'siti.rahma@domain.com') {
      localStorage.removeItem(KUNCI_STORAGE.PROFIL);
      return null;
    }
    return tersimpan;
  });

  // Validasi sesi token & perbarui profil real dari database saat aplikasi dimuat
  useEffect(() => {
    const token = localStorage.getItem('makandulu_token');
    if (token) {
      getProfilPengguna()
        .then((res) => {
          if (res.user) {
            const u = res.user;
            setProfilPengguna(u);
            setPeranPengguna(u.role);
            if (u.role === 'Pembeli' && u.address) {
              setAlamatTujuanSaatIni((prev) => ({
                ...prev,
                street: u.address,
                details: `Penerima: ${u.name} (${u.phone})`,
              }));
            }
          }
        })
        .catch(() => {
          // Token tidak valid atau sesi kedaluwarsa
          localStorage.removeItem('makandulu_token');
          localStorage.removeItem(KUNCI_STORAGE.PROFIL);
          setProfilPengguna(null);
        });
    }
  }, []);

  // Tab aktif ruang kerja
  const [tabAktifPembeli, setTabAktifPembeli] = useState<PembeliTab>('katalog');
  const [tabAktifPenjual, setTabAktifPenjual] = useState<PenjualTab>('pesanan');

  // Status modal preferensi & profil
  const [modalPreferensiTerbuka, setModalPreferensiTerbuka] = useState(false);
  const [modalProfilTerbuka, setModalProfilTerbuka] = useState(false);

  // Status toko buka/tutup (dikendalikan penjual, tersinkronisasi ke pembeli)
  const [statusTokoBuka, setStatusTokoBuka] = useState<boolean>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.STATUS_TOKO, true)
  );

  // Status tampilan profil toko (saat pembeli memilih salah satu mitra resto)
  const [namaTokoDilihat, setNamaTokoDilihat] = useState<string | null>(null);

  // Status data domain aplikasi dengan LocalStorage persistence
  const [daftarMenu, setDaftarMenu] = useState<MenuItem[]>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.MENU, INITIAL_MENU_ITEMS)
  );
  // Status sinkronisasi mitra toko dan rekomendasi dari database
  const [daftarToko, setDaftarToko] = useState<StoreProfile[]>([]);
  const [daftarRekomendasi, setDaftarRekomendasi] = useState<MenuItem[]>([]);
  const [keranjang, setKeranjang] = useState<CartItem[]>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.KERANJANG, INITIAL_CART)
  );
  const [alamatTujuanSaatIni, setAlamatTujuanSaatIni] = useState<DeliveryAddress>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.ALAMAT, DEFAULT_DELIVERY_ADDRESS)
  );
  const [pesananSaatIni, setPesananSaatIni] = useState<OrderRecord | null>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.PESANAN_AKTIF, null)
  );

  // Status modal alamat
  const [modalAlamatTerbuka, setModalAlamatTerbuka] = useState(false);

  //cek status api
useEffect(() => {
  fetch('/api/health')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Request ke backend gagal');
      }

      return response.json();
    })
    .then((data) => {
      console.log('Status backend:', data.message);
    })
    .catch((error) => {
      console.error('Gagal terhubung ke backend:', error);
    });
}, []);

  useEffect(() => {
    if (peranPengguna !== 'Penjual' || tahapAplikasi !== 'app') return;

    getMenus()
      .then((response) => {
        const menuFromApi = response.data.map((item: MenuApiItem): MenuItem => ({
          id: item.id,
          name: item.name,
          restaurant: item.restaurant || 'Resto Bebek Juara',
          distance: item.distance || '—',
          price: item.price,
          originalPrice: item.originalPrice,
          discountPercentage: item.discountPercentage,
          rating: item.rating,
          reviewCount: item.reviewCount,
          tag: item.tag,
          tasteCategory: item.tasteCategory,
          category: item.category,
          description: item.description,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
          modifier: item.modifier,
          salesCount: item.salesCount,
        }));
        setDaftarMenu(menuFromApi);
      })
      .catch((error) => {
        console.error('Gagal memuat menu dari backend:', error);
      });
  }, [peranPengguna, tahapAplikasi]);

  // Main Flow Diagram Robustness: proses_katalog(preferensi_pembeli) -> ambil_preferensi + ambil_menu
  useEffect(() => {
    if (peranPengguna !== 'Pembeli' || tahapAplikasi !== 'app') return;

    apiClient
      .getKatalog(profilPengguna?.id)
      .then((response) => {
        if (response.success && response.data) {
          if (response.data.menus && response.data.menus.length > 0) {
            setDaftarMenu(response.data.menus);
          }
          if (response.data.rekomendasi && response.data.rekomendasi.length > 0) {
            setDaftarRekomendasi(response.data.rekomendasi);
          }
          if (response.data.tokoList && response.data.tokoList.length > 0) {
            setDaftarToko(response.data.tokoList);
          }
        }
      })
      .catch((error) => {
        console.error('Gagal memuat katalog pembeli dari backend:', error);
      });
  }, [peranPengguna, tahapAplikasi, profilPengguna?.id]);

  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.TAHAP_APLIKASI, tahapAplikasi);
  }, [tahapAplikasi]);
  
  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.PERAN, peranPengguna);
  }, [peranPengguna]);
  
  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.PROFIL, profilPengguna);
  }, [profilPengguna]);

  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.MENU, daftarMenu);
  }, [daftarMenu]);

  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.KERANJANG, keranjang);
  }, [keranjang]);

  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.ALAMAT, alamatTujuanSaatIni);
  }, [alamatTujuanSaatIni]);

  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.PESANAN_AKTIF, pesananSaatIni);
  }, [pesananSaatIni]);

  useEffect(() => {
    simpanKePenyimpanan(KUNCI_STORAGE.STATUS_TOKO, statusTokoBuka);
  }, [statusTokoBuka]);

  // Status notifikasi toast
  const [pemberitahuanToast, setPemberitahuanToast] = useState<{
    tampil: boolean;
    judul: string;
    pesan: string;
    apakahError: boolean;
  }>({
    tampil: false,
    judul: 'Berhasil Ditambahkan',
    pesan: 'Menu telah masuk ke keranjang pesanan.',
    apakahError: false
  });

  const tampilkanToast = (judul: string, pesan: string, apakahError = false) => {
    setPemberitahuanToast({
      tampil: true,
      judul,
      pesan,
      apakahError
    });
  };

  useEffect(() => {
    if (pemberitahuanToast.tampil) {
      const pengaturWaktu = setTimeout(() => {
        setPemberitahuanToast((sebelumnya) => ({ ...sebelumnya, tampil: false }));
      }, 4000);
      return () => clearTimeout(pengaturWaktu);
    }
  }, [pemberitahuanToast.tampil]);

  // Handler beralih stok menu bagi Penjual
  const tanganiAlihkanStok = async (idMenu: string) => {
    const menuTarget = daftarMenu.find((item) => item.id === idMenu);
    const numericId = /^menu-(\d+)$/.exec(idMenu);

    if (numericId) {
      try {
        await toggleMenuStatus(Number(numericId[1]));
      } catch (error) {
        console.error('Gagal mengubah status stok menu:', error);
        tampilkanToast('Gagal Mengubah Stok', 'Perubahan tidak tersimpan ke backend.', true);
        return;
      }
    }

    setDaftarMenu((sebelumnya) => {
      const target = sebelumnya.find((item) => item.id === idMenu);
      const statusBerikutnya = target ? !target.isAvailable : false;
      return sebelumnya.map((item) =>
        item.id === idMenu ? { ...item, isAvailable: statusBerikutnya } : item
      );
    });

    if (menuTarget) {
      tampilkanToast(
        menuTarget.isAvailable ? 'Stok Ditandai Habis' : 'Stok Diaktifkan',
        `${menuTarget.name} kini ${menuTarget.isAvailable ? 'Habis' : 'Tersedia'} di katalog pembeli.`
      );
    }
  };

  // Handler alihkan diskon promosi bagi Penjual
  const tanganiAlihkanDiskon = async (idMenu: string) => {
    const menuTarget = daftarMenu.find((item) => item.id === idMenu);
    if (!menuTarget) return;

    const sedangDiskon = Boolean(menuTarget.originalPrice && menuTarget.originalPrice > menuTarget.price);
    let hargaBaru = menuTarget.price;
    let hargaAwalBaru: number | undefined = undefined;
    let persenDiskonBaru: number | undefined = undefined;

    if (sedangDiskon) {
      hargaBaru = menuTarget.originalPrice || menuTarget.price;
    } else {
      hargaAwalBaru = menuTarget.price;
      hargaBaru = Math.round(menuTarget.price * 0.8);
      persenDiskonBaru = 20;
    }

    const numericId = /^menu-(\d+)$/.exec(idMenu);
    if (numericId) {
      try {
        await updateMenu(Number(numericId[1]), {
          namaMenu: menuTarget.name,
          kategori: menuTarget.category,
          harga: hargaBaru,
          hargaNormal: hargaAwalBaru,
          deskripsi: menuTarget.description,
          fotoUrl: menuTarget.imageUrl,
          rasaKarakter: menuTarget.tasteCategory,
          modifier: menuTarget.modifier,
          statusAktif: menuTarget.isAvailable,
        });
      } catch (error) {
        tampilkanToast('Gagal Mengubah Diskon', error instanceof Error ? error.message : 'Perubahan tidak tersimpan ke backend.', true);
        return;
      }
    }

    setDaftarMenu((sebelumnya) => {
      const target = sebelumnya.find((x) => x.id === idMenu);
      if (!target) return sebelumnya;
      return sebelumnya.map((item) => {
        if (item.id === idMenu) {
          return {
            ...item,
            price: hargaBaru,
            originalPrice: hargaAwalBaru,
            discountPercentage: persenDiskonBaru,
          };
        }
        return item;
      });
    });

    if (sedangDiskon) {
      tampilkanToast('Diskon Dinonaktifkan', `Harga ${menuTarget.name} kembali normal: Rp ${hargaBaru.toLocaleString('id-ID')}`);
    } else {
      tampilkanToast('Diskon Diberikan!', `Harga ${menuTarget.name} didiskon 20% menjadi Rp ${hargaBaru.toLocaleString('id-ID')}`);
    }
  };

  // Handler kelola menu bagi Penjual (Tambah, Update, Hapus)
  const tanganiTambahMenu = (menuBaru: MenuItem) => {
    setDaftarMenu((sebelumnya) => [menuBaru, ...sebelumnya]);
  };

  const tanganiUpdateMenu = (menuDiperbarui: MenuItem) => {
    setDaftarMenu((sebelumnya) =>
      sebelumnya.map((m) => (m.id === menuDiperbarui.id ? menuDiperbarui : m))
    );
  };

  const tanganiHapusMenu = (idMenu: string) => {
    setDaftarMenu((sebelumnya) => sebelumnya.filter((m) => m.id !== idMenu));
  };

  // Handler buka/tutup resto bagi Penjual
  const tanganiAlihkanStatusToko = () => {
    const statusBerikutnya = !statusTokoBuka;
    setStatusTokoBuka(statusBerikutnya);
    tampilkanToast(
      statusBerikutnya ? 'Toko Dibuka Kembali' : 'Toko Ditutup Sementara',
      statusBerikutnya
        ? 'Resto kini menerima pesanan makanan dari pelanggan.'
        : 'Resto ditutup. Pembeli tidak dapat membuat pesanan baru saat ini.'
    );
  };

  // Handler reset semua data simulasi ke kondisi awal
  const tanganiResetData = () => {
    resetSemuaPenyimpanan();
    localStorage.removeItem('makandulu_token');
    localStorage.removeItem(KUNCI_STORAGE.PROFIL);
    setDaftarMenu(INITIAL_MENU_ITEMS);
    setKeranjang(INITIAL_CART);
    setAlamatTujuanSaatIni(DEFAULT_DELIVERY_ADDRESS);
    setPesananSaatIni(null);
    setStatusTokoBuka(true);
    setProfilPengguna(null);
    setTahapAplikasi('select_role');
    setPeranPengguna(null);
    tampilkanToast('Data Direset', 'Semua data dan sesi login telah dibersihkan.');
  };

  // Handler keberhasilan checkout
  const tanganiPesananBerhasil = (
    itemBelanja: CartItem[],
    totalTagihan: number,
    metodeBayar: PaymentMethod,
    namaPenyedia?: string
  ) => {
    const pesananBaru: OrderRecord = {
      id: `order-${Date.now()}`,
      orderNumber: `MKD-${Math.floor(100000 + Math.random() * 900000)}`,
      items: itemBelanja,
      subtotal: itemBelanja.reduce((acc, i) => acc + i.price * i.qty, 0),
      shippingFee: 10000,
      serviceFee: 2000,
      discount: itemBelanja.reduce((acc, i) => acc + i.price * i.qty, 0) > 60000 ? 15000 : 0,
      total: totalTagihan,
      paymentMethod: metodeBayar,
      selectedProvider: namaPenyedia || 'GoPay',
      address: alamatTujuanSaatIni,
      status: 'dimasak',
      orderTime: 'Baru saja',
      estimatedDeliveryTime: '15-20 Menit',
      driverName: 'Pak Ahmad Fauzi',
      driverPhone: '0812-9876-5432',
      driverPlate: 'B 4821 KOP',
      driverRating: 4.9,
      podImageUrl: POD_PHOTO_URL,
      merchantTimerSeconds: 600
    };

    setPesananSaatIni(pesananBaru);
    setKeranjang([]);
    setTabAktifPembeli('tracking');
    tampilkanToast(
      'Pesanan Diterima Dapur!',
      `Pesanan #${pesananBaru.orderNumber} sedang disiapkan oleh mitra dapur resto.`
    );
  };

  // Handler keluar / ganti peran
  const tanganiKeluarKeLanding = () => {
    localStorage.removeItem('makandulu_token');
    localStorage.removeItem(KUNCI_STORAGE.PROFIL);
    setProfilPengguna(null);
    setPeranPengguna(null);
    setTahapAplikasi('select_role');
    setPesananSaatIni(null);
    setNamaTokoDilihat(null);
    tampilkanToast('Sesi Berakhir', 'Silakan pilih peran Pembeli atau Penjual untuk melanjutkan.');
  };

  const totalJumlahItemKeranjang = keranjang.reduce((acc, x) => acc + x.qty, 0);

  // Komponen Notifikasi Toast
  const elemenToast = pemberitahuanToast.tampil && (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm ${
        pemberitahuanToast.apakahError
          ? 'bg-[#ba1a1a] text-white border-[#ffb4ab]'
          : 'bg-[#111c2d] text-white border-[#263143]'
      }`}
    >
      <span className="material-symbols-outlined text-xl shrink-0">
        {pemberitahuanToast.apakahError ? 'error' : 'check_circle'}
      </span>
      <div className="flex flex-col text-left">
        <span className="text-sm font-bold text-white">{pemberitahuanToast.judul}</span>
        <span className="text-xs text-[#cfdaf2] mt-0.5">{pemberitahuanToast.pesan}</span>
      </div>
      <button
        onClick={() => setPemberitahuanToast((prev) => ({ ...prev, tampil: false }))}
        className="ml-2 text-[#cfdaf2] hover:text-white"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );

  if (tahapAplikasi === 'select_role' || !peranPengguna) {
    return (
      <>
        {elemenToast}

        <HalamanPilihPeran
          onSelectRole={(role) => {
            setPeranPengguna(role);
            setTahapAplikasi('auth');
          }}
          onOpenPortalModal={() => {
            setPeranPengguna('Pembeli');
            setTahapAplikasi('auth');
          }}
        />
      </>
    );
  }

  // =========================================================================
  // 2. TAHAP KEDUA: Halaman Login / Daftar terintegrasi (tab switcher)
  // =========================================================================
  if (tahapAplikasi === 'auth' && peranPengguna) {
    return (
      <div className="min-h-screen bg-[#f9f9ff]">
        {elemenToast}
        <AlurAutentikasiPeran
          userRole={peranPengguna}
          onSuccess={(profil) => {
            setProfilPengguna({
              ...profil,
              role: peranPengguna,
            });
            if (peranPengguna === 'Pembeli' && profil.address) {
              setAlamatTujuanSaatIni({
                label: 'Alamat Utama',
                street: profil.address,
                details: `Penerima: ${profil.name} (${profil.phone})`,
                notes: 'Hubungi penerima saat kurir tiba di lokasi.'
              });
            }
            setTahapAplikasi('app');
          }}
          onBackToRoleSelect={() => {
            setPeranPengguna(null);
            setTahapAplikasi('select_role');
          }}
          showToast={tampilkanToast}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col font-sans">
      {elemenToast}

      {/* Main Navigation Header: Atas Logo & Profil, Bawah Bar Menu */}
      <NavigasiAtas
        userRole={peranPengguna}
        activePembeliTab={tabAktifPembeli}
        setActivePembeliTab={(tab) => {
          setTabAktifPembeli(tab);
          if (tab === 'katalog') {
            setNamaTokoDilihat(null);
          }
        }}
        activePenjualTab={tabAktifPenjual}
        setActivePenjualTab={setTabAktifPenjual}
        cartItemCount={totalJumlahItemKeranjang}
        hasActiveOrder={pesananSaatIni !== null}
        onLogout={tanganiKeluarKeLanding}
        onOpenPortalModal={() => {
          setTahapAplikasi('auth');
        }}
        userProfile={profilPengguna}
        onOpenProfileModal={() => setModalProfilTerbuka(true)}
        onOpenPreferenceModal={() => setModalPreferensiTerbuka(true)}
      />

      {/* Konten Utama Berdasarkan Peran Pengguna & Tab Aktif */}
      <main className="w-full pt-28 flex-1">
        {peranPengguna === 'Pembeli' ? (
          <>
            {tabAktifPembeli === 'katalog' && (
              namaTokoDilihat ? (
                <ProfilToko
                  storeProfile={
                    daftarToko.find((t) => t.name.toLowerCase() === namaTokoDilihat.toLowerCase()) ||
                    STORE_PROFILES[namaTokoDilihat] || {
                      id: `store-${namaTokoDilihat.toLowerCase().replace(/\s+/g, '-')}`,
                      name: namaTokoDilihat,
                      tagline: 'Mitra Kuliner Terpercaya Pilihan MakanDulu',
                      cuisineType: 'Kuliner Nusantara',
                      rating: 4.8,
                      reviewCount: '500+ ulasan',
                      distance: '1.5 km',
                      deliveryTime: '15-20 mnt',
                      address: 'Jakarta Selatan',
                      openingHours: '09:00 - 21:00 WIB',
                      bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
                      logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=80',
                      promoText: 'Diskon Spesial Langsung dari Mitra Toko.',
                      description: 'Menyajikan aneka menu lezat khas nusantara dengan bahan pilihan bermutu.',
                      verified: true
                    }
                  }
                  menuList={daftarMenu}
                  cart={keranjang}
                  setCart={setKeranjang}
                  isStoreOpen={namaTokoDilihat === 'Resto Bebek Juara' ? statusTokoBuka : true}
                  onBackToCatalog={() => setNamaTokoDilihat(null)}
                  onNavigateToCartCheckout={() => {
                    setNamaTokoDilihat(null);
                    setTabAktifPembeli('keranjang');
                  }}
                  showToast={tampilkanToast}
                />
              ) : (
                <HalamanCheckout
                  menuList={daftarMenu}
                  cart={keranjang}
                  setCart={setKeranjang}
                  currentAddress={alamatTujuanSaatIni}
                  onOpenAddressModal={() => setModalAlamatTerbuka(true)}
                  onOrderSuccess={tanganiPesananBerhasil}
                  showToast={tampilkanToast}
                  onNavigateToCartCheckout={() => setTabAktifPembeli('keranjang')}
                  onOpenStoreProfile={(storeName) => setNamaTokoDilihat(storeName)}
                  isStoreOpen={statusTokoBuka}
                  userPreferences={profilPengguna?.preferences}
                  onOpenPreferenceModal={() => setModalPreferensiTerbuka(true)}
                  storeList={daftarToko}
                  recommendedMenus={daftarRekomendasi}
                />
              )
            )}

            {tabAktifPembeli === 'keranjang' && (
              <KeranjangPembeli
                cart={keranjang}
                setCart={setKeranjang}
                currentAddress={alamatTujuanSaatIni}
                onOpenAddressModal={() => setModalAlamatTerbuka(true)}
                onOrderSuccess={tanganiPesananBerhasil}
                onNavigateToCatalog={() => {
                  setNamaTokoDilihat(null);
                  setTabAktifPembeli('katalog');
                }}
                onOpenStoreProfile={(storeName) => {
                  setNamaTokoDilihat(storeName);
                  setTabAktifPembeli('katalog');
                }}
                showToast={tampilkanToast}
              />
            )}

            {tabAktifPembeli === 'tracking' && (
              <PelacakanPesanan
                currentOrder={pesananSaatIni}
                onNavigateToCatalog={() => {
                  setNamaTokoDilihat(null);
                  setTabAktifPembeli('katalog');
                }}
                onOrderCompleted={() => {
                  setPesananSaatIni(null);
                }}
                showToast={tampilkanToast}
                isMerchantView={false}
              />
            )}
          </>
        ) : (
          /* ========================================= */
          /* MODE PENJUAL: MENU PESANAN, KELOLA MENU & STOK, VOUCHER, LAPORAN, & DASHBOARD */
          /* ========================================= */
          <>
            {tabAktifPenjual === 'pesanan' && (
              <HalamanPesananPenjual
                showToast={tampilkanToast}
                onNavigateToDashboard={() => setTabAktifPenjual('dashboard')}
                userProfile={profilPengguna}
              />
            )}

            {tabAktifPenjual === 'stok' && (
              <HalamanKelolaMenu
                menuList={daftarMenu}
                onAddMenu={tanganiTambahMenu}
                onUpdateMenu={tanganiUpdateMenu}
                onDeleteMenu={tanganiHapusMenu}
                onToggleStock={tanganiAlihkanStok}
                onToggleDiscount={tanganiAlihkanDiskon}
                showToast={tampilkanToast}
              />
            )}

            {tabAktifPenjual === 'voucher' && (
              <HalamanKelolaVoucher showToast={tampilkanToast} />
            )}

            {tabAktifPenjual === 'laporan' && (
              <HalamanLaporanPenjualan
                onBackToDashboard={() => setTabAktifPenjual('dashboard')}
              />
            )}

            {tabAktifPenjual === 'dashboard' && (
              <HalamanDashboardPenjual
                menuList={daftarMenu}
                isStoreOpen={statusTokoBuka}
                onToggleStoreStatus={tanganiAlihkanStatusToko}
                onNavigateToMenu={() => setTabAktifPenjual('stok')}
                onNavigateToOrders={() => setTabAktifPenjual('pesanan')}
                onNavigateToVoucher={() => setTabAktifPenjual('voucher')}
                onNavigateToReport={() => setTabAktifPenjual('laporan')}
                userProfile={profilPengguna}
              />
            )}
          </>
        )}
      </main>

      {/* Modal Ubah Alamat */}
      <ModalAlamat
        isOpen={modalAlamatTerbuka}
        onClose={() => setModalAlamatTerbuka(false)}
        currentAddress={alamatTujuanSaatIni}
        onSave={(alamatBaru) => {
          setAlamatTujuanSaatIni(alamatBaru);
          tampilkanToast('Alamat Diperbarui', `Pesanan akan diantar ke: ${alamatBaru.street}`);
        }}
      />

      {/* Modal Preferensi Selera Makanan */}
      {profilPengguna?.preferences && (
        <ModalPreferensi
          isOpen={modalPreferensiTerbuka}
          onClose={() => setModalPreferensiTerbuka(false)}
          currentPreferences={profilPengguna.preferences}
          onSavePreferences={async (preferensiDiperbarui) => {
            await simpanPreferensi(preferensiDiperbarui);
            setProfilPengguna((sebelumnya) =>
              sebelumnya ? { ...sebelumnya, preferences: preferensiDiperbarui } : null
            );
          }}
          showToast={tampilkanToast}
        />
      )}
    </div>
  );
}

