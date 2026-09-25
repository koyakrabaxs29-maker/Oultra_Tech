export type UserRole = 'owner' | 'cashier' | 'waitress' | 'chef' | 'barista';

export type MenuCategory = 'Kopi' | 'Non-Kopi' | 'Makanan Ringan' | 'Makanan Berat';

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'completed' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'qris' | 'bank_transfer';

export type PaymentStatus = 'unpaid' | 'paid';

export type TableStatus = 'available' | 'occupied' | 'billing';

export type PortionSize = 'Reguler' | 'Large';

export type SugarLevel = 'Normal Sugar' | 'Less Sugar (50%)' | 'Low Sugar (25%)' | 'No Sugar (0%)' | 'Extra Sweet';

export type IceLevel = 'Normal Ice' | 'Less Ice' | 'No Ice' | 'Hot / Panas';

export type SpicyLevel = 'Tidak Pedas' | 'Pedas Sedang' | 'Pedas Mantap' | 'Extra Pedas';

export interface MenuAddOn {
  id: string;
  name: string;
  price: number; // Harga tambahan untuk add-on ini (misal: Rp 6.000)
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number; // Harga dasar Reguler
  largePriceAddition?: number; // Tambahan harga untuk Large (default: Rp 6.000)
  hasLargePortion?: boolean; // Apakah memiliki pilihan porsi Large dengan harga kustom?
  costPrice?: number; // Harga Pokok Penjualan (HPP modal bahan per porsi)
  description: string;
  image: string;
  inStock: boolean;
  prepTimeMinutes: number;
  station: 'bar' | 'kitchen';
  tags: string[];
  availableAddOns?: MenuAddOn[]; // Daftar add-ons / topping kustom beserta harganya
}

export const DEFAULT_CATEGORY_ADDONS: Record<MenuCategory, MenuAddOn[]> = {
  'Kopi': [
    { id: 'add-esp-1', name: 'Extra Espresso Shot', price: 6000 },
    { id: 'add-whip-1', name: 'Whipped Cream', price: 5000 },
    { id: 'add-oat-1', name: 'Oat Milk Swap', price: 6000 },
    { id: 'add-syrup-1', name: 'Caramel Syrup Drizzle', price: 5000 },
  ],
  'Non-Kopi': [
    { id: 'add-whip-2', name: 'Whipped Cream', price: 5000 },
    { id: 'add-oat-2', name: 'Oat Milk Swap', price: 6000 },
    { id: 'add-boba-1', name: 'Popping Boba / Jelly', price: 5000 },
    { id: 'add-syrup-2', name: 'Vanilla Shot', price: 5000 },
  ],
  'Makanan Ringan': [
    { id: 'add-cheese-1', name: 'Ekstra Keju Leleh', price: 7000 },
    { id: 'add-sambal-1', name: 'Ekstra Sambal Spesial', price: 4000 },
    { id: 'add-mayo-1', name: 'Ekstra Saus Mentai & Mayo', price: 5000 },
  ],
  'Makanan Berat': [
    { id: 'add-egg-1', name: 'Telur Mata Sapi / Dadar', price: 6000 },
    { id: 'add-cheese-2', name: 'Ekstra Keju Mozzarella', price: 7000 },
    { id: 'add-sambal-2', name: 'Ekstra Sambal Nadira', price: 4000 },
    { id: 'add-rice-1', name: 'Nasi Putih Tambahan', price: 5000 },
  ],
};

export interface OrderCustomization {
  portionSize: PortionSize;
  sugarLevel?: SugarLevel;
  iceLevel?: IceLevel;
  spicyLevel?: SpicyLevel;
  addOns?: string[];
  notes?: string;
}

export interface OrderItem {
  id: string; // unique item line id
  menuItemId: string;
  name: string;
  portionSize: PortionSize;
  price: number; // calculated unit price including portion & add-ons
  quantity: number;
  category: MenuCategory;
  station: 'bar' | 'kitchen';
  customization?: OrderCustomization;
  status?: 'pending' | 'cooking' | 'ready';
  readyAt?: string; // ISO timestamp when this specific item was marked ready
  served?: boolean; // true if waitress has served it to the table
  servedAt?: string; // ISO timestamp when served
  isAdditional?: boolean; // true if added after initial order placement (tambahan pesanan)
  addedAt?: string; // ISO timestamp when additional item was added
}

export type NotificationType = 
  | 'item_ready' 
  | 'bar_ready' // Minuman bar selesai siap saji oleh barista
  | 'kitchen_ready' // Makanan dapur selesai siap saji oleh chef
  | 'order_ready' 
  | 'order_delay_warning' // 15 - 20 minutes
  | 'order_delay_critical' // > 20 minutes
  | 'call_waiter'
  | 'order_items_added' // Tambahan pesanan baru dari waitress
  | 'new_order' // Pesanan meja baru
  | 'order_cancelled'
  | 'payment_success';

export interface CafeNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  tableNumber?: number;
  orderId?: string;
  orderNumber?: string;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  station?: 'bar' | 'kitchen';
  targetRole?: UserRole | 'all';
  itemsSummary?: string;
  createdAt: string; // ISO string
  read: boolean;
  served?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number; // PPN 10%
  serviceCharge: number; // 5%
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: {
    cashReceived?: number;
    changeReturned?: number;
    referenceNumber?: string;
    paidAt?: string;
  };
  waitressName?: string;
  cancelReason?: string;
  barReadyAt?: string; // ISO string when barista finished drinks
  kitchenReadyAt?: string; // ISO string when chef finished dishes
  barServedAt?: string; // ISO string when drinks were served by waitress
  kitchenServedAt?: string; // ISO string when food was served by waitress
  servedAt?: string; // ISO string when all food/drink served
  completedAt?: string; // ISO string when order completed
  hasNewAdditions?: boolean; // true when waitress added new items, awaiting chef acknowledgment
  lastItemAddedAt?: string; // ISO string of latest additions
  createdAt: string; // ISO string
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Kopi & Biji' | 'Susu & Dairy' | 'Sirup & Pemanis' | 'Bahan Makanan' | 'Kemasan';
  stockQuantity: number;
  unit: string; // kg, liter, botol, pack, gram
  minThreshold: number;
  costPerUnit: number; // Harga modal
  lastRestocked: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  pin: string;
  email: string;
  phone: string;
  active: boolean;
  avatar: string;
}

export interface TableInfo {
  number: number;
  capacity: number;
  section?: string;
  status: TableStatus;
  currentOrderId?: string;
}

export type ExpenseCategory = 
  | 'Gaji & Karyawan' 
  | 'Sewa & Lokasi' 
  | 'Utilitas (Listrik/Air/Wifi/Gas)' 
  | 'Pemeliharaan & Alat' 
  | 'Bahan Penunjang & Kebersihan' 
  | 'Pemasaran & Lainnya';

export interface OperationalExpense {
  id: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}
