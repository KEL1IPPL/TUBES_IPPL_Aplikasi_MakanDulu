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
  MenuItem
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
import { HalamanPilihPeran } from './components/HalamanPilihPeran';
import { AlurAutentikasiPeran } from './views/AlurAutentikasiPeran';
import { ModalAlamat } from './components/ModalAlamat';
import { ModalPreferensi } from './components/ModalPreferensi';
import { ModalProfil } from './components/ModalProfil';
import { HalamanCheckout } from './views/HalamanCheckout';
import { KeranjangPembeli } from './views/KeranjangPembeli';
import { PortalAutentikasi } from './views/PortalAutentikasi';
import { PelacakanPesanan } from './views/PelacakanPesanan';
import { DashboardPenjual } from './views/DashboardPenjual';
import { PesananPenjual } from './views/PesananPenjual';
import { KelolaStokPenjual } from './views/KelolaStokPenjual';
import { ProfilToko } from './views/ProfilToko';

export default function AplikasiUtama() {
  // Tahap Aplikasi: 'select_role' (Halaman Depan) -> 'auth' (Daftar / Login) -> 'app' (Workspace)
  const [tahapAplikasi, setTahapAplikasi] = useState<'select_role' | 'auth' | 'app'>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.TAHAP_APLIKASI, 'select_role')
  );
  const [peranPengguna, setPeranPengguna] = useState<'Pembeli' | 'Penjual' | null>(() =>
    muatDariPenyimpanan(KUNCI_STORAGE.PERAN, null)
  );

  // Profil Pengguna (menyimpan detail pendaftaran, saldo MakanPay & preferensi rasa)
  const [profilPengguna, setProfilPengguna] = useState<UserProfile | null>(() =>
    muatDariPenyimpanan<UserProfile | null>(KUNCI_STORAGE.PROFIL, {
      name: 'Siti Rahmawati',
      email: 'siti.rahma@domain.com',
      phone: '0812-3456-7890',
      address: 'Jl. Sudirman No. 42 (Gedung B Lt. 3), Kebayoran Baru, Jakarta Selatan',
      role: 'Pembeli',
      balance: 150000,
      registeredAt: '20 Oktober 2026',
      preferences: {
        tastes: ['pedas', 'gurih'],
        categories: ['ayam_bebek', 'nasi_bakar'],
        dietary: ['aman_lambung']
      }
    })
  );

  // Tab aktif ruang kerja
  const [tabAktifPembeli, setTabAktifPembeli] = useState<PembeliTab>('katalog');
  const [tabAktifPenjual, setTabAktifPenjual] = useState<PenjualTab>('pesanan');
  const [modalPortalTerbuka, setModalPortalTerbuka] = useState(false);

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

  // Sinkronisasi otomatis ke LocalStorage
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
  const tanganiAlihkanStok = (idMenu: string) => {
    setDaftarMenu((sebelumnya) => {
      const menuTarget = sebelumnya.find((x) => x.id === idMenu);
      const statusBerikutnya = menuTarget ? !menuTarget.isAvailable : false;

      const hasil = sebelumnya.map((item) => {
        if (item.id === idMenu) {
          return { ...item, isAvailable: statusBerikutnya };
        }
        return item;
      });

      if (menuTarget) {
        tampilkanToast(
          statusBerikutnya ? 'Stok Diaktifkan' : 'Stok Ditandai Habis',
          `${menuTarget.name} kini ${statusBerikutnya ? 'Tersedia' : 'Habis'} di katalog pembeli.`
        );
      }

      return hasil;
    });
  };

  // Handler alihkan diskon promosi bagi Penjual
  const tanganiAlihkanDiskon = (idMenu: string) => {
    setDaftarMenu((sebelumnya) => {
      const menuTarget = sebelumnya.find((x) => x.id === idMenu);
      if (!menuTarget) return sebelumnya;

      const sedangDiskon = Boolean(menuTarget.originalPrice && menuTarget.originalPrice > menuTarget.price);
      let hargaBaru = menuTarget.price;
      let hargaAwalBaru: number | undefined = undefined;
      let persenDiskonBaru: number | undefined = undefined;

      if (sedangDiskon) {
        hargaBaru = menuTarget.originalPrice || menuTarget.price;
        hargaAwalBaru = undefined;
        persenDiskonBaru = undefined;
        tampilkanToast('Diskon Dinonaktifkan', `Harga ${menuTarget.name} kembali normal: Rp ${hargaBaru.toLocaleString('id-ID')}`);
      } else {
        hargaAwalBaru = menuTarget.price;
        hargaBaru = Math.round(menuTarget.price * 0.8); // Diskon 20%
        persenDiskonBaru = 20;
        tampilkanToast('Diskon Diberikan!', `Harga ${menuTarget.name} didiskon 20% menjadi Rp ${hargaBaru.toLocaleString('id-ID')}`);
      }

      return sebelumnya.map((item) => {
        if (item.id === idMenu) {
          return {
            ...item,
            price: hargaBaru,
            originalPrice: hargaAwalBaru,
            discountPercentage: persenDiskonBaru
          };
        }
        return item;
      });
    });
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

  // Handler tambah menu langsung dari Asisten AI
  const tanganiTambahMenuDariAI = (itemMenu: MenuItem) => {
    setKeranjang((sebelumnya) => {
      const itemAda = sebelumnya.find((x) => x.menuId === itemMenu.id);
      if (itemAda) {
        return sebelumnya.map((x) => (x.menuId === itemMenu.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...sebelumnya,
        {
          id: `cart-${Date.now()}-${itemMenu.id}`,
          menuId: itemMenu.id,
          name: itemMenu.name,
          price: itemMenu.price,
          qty: 1,
          sublabel: itemMenu.modifier || 'Porsi Reguler',
          restaurant: itemMenu.restaurant
        }
      ];
    });
  };

  // Handler reset semua data simulasi ke kondisi awal
  const tanganiResetData = () => {
    resetSemuaPenyimpanan();
    setDaftarMenu(INITIAL_MENU_ITEMS);
    setKeranjang(INITIAL_CART);
    setAlamatTujuanSaatIni(DEFAULT_DELIVERY_ADDRESS);
    setPesananSaatIni(null);
    setStatusTokoBuka(true);
    setProfilPengguna({
      name: 'Siti Rahmawati',
      email: 'siti.rahma@domain.com',
      phone: '0812-3456-7890',
      address: 'Jl. Sudirman No. 42 (Gedung B Lt. 3), Kebayoran Baru, Jakarta Selatan',
      role: 'Pembeli',
      balance: 150000,
      registeredAt: '20 Oktober 2026',
      preferences: {
        tastes: ['pedas', 'gurih'],
        categories: ['ayam_bebek', 'nasi_bakar'],
        dietary: ['aman_lambung']
      }
    });
    setTahapAplikasi('select_role');
    setPeranPengguna(null);
    tampilkanToast('Data Direset', 'Semua data dan keranjang telah dikembalikan ke setelan awal.');
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

  // =========================================================================
  // 1. TAHAP PERTAMA: Halaman Depan Pemilihan Role
  // =========================================================================
  if (tahapAplikasi === 'select_role' || !peranPengguna) {
    return (
      <>
        {elemenToast}

        <HalamanPilihPeran
          onSelectRole={(role) => {
            setPeranPengguna(role);
            setTahapAplikasi('auth');
          }}
          onOpenPortalModal={() => setModalPortalTerbuka(true)}
        />

        {/* Portal Auth Modal Simulator */}
        {modalPortalTerbuka && (
          <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative bg-[#f9f9ff] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dee8ff]">
              <button
                onClick={() => setModalPortalTerbuka(false)}
                className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5a4138] hover:text-[#111c2d] shadow-sm z-20"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <PortalAutentikasi
                userRole={peranPengguna || 'Pembeli'}
                setUserRole={(r) => {
                  setPeranPengguna(r);
                  setModalPortalTerbuka(false);
                }}
                onNavigateToCatalog={() => {
                  setModalPortalTerbuka(false);
                  setPeranPengguna('Pembeli');
                  setTahapAplikasi('app');
                  setTabAktifPembeli('katalog');
                }}
                showToast={tampilkanToast}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // =========================================================================
  // 2. TAHAP KEDUA: Halaman Pilihan Daftar atau Login sesuai Role
  // =========================================================================
  if (tahapAplikasi === 'auth' && peranPengguna) {
    return (
      <>
        {elemenToast}

        <AlurAutentikasiPeran
          userRole={peranPengguna}
          onBackToRoleSelect={() => {
            setPeranPengguna(null);
            setTahapAplikasi('select_role');
          }}
          onAuthSuccess={(role, profil) => {
            setPeranPengguna(role);
            if (profil) {
              setProfilPengguna((prev) => ({
                ...prev,
                ...profil,
                balance: prev?.balance ?? 150000
              }));
            }
            setTahapAplikasi('app');
            if (role === 'Pembeli') {
              setTabAktifPembeli('katalog');
            } else {
              setTabAktifPenjual('pesanan');
            }
          }}
          showToast={tampilkanToast}
        />
      </>
    );
  }

  // =========================================================================
  // 3. TAHAP KETIGA: Halaman Kerja Workspace (Setelah Berhasil Login / Daftar)
  // =========================================================================
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
        onOpenPortalModal={() => setModalPortalTerbuka(true)}
        userProfile={profilPengguna}
        onOpenProfileModal={() => setModalProfilTerbuka(true)}
        onOpenPreferenceModal={() => setModalPreferensiTerbuka(true)}
      />

      {/* Konten Utama Berdasarkan Peran Pengguna & Tab Aktif */}
      <main className="w-full pt-28 flex-1">
        {peranPengguna === 'Pembeli' ? (
          /* ========================================= */
          /* MODE PEMBELI: KATALOG, KERANJANG, & LIVE TRACKING */
          /* ========================================= */
          <>
            {tabAktifPembeli === 'katalog' && (
              namaTokoDilihat ? (
                <ProfilToko
                  storeProfile={
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
          /* MODE PENJUAL: MENU PESANAN, KELOLA STOK, & DASHBOARD MERCHANT */
          /* ========================================= */
          <>
            {tabAktifPenjual === 'pesanan' && (
              <PesananPenjual
                showToast={tampilkanToast}
                onNavigateToDashboard={() => setTabAktifPenjual('dashboard')}
              />
            )}

            {tabAktifPenjual === 'stok' && (
              <KelolaStokPenjual
                menuList={daftarMenu}
                onToggleStock={tanganiAlihkanStok}
                onToggleDiscount={tanganiAlihkanDiskon}
                showToast={tampilkanToast}
              />
            )}

            {tabAktifPenjual === 'dashboard' && (
              <DashboardPenjual
                menuList={daftarMenu}
                isStoreOpen={statusTokoBuka}
                onToggleStoreStatus={tanganiAlihkanStatusToko}
                onNavigateToStock={() => setTabAktifPenjual('stok')}
                onNavigateToOrders={() => setTabAktifPenjual('pesanan')}
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
          onSavePreferences={(preferensiDiperbarui) => {
            setProfilPengguna((sebelumnya) =>
              sebelumnya ? { ...sebelumnya, preferences: preferensiDiperbarui } : null
            );
          }}
          showToast={tampilkanToast}
        />
      )}

      {/* Modal Detail Profil & Data Registrasi (dengan Tombol Reset Data) */}
      {profilPengguna && peranPengguna && (
        <ModalProfil
          isOpen={modalProfilTerbuka}
          onClose={() => setModalProfilTerbuka(false)}
          userProfile={profilPengguna}
          userRole={peranPengguna}
          isStoreOpen={statusTokoBuka}
          onOpenPreferenceModal={() => setModalPreferensiTerbuka(true)}
          onResetData={tanganiResetData}
          onLogout={tanganiKeluarKeLanding}
        />
      )}

      {/* Modal Simulator Portal Autentikasi */}
      {modalPortalTerbuka && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-[#f9f9ff] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dee8ff]">
            <button
              onClick={() => setModalPortalTerbuka(false)}
              className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5a4138] hover:text-[#111c2d] shadow-sm z-20"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <PortalAutentikasi
              userRole={peranPengguna || 'Pembeli'}
              setUserRole={(r) => {
                setPeranPengguna(r);
                setModalPortalTerbuka(false);
              }}
              onNavigateToCatalog={() => {
                setModalPortalTerbuka(false);
                setPeranPengguna('Pembeli');
                setTahapAplikasi('app');
                setTabAktifPembeli('katalog');
              }}
              showToast={tampilkanToast}
            />
          </div>
        </div>
      )}
    </div>
  );
}
