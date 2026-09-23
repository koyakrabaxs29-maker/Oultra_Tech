import React from 'react';
import { useCafe } from '../context/CafeContext';
import { UserRole } from '../types';
import { 
  Coffee, 
  UtensilsCrossed, 
  ReceiptText, 
  ChefHat, 
  ShieldCheck, 
  RotateCcw,
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  onOpenGuide?: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { 
    activeRole, 
    setActiveRole, 
    activeOrders, 
    notifications,
    unreadNotificationsCount,
    isSoundEnabled,
    setIsSoundEnabled,
    resetToDefaultData,
    syncStatus,
    syncBrokerName,
    connectedDevicesCount,
    triggerManualSync
  } = useCafe();

  const pendingCookingCount = activeOrders.filter(
    (o) => o.status === 'pending' || o.status === 'cooking'
  ).length;

  const unpaidCount = activeOrders.filter(
    (o) => o.paymentStatus === 'unpaid'
  ).length;

  const delayedOrdersCount = notifications.filter(
    (n) => !n.read && (n.type === 'order_delay_warning' || n.type === 'order_delay_critical')
  ).length;

  const readyItemsCount = notifications.filter(
    (n) => !n.read && (n.type === 'item_ready' || n.type === 'order_ready')
  ).length;

  const roleConfigs: {
    role: UserRole;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    description: string;
  }[] = [
    {
      role: 'waitress',
      label: 'Waitress (Floor Order)',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      description: 'Order Baru, Add Order, & Manajemen 30 Meja Kafe',
    },
    {
      role: 'chef',
      label: 'Chef & Barista (KDS)',
      icon: <ChefHat className="w-4 h-4" />,
      badge: pendingCookingCount,
      description: 'Kitchen Display System & Antrean Masak',
    },
    {
      role: 'cashier',
      label: 'Kasir POS',
      icon: <ReceiptText className="w-4 h-4" />,
      badge: unpaidCount,
      description: 'Billing, Cash/QRIS/Bank, & Cetak Struk',
    },
    {
      role: 'owner',
      label: 'Owner / CEO',
      icon: <ShieldCheck className="w-4 h-4" />,
      description: 'Laporan Omset, CRUD Menu, Stok & User',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#25180E] text-[#F5EBE1] border-b border-[#3D2817] shadow-lg">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#A8713D] to-[#6E421B] flex items-center justify-center shadow-inner border border-[#C58E55]/30">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFF5EA]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F7E6D4]">
                  NADIRA
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#3F2B1B] text-[#D4A373] border border-[#5A3E26] font-medium tracking-wider uppercase">
                  Café & Resto
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#B89F88] hidden sm:block">
                Specialty Coffee & Modern Dining • Staff POS & Kitchen Display System
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Live Cloud Multi-Device Indicator */}
            <button
              onClick={triggerManualSync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2B1B0F] border border-[#3D2817] hover:border-[#6E421B] text-xs transition-all cursor-pointer group"
              title={`Status Cloud Sync: ${syncStatus === 'connected' ? 'Terhubung (' + syncBrokerName + ')' : syncStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}. Klik untuk sinkronisasi manual.`}
            >
              <span className="relative flex h-2 w-2">
                {syncStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-500'
                      : syncStatus === 'connecting' || syncStatus === 'reconnecting'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span className="text-[11px] font-medium hidden lg:inline text-stone-300 group-hover:text-white">
                {syncStatus === 'connected'
                  ? `${connectedDevicesCount} Perangkat Live`
                  : syncStatus === 'connecting' || syncStatus === 'reconnecting'
                  ? 'Koneksi Cloud...'
                  : 'Mode Lokal'}
              </span>
            </button>

            {/* Audio Toggle Button */}
            <button
              id="btn-sound-toggle"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isSoundEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                  : 'bg-[#2B1B0F] text-stone-400 border-[#3D2817] hover:text-stone-200'
              }`}
              title={isSoundEnabled ? 'Suara Bel Notifikasi: Aktif' : 'Suara Bel Notifikasi: Senyap'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell with Badge */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className={`relative p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                delayedOrdersCount > 0
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-amber-900/40 ring-1 ring-amber-400'
                  : unreadNotificationsCount > 0
                  ? 'bg-[#3F2B1B] text-[#F3D7B5] border-[#8C5223]'
                  : 'bg-[#2B1B0F] text-[#B89F88] border-[#3D2817] hover:text-white'
              }`}
              title="Buka Pusat Notifikasi & Peringatan Dapur"
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </div>

              {readyItemsCount > 0 && (
                <span className="text-[10px] font-bold bg-emerald-500 text-black px-1.5 py-0.2 rounded-full hidden sm:inline">
                  {readyItemsCount} Siap
                </span>
              )}

              {delayedOrdersCount > 0 && (
                <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.2 rounded-full animate-pulse flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">&gt;15m</span>
                </span>
              )}
            </button>

            <button
              id="btn-reset-demo"
              onClick={() => {
                if (window.confirm('Reset semua data transaksi, stok, dan menu ke kondisi awal NADIRA Café?')) {
                  resetToDefaultData();
                }
              }}
              className="p-1.5 sm:p-2 text-xs rounded-lg text-[#B89F88] hover:text-[#FFF5EA] hover:bg-[#3D2817] transition-all cursor-pointer"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Role Navigation Switcher Bar */}
      <div className="bg-[#1C120A] border-t border-[#362112] px-3 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 min-w-max">
          <span className="text-[11px] uppercase tracking-wider text-[#8A715C] font-bold px-2 flex items-center gap-1">
            <Bell className="w-3 h-3 text-[#A8713D]" /> Staf Aktif:
          </span>

          {roleConfigs.map((cfg) => {
            const isActive = activeRole === cfg.role;
            return (
              <button
                key={cfg.role}
                id={`role-tab-${cfg.role}`}
                onClick={() => setActiveRole(cfg.role)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7D4F27] text-white shadow-md shadow-[#2C1D11]/50 border border-[#A8713D]'
                    : 'bg-[#2B1B0F] text-[#C4AC97] hover:bg-[#382314] hover:text-[#EFE2D4] border border-[#3D2817]'
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {typeof cfg.badge === 'number' && cfg.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse">
                    {cfg.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
