import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  UserRole, 
  MenuItem, 
  Order, 
  InventoryItem, 
  UserAccount, 
  TableInfo, 
  OrderItem, 
  OrderStatus, 
  PaymentMethod,
  CafeNotification,
  OperationalExpense
} from '../types';
import { 
  INITIAL_MENU_ITEMS, 
  INITIAL_TABLES, 
  INITIAL_INVENTORY, 
  INITIAL_USERS, 
  INITIAL_ORDERS, 
  INITIAL_PAID_ORDERS 
} from '../data/initialData';
import { soundAlerts } from '../utils/soundAlerts';
import { getElapsedMinutes } from '../utils/formatters';

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

interface CafeContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  
  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuStock: (id: string) => void;

  // Orders
  activeOrders: Order[];
  completedOrders: Order[];
  allOrders: Order[];
  createOrder: (data: { tableNumber: number; customerName: string; items: OrderItem[]; waitressName?: string }) => Order;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  acknowledgeOrderAdditions: (orderId: string) => void;
  updateOrderItems: (orderId: string, items: OrderItem[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, itemStatus: 'pending' | 'cooking' | 'ready') => void;
  cancelOrder: (orderId: string, reason: string) => void;
  processPayment: (orderId: string, method: PaymentMethod, details: { cashReceived?: number; changeReturned?: number; referenceNumber?: string }) => void;
  markItemServed: (orderId: string, itemId: string, forceServed?: boolean) => void;
  markAllOrderItemsServed: (orderId: string) => void;
  markOrderServed: (orderId: string) => void;
  markOrderCompleted: (orderId: string) => void;
  updateCompletedOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteCompletedOrder: (orderId: string) => void;

  // Expenses & Profit / Loss
  expenses: OperationalExpense[];
  addExpense: (expense: Omit<OperationalExpense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<OperationalExpense>) => void;
  deleteExpense: (id: string) => void;

  // Tables
  tables: TableInfo[];
  updateTableStatus: (tableNumber: number, status: TableInfo['status'], orderId?: string) => void;

  // Inventory
  inventory: InventoryItem[];
  updateInventoryStock: (id: string, newStock: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  deleteInventoryItem: (id: string) => void;

  // Users
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  // Notifications & Sound Alert
  notifications: CafeNotification[];
  unreadNotificationsCount: number;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  addNotification: (notif: Omit<CafeNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Reset demo
  resetToDefaultData: () => void;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MENU: 'nadira_pos_menu_v4',
  ORDERS: 'nadira_pos_orders_v4',
  PAID_ORDERS: 'nadira_pos_paid_orders_v4',
  DELETED_ORDER_IDS: 'nadira_pos_deleted_order_ids_v4',
  TABLES: 'nadira_pos_tables_v4',
  INVENTORY: 'nadira_pos_inventory_v4',
  USERS: 'nadira_pos_users_v4',
  NOTIFICATIONS: 'nadira_pos_notifications_v4',
  SOUND_ENABLED: 'nadira_pos_sound_v4',
  EXPENSES: 'nadira_pos_expenses_v4',
};

const INITIAL_NOTIFICATIONS: CafeNotification[] = [
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

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('waitress');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper for localStorage
  const loadInitial = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return fallback;
  };

  // Persistent registry of deleted order IDs so they are NEVER resurrected on refresh or role login
  const [deletedOrderIds, setDeletedOrderIds] = useState<string[]>(() => 
    loadInitial<string[]>(STORAGE_KEYS.DELETED_ORDER_IDS, [])
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => 
    loadInitial(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS)
  );

  const [activeOrders, setActiveOrders] = useState<Order[]>(() => {
    const deleted = loadInitial<string[]>(STORAGE_KEYS.DELETED_ORDER_IDS, []);
    const deletedSet = new Set(deleted);
    const loaded = loadInitial(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return loaded.filter((o: Order) => !deletedSet.has(o.id));
  });

  const [completedOrders, setCompletedOrders] = useState<Order[]>(() => {
    const deleted = loadInitial<string[]>(STORAGE_KEYS.DELETED_ORDER_IDS, []);
    const deletedSet = new Set(deleted);
    const loaded = loadInitial(STORAGE_KEYS.PAID_ORDERS, INITIAL_PAID_ORDERS);
    return loaded.filter((o: Order) => !deletedSet.has(o.id));
  });

  const [tables, setTables] = useState<TableInfo[]>(() => {
    const loaded = loadInitial(STORAGE_KEYS.TABLES, INITIAL_TABLES);
    if (!Array.isArray(loaded) || loaded.length !== 30) {
      return INITIAL_TABLES;
    }
    return loaded;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => 
    loadInitial(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY)
  );

  const [users, setUsers] = useState<UserAccount[]>(() => 
    loadInitial(STORAGE_KEYS.USERS, INITIAL_USERS)
  );

  const [notifications, setNotifications] = useState<CafeNotification[]>(() => 
    loadInitial(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [expenses, setExpenses] = useState<OperationalExpense[]>(() => 
    loadInitial(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );

  const [isSoundEnabled, setIsSoundEnabledState] = useState<boolean>(() => {
    const saved = loadInitial<boolean | null>(STORAGE_KEYS.SOUND_ENABLED, null);
    if (saved !== null) {
      soundAlerts.setEnabled(saved);
      return saved;
    }
    return true;
  });

  const setIsSoundEnabled = (enabled: boolean) => {
    setIsSoundEnabledState(enabled);
    soundAlerts.setEnabled(enabled);
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(enabled));
  };

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(activeOrders));
  }, [activeOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(completedOrders));
  }, [completedOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_ORDER_IDS, JSON.stringify(deletedOrderIds));
  }, [deletedOrderIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  // Keep track of which orders have already fired delay reminders
  const alertedDelayOrdersRef = useRef<{ [orderId: string]: { warning15?: boolean; critical20?: boolean } }>({
    'ORD-101': { warning15: true }
  });

  // Automated 15 - 20 minute delay watcher
  useEffect(() => {
    const checkOrderDelays = () => {
      activeOrders.forEach((order) => {
        if (order.status === 'pending' || order.status === 'cooking') {
          const elapsed = getElapsedMinutes(order.createdAt);
          const currentAlerts = alertedDelayOrdersRef.current[order.id] || {};

          // Critical delay: >= 20 minutes
          if (elapsed >= 20 && !currentAlerts.critical20) {
            alertedDelayOrdersRef.current[order.id] = {
              ...currentAlerts,
              warning15: true,
              critical20: true,
            };
            soundAlerts.playCriticalDelay();

            const criticalNotif: CafeNotification = {
              id: `notif-delay-crit-${Date.now()}-${order.id}`,
              type: 'order_delay_critical',
              title: `🚨 Peringatan Kritis: Meja #${order.tableNumber} (>20 mnt)`,
              message: `Pesanan ${order.orderNumber} (Meja #${order.tableNumber}) telah mencapai ${elapsed} menit dan belum selesai! Mohon prioritaskan segera.`,
              tableNumber: order.tableNumber,
              orderId: order.id,
              orderNumber: order.orderNumber,
              createdAt: new Date().toISOString(),
              read: false,
            };

            setNotifications((prev) => [criticalNotif, ...prev]);
            showToast(`🚨 PERINGATAN KRITIS: Pesanan Meja #${order.tableNumber} sudah ${elapsed} menit belum selesai!`);
          } 
          // Warning delay: 15 - 20 minutes
          else if (elapsed >= 15 && elapsed < 20 && !currentAlerts.warning15) {
            alertedDelayOrdersRef.current[order.id] = {
              ...currentAlerts,
              warning15: true,
            };
            soundAlerts.playWarningReminder();

            const warningNotif: CafeNotification = {
              id: `notif-delay-warn-${Date.now()}-${order.id}`,
              type: 'order_delay_warning',
              title: `⚠️ Pengingat Durasi: Meja #${order.tableNumber} (15-20 mnt)`,
              message: `Pesanan ${order.orderNumber} (Meja #${order.tableNumber}) sudah berlangsung ${elapsed} menit dan belum selesai diracik/dimasak.`,
              tableNumber: order.tableNumber,
              orderId: order.id,
              orderNumber: order.orderNumber,
              createdAt: new Date().toISOString(),
              read: false,
            };

            setNotifications((prev) => [warningNotif, ...prev]);
            showToast(`⚠️ Peringatan: Pesanan Meja #${order.tableNumber} sudah ${elapsed} menit belum selesai!`);
          }
        }
      });
    };

    checkOrderDelays();
    const interval = setInterval(checkOrderDelays, 10000);
    return () => clearInterval(interval);
  }, [activeOrders]);

  const addNotification = (notifData: Omit<CafeNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: CafeNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast(`Semua notifikasi telah ditandai sudah dibaca.`);
  };

  const clearNotifications = () => {
    setNotifications([]);
    showToast(`Riwayat notifikasi dibersihkan.`);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Helper calculations
  const calculateTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.1); // PPN 10%
    const serviceCharge = Math.round(subtotal * 0.05); // 5%
    const total = subtotal + tax + serviceCharge;
    return { subtotal, tax, serviceCharge, total };
  };

  // ORDER ACTIONS
  const createOrder = ({
    tableNumber,
    customerName,
    items,
    waitressName,
  }: {
    tableNumber: number;
    customerName: string;
    items: OrderItem[];
    waitressName?: string;
  }): Order => {
    const { subtotal, tax, serviceCharge, total } = calculateTotals(items);
    const newOrderNumber = `#NDR-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `ORD-${Date.now().toString().slice(-6)}`;

    const newOrder: Order = {
      id: newId,
      orderNumber: newOrderNumber,
      tableNumber,
      customerName: customerName.trim() || `Pelanggan Meja ${tableNumber}`,
      items: items.map((it) => ({ ...it, status: it.status || 'pending' })),
      subtotal,
      tax,
      serviceCharge,
      total,
      status: 'pending',
      paymentStatus: 'unpaid',
      waitressName: waitressName || (activeRole === 'waitress' ? 'Siti Rahma' : 'Waitress On-Duty'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveOrders((prev) => [newOrder, ...prev]);

    // Update table status
    setTables((prev) =>
      prev.map((t) =>
        t.number === tableNumber
          ? { ...t, status: 'occupied', currentOrderId: newOrder.id }
          : t
      )
    );

    // Audio chime & notification for Kitchen & Bar
    soundAlerts.playNewOrderChime();
    const newOrderNotif: CafeNotification = {
      id: `notif-new-order-${Date.now()}-${newId}`,
      type: 'new_order',
      title: `📝 Pesanan Baru: Meja #${tableNumber}`,
      message: `Pesanan ${newOrderNumber} (${customerName.trim() || `Meja ${tableNumber}`}) berisi ${items.length} menu siap diproses di Dapur/Bar.`,
      tableNumber,
      orderId: newId,
      orderNumber: newOrderNumber,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newOrderNotif, ...prev]);

    showToast(`Pesanan ${newOrderNumber} berhasil dibuat untuk Meja ${tableNumber}!`);
    return newOrder;
  };

  const addItemsToOrder = (orderId: string, newItems: OrderItem[]) => {
    let affectedTableNumber = 0;
    let affectedOrderNumber = '';
    let affectedCustomerName = '';
    const nowIso = new Date().toISOString();

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        affectedTableNumber = order.tableNumber;
        affectedOrderNumber = order.orderNumber;
        affectedCustomerName = order.customerName;

        const mergedItems = [...order.items];
        newItems.forEach((newItem) => {
          // If an identical item exists and is still pending (not started cooking yet and not served)
          const existingIdx = mergedItems.findIndex(
            (it) =>
              it.menuItemId === newItem.menuItemId &&
              JSON.stringify(it.customization || {}) === JSON.stringify(newItem.customization || {}) &&
              it.status === 'pending' &&
              !it.served
          );

          if (existingIdx >= 0) {
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity: mergedItems[existingIdx].quantity + newItem.quantity,
              isAdditional: true,
              addedAt: nowIso,
            };
          } else {
            // Fresh line for additional item so chef cooks this fresh portion and waitress/kitchen track it distinctly
            mergedItems.push({
              ...newItem,
              id: newItem.id || `item-add-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              status: 'pending',
              served: false,
              isAdditional: true,
              addedAt: nowIso,
            });
          }
        });

        const { subtotal, tax, serviceCharge, total } = calculateTotals(mergedItems);
        return {
          ...order,
          items: mergedItems,
          subtotal,
          tax,
          serviceCharge,
          total,
          // CRITICAL: Always reset to cooking so it actively displays in KDS even if previously served/ready
          status: 'cooking',
          hasNewAdditions: true,
          lastItemAddedAt: nowIso,
          updatedAt: nowIso,
        };
      })
    );

    // Audio chime specifically for additional orders!
    soundAlerts.playAdditionalItemChime();

    // Summary of added items for notifications and toast
    const itemsSummary = newItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
    const stations = Array.from(new Set(newItems.map((it) => it.station)));
    const stationLabel = stations.length === 1 ? (stations[0] === 'bar' ? 'Bar (Minuman)' : 'Kitchen (Makanan)') : 'Kitchen & Bar';

    const addNotif: CafeNotification = {
      id: `notif-add-items-${Date.now()}-${orderId}`,
      type: 'order_items_added',
      title: `🔔 Tambahan Pesanan: Meja #${affectedTableNumber || '?'}`,
      message: `Meja #${affectedTableNumber} (${affectedCustomerName} - ${affectedOrderNumber}) menambah menu: ${itemsSummary}. Harap segera disiapkan di ${stationLabel}!`,
      tableNumber: affectedTableNumber,
      orderId,
      orderNumber: affectedOrderNumber,
      station: stations.length === 1 ? stations[0] : undefined,
      createdAt: nowIso,
      read: false,
    };
    setNotifications((prev) => [addNotif, ...prev]);

    showToast(`🔔 TAMBAHAN PESANAN MEJA #${affectedTableNumber || '?'}: ${itemsSummary} dikirim ke Dapur/Bar!`);
  };

  const acknowledgeOrderAdditions = (orderId: string) => {
    setActiveOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, hasNewAdditions: false } : order
      )
    );
  };

  const updateOrderItems = (orderId: string, items: OrderItem[]) => {
    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const { subtotal, tax, serviceCharge, total } = calculateTotals(items);
        return {
          ...order,
          items,
          subtotal,
          tax,
          serviceCharge,
          total,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(`Pesanan berhasil diperbarui!`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        // if updating order to ready, also update all item statuses
        const now = new Date().toISOString();
        const updatedItems = order.items.map((it) => ({
          ...it,
          status: status === 'ready' ? 'ready' : status === 'cooking' ? 'cooking' : it.status,
          readyAt: status === 'ready' ? (it.readyAt || now) : it.readyAt,
        }));
        return {
          ...order,
          status,
          items: updatedItems,
          updatedAt: now,
        };
      })
    );

    if (status === 'ready' && targetOrder) {
      soundAlerts.playReadyChime();
      const readyNotif: CafeNotification = {
        id: `notif-order-ready-${Date.now()}-${orderId}`,
        type: 'order_ready',
        title: '✨ Seluruh Pesanan Siap Saji',
        message: `Semua hidangan untuk Meja #${targetOrder.tableNumber} (${targetOrder.orderNumber}) telah selesai siap diantar!`,
        tableNumber: targetOrder.tableNumber,
        orderId: targetOrder.id,
        orderNumber: targetOrder.orderNumber,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [readyNotif, ...prev]);
    }

    showToast(`Status pesanan diperbarui menjadi: ${status.toUpperCase()}`);
  };

  const updateOrderItemStatus = (
    orderId: string,
    itemId: string,
    itemStatus: 'pending' | 'cooking' | 'ready'
  ) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    const targetItem = targetOrder?.items.find((it) => it.id === itemId);
    const now = new Date().toISOString();

    if (itemStatus === 'ready' && targetOrder && targetItem && targetItem.status !== 'ready') {
      soundAlerts.playReadyChime();
      const itemReadyNotif: CafeNotification = {
        id: `notif-item-ready-${Date.now()}-${itemId}`,
        type: 'item_ready',
        title: '🍽️ Makanan/Minuman Siap Saji',
        message: `${targetItem.quantity}x ${targetItem.name} untuk Meja #${targetOrder.tableNumber} siap disajikan!`,
        tableNumber: targetOrder.tableNumber,
        orderId: targetOrder.id,
        orderNumber: targetOrder.orderNumber,
        itemId: targetItem.id,
        itemName: targetItem.name,
        quantity: targetItem.quantity,
        station: targetItem.station,
        createdAt: now,
        read: false,
        served: false,
      };
      setNotifications((prev) => [itemReadyNotif, ...prev]);
      showToast(`🔔 Meja #${targetOrder.tableNumber}: ${targetItem.quantity}x ${targetItem.name} SIAP SAJI!`);
    }

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            status: itemStatus,
            readyAt: itemStatus === 'ready' ? (it.readyAt || now) : it.readyAt,
            served: itemStatus === 'ready' ? false : it.served,
          };
        });

        const allReady = updatedItems.every((it) => it.status === 'ready');
        const anyCooking = updatedItems.some((it) => it.status === 'cooking' || it.status === 'ready');

        let newOrderStatus: OrderStatus = order.status;
        if (allReady) {
          newOrderStatus = 'ready';
          if (order.status !== 'ready') {
            const allReadyNotif: CafeNotification = {
              id: `notif-all-ready-${Date.now()}-${order.id}`,
              type: 'order_ready',
              title: '✨ Seluruh Pesanan Meja Siap Saji',
              message: `Semua menu ${order.orderNumber} (Meja #${order.tableNumber}) lengkap siap diantar ke meja tamu!`,
              tableNumber: order.tableNumber,
              orderId: order.id,
              orderNumber: order.orderNumber,
              createdAt: now,
              read: false,
            };
            setNotifications((nPrev) => [allReadyNotif, ...nPrev]);
          }
        } else if (anyCooking) {
          newOrderStatus = 'cooking';
        }

        return {
          ...order,
          items: updatedItems,
          status: newOrderStatus,
          updatedAt: now,
        };
      })
    );
  };

  const markItemServed = (orderId: string, itemId: string, forceServed?: boolean) => {
    const now = new Date().toISOString();
    let affectedItemName = '';
    let affectedTableNum = 0;
    let isNowServed = false;

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        affectedTableNum = order.tableNumber;
        const updatedItems = order.items.map((it) => {
          if (it.id !== itemId) return it;
          const newServed = forceServed !== undefined ? forceServed : !it.served;
          isNowServed = newServed;
          affectedItemName = it.name;
          return {
            ...it,
            served: newServed,
            servedAt: newServed ? (it.servedAt || now) : undefined,
          };
        });

        const allServed = updatedItems.length > 0 && updatedItems.every((it) => it.served);
        let newOrderStatus: OrderStatus = order.status;
        if (allServed) {
          newOrderStatus = 'served';
        } else if (order.status === 'served') {
          const anyReady = updatedItems.some((it) => it.status === 'ready');
          newOrderStatus = anyReady ? 'ready' : 'cooking';
        }

        return {
          ...order,
          items: updatedItems,
          status: newOrderStatus,
          servedAt: allServed ? (order.servedAt || now) : (newOrderStatus === 'served' ? order.servedAt : undefined),
          updatedAt: now,
        };
      })
    );

    // Also update completedOrders if found there
    setCompletedOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((it) => {
          if (it.id !== itemId) return it;
          const newServed = forceServed !== undefined ? forceServed : !it.served;
          isNowServed = newServed;
          affectedItemName = it.name;
          return {
            ...it,
            served: newServed,
            servedAt: newServed ? (it.servedAt || now) : undefined,
          };
        });
        return {
          ...order,
          items: updatedItems,
          updatedAt: now,
        };
      })
    );

    // Update notifications
    setNotifications((prev) =>
      prev.map((n) =>
        n.orderId === orderId && n.itemId === itemId
          ? { ...n, served: isNowServed, read: isNowServed }
          : n
      )
    );

    if (affectedItemName) {
      showToast(
        isNowServed
          ? `🍽️ ${affectedItemName} (Meja #${affectedTableNum || '?'}) berhasil disajikan!`
          : `Status saji ${affectedItemName} dibatalkan.`
      );
    } else {
      showToast('Status penyajian makanan/minuman diperbarui!');
    }
  };

  const markAllOrderItemsServed = (orderId: string) => {
    const now = new Date().toISOString();
    let orderNum = '';
    let tableNum = 0;

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        orderNum = order.orderNumber;
        tableNum = order.tableNumber;
        const updatedItems = order.items.map((it) => ({
          ...it,
          served: true,
          servedAt: it.servedAt || now,
        }));
        return {
          ...order,
          items: updatedItems,
          status: 'served',
          servedAt: order.servedAt || now,
          updatedAt: now,
        };
      })
    );

    setCompletedOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        orderNum = order.orderNumber;
        tableNum = order.tableNumber;
        const updatedItems = order.items.map((it) => ({
          ...it,
          served: true,
          servedAt: it.servedAt || now,
        }));
        return {
          ...order,
          items: updatedItems,
          servedAt: order.servedAt || now,
          updatedAt: now,
        };
      })
    );

    setNotifications((prev) =>
      prev.map((n) =>
        n.orderId === orderId ? { ...n, served: true, read: true } : n
      )
    );

    showToast(`🍽️ Makanan & minuman pesanan ${orderNum || orderId} (Meja #${tableNum}) telah disajikan lengkap!`);
  };

  const markOrderServed = (orderId: string) => {
    markAllOrderItemsServed(orderId);
  };

  const markOrderCompleted = (orderId: string) => {
    const now = new Date().toISOString();
    let orderNum = '';
    let tableNum = 0;

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        orderNum = order.orderNumber;
        tableNum = order.tableNumber;
        const updatedItems = order.items.map((it) => ({
          ...it,
          served: true,
          servedAt: it.servedAt || now,
        }));
        return {
          ...order,
          items: updatedItems,
          status: 'completed',
          servedAt: order.servedAt || now,
          completedAt: order.completedAt || now,
          updatedAt: now,
        };
      })
    );

    setCompletedOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        orderNum = order.orderNumber;
        tableNum = order.tableNumber;
        const updatedItems = order.items.map((it) => ({
          ...it,
          served: true,
          servedAt: it.servedAt || now,
        }));
        return {
          ...order,
          items: updatedItems,
          status: 'completed',
          servedAt: order.servedAt || now,
          completedAt: order.completedAt || now,
          updatedAt: now,
        };
      })
    );

    showToast(`✅ Pesanan ${orderNum || orderId} (Meja #${tableNum}) berhasil ditandai sebagai Orderan Selesai!`);
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const target = activeOrders.find((o) => o.id === orderId);
    if (!target) return;

    const cancelledOrder: Order = {
      ...target,
      status: 'cancelled',
      cancelReason: reason,
      updatedAt: new Date().toISOString(),
    };

    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCompletedOrders((prev) => [cancelledOrder, ...prev]);

    // Free up table
    setTables((prev) =>
      prev.map((t) =>
        t.number === target.tableNumber
          ? { ...t, status: 'available', currentOrderId: undefined }
          : t
      )
    );

    showToast(`Pesanan ${target.orderNumber} dibatalkan: ${reason}`);
  };

  const processPayment = (
    orderId: string,
    method: PaymentMethod,
    details: { cashReceived?: number; changeReturned?: number; referenceNumber?: string }
  ) => {
    const target = activeOrders.find((o) => o.id === orderId);
    if (!target) return;

    const paidOrder: Order = {
      ...target,
      status: 'paid',
      paymentStatus: 'paid',
      paymentMethod: method,
      paymentDetails: {
        ...details,
        paidAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCompletedOrders((prev) => [paidOrder, ...prev]);

    // Free up table
    setTables((prev) =>
      prev.map((t) =>
        t.number === target.tableNumber
          ? { ...t, status: 'available', currentOrderId: undefined }
          : t
      )
    );

    showToast(`Pembayaran ${target.orderNumber} selesai via ${method.toUpperCase()}! Struk dicetak.`);
  };

  // COMPLETED ORDER / TRANSACTION HISTORY ACTIONS
  const updateCompletedOrder = (orderId: string, updates: Partial<Order>) => {
    setCompletedOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const subtotal = updates.subtotal !== undefined ? updates.subtotal : order.subtotal;
        const tax = updates.tax !== undefined ? updates.tax : Math.round(subtotal * 0.1);
        const serviceCharge = updates.serviceCharge !== undefined ? updates.serviceCharge : Math.round(subtotal * 0.05);
        const total = updates.total !== undefined ? updates.total : (subtotal + tax + serviceCharge);

        return {
          ...order,
          ...updates,
          subtotal,
          tax,
          serviceCharge,
          total,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast('Data transaksi berhasil diperbarui!');
  };

  const deleteCompletedOrder = (orderId: string) => {
    const target = completedOrders.find((o) => o.id === orderId) || activeOrders.find((o) => o.id === orderId);
    // Remove from completed orders and active orders
    setCompletedOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(updated));
      return updated;
    });
    setActiveOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
    // Register to deletedOrderIds to prevent revival on refresh or login
    setDeletedOrderIds((prev) => {
      if (prev.includes(orderId)) return prev;
      const nextDeleted = [...prev, orderId];
      localStorage.setItem(STORAGE_KEYS.DELETED_ORDER_IDS, JSON.stringify(nextDeleted));
      return nextDeleted;
    });
    showToast(`Transaksi ${target?.orderNumber || ''} berhasil dihapus dari sistem.`);
  };

  // OPERATIONAL EXPENSES ACTIONS
  const addExpense = (expense: Omit<OperationalExpense, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    const newExpense: OperationalExpense = { ...expense, id: newId };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Pengeluaran "${expense.name}" berhasil dicatat.`);
  };

  const updateExpense = (id: string, updates: Partial<OperationalExpense>) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
    showToast(`Catatan pengeluaran diperbarui.`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    showToast(`Catatan pengeluaran dihapus.`);
  };

  // TABLE ACTIONS
  const updateTableStatus = (tableNumber: number, status: TableInfo['status'], orderId?: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.number === tableNumber ? { ...t, status, currentOrderId: orderId ?? t.currentOrderId } : t
      )
    );
  };

  // MENU ACTIONS
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newId = `item-${Date.now()}`;
    const newItem: MenuItem = { ...item, id: newId };
    setMenuItems((prev) => [newItem, ...prev]);
    showToast(`Menu baru "${newItem.name}" berhasil ditambahkan!`);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    showToast(`Menu berhasil diperbarui!`);
  };

  const deleteMenuItem = (id: string) => {
    const target = menuItems.find((i) => i.id === id);
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`Menu "${target?.name || ''}" telah dihapus.`);
  };

  const toggleMenuStock = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item))
    );
    const item = menuItems.find((i) => i.id === id);
    if (item) {
      showToast(`Status stok "${item.name}" diubah menjadi ${!item.inStock ? 'Tersedia' : 'Habis'}`);
    }
  };

  // INVENTORY ACTIONS
  const updateInventoryStock = (id: string, newStock: number) => {
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, stockQuantity: Math.max(0, newStock), lastRestocked: new Date().toISOString().split('T')[0] }
          : inv
      )
    );
    showToast(`Stok bahan baku diperbarui.`);
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newId = `inv-${Date.now()}`;
    setInventory((prev) => [...prev, { ...item, id: newId }]);
    showToast(`Bahan baku "${item.name}" berhasil ditambahkan.`);
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    showToast(`Bahan baku dihapus.`);
  };

  // USER ACTIONS
  const addUser = (user: Omit<UserAccount, 'id'>) => {
    const newId = `usr-${Date.now()}`;
    setUsers((prev) => [...prev, { ...user, id: newId }]);
    showToast(`Pengguna baru "${user.name}" berhasil dibuat.`);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    showToast(`Data pengguna diperbarui.`);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast(`Pengguna telah dihapus.`);
  };

  const resetToDefaultData = () => {
    setDeletedOrderIds([]);
    setMenuItems(INITIAL_MENU_ITEMS);
    setActiveOrders(INITIAL_ORDERS);
    setCompletedOrders(INITIAL_PAID_ORDERS);
    setTables(INITIAL_TABLES);
    setInventory(INITIAL_INVENTORY);
    setUsers(INITIAL_USERS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setExpenses(INITIAL_EXPENSES);
    setIsSoundEnabled(true);
    alertedDelayOrdersRef.current = { 'ORD-101': { warning15: true } };
    localStorage.clear();
    showToast(`Data aplikasi di-reset ke data default NADIRA Café & Resto.`);
  };

  const allOrders = [...activeOrders, ...completedOrders];

  return (
    <CafeContext.Provider
      value={{
        activeRole,
        setActiveRole,
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuStock,
        activeOrders,
        completedOrders,
        allOrders,
        createOrder,
        addItemsToOrder,
        acknowledgeOrderAdditions,
        updateOrderItems,
        updateOrderStatus,
        updateOrderItemStatus,
        cancelOrder,
        processPayment,
        markItemServed,
        markAllOrderItemsServed,
        markOrderServed,
        markOrderCompleted,
        updateCompletedOrder,
        deleteCompletedOrder,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        tables,
        updateTableStatus,
        inventory,
        updateInventoryStock,
        addInventoryItem,
        deleteInventoryItem,
        users,
        addUser,
        updateUser,
        deleteUser,
        notifications,
        unreadNotificationsCount,
        isSoundEnabled,
        setIsSoundEnabled,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        toastMessage,
        showToast,
        resetToDefaultData,
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};
