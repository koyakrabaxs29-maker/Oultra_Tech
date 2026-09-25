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
      role: 'barista',
      label: 'Barista (Bar)',
      icon: <Coffee className="w-4 h-4" />,
      badge: pendingDrinksCount,
      description: 'Bar Display System & Antrean Minuman Kopi & Non-Kopi',
    },
    {
      role: 'chef',
      label: 'Chef (Dapur)',
      icon: <ChefHat className="w-4 h-4" />,
      badge: pendingFoodCount,
      description: 'Kitchen Display System & Antrean Masak Makanan',
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
        <div className="flex items-center justify-between min-h-[68px] sm:min-h-[82px] py-2 sm:py-2.5">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#3F2B1B] flex items-center justify-center shadow-inner border border-[#D4A373]/30 shrink-0">
              <NadiraLogo size={32} color="#FFF5EA" />
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
                Jalan Lubuk Semut Kecamatan Karimun Kepulauan Riau
              </p>
            </div>
          </div>

          {/* Right Action Section: Action Buttons & Login Profile on Top, Live Clock below Login Button */}
          <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
            {/* Top row: Live sync, audio, notifications, and User Login Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
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

              {/* Tombol Profil / Status Login */}
              {currentUser ? (
                <div 
                  id="user-profile-login-btn"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-[#3F2B1B] border border-[#5A3E26] text-xs font-semibold text-[#F7E6D4] shadow-sm"
                  title={`Akun Login: ${currentUser.name} (${currentUser.role})`}
                >
                  <span className="text-sm filter drop-shadow-sm">{currentUser.avatar}</span>
                  <span className="hidden md:inline text-white max-w-[100px] truncate font-bold">{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-[#D4A373] bg-[#2E1F13] px-1.5 py-0.5 rounded capitalize hidden sm:inline">{currentUser.role === 'barista' ? 'Barista' : currentUser.role === 'chef' ? 'Chef' : currentUser.role}</span>
                  <div className="h-4 w-px bg-[#5A3E26]"></div>
                  <button 
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2E1F13] hover:bg-[#FFA000]/20 hover:text-[#FFA000] text-[#D4A373] text-[11px] font-bold transition-all cursor-pointer border border-[#5A3E26]"
                    title="Ganti PIN / Sandi Akun"
                  >
                    <Key className="w-3 h-3" />
                    <span>Ganti PIN</span>
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentUser(null);
                      showToast("Anda telah keluar dari sistem.");
                    }}
                    className="p-1 hover:text-rose-400 transition-colors cursor-pointer text-rose-300"
                    title="Keluar Sesi"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentUser(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  title="Login Akun Staf"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login Staf</span>
                </button>
              )}
            </div>

            {/* Dibawah tombol login: Fitur Hari, Tanggal dan Waktu Real-Time */}
            <LiveClockWidget theme="dark" />
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
                    showToast(`Akses Dibatasi! Hanya Owner yang dapat berpindah ke halaman ${cfg.label}.`);
                  }
                }}
                className={`relative flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[#7D4F27] text-white shadow-md shadow-[#2C1D11]/50 border border-[#A8713D]'
                    : !canAccess
                    ? 'bg-[#1F140C] text-[#5A4535] border-[#291A0F] cursor-not-allowed opacity-50'
                    : 'bg-[#2B1B0F] text-[#C4AC97] hover:bg-[#382314] hover:text-[#EFE2D4] border border-[#3D2817]'
                }`}
                title={!canAccess ? `Akses terkunci untuk akun Anda` : `Pindah ke halaman ${cfg.label}`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {!canAccess && <Lock className="w-3 h-3 text-[#705642]" />}
                {canAccess && typeof cfg.badge === 'number' && cfg.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse">
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
