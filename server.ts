import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_INVENTORY,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_PAID_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS
} from './src/data/initialData.ts';
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  CafeNotification,
  TableInfo,
  MenuItem,
  InventoryItem,
  UserAccount,
  OperationalExpense
} from './src/types.ts';

interface CafeState {
  menuItems: MenuItem[];
  activeOrders: Order[];
  completedOrders: Order[];
  deletedOrderIds: string[];
  tables: TableInfo[];
  inventory: InventoryItem[];
  users: UserAccount[];
  notifications: CafeNotification[];
  expenses: OperationalExpense[];
  version: number;
}

const STORE_PATH = path.resolve(process.cwd(), 'cafe-state-store.json');

function getInitialState(): CafeState {
  return {
    menuItems: JSON.parse(JSON.stringify(INITIAL_MENU_ITEMS)),
    activeOrders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    completedOrders: JSON.parse(JSON.stringify(INITIAL_PAID_ORDERS)),
    deletedOrderIds: [],
    tables: JSON.parse(JSON.stringify(INITIAL_TABLES)),
    inventory: JSON.parse(JSON.stringify(INITIAL_INVENTORY)),
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    expenses: JSON.parse(JSON.stringify(INITIAL_EXPENSES)),
    version: 1,
  };
}

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

function loadState(): CafeState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activeOrders)) {
        parsed.activeOrders = parsed.activeOrders.filter((o: Order) => !isDemoOrder(o));
        parsed.completedOrders = (parsed.completedOrders || []).filter((o: Order) => !isDemoOrder(o));
        parsed.notifications = (parsed.notifications || []).filter((n: CafeNotification) => !isDemoOrder({ id: n.orderId || n.id, orderNumber: n.orderNumber }));
        parsed.expenses = (parsed.expenses || []).filter((e: OperationalExpense) => !isDemoExpense(e));
        parsed.inventory = (parsed.inventory || []).filter((i: InventoryItem) => !isDemoInventory(i));
        parsed.tables = (parsed.tables || []).map((t: TableInfo) => {
          if (t.currentOrderId && isDemoOrder({ id: t.currentOrderId })) {
            return { ...t, status: 'available' as const, currentOrderId: undefined };
          }
          return t;
        });
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Server] Failed to load store, using initial data:', err);
  }
  const initial = getInitialState();
  saveStateImmediate(initial);
  return initial;
}

let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSave(state: CafeState) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveStateImmediate(state);
  }, 250);
}

function saveStateImmediate(state: CafeState) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to write store to disk:', err);
  }
}

const state: CafeState = loadState();

const sseClients = new Set<express.Response>();

function broadcast(event: {
  type: string;
  payload?: any;
  version: number;
  sourceClientId?: string;
  state?: any;
}) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Helper calculation
function calculateTotals(items: OrderItem[]) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1); // PPN 10%
  const serviceCharge = Math.round(subtotal * 0.05); // 5%
  const total = subtotal + tax + serviceCharge;
  return { subtotal, tax, serviceCharge, total };
}

const app = express();

app.use(express.json({ limit: '10mb' }));

// CORS and Cache Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// SSE endpoint for instant real-time synchronization across devices
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connected event with current state
  res.write(`data: ${JSON.stringify({ type: 'connected', version: state.version, state })}\n\n`);

  sseClients.add(res);

  // Heartbeat every 15s to keep mobile connections open
  const heartbeat = setInterval(() => {
    try {
      res.write(':keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Get current full state
app.get('/api/state', (req, res) => {
  res.json({ success: true, version: state.version, state });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: state.version, activeOrders: state.activeOrders.length });
});

// Action dispatcher
app.post('/api/action', (req, res) => {
  const { action, payload, clientId } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'Missing action' });
  }

  let eventType = 'state_updated';
  let eventPayload: any = null;

  switch (action) {
    case 'create_order': {
      let newOrder: Order;
      if (payload.order) {
        newOrder = payload.order;
      } else {
        const { tableNumber, customerName, items, waitressName } = payload;
        const { subtotal, tax, serviceCharge, total } = calculateTotals(items);
        const newOrderNumber = `#NDR-${Math.floor(100 + Math.random() * 900)}`;
        const newId = `ORD-${Date.now().toString().slice(-6)}`;

        newOrder = {
          id: newId,
          orderNumber: newOrderNumber,
          tableNumber,
          customerName: customerName?.trim() || `Pelanggan Meja ${tableNumber}`,
          items: items.map((it: OrderItem) => ({ ...it, status: it.status || 'pending' })),
          subtotal,
          tax,
          serviceCharge,
          total,
          status: 'pending',
          paymentStatus: 'unpaid',
          waitressName: waitressName || 'Waitress On-Duty',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      state.activeOrders = [newOrder, ...state.activeOrders.filter((o) => o.id !== newOrder.id)];

      // Update table
      state.tables = state.tables.map((t) =>
        t.number === newOrder.tableNumber
          ? { ...t, status: 'occupied', currentOrderId: newOrder.id }
          : t
      );

      // Notification for Kitchen & Bar
      const notif: CafeNotification = payload.notification || {
        id: `notif-new-${Date.now()}-${newOrder.id}`,
        type: 'new_order',
        title: `📝 Pesanan Baru: Meja #${newOrder.tableNumber}`,
        message: `Pesanan ${newOrder.orderNumber} (${newOrder.customerName}) berisi ${newOrder.items.length} menu siap diproses di Dapur/Bar.`,
        tableNumber: newOrder.tableNumber,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        createdAt: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(notif);

      eventType = 'order_created';
      eventPayload = { order: newOrder, notification: notif };
      break;
    }

    case 'add_items_to_order': {
      const { orderId, newItems } = payload;
      const nowIso = new Date().toISOString();
      const targetOrder = state.activeOrders.find((o) => o.id === orderId);

      if (targetOrder) {
        const mergedItems = [...targetOrder.items];
        newItems.forEach((newItem: OrderItem) => {
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
        targetOrder.items = mergedItems;
        targetOrder.subtotal = subtotal;
        targetOrder.tax = tax;
        targetOrder.serviceCharge = serviceCharge;
        targetOrder.total = total;
        targetOrder.status = 'cooking';
        targetOrder.hasNewAdditions = true;
        targetOrder.lastItemAddedAt = nowIso;
        targetOrder.updatedAt = nowIso;

        const itemsSummary = newItems.map((it: OrderItem) => `${it.quantity}x ${it.name}`).join(', ');
        const stations = Array.from(new Set(newItems.map((it: OrderItem) => it.station)));
        const stationLabel = stations.length === 1 ? (stations[0] === 'bar' ? 'Bar (Minuman)' : 'Kitchen (Makanan)') : 'Kitchen & Bar';

        const notif: CafeNotification = {
          id: `notif-add-${Date.now()}-${orderId}`,
          type: 'order_items_added',
          title: `🔔 Tambahan Pesanan: Meja #${targetOrder.tableNumber}`,
          message: `Meja #${targetOrder.tableNumber} (${targetOrder.customerName} - ${targetOrder.orderNumber}) menambah menu: ${itemsSummary}. Harap segera disiapkan di ${stationLabel}!`,
          tableNumber: targetOrder.tableNumber,
          orderId,
          orderNumber: targetOrder.orderNumber,
          station: stations.length === 1 ? (stations[0] as any) : undefined,
          createdAt: nowIso,
          read: false,
        };
        state.notifications.unshift(notif);

        eventType = 'items_added';
        eventPayload = { orderId, order: targetOrder, notification: notif };
      }
      break;
    }

    case 'acknowledge_order_additions': {
      const { orderId } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        order.hasNewAdditions = false;
      }
      eventType = 'additions_acknowledged';
      eventPayload = { orderId };
      break;
    }

    case 'update_order_items': {
      const { orderId, items } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const { subtotal, tax, serviceCharge, total } = calculateTotals(items);
        order.items = items;
        order.subtotal = subtotal;
        order.tax = tax;
        order.serviceCharge = serviceCharge;
        order.total = total;
        order.updatedAt = new Date().toISOString();
      }
      eventType = 'order_updated';
      eventPayload = { orderId };
      break;
    }

    case 'update_order_status': {
      const { orderId, status: newStatus } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        order.status = newStatus;
        order.updatedAt = now;
        if (newStatus === 'ready') {
          order.items = order.items.map((it) => ({
            ...it,
            status: 'ready',
            readyAt: it.readyAt || now,
          }));

          const notif: CafeNotification = {
            id: `notif-ready-all-${Date.now()}-${orderId}`,
            type: 'item_ready',
            title: `🍽️ Semua Menu Meja #${order.tableNumber} Siap!`,
            message: `Seluruh pesanan ${order.orderNumber} untuk Meja #${order.tableNumber} telah siap disajikan oleh Dapur & Bar!`,
            tableNumber: order.tableNumber,
            orderId,
            orderNumber: order.orderNumber,
            createdAt: now,
            read: false,
          };
          state.notifications.unshift(notif);
          eventPayload = { orderId, status: newStatus, order, notification: notif };
        } else {
          eventPayload = { orderId, status: newStatus, order };
        }
      }
      eventType = 'order_status_updated';
      break;
    }

    case 'update_order_item_status': {
      const { orderId, itemId, itemStatus } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        let targetItem: OrderItem | undefined;
        order.items = order.items.map((it) => {
          if (it.id === itemId) {
            targetItem = {
              ...it,
              status: itemStatus,
              readyAt: itemStatus === 'ready' ? now : it.readyAt,
            };
            return targetItem;
          }
          return it;
        });

        const allReady = order.items.every((it) => it.status === 'ready');
        const anyCooking = order.items.some((it) => it.status === 'cooking' || it.status === 'ready');
        if (allReady) {
          order.status = 'ready';
        } else if (anyCooking && order.status === 'pending') {
          order.status = 'cooking';
        }
        order.updatedAt = now;

        let notif: CafeNotification | undefined;
        if (itemStatus === 'ready' && targetItem) {
          notif = {
            id: `notif-item-ready-${Date.now()}-${itemId}`,
            type: 'item_ready',
            title: `${targetItem.station === 'bar' ? '☕' : '🍽️'} Menu Siap Saji: Meja #${order.tableNumber}`,
            message: `${targetItem.quantity}x ${targetItem.name} untuk Meja #${order.tableNumber} siap diantar!`,
            tableNumber: order.tableNumber,
            orderId,
            orderNumber: order.orderNumber,
            itemId,
            itemName: targetItem.name,
            quantity: targetItem.quantity,
            station: targetItem.station,
            createdAt: now,
            read: false,
            served: false,
          };
          state.notifications.unshift(notif);
        }

        eventType = 'item_status_updated';
        eventPayload = { orderId, itemId, itemStatus, order, notification: notif };
      }
      break;
    }

    case 'mark_item_served': {
      const { orderId, itemId, forceServed } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        order.items = order.items.map((it) => {
          if (it.id === itemId) {
            const nextServed = forceServed !== undefined ? forceServed : !it.served;
            return {
              ...it,
              served: nextServed,
              servedAt: nextServed ? now : undefined,
              status: nextServed ? 'ready' : it.status,
            };
          }
          return it;
        });

        const allServed = order.items.every((it) => it.served);
        if (allServed) {
          order.status = 'served';
        }
        order.updatedAt = now;
      }
      // Also update notification
      state.notifications = state.notifications.map((n) =>
        n.orderId === orderId && n.itemId === itemId ? { ...n, served: true, read: true } : n
      );
      eventType = 'item_served';
      eventPayload = { orderId, itemId };
      break;
    }

    case 'mark_all_order_items_served': {
      const { orderId } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        order.items = order.items.map((it) => ({
          ...it,
          served: true,
          servedAt: it.servedAt || now,
          status: 'ready',
        }));
        order.status = 'served';
        order.updatedAt = now;
      }
      state.notifications = state.notifications.map((n) =>
        n.orderId === orderId ? { ...n, served: true, read: true } : n
      );
      eventType = 'all_items_served';
      eventPayload = { orderId };
      break;
    }

    case 'mark_station_items_ready': {
      const { orderId, station } = payload; // 'bar' | 'kitchen'
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        const isBar = station === 'bar';
        order.items = order.items.map((it) => {
          const matchStation = isBar
            ? it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
            : it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat';
          if (matchStation) {
            return {
              ...it,
              status: 'ready',
              readyAt: it.readyAt || now,
            };
          }
          return it;
        });

        if (isBar) {
          order.barReadyAt = now;
        } else {
          order.kitchenReadyAt = now;
        }

        const allReady = order.items.every((it) => it.status === 'ready');
        if (allReady) {
          order.status = 'ready';
        } else if (order.status === 'pending') {
          order.status = 'cooking';
        }
        order.updatedAt = now;

        const notif: CafeNotification = {
          id: `notif-station-ready-${Date.now()}-${orderId}-${station}`,
          type: isBar ? 'bar_ready' : 'kitchen_ready',
          title: isBar
            ? `☕ Minuman Bar Siap Saji: Meja #${order.tableNumber}`
            : `🍳 Makanan Dapur Siap Saji: Meja #${order.tableNumber}`,
          message: isBar
            ? `Pesanan minuman untuk Meja #${order.tableNumber} (${order.orderNumber}) selesai diracik Barista! Siap diantar lebih dulu agar minuman tetap segar.`
            : `Hidangan makanan untuk Meja #${order.tableNumber} (${order.orderNumber}) telah matang dimasak Chef dan siap disajikan hangat!`,
          tableNumber: order.tableNumber,
          orderId,
          orderNumber: order.orderNumber,
          station,
          targetRole: 'waitress',
          createdAt: now,
          read: false,
        };
        state.notifications.unshift(notif);

        eventType = 'station_items_ready';
        eventPayload = { orderId, station, order, notification: notif };
      }
      break;
    }

    case 'mark_station_items_served': {
      const { orderId, station, forceServed } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        const isBar = station === 'bar';
        const nextServed = forceServed !== undefined ? forceServed : true;

        order.items = order.items.map((it) => {
          const matchStation = isBar
            ? it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi'
            : it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat';
          if (matchStation) {
            return {
              ...it,
              served: nextServed,
              servedAt: nextServed ? (it.servedAt || now) : undefined,
              status: nextServed ? 'ready' : it.status,
            };
          }
          return it;
        });

        if (isBar) {
          order.barServedAt = nextServed ? now : undefined;
        } else {
          order.kitchenServedAt = nextServed ? now : undefined;
        }

        const allServed = order.items.length > 0 && order.items.every((it) => it.served);
        if (allServed) {
          order.status = 'served';
          order.servedAt = order.servedAt || now;
        } else if (order.status === 'served') {
          const anyReady = order.items.some((it) => it.status === 'ready');
          order.status = anyReady ? 'ready' : 'cooking';
        }
        order.updatedAt = now;

        // Mark station notifications as read & served
        state.notifications = state.notifications.map((n) => {
          if (n.orderId === orderId && (n.station === station || (station === 'bar' && n.type === 'bar_ready') || (station === 'kitchen' && n.type === 'kitchen_ready'))) {
            return { ...n, served: nextServed, read: nextServed };
          }
          return n;
        });

        eventType = 'station_items_served';
        eventPayload = { orderId, station, forceServed: nextServed, order };
      }
      break;
    }

    case 'cancel_order': {
      const { orderId, reason } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        state.activeOrders = state.activeOrders.filter((o) => o.id !== orderId);
        state.tables = state.tables.map((t) =>
          t.number === order.tableNumber ? { ...t, status: 'available', currentOrderId: undefined } : t
        );

        const notif: CafeNotification = {
          id: `notif-cancel-${Date.now()}-${orderId}`,
          type: 'order_cancelled',
          title: `❌ Pesanan Dibatalkan: Meja #${order.tableNumber}`,
          message: `Pesanan ${order.orderNumber} (Meja #${order.tableNumber}) telah dibatalkan. Alasan: ${reason || 'Pembatalan kasir'}`,
          tableNumber: order.tableNumber,
          orderId,
          orderNumber: order.orderNumber,
          createdAt: new Date().toISOString(),
          read: false,
        };
        state.notifications.unshift(notif);
      }
      eventType = 'order_cancelled';
      eventPayload = { orderId, reason };
      break;
    }

    case 'process_payment': {
      const { orderId, method, details } = payload;
      const order = state.activeOrders.find((o) => o.id === orderId);
      if (order) {
        const now = new Date().toISOString();
        const paidOrder: Order = {
          ...order,
          status: 'paid',
          paymentStatus: 'paid',
          paymentMethod: method,
          paymentDetails: {
            ...details,
            paidAt: now,
          },
          updatedAt: now,
        };

        state.activeOrders = state.activeOrders.filter((o) => o.id !== orderId);
        state.completedOrders.unshift(paidOrder);

        state.tables = state.tables.map((t) =>
          t.number === order.tableNumber ? { ...t, status: 'available', currentOrderId: undefined } : t
        );

        const notif: CafeNotification = {
          id: `notif-paid-${Date.now()}-${orderId}`,
          type: 'payment_success',
          title: `💰 Pembayaran Berhasil: Meja #${order.tableNumber}`,
          message: `Pesanan ${order.orderNumber} (Rp ${paidOrder.total.toLocaleString('id-ID')}) lunas via ${method?.toUpperCase()}. Meja kini kosong.`,
          tableNumber: order.tableNumber,
          orderId,
          orderNumber: order.orderNumber,
          createdAt: now,
          read: false,
        };
        state.notifications.unshift(notif);
        eventPayload = { orderId, paidOrder };
      }
      eventType = 'payment_completed';
      break;
    }

    case 'update_table_status': {
      const { tableNumber, status: tableStatus, orderId } = payload;
      state.tables = state.tables.map((t) =>
        t.number === tableNumber ? { ...t, status: tableStatus, currentOrderId: orderId } : t
      );
      eventType = 'table_updated';
      eventPayload = { tableNumber, status: tableStatus, orderId };
      break;
    }

    case 'add_table': {
      const { table } = payload;
      if (table && !state.tables.some((t) => t.number === table.number)) {
        state.tables.push(table);
      }
      eventType = 'table_added';
      eventPayload = { table };
      break;
    }

    case 'toggle_menu_stock': {
      const { id } = payload;
      state.menuItems = state.menuItems.map((m) => (m.id === id ? { ...m, inStock: !m.inStock } : m));
      eventType = 'menu_updated';
      eventPayload = { id, menuItems: state.menuItems };
      break;
    }

    case 'add_menu_item': {
      const item = payload.item || payload;
      const newItem: MenuItem = {
        ...item,
        id: item.id || `menu-${Date.now()}`,
      };
      state.menuItems = [newItem, ...state.menuItems.filter((m) => m.id !== newItem.id)];
      eventType = 'menu_updated';
      eventPayload = { item: newItem, menuItems: state.menuItems };
      break;
    }

    case 'update_menu_item': {
      const { id, updates } = payload;
      state.menuItems = state.menuItems.map((m) => (m.id === id ? { ...m, ...updates } : m));
      eventType = 'menu_updated';
      eventPayload = { id, updates, menuItems: state.menuItems };
      break;
    }

    case 'delete_menu_item': {
      const { id } = payload;
      state.menuItems = state.menuItems.filter((m) => m.id !== id);
      eventType = 'menu_updated';
      eventPayload = { id, menuItems: state.menuItems };
      break;
    }

    case 'update_inventory_stock': {
      const { id, newStock } = payload;
      state.inventory = state.inventory.map((inv) =>
        inv.id === id
          ? { ...inv, stockQuantity: Math.max(0, newStock), lastRestocked: new Date().toISOString().split('T')[0] }
          : inv
      );
      eventType = 'inventory_updated';
      eventPayload = { id, newStock, inventory: state.inventory };
      break;
    }

    case 'add_inventory_item': {
      const item = payload.item || payload;
      const newInv: InventoryItem = {
        ...item,
        id: item.id || `inv-${Date.now()}`,
        lastRestocked: item.lastRestocked || new Date().toISOString().split('T')[0],
      };
      state.inventory = [newInv, ...state.inventory.filter((i) => i.id !== newInv.id)];
      eventType = 'inventory_updated';
      eventPayload = { item: newInv, inventory: state.inventory };
      break;
    }

    case 'delete_inventory_item': {
      const { id } = payload;
      state.inventory = state.inventory.filter((inv) => inv.id !== id);
      eventType = 'inventory_updated';
      eventPayload = { id, inventory: state.inventory };
      break;
    }

    case 'add_user': {
      const user = payload.user || payload;
      const newUser: UserAccount = {
        ...user,
        id: user.id || `usr-${Date.now()}`,
      };
      state.users = [...state.users.filter((u) => u.id !== newUser.id), newUser];
      eventType = 'users_updated';
      eventPayload = { user: newUser, users: state.users };
      break;
    }

    case 'update_user': {
      const { id, updates } = payload;
      state.users = state.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
      eventType = 'users_updated';
      eventPayload = { id, updates, users: state.users };
      break;
    }

    case 'delete_user': {
      const { id } = payload;
      state.users = state.users.filter((u) => u.id !== id);
      eventType = 'users_updated';
      eventPayload = { id, users: state.users };
      break;
    }

    case 'add_expense': {
      const expense = payload.expense || payload;
      const newExp: OperationalExpense = {
        ...expense,
        id: expense.id || `exp-${Date.now()}`,
      };
      state.expenses = [newExp, ...state.expenses.filter((e) => e.id !== newExp.id)];
      eventType = 'expenses_updated';
      eventPayload = { expense: newExp, expenses: state.expenses };
      break;
    }

    case 'update_expense': {
      const { id, updates } = payload;
      state.expenses = state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e));
      eventType = 'expenses_updated';
      eventPayload = { id, updates, expenses: state.expenses };
      break;
    }

    case 'delete_expense': {
      const { id } = payload;
      state.expenses = state.expenses.filter((e) => e.id !== id);
      eventType = 'expenses_updated';
      eventPayload = { id, expenses: state.expenses };
      break;
    }

    case 'delete_completed_order': {
      const { orderId } = payload;
      state.completedOrders = state.completedOrders.filter((o) => o.id !== orderId);
      if (!state.deletedOrderIds.includes(orderId)) {
        state.deletedOrderIds.push(orderId);
      }
      eventType = 'completed_order_deleted';
      eventPayload = { orderId };
      break;
    }

    case 'update_completed_order': {
      const { orderId, updates } = payload;
      state.completedOrders = state.completedOrders.map((o) =>
        o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
      );
      eventType = 'completed_order_updated';
      break;
    }

    case 'mark_notification_read': {
      const { id } = payload;
      state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      eventType = 'notifications_updated';
      break;
    }

    case 'mark_all_notifications_read': {
      state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
      eventType = 'notifications_updated';
      break;
    }

    case 'clear_notifications': {
      state.notifications = [];
      eventType = 'notifications_updated';
      break;
    }

    case 'clear_all_active_transactions': {
      const nowIso = new Date().toISOString();
      const newlyCompleted: Order[] = state.activeOrders.map((o) => ({
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
      state.completedOrders = [...newlyCompleted, ...state.completedOrders];
      state.activeOrders = [];
      state.tables = state.tables.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
      eventType = 'active_transactions_cleared';
      break;
    }

    case 'delete_all_orders': {
      state.activeOrders = [];
      state.completedOrders = [];
      state.notifications = [];
      state.deletedOrderIds = [];
      state.tables = state.tables.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
      eventType = 'all_orders_deleted';
      break;
    }

    case 'clear_all_expenses': {
      state.expenses = [];
      eventType = 'expenses_updated';
      break;
    }

    case 'clear_all_inventory': {
      state.inventory = [];
      eventType = 'inventory_updated';
      break;
    }

    case 'clear_all_operational_data': {
      state.activeOrders = [];
      state.completedOrders = [];
      state.notifications = [];
      state.deletedOrderIds = [];
      state.expenses = [];
      state.inventory = [];
      state.tables = state.tables.map((t) => ({ ...t, status: 'available' as const, currentOrderId: undefined }));
      eventType = 'operational_data_cleared';
      break;
    }

    case 'reset_data': {
      const fresh = getInitialState();
      Object.assign(state, fresh);
      eventType = 'data_reset';
      break;
    }

    case 'full_sync_state': {
      if (payload?.state) {
        Object.assign(state, payload.state);
        eventType = 'state_synced';
      }
      break;
    }

    default:
      console.warn('[Server] Unknown action:', action);
  }

  state.version = (state.version || 0) + 1;
  scheduleSave(state);

  // Broadcast to all clients with full state snapshot
  broadcast({
    type: eventType,
    payload: eventPayload,
    state,
    version: state.version,
    sourceClientId: clientId,
  });

  return res.json({ success: true, version: state.version, state });
});

// Setup dev server or static file serving
const isProd = process.env.NODE_ENV === 'production';
const distPath = path.resolve(process.cwd(), 'dist');

async function startServer() {
  if (!isProd) {
    // Mount Vite dev server middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Mounted Vite dev middleware in development mode');
  } else {
    // Serve production static build
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build not found. Run npm run build.');
      }
    });
    console.log('[Server] Serving production static files from', distPath);
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] NADIRA Café server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
