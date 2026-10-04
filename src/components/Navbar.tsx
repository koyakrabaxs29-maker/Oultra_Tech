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
      icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
      description: 'Order Baru, Add Order, & Manajemen 30 Meja Kafe',
    },
    {
      role: 'barista',
      shortLabel: 'Barista',
      fullLabel: 'Barista (Bar)',
      icon: <Coffee className="w-3.5 h-3.5" />,
      badge: pendingDrinksCount,
      description: 'Bar Display System & Antrean Minuman Kopi & Non-Kopi',
    },
    {
      role: 'chef',
      shortLabel: 'Chef',
      fullLabel: 'Chef (Dapur)',
      icon: <ChefHat className="w-3.5 h-3.5" />,
      badge: pendingFoodCount,
      description: 'Kitchen Display System & Antrean Masak Makanan',
    },
    {
      role: 'cashier',
      shortLabel: 'Kasir',
      fullLabel: 'Kasir POS',
      icon: <ReceiptText className="w-3.5 h-3.5" />,
      badge: unpaidCount,
      description: 'Billing, Cash/QRIS/Bank, & Cetak Struk',
    },
    {
      role: 'owner',
      shortLabel: 'Owner',
      fullLabel: 'Owner / CEO',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      description: 'Laporan Omset, CRUD Menu, Stok & User',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#25180E] text-[#F5EBE1] border-b border-[#3D2817] shadow-md">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between min-h-[44px] sm:min-h-[64px] py-1 sm:py-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-[#3F2B1B] flex items-center justify-center shadow-inner border border-[#D4A373]/30 shrink-0">
              <div className="hidden sm:block">
                <NadiraLogo size={26} color="#FFF5EA" />
              </div>
              <div className="sm:hidden">
                <NadiraLogo size={18} color="#FFF5EA" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm sm:text-xl font-bold tracking-tight text-[#F7E6D4]">
                  NADIRA
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-[#3F2B1B] text-[#D4A373] border border-[#5A3E26] font-medium tracking-wider uppercase whitespace-nowrap">
                  Café & Resto
                </span>
              </div>
              <p className="text-[10px] text-[#B89F88] hidden md:block leading-tight">
                Karimun, Kepulauan Riau
              </p>
            </div>
          </div>

          {/* Right Action Section */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live Clock Widget */}
            <div className="hidden sm:flex">
              <LiveClockWidget theme="dark" showSeconds={false} />
            </div>

            {/* Cloud Sync Status Indicator */}
            <button
              onClick={triggerManualSync}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg bg-[#2B1B0F] border border-[#3D2817] hover:border-[#6E421B] text-[10px] transition-all cursor-pointer group"
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
              <span className="text-[10px] font-medium hidden xl:inline text-stone-300 group-hover:text-white">
                {syncStatus === 'connected'
                  ? `${connectedDevicesCount} Live`
                  : syncStatus === 'connecting' || syncStatus === 'reconnecting'
                  ? 'Koneksi...'
                  : 'Offline'}
              </span>
            </button>

            {/* Audio Toggle Button */}
            <button
              id="btn-sound-toggle"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg border transition-all cursor-pointer ${
                isSoundEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                  : 'bg-[#2B1B0F] text-stone-400 border-[#3D2817] hover:text-stone-200'
              }`}
              title={isSoundEnabled ? 'Suara Bel Notifikasi: Aktif' : 'Suara Bel Notifikasi: Senyap'}
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Notification Bell with Badge */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className={`relative p-1.5 sm:p-2 rounded-md sm:rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                delayedOrdersCount > 0
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-amber-900/40 ring-1 ring-amber-400'
                  : unreadNotificationsCount > 0
                  ? 'bg-[#3F2B1B] text-[#F3D7B5] border-[#8C5223]'
                  : 'bg-[#2B1B0F] text-[#B89F88] border-[#3D2817] hover:text-white'
              }`}
              title="Pusat Notifikasi & Peringatan Dapur"
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
                <span className="text-[9px] font-bold bg-emerald-500 text-black px-1 py-0.2 rounded-full hidden sm:inline">
                  {readyItemsCount}
                </span>
              )}

              {delayedOrdersCount > 0 && (
                <span className="text-[9px] font-black bg-red-500 text-white px-1 py-0.2 rounded-full animate-pulse flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">&gt;15m</span>
                </span>
              )}
            </button>

            {/* User Profile / Status Login Button */}
            {currentUser ? (
              <div 
                id="user-profile-login-btn"
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg bg-[#3F2B1B] border border-[#5A3E26] text-[11px] font-semibold text-[#F7E6D4] shadow-sm"
                title={`Akun Login: ${currentUser.name} (${currentUser.role})`}
              >
                <span className="text-xs">{currentUser.avatar}</span>
                <span className="text-white font-bold truncate max-w-[50px] sm:max-w-[80px]">{currentUser.name.split(' ')[0]}</span>
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-1 hover:text-[#FFA000] text-[#D4A373] transition-colors cursor-pointer hidden xs:inline"
                  title="Ganti PIN"
                >
                  <Key className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    showToast("Anda telah keluar dari sistem.");
                  }}
                  className="p-1 hover:text-rose-400 transition-colors cursor-pointer text-rose-300"
                  title="Keluar"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentUser(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-md sm:rounded-lg bg-[#7D4F27] hover:bg-[#633C1B] text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                title="Login Akun Staf"
              >
                <LogIn className="w-3 h-3" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Navigation Switcher Bar (Ultra-Compact on Mobile) */}
      <div className="bg-[#1C120A] border-t border-[#362112] px-2 sm:px-3 py-1 sm:py-1.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-1.5 min-w-max">
          {roleConfigs.map((cfg) => {
            const isActive = activeRole === cfg.role;
            const isOwner = currentUser?.role === 'owner';
            const canAccess = isOwner || currentUser?.role === cfg.role;

            return (
              <button
                key={cfg.role}
                id={`role-tab-${cfg.role}`}
                onClick={() => {
                  if (canAccess) {
                    setActiveRole(cfg.role);
                  } else {
                    showToast(`Akses Dibatasi! Hanya Owner yang dapat berpindah ke halaman ${cfg.fullLabel}.`);
                  }
                }}
                className={`relative flex items-center gap-1.5 min-h-[30px] sm:min-h-[36px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold sm:font-bold transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[#7D4F27] text-white shadow-sm shadow-[#2C1D11]/50 border border-[#A8713D]'
                    : !canAccess
                    ? 'bg-[#1F140C] text-[#5A4535] border-[#291A0F] cursor-not-allowed opacity-50'
                    : 'bg-[#2B1B0F] text-[#C4AC97] hover:bg-[#382314] hover:text-[#EFE2D4] border border-[#3D2817]'
                }`}
                title={!canAccess ? `Akses terkunci untuk akun Anda` : `Pindah ke halaman ${cfg.fullLabel}`}
              >
                <span className="shrink-0">{cfg.icon}</span>
                <span className="sm:hidden">{cfg.shortLabel}</span>
                <span className="hidden sm:inline">{cfg.fullLabel}</span>
                {!canAccess && <Lock className="w-3 h-3 text-[#705642]" />}
                {canAccess && typeof cfg.badge === 'number' && cfg.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black animate-pulse">
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
