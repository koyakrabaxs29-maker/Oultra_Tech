import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { UserRole } from '../types';
import { 
  Coffee, 
  UtensilsCrossed, 
  ReceiptText, 
  ChefHat, 
  ShieldCheck, 
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
  Key,
  LogOut,
  Lock,
  LogIn
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { NadiraLogo } from './NadiraLogo';
import { LiveClockWidget } from './LiveClockWidget';

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { 
    activeRole, 
    setActiveRole, 
    currentUser,
    setCurrentUser,
    activeOrders, 
    notifications,
    unreadNotificationsCount,
    isSoundEnabled,
    setIsSoundEnabled,
    syncStatus,
    syncBrokerName,
    connectedDevicesCount,
    triggerManualSync,
    showToast
  } = useCafe();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const pendingFoodCount = activeOrders.filter((o) =>
    (o.status === 'pending' || o.status === 'cooking') &&
    o.items.some((it) => (it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat') && it.status !== 'ready')
  ).length;

  const pendingDrinksCount = activeOrders.filter((o) =>
    (o.status === 'pending' || o.status === 'cooking') &&
    o.items.some((it) => (it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi') && it.status !== 'ready')
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
    shortLabel: string;
    fullLabel: string;
    icon: React.ReactNode;
    badge?: number;
    description: string;
  }[] = [
    {
      role: 'waitress',
      shortLabel: 'Waitress',
      fullLabel: 'Waitress (Order)',
      icon: <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />,
      description: 'Order Baru, Add Order, & Manajemen 30 Meja Kafe',
    },
    {
      role: 'barista',
      shortLabel: 'Barista',
      fullLabel: 'Barista (Bar)',
      icon: <Coffee className="w-3.5 h-3.5 shrink-0" />,
      badge: pendingDrinksCount,
      description: 'Bar Display System & Antrean Minuman Kopi & Non-Kopi',
    },
    {
      role: 'chef',
      shortLabel: 'Chef',
      fullLabel: 'Chef (Dapur)',
      icon: <ChefHat className="w-3.5 h-3.5 shrink-0" />,
      badge: pendingFoodCount,
      description: 'Kitchen Display System & Antrean Masak Makanan',
    },
    {
      role: 'cashier',
      shortLabel: 'Kasir',
      fullLabel: 'Kasir POS',
      icon: <ReceiptText className="w-3.5 h-3.5 shrink-0" />,
      badge: unpaidCount,
      description: 'Billing, Cash/QRIS/Bank, & Cetak Struk',
    },
    {
      role: 'owner',
      shortLabel: 'Owner',
      fullLabel: 'Owner / CEO',
      icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
      description: 'Laporan Omset, CRUD Menu, Stok & User',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#22150C] text-[#F5EBE1] border-b border-[#382212] shadow-sm select-none">
      {/* Main Ultra-Compact Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-10 sm:h-12 gap-2">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#382415] flex items-center justify-center border border-[#D4A373]/30 shrink-0">
              <NadiraLogo size={18} color="#FFF5EA" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm sm:text-base font-bold tracking-tight text-[#F7E6D4]">
                NADIRA
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-[#382415] text-[#D4A373] border border-[#52351E] font-medium uppercase tracking-wider whitespace-nowrap">
                Café & Resto
              </span>
            </div>
          </div>

          {/* Center (Desktop/Tablet): Integrated Role Tabs */}
          <div className="hidden lg:flex items-center gap-1">
            {roleConfigs.map((cfg) => {
              const isActive = activeRole === cfg.role;
              const isOwner = currentUser?.role === 'owner';
              const canAccess = isOwner || currentUser?.role === cfg.role;

              return (
                <button
                  key={cfg.role}
                  id={`role-tab-desktop-${cfg.role}`}
                  onClick={() => {
                    if (canAccess) {
                      setActiveRole(cfg.role);
                    } else {
                      showToast(`Akses Dibatasi! Hanya Owner yang dapat berpindah ke halaman ${cfg.fullLabel}.`);
                    }
                  }}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#7D4F27] text-white shadow-xs border border-[#A8713D]'
                      : !canAccess
                      ? 'bg-[#191008] text-[#554030] border border-transparent cursor-not-allowed opacity-50'
                      : 'bg-[#2D1B0F] text-[#C4AC97] hover:bg-[#3D2515] hover:text-white border border-[#3E2614]'
                  }`}
                  title={!canAccess ? `Akses terkunci` : `Pindah ke ${cfg.fullLabel}`}
                >
                  {cfg.icon}
                  <span>{cfg.shortLabel}</span>
                  {!canAccess && <Lock className="w-2.5 h-2.5 text-[#705642]" />}
                  {canAccess && typeof cfg.badge === 'number' && cfg.badge > 0 && (
                    <span className="px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black">
                      {cfg.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Actions & User Session */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Live Clock Widget (Hidden on small mobile) */}
            <div className="hidden xl:flex">
              <LiveClockWidget theme="dark" showSeconds={false} />
            </div>

            {/* Cloud Sync Status */}
            <button
              onClick={triggerManualSync}
              className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-[#2B1B0F] border border-[#3A2210] hover:border-[#6E421B] text-[10px] transition-all cursor-pointer"
              title={`Status Cloud Sync: ${syncStatus === 'connected' ? 'Terhubung (' + syncBrokerName + ')' : syncStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}. Klik untuk sync.`}
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
              <span className="text-[10px] font-medium hidden md:inline text-stone-300">
                {syncStatus === 'connected' ? `${connectedDevicesCount} Live` : 'Offline'}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              id="btn-sound-toggle"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-1 rounded-md border transition-all cursor-pointer ${
                isSoundEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                  : 'bg-[#2B1B0F] text-stone-400 border-[#3A2210] hover:text-stone-200'
              }`}
              title={isSoundEnabled ? 'Suara Bel: Aktif' : 'Suara Bel: Senyap'}
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Notification Bell */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className={`relative p-1 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                delayedOrdersCount > 0
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500 ring-1 ring-amber-400'
                  : unreadNotificationsCount > 0
                  ? 'bg-[#3F2B1B] text-[#F3D7B5] border-[#8C5223]'
                  : 'bg-[#2B1B0F] text-[#B89F88] border-[#3A2210] hover:text-white'
              }`}
              title="Pusat Notifikasi"
            >
              <div className="relative">
                <Bell className="w-3.5 h-3.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </div>

              {readyItemsCount > 0 && (
                <span className="text-[9px] font-bold bg-emerald-500 text-black px-1 rounded-full hidden sm:inline">
                  {readyItemsCount}
                </span>
              )}

              {delayedOrdersCount > 0 && (
                <span className="text-[9px] font-black bg-red-500 text-white px-1 rounded-full animate-pulse flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            {/* User Session */}
            {currentUser ? (
              <div 
                id="user-profile-login-btn"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#382415] border border-[#52351E] text-[11px] font-semibold text-[#F7E6D4]"
                title={`Akun: ${currentUser.name} (${currentUser.role})`}
              >
                <span className="text-xs">{currentUser.avatar}</span>
                <span className="text-white font-bold truncate max-w-[45px] sm:max-w-[70px]">{currentUser.name.split(' ')[0]}</span>
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-0.5 hover:text-[#FFA000] text-[#D4A373] cursor-pointer"
                  title="Ganti PIN"
                >
                  <Key className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    showToast("Anda telah keluar dari sistem.");
                  }}
                  className="p-0.5 hover:text-rose-400 text-rose-300 cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentUser(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7D4F27] hover:bg-[#633C1B] text-white text-[11px] font-bold cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Role Switcher Strip (Ultra-Slim single scroll line) */}
      <div className="lg:hidden bg-[#180E07] border-t border-[#311C0D] px-1.5 py-1 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max justify-start sm:justify-center">
          {roleConfigs.map((cfg) => {
            const isActive = activeRole === cfg.role;
            const isOwner = currentUser?.role === 'owner';
            const canAccess = isOwner || currentUser?.role === cfg.role;

            return (
              <button
                key={cfg.role}
                id={`role-tab-mobile-${cfg.role}`}
                onClick={() => {
                  if (canAccess) {
                    setActiveRole(cfg.role);
                  } else {
                    showToast(`Akses Dibatasi! Hanya Owner yang dapat berpindah ke halaman ${cfg.fullLabel}.`);
                  }
                }}
                className={`relative flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7D4F27] text-white font-bold border border-[#A8713D]'
                    : !canAccess
                    ? 'bg-[#120B05] text-[#554030] border border-transparent opacity-40 cursor-not-allowed'
                    : 'bg-[#25160C] text-[#BFA690] hover:bg-[#331E10] hover:text-white border border-[#3A2210]'
                }`}
              >
                {cfg.icon}
                <span>{cfg.shortLabel}</span>
                {!canAccess && <Lock className="w-2.5 h-2.5 text-[#705642]" />}
                {canAccess && typeof cfg.badge === 'number' && cfg.badge > 0 && (
                  <span className="px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500 text-black">
                    {cfg.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </header>
  );
};
