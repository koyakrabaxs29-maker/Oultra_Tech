import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  UserAccount, 
  MenuItem, 
  TableInfo, 
  Order, 
  OperationalExpense, 
  InventoryItem 
} from '../types';

export const COLLECTIONS = {
  USERS: 'users',
  MENU_ITEMS: 'menu_items',
  TABLES: 'tables',
  ACTIVE_ORDERS: 'active_orders',
  COMPLETED_ORDERS: 'completed_orders',
  EXPENSES: 'expenses',
  INVENTORY: 'inventory',
} as const;

export interface FirestoreDataCallbacks {
  onUsersLoaded?: (users: UserAccount[]) => void;
  onMenuLoaded?: (menu: MenuItem[]) => void;
  onTablesLoaded?: (tables: TableInfo[]) => void;
  onActiveOrdersLoaded?: (orders: Order[]) => void;
  onCompletedOrdersLoaded?: (orders: Order[]) => void;
  onExpensesLoaded?: (expenses: OperationalExpense[]) => void;
  onInventoryLoaded?: (inventory: InventoryItem[]) => void;
}

function sanitizePayload<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Seed initial data to Firestore if collections are currently empty
 * (Catatan: Data akun disimpan di Local Storage, tidak di Cloud Firestore)
 */
export async function seedFirestoreIfEmpty(
  initialMenu: MenuItem[],
  initialTables: TableInfo[],
  initialInventory: InventoryItem[],
  initialExpenses: OperationalExpense[]
) {
  try {
    const menuSnap = await getDocs(collection(db, COLLECTIONS.MENU_ITEMS));
    if (menuSnap.empty) {
      console.log('🌱 Seeding initial menu items to Firestore...');
      const batch = writeBatch(db);
      initialMenu.forEach((item) => {
        const ref = doc(db, COLLECTIONS.MENU_ITEMS, item.id);
        batch.set(ref, sanitizePayload(item));
      });
      await batch.commit();
    }

    const tablesSnap = await getDocs(collection(db, COLLECTIONS.TABLES));
    if (tablesSnap.empty) {
      console.log('🌱 Seeding initial tables to Firestore...');
      const batch = writeBatch(db);
      initialTables.forEach((table) => {
        const ref = doc(db, COLLECTIONS.TABLES, `table-${table.number}`);
        batch.set(ref, sanitizePayload(table));
      });
      await batch.commit();
    }

    const invSnap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
    if (invSnap.empty && initialInventory.length > 0) {
      console.log('🌱 Seeding initial inventory to Firestore...');
      const batch = writeBatch(db);
      initialInventory.forEach((inv) => {
        const ref = doc(db, COLLECTIONS.INVENTORY, inv.id);
        batch.set(ref, sanitizePayload(inv));
      });
      await batch.commit();
    }

    // Uang Keluar (Expenses) di Firebase
    const expSnap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    if (expSnap.empty && initialExpenses.length > 0) {
      console.log('🌱 Seeding initial expenses to Firestore...');
      const batch = writeBatch(db);
      initialExpenses.forEach((exp) => {
        const ref = doc(db, COLLECTIONS.EXPENSES, exp.id);
        batch.set(ref, sanitizePayload(exp));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}

/**
 * Setup real-time listeners for Firestore collections
 * - Data Akun: Disimpan lokal di Local Storage Owner
 * - Data Transaksi Uang Masuk (completed_orders) & Uang Keluar (expenses): Disimpan & disinkronkan di Firebase
 */
export function setupFirestoreSubscriptions(callbacks: FirestoreDataCallbacks) {
  const unsubscribes: Array<() => void> = [];

  // 1. Menu Items (Semua Role Staf)
  try {
    const unsubMenu = onSnapshot(
      collection(db, COLLECTIONS.MENU_ITEMS),
      (snapshot) => {
        if (callbacks.onMenuLoaded && !snapshot.empty) {
          const menu = snapshot.docs.map((d) => d.data() as MenuItem);
          callbacks.onMenuLoaded(menu);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.MENU_ITEMS);
      }
    );
    unsubscribes.push(unsubMenu);
  } catch (e) {
    console.warn('Menu onSnapshot error:', e);
  }

  // 2. Tables (Semua Role Staf)
  try {
    const unsubTables = onSnapshot(
      collection(db, COLLECTIONS.TABLES),
      (snapshot) => {
        if (callbacks.onTablesLoaded && !snapshot.empty) {
          const tables = snapshot.docs.map((d) => d.data() as TableInfo);
          tables.sort((a, b) => a.number - b.number);
          callbacks.onTablesLoaded(tables);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.TABLES);
      }
    );
    unsubscribes.push(unsubTables);
  } catch (e) {
    console.warn('Tables onSnapshot error:', e);
  }

  // 3. Active Orders (Semua Role Staf)
  try {
    const unsubActive = onSnapshot(
      collection(db, COLLECTIONS.ACTIVE_ORDERS),
      (snapshot) => {
        if (callbacks.onActiveOrdersLoaded) {
          const orders = snapshot.docs.map((d) => d.data() as Order);
          callbacks.onActiveOrdersLoaded(orders);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.ACTIVE_ORDERS);
      }
    );
    unsubscribes.push(unsubActive);
  } catch (e) {
    console.warn('ActiveOrders onSnapshot error:', e);
  }

  // 4. Data Transaksi Uang Masuk (Completed Orders / Penjualan Lunas) di Firebase
  try {
    const unsubCompleted = onSnapshot(
      collection(db, COLLECTIONS.COMPLETED_ORDERS),
      (snapshot) => {
        if (callbacks.onCompletedOrdersLoaded) {
          const orders = snapshot.docs.map((d) => d.data() as Order);
          callbacks.onCompletedOrdersLoaded(orders);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.COMPLETED_ORDERS);
      }
    );
    unsubscribes.push(unsubCompleted);
  } catch (e) {
    console.warn('CompletedOrders onSnapshot error:', e);
  }

  // 5. Data Transaksi Uang Keluar (Expenses / Pengeluaran Operasional) di Firebase
  try {
    const unsubExpenses = onSnapshot(
      collection(db, COLLECTIONS.EXPENSES),
      (snapshot) => {
        if (callbacks.onExpensesLoaded) {
          const expenses = snapshot.docs.map((d) => d.data() as OperationalExpense);
          callbacks.onExpensesLoaded(expenses);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.EXPENSES);
      }
    );
    unsubscribes.push(unsubExpenses);
  } catch (e) {
    console.warn('Expenses onSnapshot error:', e);
  }

  // 6. Inventory (Semua Role Staf)
  try {
    const unsubInventory = onSnapshot(
      collection(db, COLLECTIONS.INVENTORY),
      (snapshot) => {
        if (callbacks.onInventoryLoaded) {
          const inventory = snapshot.docs.map((d) => d.data() as InventoryItem);
          callbacks.onInventoryLoaded(inventory);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.INVENTORY);
      }
    );
    unsubscribes.push(unsubInventory);
  } catch (e) {
    console.warn('Inventory onSnapshot error:', e);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

// Write helpers
export async function syncOrderToFirestore(order: Order) {
  try {
    const ref = doc(db, COLLECTIONS.ACTIVE_ORDERS, order.id);
    await setDoc(ref, sanitizePayload(order));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.ACTIVE_ORDERS}/${order.id}`);
  }
}

export async function removeActiveOrderFromFirestore(orderId: string) {
  try {
    const ref = doc(db, COLLECTIONS.ACTIVE_ORDERS, orderId);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${COLLECTIONS.ACTIVE_ORDERS}/${orderId}`);
  }
}

export async function syncCompletedOrderToFirestore(order: Order) {
  try {
    const ref = doc(db, COLLECTIONS.COMPLETED_ORDERS, order.id);
    await setDoc(ref, sanitizePayload(order));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.COMPLETED_ORDERS}/${order.id}`);
  }
}

export async function syncTableToFirestore(table: TableInfo) {
  try {
    const ref = doc(db, COLLECTIONS.TABLES, `table-${table.number}`);
    await setDoc(ref, sanitizePayload(table));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.TABLES}/table-${table.number}`);
  }
}

// User accounts are stored locally in Local Storage Owner, not in Firebase
export async function syncUserToFirestore(_user: UserAccount) {
  // Disimpan pada Local Storage Owner, tidak dikirim ke Firebase
}

export async function removeUserFromFirestore(_userId: string) {
  // Disimpan pada Local Storage Owner, tidak dikirim ke Firebase
}

export async function syncMenuItemToFirestore(item: MenuItem) {
  try {
    const ref = doc(db, COLLECTIONS.MENU_ITEMS, item.id);
    await setDoc(ref, sanitizePayload(item));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.MENU_ITEMS}/${item.id}`);
  }
}

export async function removeMenuItemFromFirestore(itemId: string) {
  try {
    const ref = doc(db, COLLECTIONS.MENU_ITEMS, itemId);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${COLLECTIONS.MENU_ITEMS}/${itemId}`);
  }
}

export async function syncExpenseToFirestore(expense: OperationalExpense) {
  try {
    const ref = doc(db, COLLECTIONS.EXPENSES, expense.id);
    await setDoc(ref, sanitizePayload(expense));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.EXPENSES}/${expense.id}`);
  }
}

export async function removeExpenseFromFirestore(expenseId: string) {
  try {
    const ref = doc(db, COLLECTIONS.EXPENSES, expenseId);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${COLLECTIONS.EXPENSES}/${expenseId}`);
  }
}

export async function syncInventoryToFirestore(item: InventoryItem) {
  try {
    const ref = doc(db, COLLECTIONS.INVENTORY, item.id);
    await setDoc(ref, sanitizePayload(item));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.INVENTORY}/${item.id}`);
  }
}

export async function removeInventoryFromFirestore(itemId: string) {
  try {
    const ref = doc(db, COLLECTIONS.INVENTORY, itemId);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${COLLECTIONS.INVENTORY}/${itemId}`);
  }
}
