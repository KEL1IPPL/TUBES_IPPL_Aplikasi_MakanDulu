export type UserRole = 'Pembeli' | 'Penjual' | null;

export type PembeliTab = 'katalog' | 'keranjang' | 'tracking';
export type PenjualTab = 'pesanan' | 'stok' | 'dashboard';
export type ActiveTab = PembeliTab | PenjualTab | 'portal';

export interface MenuItem {
  id: string;
  name: string;
  restaurant: string;
  distance: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: string;
  tag: string;
  tagColor?: 'primary' | 'secondary' | 'tertiary';
  tasteCategory: string[];
  category: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  salesCount?: string;
  modifier?: string;
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'shipping';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  expiryDate: string;
  tag: string;
  storeExclusive?: string;
}

export interface StoreProfile {
  id: string;
  name: string;
  tagline: string;
  cuisineType: string;
  rating: number;
  reviewCount: string;
  distance: string;
  deliveryTime: string;
  address: string;
  openingHours: string;
  bannerUrl: string;
  logoUrl: string;
  promoText: string;
  description: string;
  verified: boolean;
}

export interface CartItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  qty: number;
  sublabel: string;
  restaurant: string;
}

export interface DeliveryAddress {
  label: string;
  street: string;
  details: string;
  notes: string;
}

export type PaymentMethod = 'ewallet' | 'bank_va' | 'cod';
export type EWalletProvider = 'GoPay' | 'DANA' | 'OVO';
export type BankProvider = 'Bank BCA' | 'Bank BNI' | 'Bank Mandiri' | 'Bank Lainnya';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  selectedProvider?: string;
  address: DeliveryAddress;
  status: 'dimasak' | 'diantar' | 'selesai' | 'dibatalkan' | 'ditolak_cod' | 'auto_batal_10mnt';
  rejectionReason?: string;
  orderTime: string;
  estimatedDeliveryTime: string;
  driverName: string;
  driverPhone: string;
  driverPlate: string;
  driverRating: number;
  podImageUrl?: string;
  merchantTimerSeconds: number;
}

export interface UserPreferences {
  tastes: string[];
  categories: string[];
  dietary: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'Pembeli' | 'Penjual';
  balance?: number;
  registeredAt?: string;
  storeName?: string;
  ownerName?: string;
  nibNumber?: string;
  ktpNumber?: string;
  npwpNumber?: string;
  preferences?: UserPreferences;
}

// Alias dalam Bahasa Indonesia
export type PeranPengguna = UserRole;
export type TabPembeli = PembeliTab;
export type TabPenjual = PenjualTab;
export type ItemMenu = MenuItem;
export type ItemKeranjang = CartItem;
export type ProfilTokoTipe = StoreProfile;
export type AlamatPengiriman = DeliveryAddress;
export type MetodePembayaran = PaymentMethod;
export type PenyediaEWallet = EWalletProvider;
export type PenyediaBank = BankProvider;
export type CatatanPesanan = OrderRecord;
export type PreferensiPengguna = UserPreferences;
export type ProfilPengguna = UserProfile;
