import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { soundAlerts } from '../utils/soundAlerts';
import { formatShortTime } from '../utils/formatters';
import {
  Bell,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Utensils,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles,
  Flame,
  ChefHat,
  PlusCircle
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    isSoundEnabled,
    setIsSoundEnabled,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    markItemServed,
    setActiveRole,
  } = useCafe();

  const [activeTab, setActiveTab] = useState<'all' | 'additions' | 'ready' | 'delay' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'additions') return n.type === 'order_items_added' || n.type === 'new_order';
    if (activeTab === 'ready') return n.type === 'item_ready' || n.type === 'order_ready';
    if (activeTab === 'delay') return n.type === 'order_delay_warning' || n.type === 'order_delay_critical';
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const additionsCount = notifications.filter((n) => n.type === 'order_items_added' || n.type === 'new_order').length;
  const readyCount = notifications.filter((n) => n.type === 'item_ready' || n.type === 'order_ready').length;
  const delayCount = notifications.filter((n) => n.type === 'order_delay_warning' || n.type === 'order_delay_critical').length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#24170E] text-[#F7EFE9] w-full max-w-2xl rounded-2xl border border-[#4D311C] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#3D2513] flex items-center justify-between bg-[#1C120A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C5223] to-[#523013] flex items-center justify-center text-[#F7E6D4] border border-[#A8713D]/40">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-[#F7E6D4]">
                  Pemberitahuan & Peringatan Dapur
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black animate-pulse">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-xs text-[#C4AD99]">
                Live feed status makanan siap saji, panggilan bel waitress, dan pengingat durasi 15-20 menit.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#C4AD99] hover:text-white hover:bg-[#382314] transition-all cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio controls & Quick Actions */}
        <div className="px-4 py-2.5 bg-[#2B1B0F] border-b border-[#3D2513] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Sound Toggle & Test */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                isSoundEnabled
                  ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}
              title="Aktifkan atau matikan bel suara notifikasi"
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isSoundEnabled ? 'Bel Suara: Aktif' : 'Bel Suara: Bisu'}</span>
            </button>

            {isSoundEnabled && (
              <>
                <button
                  onClick={() => soundAlerts.playReadyChime()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3D2513] hover:bg-[#523219] text-[#D4A373] text-[11px] font-medium border border-[#5A381F] transition-all cursor-pointer"
                  title="Cek suara bel siap saji"
                >
                  Tes Bel Siap 🔔
                </button>
                <button
                  onClick={() => soundAlerts.playAdditionalItemChime()}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 text-[11px] font-bold border border-amber-500/50 transition-all cursor-pointer flex items-center gap-1"
                  title="Cek suara bel koki untuk tambahan pesanan"
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Tes Bel Tambahan 🔥</span>
                </button>
              </>
            )}
          </div>

          {/* Read / Clear Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3D2513] hover:bg-[#523219] text-[#F3D7B5] text-xs font-semibold border border-[#5A381F] transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-red-300 hover:bg-red-950/40 text-xs transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2 border-b border-[#3D2513] bg-[#20140B] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#7D4F27] text-white shadow-xs'
                : 'text-[#C4AD99] hover:text-white'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('additions')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'additions'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Tambahan & Baru ({additionsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ready'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Siap Saji ({readyCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('delay')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'delay'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pengingat 15-20m ({delayCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-[#7D4F27] text-white shadow-xs'
                : 'text-[#C4AD99] hover:text-white'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">Tidak ada notifikasi di kategori ini</p>
              <p className="text-xs text-stone-500">
                Pemberitahuan otomatis akan muncul ketika pesanan baru/tambahan masuk, koki menandai pesanan siap saji, atau saat mendekati 15-20 menit.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isAddition = notif.type === 'order_items_added';
              const isNewOrder = notif.type === 'new_order';
              const isReady = notif.type === 'item_ready' || notif.type === 'order_ready';
              const isWarning = notif.type === 'order_delay_warning';
              const isCritical = notif.type === 'order_delay_critical';

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markNotificationRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !notif.read
                      ? isAddition
                        ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/40'
                        : isNewOrder
                        ? 'bg-[#2A1B0E] border-amber-500/50 ring-1 ring-amber-500/30'
                        : isCritical
                        ? 'bg-red-950/40 border-red-500/50 ring-1 ring-red-500/30'
                        : isWarning
                        ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'bg-[#1C120A] border-[#3D2513] opacity-90'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isAddition
                          ? 'bg-amber-500 text-black shadow-md'
                          : isNewOrder
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          : isCritical
                          ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                          : isWarning
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {isAddition ? (
                        <Flame className="w-5 h-5 text-black animate-pulse" />
                      ) : isNewOrder ? (
                        <PlusCircle className="w-5 h-5 text-amber-400" />
                      ) : isCritical ? (
                        <AlertOctagon className="w-5 h-5 animate-pulse text-red-400" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isAddition
                              ? 'bg-amber-400 text-black'
                              : isNewOrder
                              ? 'bg-amber-600 text-white'
                              : isCritical
                              ? 'bg-red-500 text-white'
                              : isWarning
                              ? 'bg-amber-500 text-black'
                              : 'bg-emerald-500 text-black'
                          }`}
                        >
                          {isAddition
                            ? '🔥 TAMBAHAN MENU'
                            : isNewOrder
                            ? '✨ PESANAN BARU'
                            : isCritical
                            ? '🚨 > 20 Menit'
                            : isWarning
                            ? '⚠️ Peringatan 15m'
                            : '🍽️ Siap Saji'}
                        </span>

                        {notif.tableNumber && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#3D2513] text-[#F7E6D4] border border-[#523219]">
                            Meja #{notif.tableNumber}
                          </span>
                        )}

                        {notif.station && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                            Stasiun: {notif.station.toUpperCase()}
                          </span>
                        )}

                        <span className="text-[10px] text-stone-400">
                          {formatShortTime(notif.createdAt)}
                        </span>

                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-[#F7EFE9]">{notif.title}</h4>
                      <p className="text-xs text-[#C4AD99] leading-relaxed">{notif.message}</p>
                    </div>
                  </div>

                  {/* Notification Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {(isAddition || isNewOrder) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRole('chef');
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Buka KDS Dapur</span>
                      </button>
                    )}
                    {isReady && notif.orderId && notif.itemId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markItemServed(notif.orderId!, notif.itemId!);
                        }}
                        disabled={notif.served}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          notif.served
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 opacity-80 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{notif.served ? 'Telah Diantar' : 'Antar ke Meja'}</span>
                      </button>
                    )}

                    {(isWarning || isCritical) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRole('chef');
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Cek di KDS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1C120A] border-t border-[#3D2513] text-center text-[11px] text-[#A88B74]">
          Sistem otomatis memantau durasi antrean: 15 menit (Peringatan Awal) dan 20 menit (Keterlambatan Kritis).
        </div>
      </div>
    </div>
  );
};
