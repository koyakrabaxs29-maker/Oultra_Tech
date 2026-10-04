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

/**
 * Seed initial data to Firestore if collections are currently empty
 */
export async function seedFirestoreIfEmpty(
  initialUsers: UserAccount[],
  initialMenu: MenuItem[],
  initialTables: TableInfo[],
  initialInventory: InventoryItem[],
  initialExpenses: OperationalExpense[]
) {
  try {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    if (usersSnap.empty) {
      console.log('🌱 Seeding initial users to Firestore...');
      const batch = writeBatch(db);
      initialUsers.forEach((user) => {
        const ref = doc(db, COLLECTIONS.USERS, user.id);
        batch.set(ref, user);
      });
      await batch.commit();
    }

    const menuSnap = await getDocs(collection(db, COLLECTIONS.MENU_ITEMS));
    if (menuSnap.empty) {
      console.log('🌱 Seeding initial menu items to Firestore...');
      const batch = writeBatch(db);
      initialMenu.forEach((item) => {
        const ref = doc(db, COLLECTIONS.MENU_ITEMS, item.id);
        batch.set(ref, item);
      });
      await batch.commit();
    }

    const tablesSnap = await getDocs(collection(db, COLLECTIONS.TABLES));
    if (tablesSnap.empty) {
      console.log('🌱 Seeding initial tables to Firestore...');
      const batch = writeBatch(db);
      initialTables.forEach((table) => {
        const ref = doc(db, COLLECTIONS.TABLES, `table-${table.number}`);
        batch.set(ref, table);
      });
      await batch.commit();
    }

    const invSnap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
    if (invSnap.empty) {
      console.log('🌱 Seeding initial inventory to Firestore...');
      const batch = writeBatch(db);
      initialInventory.forEach((inv) => {
        const ref = doc(db, COLLECTIONS.INVENTORY, inv.id);
        batch.set(ref, inv);
      });
      await batch.commit();
    }

    const expSnap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    if (expSnap.empty && initialExpenses.length > 0) {
      console.log('🌱 Seeding initial expenses to Firestore...');
      const batch = writeBatch(db);
      initialExpenses.forEach((exp) => {
        const ref = doc(db, COLLECTIONS.EXPENSES, exp.id);
        batch.set(ref, exp);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}

/**
 * Setup real-time listeners for all Firestore collections
 */
export function setupFirestoreSubscriptions(callbacks: FirestoreDataCallbacks) {
  const unsubscribes: Array<() => void> = [];

  // 1. Users
  try {
    const unsubUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snapshot) => {
        if (callbacks.onUsersLoaded && !snapshot.empty) {
          const users = snapshot.docs.map((d) => d.data() as UserAccount);
          callbacks.onUsersLoaded(users);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.USERS);
      }
    );
    unsubscribes.push(unsubUsers);
  } catch (e) {
    console.warn('Users onSnapshot error:', e);
  }

  // 2. Menu Items
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

  // 3. Tables
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

  // 4. Active Orders
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

  // 5. Completed Orders
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

  // 6. Expenses
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

  // 7. Inventory
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
    await setDoc(ref, order);
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
    await setDoc(ref, order);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.COMPLETED_ORDERS}/${order.id}`);
  }
}

export async function syncTableToFirestore(table: TableInfo) {
  try {
    const ref = doc(db, COLLECTIONS.TABLES, `table-${table.number}`);
    await setDoc(ref, table);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.TABLES}/table-${table.number}`);
  }
}

export async function syncUserToFirestore(user: UserAccount) {
  try {
    const ref = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(ref, user);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${COLLECTIONS.USERS}/${user.id}`);
  }
}

export async function removeUserFromFirestore(userId: string) {
  try {
    const ref = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${COLLECTIONS.USERS}/${userId}`);
  }
}

export async function syncMenuItemToFirestore(item: MenuItem) {
  try {
    const ref = doc(db, COLLECTIONS.MENU_ITEMS, item.id);
    await setDoc(ref, item);
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
    await setDoc(ref, expense);
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
    await setDoc(ref, item);
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
