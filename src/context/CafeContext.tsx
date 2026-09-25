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
  INITIAL_PAID_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';
import { soundAlerts } from '../utils/soundAlerts';
import { getElapsedMinutes } from '../utils/formatters';
import { cloudSync, ConnectionStatus, SyncMessage } from '../services/realtimeSync';

export { INITIAL_EXPENSES, INITIAL_NOTIFICATIONS };

export interface ActiveSession {
  clientId: string;
  role: string;
  user: UserAccount | null;
  lastSeen: number; // timestamp
}

interface CafeContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  onlineSessions: Record<string, ActiveSession>;

  // Cloud Multi-Device Real-time Sync
  syncStatus: ConnectionStatus;
  syncBrokerName: string;
  connectedDevicesCount: number;
  triggerManualSync: () => void;
  
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
  markStationItemsReady: (orderId: string, station: 'bar' | 'kitchen') => void;
  markStationItemsServed: (orderId: string, station: 'bar' | 'kitchen', forceServed?: boolean) => void;
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
  addTable: (tableData?: { number?: number; capacity?: number; section?: string }) => void;

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

  // Clear active transactions to history
  clearAllActiveTransactionsToHistory: () => void;

  // Hapus semua data pemesanan (aktif & demo/riwayat)
  deleteAllOrdersData: () => void;

  // Hapus semua pengeluaran & arus kas
  clearAllExpenses: () => void;

  // Hapus semua stok bahan baku
  clearAllInventory: () => void;

  // Bersihkan semua data untuk memulai operasional riil
  resetAllDataForLiveOperations: () => void;
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
  OFFLINE_QUEUE: 'nadira_pos_offline_queue_v4',
};

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    try {
      const savedUserId = localStorage.getItem('nadira_logged_in_user_id');
      if (savedUserId) {
        const stored = localStorage.getItem('nadira_pos_users_v4');
        const userList = stored ? JSON.parse(stored) : INITIAL_USERS;
        const user = userList.find((u: any) => u.id === savedUserId && u.active);
        if (user) return user.role;
      }
    } catch (e) {
      console.error(e);
    }
    return 'waitress';
  });
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

  const isToday = (dateStr: string) => {
    try {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const today = new Date();
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    } catch {
      return false;
    }
  };

  const isDemoOrder = (o: any) => {
    if (!o) return false;
    const id = o.id || '';
    const num = o.orderNumber || '';
    return /^(ORD-10[1-9]|ORD-init)/i.test(id) || /^#NDR-10[1-9]/i.test(num);
  };

  const isDemoExpense = (e: any) => {
    if (!e) return false;
    const id = e.id || '';
    return /^exp-[1-9]$/i.test(id);
  };

  const isDemoInventory = (i: any) => {
    if (!i) return false;
    const id = i.id || '';
    return /^inv-[1-9]$/i.test(id);
  };

  const [activeOrders, setActiveOrders] = useState<Order[]>(() => {
    const deleted = loadInitial<string[]>(STORAGE_KEYS.DELETED_ORDER_IDS, []);
    const deletedSet = new Set(deleted);
    const loaded = loadInitial(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return loaded.filter((o: Order) => !deletedSet.has(o.id) && !isDemoOrder(o) && isToday(o.createdAt || o.updatedAt));
  });

  const [completedOrders, setCompletedOrders] = useState<Order[]>(() => {
    const deleted = loadInitial<string[]>(STORAGE_KEYS.DELETED_ORDER_IDS, []);
    const deletedSet = new Set(deleted);
    const loaded = loadInitial(STORAGE_KEYS.PAID_ORDERS, INITIAL_PAID_ORDERS);
    return loaded.filter((o: Order) => !deletedSet.has(o.id) && !isDemoOrder(o) && isToday(o.createdAt || o.updatedAt));
  });

  const [tables, setTables] = useState<TableInfo[]>(() => {
    const loaded = loadInitial(STORAGE_KEYS.TABLES, INITIAL_TABLES);
    if (!Array.isArray(loaded) || loaded.length !== 30) {
      return INITIAL_TABLES;
    }
    return loaded.map((tbl: TableInfo) => {
      if (tbl.currentOrderId && isDemoOrder({ id: tbl.currentOrderId })) {
        return { ...tbl, status: 'available' as const, currentOrderId: undefined };
      }
      return tbl;
    });
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const loaded = loadInitial<InventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
    return (Array.isArray(loaded) ? loaded : []).filter((i: InventoryItem) => !isDemoInventory(i));
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const loaded = loadInitial<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const hasBarista = loaded.some((u) => u.role === 'barista' || u.id === 'usr-5');
    if (!hasBarista) {
      const barista = INITIAL_USERS.find((u) => u.id === 'usr-5');
      if (barista) {
        return [...loaded, barista];
      }
    }
    return loaded;
  });

  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(() => {
    const savedUserId = localStorage.getItem('nadira_logged_in_user_id');
    if (savedUserId) {
      const storedUsers = loadInitial(STORAGE_KEYS.USERS, INITIAL_USERS);
      return storedUsers.find((u: any) => u.id === savedUserId && u.active) || null;
    }
    return null;
  });

  const [onlineSessions, setOnlineSessions] = useState<Record<string, ActiveSession>>({});

  const setCurrentUser = (user: UserAccount | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('nadira_logged_in_user_id', user.id);
      setActiveRole(user.role);
    } else {
      localStorage.removeItem('nadira_logged_in_user_id');
    }
  };

  const [notifications, setNotifications] = useState<CafeNotification[]>(() => {
    const loaded = loadInitial<CafeNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return (Array.isArray(loaded) ? loaded : []).filter(
      (n: CafeNotification) => !isDemoOrder({ id: n.orderId || n.id, orderNumber: n.orderNumber })
    );
  });

  const [expenses, setExpenses] = useState<OperationalExpense[]>(() => {
    const loaded = loadInitial<OperationalExpense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    return (Array.isArray(loaded) ? loaded : []).filter((e: OperationalExpense) => !isDemoExpense(e));
  });

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

  // State refs to prevent stale closure data loss
  const activeOrdersRef = useRef<Order[]>(activeOrders);
  const completedOrdersRef = useRef<Order[]>(completedOrders);
  const deletedOrderIdsRef = useRef<string[]>(deletedOrderIds);
  const tablesRef = useRef<TableInfo[]>(tables);
  const menuItemsRef = useRef<MenuItem[]>(menuItems);
  const inventoryRef = useRef<InventoryItem[]>(inventory);
  const usersRef = useRef<UserAccount[]>(users);
  const expensesRef = useRef<OperationalExpense[]>(expenses);
  const notificationsRef = useRef<CafeNotification[]>(notifications);

  // Mount-time purge of any residual demo orders from localStorage
  useEffect(() => {
    try {
      const storedOrders = loadInitial<Order[]>(STORAGE_KEYS.ORDERS, []);
      const cleanOrders = storedOrders.filter((o) => !isDemoOrder(o));
      if (storedOrders.length !== cleanOrders.length) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(cleanOrders));
        setActiveOrders(cleanOrders);
        activeOrdersRef.current = cleanOrders;
      }

      const storedPaid = loadInitial<Order[]>(STORAGE_KEYS.PAID_ORDERS, []);
      const cleanPaid = storedPaid.filter((o) => !isDemoOrder(o));
      if (storedPaid.length !== cleanPaid.length) {
        localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(cleanPaid));
        setCompletedOrders(cleanPaid);
        completedOrdersRef.current = cleanPaid;
      }

      const storedNotifs = loadInitial<CafeNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const cleanNotifs = storedNotifs.filter((n) => !isDemoOrder({ id: n.orderId || n.id, orderNumber: n.orderNumber }));
      if (storedNotifs.length !== cleanNotifs.length) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleanNotifs));
        setNotifications(cleanNotifs);
        notificationsRef.current = cleanNotifs;
      }

      const storedExpenses = loadInitial<OperationalExpense[]>(STORAGE_KEYS.EXPENSES, []);
      const cleanExpenses = storedExpenses.filter((e) => !isDemoExpense(e));
      if (storedExpenses.length !== cleanExpenses.length) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(cleanExpenses));
        setExpenses(cleanExpenses);
        expensesRef.current = cleanExpenses;
      }

      const storedInventory = loadInitial<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
      const cleanInventory = storedInventory.filter((i) => !isDemoInventory(i));
      if (storedInventory.length !== cleanInventory.length) {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(cleanInventory));
        setInventory(cleanInventory);
        inventoryRef.current = cleanInventory;
      }
    } catch (e) {
      console.error('Error purging demo orders on mount:', e);
    }
  }, []);

  // Sync state to refs and localStorage
  useEffect(() => {
    activeOrdersRef.current = activeOrders;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(activeOrders));
  }, [activeOrders]);

  useEffect(() => {
    completedOrdersRef.current = completedOrders;
    localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(completedOrders));
  }, [completedOrders]);

  useEffect(() => {
    deletedOrderIdsRef.current = deletedOrderIds;
    localStorage.setItem(STORAGE_KEYS.DELETED_ORDER_IDS, JSON.stringify(deletedOrderIds));
  }, [deletedOrderIds]);

  useEffect(() => {
    tablesRef.current = tables;
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    menuItemsRef.current = menuItems;
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    inventoryRef.current = inventory;
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    usersRef.current = users;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    expensesRef.current = expenses;
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    notificationsRef.current = notifications;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Real-time Cloud Multi-Device Synchronization
  const [syncStatus, setSyncStatus] = useState<ConnectionStatus>('connecting');
  const [syncBrokerName, setSyncBrokerName] = useState<string>('Cloud Sync');
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const localVersionRef = useRef<number>(1);
  const isSyncInitializedRef = useRef<boolean>(false);

  // Offline action outbox queue
  const enqueueOfflineAction = (action: string, payload: any) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const queue: Array<{ id: string; action: string; payload: any; timestamp: number }> = stored ? JSON.parse(stored) : [];
      queue.push({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action,
        payload,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to enqueue offline action', e);
    }
  };

  const flushOfflineQueue = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!stored) return;
      const queue: Array<{ id: string; action: string; payload: any }> = JSON.parse(stored);
      if (!queue.length) return;

      const remainingQueue: typeof queue = [];
      for (const item of queue) {
        try {
          const res = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: item.action,
              payload: item.payload,
              clientId: cloudSync.getClientId(),
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.version) {
              localVersionRef.current = Math.max(localVersionRef.current, data.version);
            }
          } else {
            remainingQueue.push(item);
          }
        } catch {
          remainingQueue.push(item);
        }
      }

      if (remainingQueue.length > 0) {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remainingQueue));
      } else {
        localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
      }
    } catch {
      // ignore
    }
  };

  // Safe non-destructive order reconciliation
  const mergeActiveOrdersSafely = (
    incoming: Order[],
    current: Order[],
    deletedIds: Set<string>,
    serverCompletedIds: Set<string>
  ): Order[] => {
    const map = new Map<string, Order>();

    // 1. Keep all current local active orders that are not deleted or completed or demo
    for (const order of current) {
      if (
        !deletedIds.has(order.id) &&
        !serverCompletedIds.has(order.id) &&
        !isDemoOrder(order) &&
        order.status !== 'completed' &&
        order.status !== 'cancelled' &&
        order.paymentStatus !== 'paid'
      ) {
        map.set(order.id, order);
      }
    }

    // 2. Merge incoming orders
    for (const inc of incoming) {
      if (deletedIds.has(inc.id) || isDemoOrder(inc)) continue;
      if (
        serverCompletedIds.has(inc.id) ||
        inc.status === 'completed' ||
        inc.status === 'cancelled' ||
        inc.paymentStatus === 'paid'
      ) {
        map.delete(inc.id);
        continue;
      }

      const existing = map.get(inc.id);
      if (!existing) {
        map.set(inc.id, inc);
      } else {
        const incTime = new Date(inc.updatedAt || inc.createdAt || 0).getTime();
        const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        if (incTime > existTime || (incTime === existTime && (inc.items?.length || 0) >= (existing.items?.length || 0))) {
          map.set(inc.id, inc);
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Non-destructive applyServerState
  const applyServerState = (serverState: any, version?: number) => {
    if (!serverState) return;
    if (version !== undefined && version > 0) {
      localVersionRef.current = Math.max(localVersionRef.current, version);
    }

    // Process deleted orders registry
    const currentDeleted = new Set(deletedOrderIdsRef.current);
    if (Array.isArray(serverState.deletedOrderIds) && serverState.deletedOrderIds.length > 0) {
      serverState.deletedOrderIds.forEach((id: string) => currentDeleted.add(id));
      const nextDeleted = Array.from(currentDeleted);
      deletedOrderIdsRef.current = nextDeleted;
      setDeletedOrderIds(nextDeleted);
      localStorage.setItem(STORAGE_KEYS.DELETED_ORDER_IDS, JSON.stringify(nextDeleted));
    }

    // Collect server completed/paid IDs
    const serverCompletedIds = new Set<string>();
    if (Array.isArray(serverState.completedOrders)) {
      serverState.completedOrders.forEach((co: Order) => serverCompletedIds.add(co.id));
    }

    // Merge active orders non-destructively
    if (Array.isArray(serverState.activeOrders)) {
      const mergedActive = mergeActiveOrdersSafely(
        serverState.activeOrders,
        activeOrdersRef.current,
        currentDeleted,
        serverCompletedIds
      );
      activeOrdersRef.current = mergedActive;
      setActiveOrders(mergedActive);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mergedActive));

      // Re-sync table occupancy based on active orders
      setTables((prev) => {
        const baseTables = (Array.isArray(serverState.tables) && serverState.tables.length > 0)
          ? serverState.tables
          : prev;
        const updated = baseTables.map((tbl: TableInfo) => {
          const matchingOrder = mergedActive.find((o) => o.tableNumber === tbl.number);
          if (matchingOrder) {
            return { ...tbl, status: 'occupied' as const, currentOrderId: matchingOrder.id };
          } else if (tbl.status === 'occupied') {
            return { ...tbl, status: 'available' as const, currentOrderId: undefined };
          }
          return tbl;
        });
        tablesRef.current = updated;
        localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
        return updated;
      });
    }

    // Merge completed orders non-destructively
    if (Array.isArray(serverState.completedOrders)) {
      const completedMap = new Map<string, Order>();
      for (const co of completedOrdersRef.current) {
        if (!currentDeleted.has(co.id) && !isDemoOrder(co)) completedMap.set(co.id, co);
      }
      for (const inc of serverState.completedOrders) {
        if (!currentDeleted.has(inc.id) && !isDemoOrder(inc)) {
          const existing = completedMap.get(inc.id);
          if (!existing) {
            completedMap.set(inc.id, inc);
          } else {
            const incTime = new Date(inc.updatedAt || inc.createdAt || 0).getTime();
            const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            if (incTime >= existTime) completedMap.set(inc.id, inc);
          }
        }
      }
      const mergedCompleted = Array.from(completedMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);
      completedOrdersRef.current = mergedCompleted;
      setCompletedOrders(mergedCompleted);
      localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(mergedCompleted));
    }

    if (Array.isArray(serverState.menuItems) && serverState.menuItems.length > 0) {
      menuItemsRef.current = serverState.menuItems;
      setMenuItems(serverState.menuItems);
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(serverState.menuItems));
    }

    if (Array.isArray(serverState.inventory)) {
      const cleanInv = serverState.inventory.filter((i: InventoryItem) => !isDemoInventory(i));
      inventoryRef.current = cleanInv;
      setInventory(cleanInv);
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(cleanInv));
    }

    if (Array.isArray(serverState.users) && serverState.users.length > 0) {
      usersRef.current = serverState.users;
      setUsers(serverState.users);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(serverState.users));
    }

    if (Array.isArray(serverState.notifications)) {
      const notifMap = new Map<string, CafeNotification>();
      for (const n of notificationsRef.current) {
        if (!isDemoOrder({ id: n.orderId || n.id, orderNumber: n.orderNumber })) {
          notifMap.set(n.id, n);
        }
      }
      for (const n of serverState.notifications) {
        if (!isDemoOrder({ id: n.orderId || n.id, orderNumber: n.orderNumber })) {
          notifMap.set(n.id, n);
        }
      }
      const mergedNotifs = Array.from(notifMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
      notificationsRef.current = mergedNotifs;
      setNotifications(mergedNotifs);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mergedNotifs));
    }

    if (Array.isArray(serverState.expenses)) {
      const cleanExp = serverState.expenses.filter((e: OperationalExpense) => !isDemoExpense(e));
      expensesRef.current = cleanExp;
      setExpenses(cleanExp);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(cleanExp));
    }
  };

  // Universal sync message handler shared by both SSE and Cloud Broker
  const handleSyncMessage = (msg: SyncMessage | any) => {
    if (!msg) return;
    if (msg.version && msg.version > localVersionRef.current) {
      localVersionRef.current = msg.version;
    }

    if (msg.sourceClientId && msg.sourceClientId !== cloudSync.getClientId()) {
      setOnlineSessions((prev) => {
        const existing = prev[msg.sourceClientId];
        const payloadUser = msg.type === 'device_heartbeat' ? msg.payload?.user : undefined;
        const payloadRole = msg.type === 'device_heartbeat' ? msg.payload?.role : undefined;
        return {
          ...prev,
          [msg.sourceClientId]: {
            clientId: msg.sourceClientId,
            role: payloadRole || msg.sourceRole || existing?.role || 'unknown',
            user: payloadUser !== undefined ? payloadUser : (existing?.user || null),
            lastSeen: Date.now(),
          },
        };
      });
    }

    switch (msg.type) {
      case 'create_order':
      case 'order_created': {
        const order = msg.payload?.order;
        if (order && !deletedOrderIdsRef.current.includes(order.id)) {
          setActiveOrders((prev) => {
            const updated = [order, ...prev.filter((o) => o.id !== order.id)];
            activeOrdersRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
            return updated;
          });
          if (order.tableNumber) {
            setTables((prev) => {
              const updated = prev.map((t) =>
                t.number === order.tableNumber
                  ? { ...t, status: 'occupied' as const, currentOrderId: order.id }
                  : t
              );
              tablesRef.current = updated;
              localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
              return updated;
            });
          }
          const notifsToAdd = Array.isArray(msg.payload?.notifications)
            ? msg.payload.notifications
            : msg.payload?.notification
            ? [msg.payload.notification]
            : [];
          if (notifsToAdd.length > 0) {
            setNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const freshNotifs = notifsToAdd.filter((n: any) => !existingIds.has(n.id));
              const updated = [...freshNotifs, ...prev];
              notificationsRef.current = updated;
              localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
              return updated;
            });
          }
          soundAlerts.playNewOrderChime();
          showToast(
            `📝 Pesanan Baru Masuk: Meja #${order.tableNumber} (${order.orderNumber}) dari ${order.waitressName || 'Waitress'}!`
          );
        }
        break;
      }
      case 'add_items_to_order':
      case 'items_added': {
        const { order, notification, notifications } = msg.payload || {};
        if (order) {
          setActiveOrders((prev) => {
            const updated = prev.map((o) => (o.id === order.id ? order : o));
            activeOrdersRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
            return updated;
          });
        }
        const notifsToAdd = Array.isArray(notifications)
          ? notifications
          : notification
          ? [notification]
          : [];
        if (notifsToAdd.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const freshNotifs = notifsToAdd.filter((n: any) => !existingIds.has(n.id));
            const updated = [...freshNotifs, ...prev];
            notificationsRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
            return updated;
          });
        }
        soundAlerts.playAdditionalItemChime();
        showToast(`🔔 Tambahan Menu Masuk untuk Meja #${order?.tableNumber || '?'}!`);
        break;
      }
      case 'update_order_item_status':
      case 'item_status_updated': {
        const { orderId, itemId, itemStatus, notification } = msg.payload || {};
        setActiveOrders((prev) => {
          const updated = prev.map((order) => {
            if (order.id !== orderId) return order;
            const updatedItems = order.items.map((it) =>
              it.id === itemId ? { ...it, status: itemStatus } : it
            );
            const allReady = updatedItems.length > 0 && updatedItems.every((it) => it.status === 'ready');
            const anyCooking = updatedItems.some((it) => it.status === 'cooking' || it.status === 'ready');
            let newStatus = order.status;
            if (allReady) newStatus = 'ready';
            else if (anyCooking && order.status === 'pending') newStatus = 'cooking';
            return {
              ...order,
              items: updatedItems,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            };
          });
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        if (notification) {
          setNotifications((prev) => {
            const updated = [notification, ...prev.filter((n) => n.id !== notification.id)];
            notificationsRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
            return updated;
          });
        }
        if (itemStatus === 'ready') {
          soundAlerts.playReadyChime();
          showToast(`🍽️ Menu Pesanan Siap Saji!`);
        }
        break;
      }
      case 'update_order_status':
      case 'order_status_updated': {
        const { orderId, status, notification } = msg.payload || {};
        setActiveOrders((prev) => {
          const updated = prev.map((order) => {
            if (order.id !== orderId) return order;
            return {
              ...order,
              status,
              updatedAt: new Date().toISOString(),
            };
          });
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        if (notification) {
          setNotifications((prev) => {
            const updated = [notification, ...prev.filter((n) => n.id !== notification.id)];
            notificationsRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
            return updated;
          });
        }
        if (status === 'ready') {
          soundAlerts.playReadyChime();
          showToast(`🍽️ Seluruh Menu Meja Siap Saji!`);
        }
        break;
      }
      case 'mark_item_served':
      case 'item_served': {
        const { orderId, itemId, forceServed } = msg.payload || {};
        const now = new Date().toISOString();
        setActiveOrders((prev) => {
          const updated = prev.map((order) => {
            if (order.id !== orderId) return order;
            const updatedItems = order.items.map((it) => {
              if (it.id !== itemId) return it;
              const newServed = forceServed !== undefined ? forceServed : !it.served;
              return { ...it, served: newServed, servedAt: newServed ? now : undefined };
            });
            const allServed = updatedItems.length > 0 && updatedItems.every((it) => it.served);
            return {
              ...order,
              items: updatedItems,
              status: allServed ? 'served' : order.status,
              servedAt: allServed ? now : order.servedAt,
              updatedAt: now,
            };
          });
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        setNotifications((prev) => {
          const updated = prev.map((n) =>
            n.orderId === orderId && n.itemId === itemId ? { ...n, served: true, read: true } : n
          );
          notificationsRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
          return updated;
        });
        break;
      }
      case 'station_items_ready': {
        const { orderId, station, notification } = msg.payload || {};
        const now = new Date().toISOString();
        const isBar = station === 'bar';
        setActiveOrders((prev) => {
          const updated = prev.map((order) => {
            if (order.id !== orderId) return order;
            const updatedItems = order.items.map((it) => {
              const match = isBar
                ? it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
                : it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat';
              return match ? { ...it, status: 'ready' as const, readyAt: it.readyAt || now } : it;
            });
            const allReady = updatedItems.length > 0 && updatedItems.every((it) => it.status === 'ready');
            return {
              ...order,
              items: updatedItems,
              barReadyAt: isBar ? now : order.barReadyAt,
              kitchenReadyAt: !isBar ? now : order.kitchenReadyAt,
              status: allReady ? ('ready' as const) : order.status === 'pending' ? ('cooking' as const) : order.status,
              updatedAt: now,
            };
          });
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        if (notification) {
          setNotifications((prev) => {
            const updated = [notification, ...prev.filter((n) => n.id !== notification.id)];
            notificationsRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
            return updated;
          });
        }
        soundAlerts.playReadyChime();
        break;
      }
      case 'station_items_served': {
        const { orderId, station, forceServed } = msg.payload || {};
        const now = new Date().toISOString();
        const isBar = station === 'bar';
        const nextServed = forceServed !== undefined ? forceServed : true;
        setActiveOrders((prev) => {
          const updated = prev.map((order) => {
            if (order.id !== orderId) return order;
            const updatedItems = order.items.map((it) => {
              const match = isBar
                ? it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
                : it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat';
              return match ? { ...it, served: nextServed, servedAt: nextServed ? now : undefined, status: nextServed ? ('ready' as const) : it.status } : it;
            });
            const allServed = updatedItems.length > 0 && updatedItems.every((it) => it.served);
            return {
              ...order,
              items: updatedItems,
              barServedAt: isBar ? (nextServed ? now : undefined) : order.barServedAt,
              kitchenServedAt: !isBar ? (nextServed ? now : undefined) : order.kitchenServedAt,
              status: allServed ? ('served' as const) : order.status,
              servedAt: allServed ? now : order.servedAt,
              updatedAt: now,
            };
          });
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        setNotifications((prev) => {
          const updated = prev.map((n) =>
            n.orderId === orderId && (n.station === station || (station === 'bar' && n.type === 'bar_ready') || (station === 'kitchen' && n.type === 'kitchen_ready'))
              ? { ...n, served: nextServed, read: nextServed }
              : n
          );
          notificationsRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
          return updated;
        });
        break;
      }
      case 'mark_order_completed': {
        const { orderId } = msg.payload || {};
        const now = new Date().toISOString();
        setActiveOrders((prev) => {
          const updated = prev.map((order) =>
            order.id === orderId ? { ...order, status: 'completed' as const, completedAt: now } : order
          );
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        break;
      }
      case 'process_payment':
      case 'payment_completed': {
        const { orderId, paidOrder } = msg.payload || {};
        setActiveOrders((prev) => {
          const updated = prev.filter((o) => o.id !== orderId);
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        if (paidOrder) {
          setCompletedOrders((prev) => {
            const updated = [paidOrder, ...prev.filter((o) => o.id !== paidOrder.id)];
            completedOrdersRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(updated));
            return updated;
          });
          setTables((prev) => {
            const updated = prev.map((t) =>
              t.number === paidOrder.tableNumber ? { ...t, status: 'available' as const, currentOrderId: undefined } : t
            );
            tablesRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
            return updated;
          });
        }
        break;
      }
      case 'cancel_order':
      case 'order_cancelled': {
        const { orderId, cancelledOrder } = msg.payload || {};
        setActiveOrders((prev) => {
          const updated = prev.filter((o) => o.id !== orderId);
          activeOrdersRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        });
        if (cancelledOrder) {
          setCompletedOrders((prev) => {
            const updated = [cancelledOrder, ...prev.filter((o) => o.id !== cancelledOrder.id)];
            completedOrdersRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(updated));
            return updated;
          });
          setTables((prev) => {
            const updated = prev.map((t) =>
              t.number === cancelledOrder.tableNumber ? { ...t, status: 'available' as const, currentOrderId: undefined } : t
            );
            tablesRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
            return updated;
          });
        }
        break;
      }
      case 'table_updated': {
        const { tableNumber, status, orderId } = msg.payload || {};
        setTables((prev) => {
          const updated = prev.map((t) => (t.number === tableNumber ? { ...t, status, currentOrderId: orderId } : t));
          tablesRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
          return updated;
        });
        break;
      }
      case 'table_added': {
        const { table } = msg.payload || {};
        if (table) {
          setTables((prev) => {
            if (prev.some((t) => t.number === table.number)) return prev;
            const updated = [...prev, table];
            tablesRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
            return updated;
          });
        }
        break;
      }
      case 'delete_completed_order':
      case 'completed_order_deleted': {
        const { orderId } = msg.payload || {};
        if (orderId) {
          setDeletedOrderIds((prev) => {
            if (prev.includes(orderId)) return prev;
            const updated = [...prev, orderId];
            deletedOrderIdsRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.DELETED_ORDER_IDS, JSON.stringify(updated));
            return updated;
          });
          setCompletedOrders((prev) => {
            const updated = prev.filter((o) => o.id !== orderId);
            completedOrdersRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(updated));
            return updated;
          });
          setActiveOrders((prev) => {
            const updated = prev.filter((o) => o.id !== orderId);
            activeOrdersRef.current = updated;
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
            return updated;
          });
        }
        break;
      }
      case 'request_state': {
        // ALWAYS use activeOrdersRef to avoid transmitting stale mount state!
        if (activeOrdersRef.current.length > 0) {
          cloudSync.publishAction(
            'provide_state',
            {
              activeOrders: activeOrdersRef.current,
              completedOrders: completedOrdersRef.current.slice(0, 30),
              tables: tablesRef.current,
              notifications: notificationsRef.current.slice(0, 20),
              version: localVersionRef.current,
            },
            localVersionRef.current
          );
        }
        break;
      }
      case 'provide_state': {
        const st = msg.payload;
        if (st) {
          applyServerState(st, st.version);
        }
        break;
      }
      case 'reset_data': {
        setMenuItems(INITIAL_MENU_ITEMS);
        setActiveOrders(INITIAL_ORDERS);
        setCompletedOrders(INITIAL_PAID_ORDERS);
        setDeletedOrderIds([]);
        setTables(INITIAL_TABLES);
        setInventory(INITIAL_INVENTORY);
        setUsers(INITIAL_USERS);
        setNotifications(INITIAL_NOTIFICATIONS);
        setExpenses(INITIAL_EXPENSES);
        showToast('🔄 Data kafe telah direset!');
        break;
      }
      case 'delete_all_orders':
      case 'all_orders_deleted': {
        setActiveOrders([]);
        activeOrdersRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
        setCompletedOrders([]);
        completedOrdersRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.PAID_ORDERS);
        setNotifications([]);
        notificationsRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
        setTables((prev) => {
          const updated = prev.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
          tablesRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
          return updated;
        });
        showToast('🗑️ Seluruh data pemesanan telah dibersihkan.');
        break;
      }
      case 'clear_all_expenses': {
        setExpenses([]);
        expensesRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.EXPENSES);
        break;
      }
      case 'clear_all_inventory': {
        setInventory([]);
        inventoryRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.INVENTORY);
        break;
      }
      case 'clear_all_operational_data':
      case 'operational_data_cleared': {
        setActiveOrders([]);
        activeOrdersRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.ORDERS);

        setCompletedOrders([]);
        completedOrdersRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.PAID_ORDERS);

        setDeletedOrderIds([]);
        deletedOrderIdsRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.DELETED_ORDER_IDS);

        setNotifications([]);
        notificationsRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);

        setExpenses([]);
        expensesRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.EXPENSES);

        setInventory([]);
        inventoryRef.current = [];
        localStorage.removeItem(STORAGE_KEYS.INVENTORY);

        setTables((prev) => {
          const updated = prev.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
          tablesRef.current = updated;
          localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
          return updated;
        });
        showToast('✨ Seluruh data transaksi, arus kas, dan stok bahan telah dibersihkan untuk operasional riil.');
        break;
      }
      default:
        break;
    }
  };

  const dispatchServerAction = (action: string, payload: any) => {
    localVersionRef.current = (localVersionRef.current || 0) + 1;
    const currentVersion = localVersionRef.current;

    // 1. Broadcast immediately to cloud broker using live refs
    cloudSync.publishAction(action as any, payload, currentVersion);

    // 2. Debounced live state snapshot using refs (never stale closure)
    setTimeout(() => {
      cloudSync.publishRetainedState(
        {
          activeOrders: activeOrdersRef.current,
          completedOrders: completedOrdersRef.current,
          deletedOrderIds: deletedOrderIdsRef.current,
          tables: tablesRef.current,
          menuItems: menuItemsRef.current,
          inventory: inventoryRef.current,
          users: usersRef.current,
          expenses: expensesRef.current,
          notifications: notificationsRef.current,
        },
        currentVersion
      );
    }, 150);

    // 3. Post to local server endpoint with offline fallback
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        payload,
        clientId: cloudSync.getClientId(),
      }),
    })
      .then((res) => {
        if (!res.ok) {
          enqueueOfflineAction(action, payload);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.version) {
          localVersionRef.current = Math.max(localVersionRef.current, data.version);
        }
      })
      .catch(() => {
        // Network unavailable or server temporarily unreachable - store offline safely
        enqueueOfflineAction(action, payload);
      });
  };

  const triggerManualSync = () => {
    showToast('🔄 Memperbarui koneksi sinkronisasi cloud...');
    cloudSync.publishAction('request_state' as any, {}, localVersionRef.current);
    flushOfflineQueue();
    try {
      fetch('/api/state')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.state) applyServerState(data.state, data.version);
        })
        .catch(() => {});
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    cloudSync.setRole(activeRole);
  }, [activeRole]);

  useEffect(() => {
    cloudSync.setActiveUser(currentUser);
  }, [currentUser]);

  // Clean inactive online sessions
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setOnlineSessions((prev) => {
        let changed = false;
        const cleaned = { ...prev };
        for (const [clientId, session] of Object.entries(cleaned)) {
          if (now - session.lastSeen > 25000) {
            delete cleaned[clientId];
            changed = true;
          }
        }
        return changed ? cleaned : prev;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline window listeners for network disconnection resilience
  useEffect(() => {
    const handleOnline = () => {
      showToast('📶 Terhubung kembali ke jaringan! Menyinkronkan pesanan...');
      setSyncStatus('connecting');
      flushOfflineQueue();
      triggerManualSync();
    };

    const handleOffline = () => {
      showToast('⚠️ Koneksi terputus! Mode Offline aktif. Pesanan tetap tersimpan aman di perangkat.');
      setSyncStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // SSE (Server-Sent Events) connection for persistent local/network synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setSyncStatus('connected');
          flushOfflineQueue();
        };

        eventSource.onmessage = (event) => {
          try {
            if (!event.data || event.data.startsWith(':')) return;
            const data = JSON.parse(event.data);
            if (data.type === 'connected' && data.state) {
              applyServerState(data.state, data.version);
            } else if (data.type && data.type !== 'connected') {
              handleSyncMessage({
                type: data.type,
                payload: data.payload,
                version: data.version,
                sourceClientId: data.sourceClientId || 'server',
                timestamp: new Date().toISOString(),
              });
            }
          } catch (e) {
            console.error('[SSE] Failed to process message', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (navigator.onLine) {
            setSyncStatus('reconnecting');
          } else {
            setSyncStatus('disconnected');
          }
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        console.warn('[SSE] Connection error', err);
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Cloud Broker (MQTT) initialization
  useEffect(() => {
    if (isSyncInitializedRef.current) return;
    isSyncInitializedRef.current = true;

    cloudSync.init({
      onStatusChange: (status, broker, peers) => {
        setSyncStatus(status);
        setSyncBrokerName(broker);
        setConnectedDevicesCount(peers);
        if (status === 'connected') {
          flushOfflineQueue();
        }
      },
      onRetainedState: (retainedState, version) => {
        if (retainedState) {
          applyServerState(retainedState, version);
        }
      },
      onMessage: (msg: SyncMessage) => {
        handleSyncMessage(msg);
      },
    });

    // Initial server state fetch
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.state) applyServerState(data.state, data.version);
      })
      .catch(() => {});
  }, []);


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
    dispatchServerAction('mark_notification_read', { id });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    dispatchServerAction('mark_all_notifications_read', {});
    showToast(`Semua notifikasi telah ditandai sudah dibaca.`);
  };

  const clearNotifications = () => {
    setNotifications([]);
    dispatchServerAction('clear_notifications', {});
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

    // Separate food items (Kitchen) and drink items (Bar)
    const foodItems = items.filter(
      (it) => it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat'
    );
    const drinkItems = items.filter(
      (it) => it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
    );

    const nowIso = new Date().toISOString();
    const newNotifs: CafeNotification[] = [];

    // Notifikasi Makanan khusus untuk Chef / Dapur
    if (foodItems.length > 0) {
      const foodSummary = foodItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
      newNotifs.push({
        id: `notif-food-${Date.now()}-${newId}`,
        type: 'new_order',
        title: `🍳 Pesanan Makanan: Meja #${tableNumber}`,
        message: `Pesanan ${newOrderNumber} (${customerName.trim() || `Meja ${tableNumber}`}) masuk ke Dapur: ${foodSummary}.`,
        tableNumber,
        orderId: newId,
        orderNumber: newOrderNumber,
        station: 'kitchen',
        targetRole: 'chef',
        itemsSummary: foodSummary,
        createdAt: nowIso,
        read: false,
      });
    }

    // Notifikasi Minuman khusus untuk Barista / Bar
    if (drinkItems.length > 0) {
      const drinksSummary = drinkItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
      newNotifs.push({
        id: `notif-drink-${Date.now() + 1}-${newId}`,
        type: 'new_order',
        title: `☕ Pesanan Minuman: Meja #${tableNumber}`,
        message: `Pesanan ${newOrderNumber} (${customerName.trim() || `Meja ${tableNumber}`}) masuk ke Bar: ${drinksSummary}.`,
        tableNumber,
        orderId: newId,
        orderNumber: newOrderNumber,
        station: 'bar',
        targetRole: 'barista',
        itemsSummary: drinksSummary,
        createdAt: nowIso,
        read: false,
      });
    }

    if (newNotifs.length === 0) {
      newNotifs.push({
        id: `notif-new-order-${Date.now()}-${newId}`,
        type: 'new_order',
        title: `📝 Pesanan Baru: Meja #${tableNumber}`,
        message: `Pesanan ${newOrderNumber} (${customerName.trim() || `Meja ${tableNumber}`}) berisi ${items.length} menu siap diproses.`,
        tableNumber,
        orderId: newId,
        orderNumber: newOrderNumber,
        createdAt: nowIso,
        read: false,
      });
    }

    // Audio chime & notification dispatch
    soundAlerts.playNewOrderChime();
    setNotifications((prev) => [...newNotifs, ...prev]);

    // Dispatch to server for real-time multi-device sync
    dispatchServerAction('create_order', {
      order: newOrder,
      notifications: newNotifs,
      notification: newNotifs[0],
    });

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

    // Separate food vs drink items for targeted addition notifications
    const foodNewItems = newItems.filter(
      (it) => it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat'
    );
    const drinkNewItems = newItems.filter(
      (it) => it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
    );

    const addedNotifs: CafeNotification[] = [];

    // Tambahan Makanan -> Notifikasi khusus untuk Chef
    if (foodNewItems.length > 0) {
      const foodAddedSummary = foodNewItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
      addedNotifs.push({
        id: `notif-add-food-${Date.now()}-${orderId}`,
        type: 'order_items_added',
        title: `🔔 Tambahan Makanan (Chef): Meja #${affectedTableNumber || '?'}`,
        message: `Meja #${affectedTableNumber} (${affectedCustomerName} - ${affectedOrderNumber}) menambah makanan: ${foodAddedSummary}. Harap segera disiapkan di Dapur!`,
        tableNumber: affectedTableNumber,
        orderId,
        orderNumber: affectedOrderNumber,
        station: 'kitchen',
        targetRole: 'chef',
        itemsSummary: foodAddedSummary,
        createdAt: nowIso,
        read: false,
      });
    }

    // Tambahan Minuman -> Notifikasi khusus untuk Barista
    if (drinkNewItems.length > 0) {
      const drinksAddedSummary = drinkNewItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
      addedNotifs.push({
        id: `notif-add-drinks-${Date.now() + 1}-${orderId}`,
        type: 'order_items_added',
        title: `🔔 Tambahan Minuman (Barista): Meja #${affectedTableNumber || '?'}`,
        message: `Meja #${affectedTableNumber} (${affectedCustomerName} - ${affectedOrderNumber}) menambah minuman: ${drinksAddedSummary}. Harap segera diracik di Bar!`,
        tableNumber: affectedTableNumber,
        orderId,
        orderNumber: affectedOrderNumber,
        station: 'bar',
        targetRole: 'barista',
        itemsSummary: drinksAddedSummary,
        createdAt: nowIso,
        read: false,
      });
    }

    if (addedNotifs.length === 0) {
      const itemsSummary = newItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
      addedNotifs.push({
        id: `notif-add-items-${Date.now()}-${orderId}`,
        type: 'order_items_added',
        title: `🔔 Tambahan Pesanan: Meja #${affectedTableNumber || '?'}`,
        message: `Meja #${affectedTableNumber} (${affectedCustomerName} - ${affectedOrderNumber}) menambah menu: ${itemsSummary}.`,
        tableNumber: affectedTableNumber,
        orderId,
        orderNumber: affectedOrderNumber,
        createdAt: nowIso,
        read: false,
      });
    }

    setNotifications((prev) => [...addedNotifs, ...prev]);

    // Dispatch to server for instant multi-device sync
    dispatchServerAction('add_items_to_order', {
      orderId,
      newItems,
      notifications: addedNotifs,
      notification: addedNotifs[0],
    });

    const itemsSummary = newItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');
    showToast(`🔔 TAMBAHAN PESANAN MEJA #${affectedTableNumber || '?'}: ${itemsSummary} dikirim ke Dapur & Bar!`);
  };

  const acknowledgeOrderAdditions = (orderId: string) => {
    setActiveOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, hasNewAdditions: false } : order
      )
    );
    dispatchServerAction('acknowledge_order_additions', { orderId });
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
    dispatchServerAction('update_order_items', { orderId, items });
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

    dispatchServerAction('update_order_status', { orderId, status });
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
      const isBar = targetItem.station === 'bar' || targetItem.category === 'Kopi' || targetItem.category === 'Non-Kopi';
      const itemReadyNotif: CafeNotification = {
        id: `notif-item-ready-${Date.now()}-${itemId}`,
        type: 'item_ready',
        title: isBar ? '☕ Minuman Siap Saji (Barista)' : '🍽️ Makanan Siap Saji (Chef)',
        message: `${targetItem.quantity}x ${targetItem.name} untuk Meja #${targetOrder.tableNumber} telah selesai disiapkan oleh ${isBar ? 'Barista (Bar)' : 'Chef (Dapur)'} dan siap diantar!`,
        tableNumber: targetOrder.tableNumber,
        orderId: targetOrder.id,
        orderNumber: targetOrder.orderNumber,
        itemId: targetItem.id,
        itemName: targetItem.name,
        quantity: targetItem.quantity,
        station: isBar ? 'bar' : 'kitchen',
        targetRole: 'waitress',
        createdAt: now,
        read: false,
        served: false,
      };
      setNotifications((prev) => [itemReadyNotif, ...prev]);
      showToast(`🔔 Meja #${targetOrder.tableNumber}: ${targetItem.quantity}x ${targetItem.name} SIAP SAJI (${isBar ? 'Bar' : 'Dapur'})!`);
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

    dispatchServerAction('update_order_item_status', { orderId, itemId, itemStatus });
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

    dispatchServerAction('mark_item_served', { orderId, itemId, forceServed });

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

    dispatchServerAction('mark_all_order_items_served', { orderId });
    showToast(`🍽️ Makanan & minuman pesanan ${orderNum || orderId} (Meja #${tableNum}) telah disajikan lengkap!`);
  };

  const markOrderServed = (orderId: string) => {
    markAllOrderItemsServed(orderId);
  };

  const markStationItemsReady = (orderId: string, station: 'bar' | 'kitchen') => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const now = new Date().toISOString();
    const isBar = station === 'bar';

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((it) => {
          const match = isBar
            ? it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
            : it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat';
          if (match) {
            return {
              ...it,
              status: 'ready' as const,
              readyAt: it.readyAt || now,
              served: false,
            };
          }
          return it;
        });

        const allReady = updatedItems.length > 0 && updatedItems.every((it) => it.status === 'ready');

        return {
          ...order,
          items: updatedItems,
          barReadyAt: isBar ? now : order.barReadyAt,
          kitchenReadyAt: !isBar ? now : order.kitchenReadyAt,
          status: allReady ? ('ready' as const) : order.status === 'pending' ? ('cooking' as const) : order.status,
          updatedAt: now,
        };
      })
    );

    soundAlerts.playReadyChime();

    const notif: CafeNotification = {
      id: `notif-station-ready-${Date.now()}-${orderId}-${station}`,
      type: isBar ? 'bar_ready' : 'kitchen_ready',
      title: isBar
        ? `☕ Minuman Bar Siap Saji (Barista): Meja #${targetOrder.tableNumber}`
        : `🍳 Makanan Dapur Siap Saji (Chef): Meja #${targetOrder.tableNumber}`,
      message: isBar
        ? `Pesanan minuman untuk Meja #${targetOrder.tableNumber} (${targetOrder.orderNumber}) selesai diracik Barista! Harap waitress segera mengantar ke meja agar minuman tetap segar.`
        : `Hidangan makanan untuk Meja #${targetOrder.tableNumber} (${targetOrder.orderNumber}) telah selesai dimasak Chef dan siap disajikan hangat ke tamu!`,
      tableNumber: targetOrder.tableNumber,
      orderId: targetOrder.id,
      orderNumber: targetOrder.orderNumber,
      station,
      targetRole: 'waitress',
      createdAt: now,
      read: false,
      served: false,
    };

    setNotifications((prev) => [notif, ...prev]);

    dispatchServerAction('mark_station_items_ready', { orderId, station });

    if (isBar) {
      showToast(`☕ Minuman Meja #${targetOrder.tableNumber} SIAP SAJI! Racikan barista selesai.`);
    } else {
      showToast(`🍳 Makanan Meja #${targetOrder.tableNumber} SIAP SAJI! Masakan chef selesai.`);
    }
  };

  const markStationItemsServed = (orderId: string, station: 'bar' | 'kitchen', forceServed?: boolean) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const now = new Date().toISOString();
    const isBar = station === 'bar';
    const nextServed = forceServed !== undefined ? forceServed : true;

    setActiveOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((it) => {
          const match = isBar
            ? it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
            : it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat';
          if (match) {
            return {
              ...it,
              served: nextServed,
              servedAt: nextServed ? (it.servedAt || now) : undefined,
              status: nextServed ? ('ready' as const) : it.status,
            };
          }
          return it;
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
          barServedAt: isBar ? (nextServed ? now : undefined) : order.barServedAt,
          kitchenServedAt: !isBar ? (nextServed ? now : undefined) : order.kitchenServedAt,
          status: newOrderStatus,
          servedAt: allServed ? (order.servedAt || now) : (newOrderStatus === 'served' ? order.servedAt : undefined),
          updatedAt: now,
        };
      })
    );

    setNotifications((prev) =>
      prev.map((n) => {
        if (n.orderId === orderId && (n.station === station || (station === 'bar' && n.type === 'bar_ready') || (station === 'kitchen' && n.type === 'kitchen_ready'))) {
          return { ...n, served: nextServed, read: nextServed };
        }
        return n;
      })
    );

    dispatchServerAction('mark_station_items_served', { orderId, station, forceServed: nextServed });

    showToast(
      isBar
        ? (nextServed ? `☕ Minuman Meja #${targetOrder.tableNumber} berhasil disajikan!` : `Status saji minuman Meja #${targetOrder.tableNumber} dibatalkan.`)
        : (nextServed ? `🍽️ Makanan Meja #${targetOrder.tableNumber} berhasil disajikan!` : `Status saji makanan Meja #${targetOrder.tableNumber} dibatalkan.`)
    );
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

    dispatchServerAction('mark_order_completed', { orderId });
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

    dispatchServerAction('cancel_order', { orderId, reason });
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

    dispatchServerAction('process_payment', { orderId, method, details });
    showToast(`Pembayaran ${target.orderNumber} selesai via ${method.toUpperCase()}! Struk dicetak.`);
  };

  const clearAllActiveTransactionsToHistory = () => {
    if (activeOrders.length === 0) {
      showToast('Tidak ada transaksi aktif saat ini.');
      return;
    }
    const nowIso = new Date().toISOString();
    const newlyCompleted: Order[] = activeOrders.map((o) => ({
      ...o,
      status: 'paid',
      paymentStatus: 'paid',
      paymentMethod: o.paymentMethod || 'cash',
      paymentDetails: o.paymentDetails || {
        cashReceived: o.total,
        changeReturned: 0,
        paidAt: nowIso,
      },
      updatedAt: nowIso,
    }));

    setCompletedOrders((prev) => {
      const updated = [...newlyCompleted, ...prev];
      completedOrdersRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(updated));
      return updated;
    });

    setActiveOrders([]);
    activeOrdersRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.ORDERS);

    setTables((prev) => {
      const updated = prev.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
      tablesRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
      return updated;
    });

    dispatchServerAction('clear_all_active_transactions', {});
    showToast('Semua transaksi aktif telah diarsipkan ke riwayat transaksi. Meja kini kosong dan siap untuk transaksi baru!');
  };

  const deleteAllOrdersData = () => {
    setActiveOrders([]);
    activeOrdersRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.ORDERS);

    setCompletedOrders([]);
    completedOrdersRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.PAID_ORDERS);

    setDeletedOrderIds([]);
    deletedOrderIdsRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.DELETED_ORDER_IDS);

    setNotifications([]);
    notificationsRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);

    setTables((prev) => {
      const updated = prev.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
      tablesRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
      return updated;
    });

    dispatchServerAction('delete_all_orders', {});
    showToast('Seluruh data pemesanan aktif, riwayat, dan demo berhasil dihapus bersih.');
  };

  const clearAllExpenses = () => {
    setExpenses([]);
    expensesRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    dispatchServerAction('clear_all_expenses', {});
    showToast('Seluruh data pengeluaran operasional & uang keluar telah dikosongkan.');
  };

  const clearAllInventory = () => {
    setInventory([]);
    inventoryRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    dispatchServerAction('clear_all_inventory', {});
    showToast('Seluruh stok bahan baku telah dikosongkan.');
  };

  const resetAllDataForLiveOperations = () => {
    setActiveOrders([]);
    activeOrdersRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.ORDERS);

    setCompletedOrders([]);
    completedOrdersRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.PAID_ORDERS);

    setDeletedOrderIds([]);
    deletedOrderIdsRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.DELETED_ORDER_IDS);

    setNotifications([]);
    notificationsRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);

    setExpenses([]);
    expensesRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);

    setInventory([]);
    inventoryRef.current = [];
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);

    setTables((prev) => {
      const updated = prev.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
      tablesRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
      return updated;
    });

    dispatchServerAction('clear_all_operational_data', {});
    showToast('✨ Aplikasi siap operasional riil! Seluruh data demo, arus kas, dan stok bahan telah bersih.');
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
    dispatchServerAction('update_completed_order', { orderId, updates });
    showToast('Data transaksi berhasil diperbarui!');
  };

  const deleteCompletedOrder = (orderId: string) => {
    const target = completedOrdersRef.current.find((o) => o.id === orderId) || activeOrdersRef.current.find((o) => o.id === orderId);
    // Remove from completed orders and active orders
    setCompletedOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      completedOrdersRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.PAID_ORDERS, JSON.stringify(updated));
      return updated;
    });
    setActiveOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      activeOrdersRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
    // Register to deletedOrderIds to prevent revival on refresh or login
    setDeletedOrderIds((prev) => {
      if (prev.includes(orderId)) return prev;
      const nextDeleted = [...prev, orderId];
      deletedOrderIdsRef.current = nextDeleted;
      localStorage.setItem(STORAGE_KEYS.DELETED_ORDER_IDS, JSON.stringify(nextDeleted));
      return nextDeleted;
    });
    dispatchServerAction('delete_completed_order', { orderId });
    showToast(`Transaksi ${target?.orderNumber || ''} berhasil dihapus dari sistem.`);
  };

  // OPERATIONAL EXPENSES ACTIONS
  const addExpense = (expense: Omit<OperationalExpense, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    const newExpense: OperationalExpense = { ...expense, id: newId };
    setExpenses((prev) => [newExpense, ...prev]);
    dispatchServerAction('add_expense', { expense: newExpense });
    showToast(`Pengeluaran "${expense.name}" berhasil dicatat.`);
  };

  const updateExpense = (id: string, updates: Partial<OperationalExpense>) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
    dispatchServerAction('update_expense', { id, updates });
    showToast(`Catatan pengeluaran diperbarui.`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    dispatchServerAction('delete_expense', { id });
    showToast(`Catatan pengeluaran dihapus.`);
  };

  // TABLE ACTIONS
  const updateTableStatus = (tableNumber: number, status: TableInfo['status'], orderId?: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.number === tableNumber ? { ...t, status, currentOrderId: orderId ?? t.currentOrderId } : t
      )
    );
    dispatchServerAction('update_table_status', { tableNumber, status, orderId });
  };

  const addTable = (tableData?: { number?: number; capacity?: number; section?: string }) => {
    const existingNumbers = new Set(tables.map((t) => t.number));
    let nextNum = tableData?.number || (tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 31);
    while (existingNumbers.has(nextNum)) {
      nextNum++;
    }
    const newTable: TableInfo = {
      number: nextNum,
      capacity: tableData?.capacity || 4,
      section: tableData?.section || 'Cadangan / Overflow',
      status: 'available',
    };
    setTables((prev) => {
      const updated = [...prev, newTable];
      tablesRef.current = updated;
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
      return updated;
    });
    dispatchServerAction('add_table', { table: newTable });
    showToast(`✅ Meja Cadangan #${nextNum} (Kapasitas: ${newTable.capacity} orang) berhasil ditambahkan!`);
  };

  // MENU ACTIONS
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newId = `item-${Date.now()}`;
    const newItem: MenuItem = { ...item, id: newId };
    setMenuItems((prev) => [newItem, ...prev]);
    dispatchServerAction('add_menu_item', { item: newItem });
    showToast(`Menu baru "${newItem.name}" berhasil ditambahkan!`);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    dispatchServerAction('update_menu_item', { id, updates });
    showToast(`Menu berhasil diperbarui!`);
  };

  const deleteMenuItem = (id: string) => {
    const target = menuItems.find((i) => i.id === id);
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    dispatchServerAction('delete_menu_item', { id });
    showToast(`Menu "${target?.name || ''}" telah dihapus.`);
  };

  const toggleMenuStock = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item))
    );
    dispatchServerAction('toggle_menu_stock', { id });
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
    dispatchServerAction('update_inventory_stock', { id, newStock });
    showToast(`Stok bahan baku diperbarui.`);
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newId = `inv-${Date.now()}`;
    const newInv: InventoryItem = { ...item, id: newId, lastRestocked: new Date().toISOString().split('T')[0] };
    setInventory((prev) => [...prev, newInv]);
    dispatchServerAction('add_inventory_item', { item: newInv });
    showToast(`Bahan baku "${item.name}" berhasil ditambahkan.`);
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    dispatchServerAction('delete_inventory_item', { id });
    showToast(`Bahan baku dihapus.`);
  };

  // USER ACTIONS
  const addUser = (user: Omit<UserAccount, 'id'>) => {
    const newId = `usr-${Date.now()}`;
    const newUser: UserAccount = { ...user, id: newId };
    setUsers((prev) => [...prev, newUser]);
    dispatchServerAction('add_user', { user: newUser });
    showToast(`Pengguna baru "${user.name}" berhasil dibuat.`);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
      if (currentUser && currentUser.id === id) {
        const found = updated.find((u) => u.id === id);
        if (found) {
          setCurrentUserState(found);
        }
      }
      return updated;
    });
    dispatchServerAction('update_user', { id, updates });
    showToast(`Data pengguna diperbarui.`);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    dispatchServerAction('delete_user', { id });
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
    alertedDelayOrdersRef.current = {};
    localStorage.clear();
    dispatchServerAction('reset_data', {});
    showToast(`Data aplikasi di-reset ke data default NADIRA Café & Resto.`);
  };

  const allOrders = [...activeOrders, ...completedOrders];

  return (
    <CafeContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentUser,
        setCurrentUser,
        onlineSessions,
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
        markStationItemsReady,
        markStationItemsServed,
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
        addTable,
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
        clearAllActiveTransactionsToHistory,
        deleteAllOrdersData,
        clearAllExpenses,
        clearAllInventory,
        resetAllDataForLiveOperations,
        syncStatus,
        syncBrokerName,
        connectedDevicesCount,
        triggerManualSync,
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
