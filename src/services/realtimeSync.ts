import Paho from 'paho-mqtt';

export type SyncActionType =
  | 'order_created'
  | 'create_order'
  | 'items_added'
  | 'add_items_to_order'
  | 'item_status_updated'
  | 'update_order_item_status'
  | 'order_status_updated'
  | 'update_order_status'
  | 'item_served'
  | 'mark_item_served'
  | 'order_completed'
  | 'mark_order_completed'
  | 'order_cancelled'
  | 'cancel_order'
  | 'payment_processed'
  | 'process_payment'
  | 'table_updated'
  | 'menu_updated'
  | 'inventory_updated'
  | 'expense_updated'
  | 'user_updated'
  | 'data_reset'
  | 'reset_data'
  | 'request_state'
  | 'provide_state'
  | 'device_heartbeat';

export interface SyncMessage {
  type: SyncActionType;
  payload?: any;
  sourceClientId: string;
  sourceDeviceName?: string;
  sourceRole?: string;
  version: number;
  timestamp: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export interface RealtimeSyncListeners {
  onMessage: (msg: SyncMessage) => void;
  onRetainedState: (state: any, version: number) => void;
  onStatusChange: (status: ConnectionStatus, brokerName: string, activePeers: number) => void;
}

const BROKERS = [
  { host: 'broker.emqx.io', port: 8084, path: '/mqtt', name: 'EMQX Cloud' },
  { host: 'broker.hivemq.com', port: 8884, path: '/mqtt', name: 'HiveMQ Cloud' },
];

const BASE_TOPIC = 'nadira_cafe_5a07e09b_v1';
const ACTION_TOPIC = `${BASE_TOPIC}/actions`;
const STATE_TOPIC = `${BASE_TOPIC}/state`;
const PEER_TOPIC = `${BASE_TOPIC}/peers`;

export class RealtimeSyncService {
  private client: Paho.Client | null = null;
  private clientId: string;
  private currentBrokerIndex = 0;
  private listeners: RealtimeSyncListeners | null = null;
  private status: ConnectionStatus = 'disconnected';
  private isConnecting = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private activePeersMap = new Map<string, number>();
  private localRole = 'waitress';

  constructor() {
    // Generate persistent or semi-persistent client id
    let storedId = '';
    try {
      storedId = sessionStorage.getItem('nadira_device_client_id') || '';
    } catch {
      // ignore
    }
    if (!storedId) {
      storedId = `nadira-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
      try {
        sessionStorage.setItem('nadira_device_client_id', storedId);
      } catch {
        // ignore
      }
    }
    this.clientId = storedId;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public setRole(role: string) {
    this.localRole = role;
    this.sendHeartbeat();
  }

  public init(listeners: RealtimeSyncListeners) {
    this.listeners = listeners;
    this.connect();

    // Reconnect on network / tab visibility changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.status === 'disconnected') {
          this.connect();
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (!this.client || !this.client.isConnected()) {
            this.connect();
          } else {
            this.sendHeartbeat();
          }
        }
      });
    }

    // Heartbeat every 10 seconds to discover other active devices (waitress, chef, cashier)
    this.heartbeatTimer = setInterval(() => {
      this.cleanStalePeers();
      this.sendHeartbeat();
    }, 10000);
  }

  private cleanStalePeers() {
    const now = Date.now();
    let changed = false;
    for (const [peerId, lastSeen] of this.activePeersMap.entries()) {
      if (now - lastSeen > 25000) {
        this.activePeersMap.delete(peerId);
        changed = true;
      }
    }
    if (changed && this.listeners) {
      const broker = BROKERS[this.currentBrokerIndex]?.name || 'Cloud';
      this.listeners.onStatusChange(this.status, broker, this.activePeersMap.size + 1);
    }
  }

  private updateStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    const broker = BROKERS[this.currentBrokerIndex]?.name || 'Cloud';
    if (this.listeners) {
      this.listeners.onStatusChange(newStatus, broker, this.activePeersMap.size + 1);
    }
  }

  private connect() {
    if (this.isConnecting) return;
    if (this.client && this.client.isConnected()) return;

    this.isConnecting = true;
    this.updateStatus(this.client ? 'reconnecting' : 'connecting');

    const broker = BROKERS[this.currentBrokerIndex];
    try {
      this.client = new Paho.Client(broker.host, broker.port, broker.path, this.clientId);

      this.client.onConnectionLost = (responseObject) => {
        this.isConnecting = false;
        console.warn('[CloudSync] Connection lost:', responseObject.errorMessage);
        this.updateStatus('reconnecting');
        this.scheduleReconnect();
      };

      this.client.onMessageArrived = (message: Paho.Message) => {
        this.handleIncomingMessage(message);
      };

      this.client.connect({
        useSSL: true,
        timeout: 10,
        keepAliveInterval: 30,
        cleanSession: true,
        onSuccess: () => {
          this.isConnecting = false;
          this.updateStatus('connected');
          console.log(`[CloudSync] Connected to ${broker.name} (${broker.host})`);

          // Subscribe to action topic, state topic and peer topic
          try {
            this.client?.subscribe(ACTION_TOPIC, { qos: 1 });
            this.client?.subscribe(STATE_TOPIC, { qos: 1 });
            this.client?.subscribe(PEER_TOPIC, { qos: 0 });

            // Broadcast request for latest state from online peers
            this.publishPeerMessage('request_state', {});
            this.sendHeartbeat();
          } catch (subErr) {
            console.warn('[CloudSync] Subscription error:', subErr);
          }
        },
        onFailure: (err) => {
          this.isConnecting = false;
          console.warn(`[CloudSync] Failed to connect to ${broker.name}:`, err.errorMessage || err);
          // Try next broker
          this.currentBrokerIndex = (this.currentBrokerIndex + 1) % BROKERS.length;
          this.scheduleReconnect(1500);
        },
      });
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect(2000);
    }
  }

  private scheduleReconnect(delay = 3000) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleIncomingMessage(message: Paho.Message) {
    try {
      const topic = message.destinationName;
      const rawText = message.payloadString;
      if (!rawText) return;

      if (topic === STATE_TOPIC) {
        const statePayload = JSON.parse(rawText);
        if (statePayload && statePayload.state && statePayload.sourceClientId !== this.clientId) {
          if (this.listeners) {
            this.listeners.onRetainedState(statePayload.state, statePayload.version || 1);
          }
        }
        return;
      }

      const syncMsg: SyncMessage = JSON.parse(rawText);
      if (!syncMsg) return;

      // Track active peer devices
      if (syncMsg.sourceClientId && syncMsg.sourceClientId !== this.clientId) {
        this.activePeersMap.set(syncMsg.sourceClientId, Date.now());
        if (this.listeners) {
          const broker = BROKERS[this.currentBrokerIndex]?.name || 'Cloud';
          this.listeners.onStatusChange(this.status, broker, this.activePeersMap.size + 1);
        }
      }

      // Ignore messages sent by this client instance to avoid double action
      if (syncMsg.sourceClientId === this.clientId) {
        return;
      }

      if (this.listeners) {
        this.listeners.onMessage(syncMsg);
      }
    } catch (err) {
      console.error('[CloudSync] Failed to parse message:', err);
    }
  }

  public publishAction(type: SyncMessage['type'], payload: any, version: number) {
    if (!this.client || !this.client.isConnected()) {
      // If disconnected, try to reconnect immediately
      this.connect();
    }

    const messageObj: SyncMessage = {
      type,
      payload,
      sourceClientId: this.clientId,
      sourceRole: this.localRole,
      version,
      timestamp: new Date().toISOString(),
    };

    try {
      const pahoMsg = new Paho.Message(JSON.stringify(messageObj));
      pahoMsg.destinationName = ACTION_TOPIC;
      pahoMsg.qos = 1;
      this.client?.send(pahoMsg);
    } catch (e) {
      console.warn('[CloudSync] Failed to publish action:', e);
    }
  }

  public publishRetainedState(state: any, version: number) {
    if (!this.client || !this.client.isConnected()) return;

    try {
      // Exclude unnecessary heavy logs if any to keep payload crisp & fast
      const snapshot = {
        state: {
          activeOrders: state.activeOrders,
          completedOrders: state.completedOrders ? state.completedOrders.slice(0, 50) : [],
          tables: state.tables,
          menuItems: state.menuItems,
          inventory: state.inventory,
          users: state.users,
          expenses: state.expenses,
          notifications: state.notifications ? state.notifications.slice(0, 30) : [],
        },
        version,
        sourceClientId: this.clientId,
        timestamp: new Date().toISOString(),
      };

      const pahoMsg = new Paho.Message(JSON.stringify(snapshot));
      pahoMsg.destinationName = STATE_TOPIC;
      pahoMsg.retained = true;
      pahoMsg.qos = 1;
      this.client.send(pahoMsg);
    } catch (e) {
      console.warn('[CloudSync] Failed to publish retained state:', e);
    }
  }

  private publishPeerMessage(type: SyncMessage['type'], payload: any) {
    if (!this.client || !this.client.isConnected()) return;
    try {
      const msg: SyncMessage = {
        type,
        payload,
        sourceClientId: this.clientId,
        sourceRole: this.localRole,
        version: 0,
        timestamp: new Date().toISOString(),
      };
      const pahoMsg = new Paho.Message(JSON.stringify(msg));
      pahoMsg.destinationName = PEER_TOPIC;
      pahoMsg.qos = 0;
      this.client.send(pahoMsg);
    } catch {
      // ignore
    }
  }

  private sendHeartbeat() {
    this.publishPeerMessage('device_heartbeat', { role: this.localRole });
  }

  public getConnectedDevicesCount(): number {
    return this.activePeersMap.size + 1;
  }

  public destroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    try {
      if (this.client && this.client.isConnected()) {
        this.client.disconnect();
      }
    } catch {
      // ignore
    }
  }
}

export const cloudSync = new RealtimeSyncService();
