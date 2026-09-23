import type { MenuItem, InventoryItem, UserAccount, TableInfo, Order, OperationalExpense, CafeNotification } from '../types.ts';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // KOPI
  {
    id: 'kopi-1',
    name: 'Es Kopi Susu Aren Nadira',
    category: 'Kopi',
    price: 24000,
    largePriceAddition: 6000,
    description: 'Signature coffee NADIRA dengan double shot espresso arabika, susu segar, dan gula aren organik resep istimewa.',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 4,
    station: 'bar',
    tags: ['Signature', 'Favorit', 'Dingin']
  },
  {
    id: 'kopi-2',
    name: 'V60 Manual Brew Aceh Gayo',
    category: 'Kopi',
    price: 32000,
    largePriceAddition: 8000,
    description: 'Single origin Arabika Aceh Gayo grade 1, diseduh manual V60 dengan notes fruity citrus dan aftertaste manis.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 6,
    station: 'bar',
    tags: ['Single Origin', 'Hot / Ice']
  },
  {
    id: 'kopi-3',
    name: 'Caramel Sea Salt Macchiato',
    category: 'Kopi',
    price: 30000,
    largePriceAddition: 6000,
    description: 'Espresso creamy dengan steamed milk, vanila syrup, drizzle karamel bakar, dan sentuhan fleur de sel gurih.',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 5,
    station: 'bar',
    tags: ['Favorit', 'Manis Gurih']
  },
  {
    id: 'kopi-4',
    name: 'Spanish Latte with Cinnamon',
    category: 'Kopi',
    price: 28000,
    largePriceAddition: 6000,
    description: 'Perpaduan lembut susu kental manis artisan, espresso pekat, dan taburan bubuk kayu manis wangi.',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 4,
    station: 'bar',
    tags: ['Best Seller']
  },
  {
    id: 'kopi-5',
    name: 'Americano Double Shot',
    category: 'Kopi',
    price: 22000,
    largePriceAddition: 6000,
    description: 'Espresso double extraction murni dengan air mineral panas atau dingin menyegarkan.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 3,
    station: 'bar',
    tags: ['Klasik', 'Zero Sugar']
  },

  // NON-KOPI
  {
    id: 'non-1',
    name: 'Matcha Uji Kyoto Latte',
    category: 'Non-Kopi',
    price: 29000,
    largePriceAddition: 6000,
    description: 'Bubuk ceremonial matcha murni impor dari Uji Kyoto dipadukan susu creamy lembut.',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 4,
    station: 'bar',
    tags: ['Signature Non-Kopi', 'Sehat']
  },
  {
    id: 'non-2',
    name: 'Dark Belgian Chocolate',
    category: 'Non-Kopi',
    price: 28000,
    largePriceAddition: 6000,
    description: 'Cokelat hitam Belgia 70% dengan tekstur kental pekat, hangat atau dingin dengan whipped cream.',
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 4,
    station: 'bar',
    tags: ['Rich & Creamy']
  },
  {
    id: 'non-3',
    name: 'Berry Lychee Sparkling Mocktail',
    category: 'Non-Kopi',
    price: 27000,
    largePriceAddition: 6000,
    description: 'Soda dingin menyegarkan dengan puree buah strawberry alami, sirup buah leci asli, dan daun mint segar.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 3,
    station: 'bar',
    tags: ['Segar', 'Mocktail']
  },
  {
    id: 'non-4',
    name: 'Artisan Earl Grey Lavender Tea',
    category: 'Non-Kopi',
    price: 24000,
    largePriceAddition: 6000,
    description: 'Seduhan teh hitam bergamot aromatik berpadu bunga lavender kering organik dalam teko kaca.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 5,
    station: 'bar',
    tags: ['Artisan Tea', 'Relaxing']
  },

  // MAKANAN RINGAN (SNACKS)
  {
    id: 'snack-1',
    name: 'Parmesan Truffle Fries',
    category: 'Makanan Ringan',
    price: 28000,
    largePriceAddition: 10000,
    description: 'Kentang goreng renyah dengan baluran minyak truffle Italia, taburan keju parmesan, dan saus garlic mayo.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 8,
    station: 'kitchen',
    tags: ['Favorit', 'Snack Gurih']
  },
  {
    id: 'snack-2',
    name: 'Crispy Butter Almond Croissant',
    category: 'Makanan Ringan',
    price: 26000,
    largePriceAddition: 8000,
    description: 'Pastry khas Perancis berlapis renyah dengan butter premium Elle & Vire, isian almond cream, dan topping irisan almond panggang.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 4,
    station: 'kitchen',
    tags: ['Bakery', 'Best with Coffee']
  },
  {
    id: 'snack-3',
    name: 'Crispy Chicken Honey Glaze Bites',
    category: 'Makanan Ringan',
    price: 32000,
    largePriceAddition: 12000,
    description: 'Potongan paha ayam krispi juicy dibalut madu wijen karamel khas Korea dengan saus pedas manis.',
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 10,
    station: 'kitchen',
    tags: ['Gurih Manis', 'Sharing']
  },
  {
    id: 'snack-4',
    name: 'Cireng Krispi Bumbu Rujak',
    category: 'Makanan Ringan',
    price: 20000,
    largePriceAddition: 8000,
    description: 'Camilan aci goreng gurih renyah di luar kenyal di dalam, disajikan dengan cocolan saus rujak pedas manis asam segar.',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 7,
    station: 'kitchen',
    tags: ['Lokal', 'Pedas Manis']
  },

  // MAKANAN BERAT (MAINS)
  {
    id: 'berat-1',
    name: 'Nasi Goreng Kampoeng Wagyu',
    category: 'Makanan Berat',
    price: 48000,
    largePriceAddition: 15000,
    description: 'Nasi goreng bumbu rempah tradisional gurih berasap (wok-hei), irisan daging wagyu empuk, telur mata sapi, kerupuk udang, dan acar segar.',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 12,
    station: 'kitchen',
    tags: ['Signature Chef', 'Kenyang']
  },
  {
    id: 'berat-2',
    name: 'Spaghetti Aglio Olio Smoked Beef',
    category: 'Makanan Berat',
    price: 42000,
    largePriceAddition: 12000,
    description: 'Pasta al dente ditumis minyak zaitun extra virgin, bawang putih harum, cabai kering, potongan smoked beef gurih, dan taburan parsley.',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 10,
    station: 'kitchen',
    tags: ['Western', 'Al Dente']
  },
  {
    id: 'berat-3',
    name: 'Chicken Katsu Curry Rice',
    category: 'Makanan Berat',
    price: 45000,
    largePriceAddition: 12000,
    description: 'Fillet dada ayam goreng tepung panko renyah, kuah kari khas Jepang kental harum dengan wortel dan kentang empuk di atas nasi pulen hangat.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 12,
    station: 'kitchen',
    tags: ['Japanese Style', 'Favorit']
  },
  {
    id: 'berat-4',
    name: 'Sop Buntut Bakar Madu Nadira',
    category: 'Makanan Berat',
    price: 68000,
    largePriceAddition: 20000,
    description: 'Buntut sapi pilihan dibakar empuk beraroma bumbu rempah madu, disajikan dengan kuah kaldu rempah bening gurih, emping, sambal ijo, dan nasi putih.',
    image: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prepTimeMinutes: 15,
    station: 'kitchen',
    tags: ['Chef Recommendation', 'Authentic']
  }
];

// DAFTAR 30 MEJA KAFE NADIRA (MEJA 01 - 30)
export const INITIAL_TABLES: TableInfo[] = [
  { number: 1, capacity: 2, status: 'occupied', currentOrderId: 'ORD-101' },
  { number: 2, capacity: 4, status: 'available' },
  { number: 3, capacity: 4, status: 'billing', currentOrderId: 'ORD-102' },
  { number: 4, capacity: 6, status: 'available' },
  { number: 5, capacity: 4, status: 'available' },
  { number: 6, capacity: 8, status: 'available' },
  { number: 7, capacity: 2, status: 'occupied', currentOrderId: 'ORD-103' },
  { number: 8, capacity: 4, status: 'available' },
  { number: 9, capacity: 4, status: 'available' },
  { number: 10, capacity: 6, status: 'available' },
  { number: 11, capacity: 4, status: 'available' },
  { number: 12, capacity: 4, status: 'available' },
  { number: 13, capacity: 2, status: 'occupied', currentOrderId: 'ORD-104' },
  { number: 14, capacity: 4, status: 'available' },
  { number: 15, capacity: 6, status: 'available' },
  { number: 16, capacity: 8, status: 'available' },
  { number: 17, capacity: 2, status: 'available' },
  { number: 18, capacity: 4, status: 'available' },
  { number: 19, capacity: 4, status: 'available' },
  { number: 20, capacity: 6, status: 'available' },
  { number: 21, capacity: 2, status: 'available' },
  { number: 22, capacity: 4, status: 'available' },
  { number: 23, capacity: 4, status: 'available' },
  { number: 24, capacity: 6, status: 'available' },
  { number: 25, capacity: 4, status: 'available' },
  { number: 26, capacity: 8, status: 'available' },
  { number: 27, capacity: 2, status: 'available' },
  { number: 28, capacity: 4, status: 'available' },
  { number: 29, capacity: 4, status: 'available' },
  { number: 30, capacity: 6, status: 'available' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Biji Kopi Arabika Aceh Gayo Specialty', category: 'Kopi & Biji', stockQuantity: 8.5, unit: 'kg', minThreshold: 3.0, costPerUnit: 185000, lastRestocked: '2026-09-18' },
  { id: 'inv-2', name: 'Susu Fresh Milk UHT Greenfields', category: 'Susu & Dairy', stockQuantity: 24, unit: 'liter', minThreshold: 10, costPerUnit: 22000, lastRestocked: '2026-09-19' },
  { id: 'inv-3', name: 'Susu Oat Barista Edition (Oatside)', category: 'Susu & Dairy', stockQuantity: 12, unit: 'liter', minThreshold: 5, costPerUnit: 38000, lastRestocked: '2026-09-17' },
  { id: 'inv-4', name: 'Gula Aren Cair Organik Nadira', category: 'Sirup & Pemanis', stockQuantity: 9.0, unit: 'liter', minThreshold: 4.0, costPerUnit: 45000, lastRestocked: '2026-09-18' },
  { id: 'inv-5', name: 'Sirup Karamel Monin Gourmet', category: 'Sirup & Pemanis', stockQuantity: 3, unit: 'botol', minThreshold: 2, costPerUnit: 145000, lastRestocked: '2026-09-12' },
  { id: 'inv-6', name: 'Kentang Shoestring Beku Premium', category: 'Bahan Makanan', stockQuantity: 15, unit: 'kg', minThreshold: 5, costPerUnit: 48000, lastRestocked: '2026-09-18' },
  { id: 'inv-7', name: 'Daging Slice Wagyu MB5+', category: 'Bahan Makanan', stockQuantity: 4.2, unit: 'kg', minThreshold: 2.0, costPerUnit: 280000, lastRestocked: '2026-09-19' },
  { id: 'inv-8', name: 'Minyak Truffle Putih Italia', category: 'Bahan Makanan', stockQuantity: 1.5, unit: 'liter', minThreshold: 1.0, costPerUnit: 310000, lastRestocked: '2026-09-10' },
  { id: 'inv-9', name: 'Cup Dingin 16oz Sablon Nadira', category: 'Kemasan', stockQuantity: 480, unit: 'pcs', minThreshold: 150, costPerUnit: 850, lastRestocked: '2026-09-15' },
];

export const INITIAL_USERS: UserAccount[] = [
  { id: 'usr-1', name: 'Nadira Putri (Owner)', username: 'owner', role: 'owner', pin: '1122', email: 'owner@nadiracafe.id', phone: '+628119876543', active: true, avatar: '👑' },
  { id: 'usr-2', name: 'Budi Santoso (Head Cashier)', username: 'kasir', role: 'cashier', pin: '2233', email: 'kasir@nadiracafe.id', phone: '+628123456780', active: true, avatar: '💳' },
  { id: 'usr-3', name: 'Siti Rahma (Lead Waitress)', username: 'waitress', role: 'waitress', pin: '3344', email: 'waitress@nadiracafe.id', phone: '+628135678901', active: true, avatar: '🛎️' },
  { id: 'usr-4', name: 'Chef Aris (Executive Chef & Bar)', username: 'chef', role: 'chef', pin: '4455', email: 'chef@nadiracafe.id', phone: '+628198765432', active: true, avatar: '👨‍🍳' },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    orderNumber: '#NDR-101',
    tableNumber: 1,
    customerName: 'Dimas Wicaksono',
    items: [
      {
        id: 'item-101-1',
        menuItemId: 'kopi-1',
        name: 'Es Kopi Susu Aren Nadira',
        portionSize: 'Large',
        price: 30000, // 24.000 + 6.000
        quantity: 2,
        category: 'Kopi',
        station: 'bar',
        customization: {
          portionSize: 'Large',
          sugarLevel: 'Less Sugar (50%)',
          iceLevel: 'Less Ice',
          addOns: ['Extra Espresso Shot'],
          notes: 'Tolong buat agak pekat'
        },
        status: 'ready'
      },
      {
        id: 'item-101-2',
        menuItemId: 'snack-1',
        name: 'Parmesan Truffle Fries',
        portionSize: 'Reguler',
        price: 28000,
        quantity: 1,
        category: 'Makanan Ringan',
        station: 'kitchen',
        customization: {
          portionSize: 'Reguler',
          notes: 'Saus garlic mayo dipisah ya'
        },
        status: 'cooking'
      }
    ],
    subtotal: 88000,
    tax: 8800,
    serviceCharge: 4400,
    total: 101200,
    status: 'cooking',
    paymentStatus: 'unpaid',
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ORD-102',
    orderNumber: '#NDR-102',
    tableNumber: 3,
    customerName: 'Rina & Teman',
    items: [
      {
        id: 'item-102-1',
        menuItemId: 'berat-1',
        name: 'Nasi Goreng Kampoeng Wagyu',
        portionSize: 'Large',
        price: 63000, // 48.000 + 15.000
        quantity: 2,
        category: 'Makanan Berat',
        station: 'kitchen',
        customization: {
          portionSize: 'Large',
          spicyLevel: 'Pedas Sedang',
          addOns: ['Telur Mata Sapi'],
          notes: 'Telur setengah matang'
        },
        status: 'ready'
      },
      {
        id: 'item-102-2',
        menuItemId: 'non-1',
        name: 'Matcha Uji Kyoto Latte',
        portionSize: 'Reguler',
        price: 29000,
        quantity: 2,
        category: 'Non-Kopi',
        station: 'bar',
        customization: {
          portionSize: 'Reguler',
          sugarLevel: 'Low Sugar (25%)',
          iceLevel: 'Normal Ice'
        },
        status: 'ready'
      }
    ],
    subtotal: 184000,
    tax: 18400,
    serviceCharge: 9200,
    total: 211600,
    status: 'ready',
    paymentStatus: 'unpaid',
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ORD-103',
    orderNumber: '#NDR-103',
    tableNumber: 7,
    customerName: 'Pak Hendra (VIP)',
    items: [
      {
        id: 'item-103-1',
        menuItemId: 'kopi-2',
        name: 'V60 Manual Brew Aceh Gayo',
        portionSize: 'Reguler',
        price: 32000,
        quantity: 1,
        category: 'Kopi',
        station: 'bar',
        customization: {
          portionSize: 'Reguler',
          iceLevel: 'Hot / Panas',
          sugarLevel: 'No Sugar (0%)',
          notes: 'Sajikan panas dalam cangkir keramik'
        },
        status: 'cooking'
      },
      {
        id: 'item-103-2',
        menuItemId: 'snack-2',
        name: 'Crispy Butter Almond Croissant',
        portionSize: 'Reguler',
        price: 26000,
        quantity: 1,
        category: 'Makanan Ringan',
        station: 'kitchen',
        customization: {
          portionSize: 'Reguler',
          notes: 'Tolong dihangatkan sebentar di oven'
        },
        status: 'pending'
      }
    ],
    subtotal: 58000,
    tax: 5800,
    serviceCharge: 2900,
    total: 66700,
    status: 'pending',
    paymentStatus: 'unpaid',
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ORD-104',
    orderNumber: '#NDR-104',
    tableNumber: 13,
    customerName: 'Alya & Bella',
    items: [
      {
        id: 'item-104-1',
        menuItemId: 'non-3',
        name: 'Berry Lychee Sparkling Mocktail',
        portionSize: 'Large',
        price: 33000, // 27.000 + 6.000
        quantity: 2,
        category: 'Non-Kopi',
        station: 'bar',
        customization: {
          portionSize: 'Large',
          sugarLevel: 'Normal Sugar',
          iceLevel: 'Normal Ice'
        },
        status: 'cooking'
      }
    ],
    subtotal: 66000,
    tax: 6600,
    serviceCharge: 3300,
    total: 75900,
    status: 'cooking',
    paymentStatus: 'unpaid',
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_PAID_ORDERS: Order[] = [
  {
    id: 'ORD-098',
    orderNumber: '#NDR-098',
    tableNumber: 2,
    customerName: 'Keluarga Wijaya',
    items: [
      { id: 'i-1', menuItemId: 'berat-1', name: 'Nasi Goreng Kampoeng Wagyu', portionSize: 'Large', price: 63000, quantity: 3, category: 'Makanan Berat', station: 'kitchen', status: 'ready' },
      { id: 'i-2', menuItemId: 'kopi-1', name: 'Es Kopi Susu Aren Nadira', portionSize: 'Large', price: 30000, quantity: 3, category: 'Kopi', station: 'bar', status: 'ready' },
      { id: 'i-3', menuItemId: 'snack-1', name: 'Parmesan Truffle Fries', portionSize: 'Reguler', price: 28000, quantity: 2, category: 'Makanan Ringan', station: 'kitchen', status: 'ready' }
    ],
    subtotal: 335000,
    tax: 33500,
    serviceCharge: 16750,
    total: 385250,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'qris',
    paymentDetails: {
      referenceNumber: 'QRIS-NDR-8839219',
      paidAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'ORD-097',
    orderNumber: '#NDR-097',
    tableNumber: 6,
    customerName: 'Bapak Dimas & Kolega',
    items: [
      { id: 'i-4', menuItemId: 'berat-3', name: 'Chicken Katsu Curry Rice', portionSize: 'Reguler', price: 45000, quantity: 2, category: 'Makanan Berat', station: 'kitchen', status: 'ready' },
      { id: 'i-5', menuItemId: 'kopi-2', name: 'Caramel Macchiato Cream', portionSize: 'Reguler', price: 28000, quantity: 2, category: 'Kopi', station: 'bar', status: 'ready' },
      { id: 'i-6', menuItemId: 'snack-3', name: 'Churros Cinnamon Chocolate', portionSize: 'Reguler', price: 24000, quantity: 1, category: 'Makanan Ringan', station: 'kitchen', status: 'ready' }
    ],
    subtotal: 170000,
    tax: 17000,
    serviceCharge: 8500,
    total: 195500,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    paymentDetails: {
      cashReceived: 200000,
      changeReturned: 4500,
      paidAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
    },
    waitressName: 'Dewi Lestari',
    createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  },
  {
    id: 'ORD-096',
    orderNumber: '#NDR-096',
    tableNumber: 11,
    customerName: 'Anisa & Sarah (Meeting)',
    items: [
      { id: 'i-7', menuItemId: 'non-1', name: 'Matcha Uji Kyoto Latte', portionSize: 'Large', price: 35000, quantity: 2, category: 'Non-Kopi', station: 'bar', status: 'ready' },
      { id: 'i-8', menuItemId: 'snack-2', name: 'Crispy Butter Almond Croissant', portionSize: 'Reguler', price: 26000, quantity: 2, category: 'Makanan Ringan', station: 'kitchen', status: 'ready' }
    ],
    subtotal: 122000,
    tax: 12200,
    serviceCharge: 6100,
    total: 140300,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'qris',
    paymentDetails: {
      referenceNumber: 'QRIS-NDR-7729103',
      paidAt: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    },
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  },
  {
    id: 'ORD-095',
    orderNumber: '#NDR-095',
    tableNumber: 8,
    customerName: 'Grup Arisan Ibu Linda',
    items: [
      { id: 'i-9', menuItemId: 'berat-4', name: 'Sop Buntut Bakar Madu Nadira', portionSize: 'Reguler', price: 68000, quantity: 4, category: 'Makanan Berat', station: 'kitchen', status: 'ready' },
      { id: 'i-10', menuItemId: 'non-3', name: 'Berry Lychee Sparkling Mocktail', portionSize: 'Large', price: 33000, quantity: 4, category: 'Non-Kopi', station: 'bar', status: 'ready' },
      { id: 'i-11', menuItemId: 'snack-4', name: 'Cireng Krispi Bumbu Rujak', portionSize: 'Reguler', price: 22000, quantity: 2, category: 'Makanan Ringan', station: 'kitchen', status: 'ready' }
    ],
    subtotal: 448000,
    tax: 44800,
    serviceCharge: 22400,
    total: 515200,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentDetails: {
      referenceNumber: 'BCA-TF-9912034',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() // Kemarin (~1 hari lalu)
    },
    waitressName: 'Dewi Lestari',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  },
  {
    id: 'ORD-094',
    orderNumber: '#NDR-094',
    tableNumber: 15,
    customerName: 'Komunitas Startup Bandung',
    items: [
      { id: 'i-12', menuItemId: 'kopi-4', name: 'Manual Brew Single Origin V60', portionSize: 'Reguler', price: 32000, quantity: 5, category: 'Kopi', station: 'bar', status: 'ready' },
      { id: 'i-13', menuItemId: 'snack-1', name: 'Parmesan Truffle Fries', portionSize: 'Reguler', price: 28000, quantity: 3, category: 'Makanan Ringan', station: 'kitchen', status: 'ready' }
    ],
    subtotal: 244000,
    tax: 24400,
    serviceCharge: 12200,
    total: 280600,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'qris',
    paymentDetails: {
      referenceNumber: 'QRIS-NDR-6610291',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() // 3 hari lalu
    },
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 74).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'ORD-093',
    orderNumber: '#NDR-093',
    tableNumber: 4,
    customerName: 'Reuni SMA 3 Alumni',
    items: [
      { id: 'i-14', menuItemId: 'berat-2', name: 'Spaghetti Aglio Olio Smoked Beef', portionSize: 'Reguler', price: 42000, quantity: 4, category: 'Makanan Berat', station: 'kitchen', status: 'ready' },
      { id: 'i-15', menuItemId: 'kopi-1', name: 'Es Kopi Susu Aren Nadira', portionSize: 'Large', price: 30000, quantity: 4, category: 'Kopi', station: 'bar', status: 'ready' },
      { id: 'i-16', menuItemId: 'non-2', name: 'Earl Grey Artisan Milk Tea', portionSize: 'Reguler', price: 26000, quantity: 2, category: 'Non-Kopi', station: 'bar', status: 'ready' }
    ],
    subtotal: 340000,
    tax: 34000,
    serviceCharge: 17000,
    total: 391000,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'qris',
    paymentDetails: {
      referenceNumber: 'QRIS-NDR-5541920',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() // 5 hari lalu
    },
    waitressName: 'Dewi Lestari',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 122).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
  },
  {
    id: 'ORD-092',
    orderNumber: '#NDR-092',
    tableNumber: 18,
    customerName: 'Workshop Fotografi Coffee',
    items: [
      { id: 'i-17', menuItemId: 'kopi-3', name: 'Classic Cappuccino Foam', portionSize: 'Reguler', price: 27000, quantity: 6, category: 'Kopi', station: 'bar', status: 'ready' },
      { id: 'i-18', menuItemId: 'snack-2', name: 'Crispy Butter Almond Croissant', portionSize: 'Reguler', price: 26000, quantity: 6, category: 'Makanan Ringan', station: 'kitchen', status: 'ready' }
    ],
    subtotal: 318000,
    tax: 31800,
    serviceCharge: 15900,
    total: 365700,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentDetails: {
      referenceNumber: 'MANDIRI-TF-4482910',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 360).toISOString() // 15 hari lalu
    },
    waitressName: 'Siti Rahma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 362).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 360).toISOString()
  },
  {
    id: 'ORD-091',
    orderNumber: '#NDR-091',
    tableNumber: 9,
    customerName: 'Keluarga Hendrawan',
    items: [
      { id: 'i-19', menuItemId: 'berat-1', name: 'Nasi Goreng Kampoeng Wagyu', portionSize: 'Large', price: 63000, quantity: 4, category: 'Makanan Berat', station: 'kitchen', status: 'ready' },
      { id: 'i-20', menuItemId: 'kopi-1', name: 'Es Kopi Susu Aren Nadira', portionSize: 'Reguler', price: 24000, quantity: 4, category: 'Kopi', station: 'bar', status: 'ready' }
    ],
    subtotal: 348000,
    tax: 34800,
    serviceCharge: 17400,
    total: 400200,
    status: 'paid',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    paymentDetails: {
      cashReceived: 450000,
      changeReturned: 49800,
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 500).toISOString() // ~21 hari lalu
    },
    waitressName: 'Dewi Lestari',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 502).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 500).toISOString()
  }
];

export const INITIAL_EXPENSES: OperationalExpense[] = [
  // Pengeluaran Hari Ini
  {
    id: 'exp-1',
    category: 'Gaji & Karyawan',
    name: 'Gaji Operasional 4 Barista & Waitress',
    amount: 600000,
    date: new Date().toISOString().split('T')[0],
    notes: 'Shift harian 4 staf'
  },
  {
    id: 'exp-2',
    category: 'Utilitas (Listrik/Air/Wifi/Gas)',
    name: 'Listrik Mesin Espresso & Gas Dapur',
    amount: 150000,
    date: new Date().toISOString().split('T')[0],
    notes: 'Biaya utilitas harian'
  },
  {
    id: 'exp-3',
    category: 'Bahan Penunjang & Kebersihan',
    name: 'Paper Cup, Straw & Packaging Takeaway',
    amount: 95000,
    date: new Date().toISOString().split('T')[0],
    notes: 'Packaging & hygiene supplies'
  },
  {
    id: 'exp-4',
    category: 'Sewa & Lokasi',
    name: 'Alokasi Biaya Gedung/Ruko Harian',
    amount: 250000,
    date: new Date().toISOString().split('T')[0],
    notes: 'Prorata sewa tempat'
  },
  {
    id: 'exp-5',
    category: 'Pemasaran & Lainnya',
    name: 'Promosi Digital Instagram & Wi-Fi Tamu',
    amount: 75000,
    date: new Date().toISOString().split('T')[0],
    notes: 'Marketing & koneksi internet'
  },
  // Pengeluaran 3-5 Hari Lalu (Mingguan)
  {
    id: 'exp-6',
    category: 'Pemeliharaan & Alat',
    name: 'Servis Rutin Grinder & Mesin Espresso La Marzocco',
    amount: 450000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString().split('T')[0],
    notes: 'Ganti seal gasket & kalibrasi burr'
  },
  {
    id: 'exp-7',
    category: 'Bahan Penunjang & Kebersihan',
    name: 'Restock Sabun Food Grade & Tissue Meja Kasir',
    amount: 120000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString().split('T')[0],
    notes: 'Perlengkapan sanitasi kafe'
  },
  // Pengeluaran 12-20 Hari Lalu (Bulanan)
  {
    id: 'exp-8',
    category: 'Pemasaran & Lainnya',
    name: 'Cetak Buku Menu Hardcover & Standing Banner Promo',
    amount: 350000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 360).toISOString().split('T')[0],
    notes: 'Marketing cetak materi promosi'
  },
  {
    id: 'exp-9',
    category: 'Utilitas (Listrik/Air/Wifi/Gas)',
    name: 'Tagihan Internet Biznet Dedicated Kafe 100 Mbps',
    amount: 550000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 480).toISOString().split('T')[0],
    notes: 'Tagihan wifi bulanan kafe'
  }
];

export const INITIAL_NOTIFICATIONS: CafeNotification[] = [
  {
    id: 'notif-init-1',
    type: 'item_ready',
    title: '🍽️ Minuman Siap Saji',
    message: '2x Es Kopi Susu Aren Nadira untuk Meja #1 siap disajikan!',
    tableNumber: 1,
    orderId: 'ORD-101',
    orderNumber: '#NDR-101',
    itemId: 'item-101-1',
    itemName: 'Es Kopi Susu Aren Nadira',
    quantity: 2,
    station: 'bar',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    read: false,
    served: false,
  },
  {
    id: 'notif-init-2',
    type: 'order_delay_warning',
    title: '⚠️ Pengingat: Mendekati 15 Menit',
    message: 'Pesanan #NDR-101 (Meja #1) sudah 14 menit belum selesai diracik!',
    tableNumber: 1,
    orderId: 'ORD-101',
    orderNumber: '#NDR-101',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: 'notif-init-3',
    type: 'item_ready',
    title: '🍽️ Makanan Siap Saji',
    message: '2x Nasi Goreng Kampoeng Wagyu untuk Meja #3 siap disajikan!',
    tableNumber: 3,
    orderId: 'ORD-102',
    orderNumber: '#NDR-102',
    itemId: 'item-102-1',
    itemName: 'Nasi Goreng Kampoeng Wagyu',
    quantity: 2,
    station: 'kitchen',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    read: true,
    served: true,
  }
];


