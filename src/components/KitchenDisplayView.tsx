import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { OrderStatus } from '../types';
import { getElapsedMinutes, formatShortTime } from '../utils/formatters';
import { soundAlerts } from '../utils/soundAlerts';
import { 
  ChefHat, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Utensils, 
  Check, 
  CheckCheck,
  Volume2, 
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export interface KitchenDisplayViewProps {
  defaultStation?: 'kitchen' | 'bar' | 'all';
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({ defaultStation }) => {
  const { 
    activeOrders, 
    activeRole,
    currentUser,
    updateOrderStatus, 
    updateOrderItemStatus,
    markStationItemsReady,
    showToast,
    addNotification,
    acknowledgeOrderAdditions
  } = useCafe();

  const initialStation = defaultStation || (activeRole === 'barista' ? 'bar' : activeRole === 'chef' ? 'kitchen' : 'all');
  const [stationFilter, setStationFilter] = useState<'all' | 'additions' | 'bar' | 'kitchen' | 'delayed'>(initialStation);

  // Synchronize when activeRole or defaultStation changes
  React.useEffect(() => {
    if (defaultStation) {
      setStationFilter(defaultStation);
    } else if (activeRole === 'barista') {
      setStationFilter('bar');
    } else if (activeRole === 'chef') {
      setStationFilter('kitchen');
    }
  }, [defaultStation, activeRole]);

  // Filter orders that are active in kitchen (pending, cooking, ready)
  const kitchenTickets = activeOrders.filter(
    (o) => o.status === 'pending' || o.status === 'cooking' || o.status === 'ready'
  );

  const barTicketsCount = kitchenTickets.filter((o) =>
    o.items.some((it) => it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi')
  ).length;

  const kitchenOnlyTicketsCount = kitchenTickets.filter((o) =>
    o.items.some((it) => it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat')
  ).length;

  // Orders that have additional items recently requested by waitress
  const ordersWithAdditions = kitchenTickets.filter(
    (o) => o.hasNewAdditions || o.items.some((it) => it.isAdditional && it.status !== 'ready')
  );

  // Orders exceeding 15 minutes that are not fully paid/ready
  const delayedOrders = kitchenTickets.filter((o) => {
    const elapsed = getElapsedMinutes(o.createdAt);
    return elapsed >= 15 && o.status !== 'ready';
  });

  const handleNotifyWaitress = (orderNumber: string, tableNumber: number, customMsg?: string) => {
    soundAlerts.playReadyChime();
    addNotification({
      type: 'call_waiter',
      title: `🔔 Panggilan Waitress: Meja #${tableNumber}`,
      message: customMsg || `Pesanan ${orderNumber} di Meja #${tableNumber} siap diambil dan disajikan!`,
      tableNumber,
      orderNumber,
    });
    showToast(`Panggilan Bel: Pesanan ${orderNumber} di Meja #${tableNumber} siap diantar!`);
  };

  // Filter based on active tab
  const displayedTickets = kitchenTickets.filter((order) => {
    if (stationFilter === 'additions') {
      return order.hasNewAdditions || order.items.some((it) => it.isAdditional && it.status !== 'ready');
    }
    if (stationFilter === 'delayed') {
      const elapsed = getElapsedMinutes(order.createdAt);
      return elapsed >= 15 && order.status !== 'ready';
    }
    if (stationFilter === 'all') return true;
    return order.items.some((it) => it.station === stationFilter);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Tambahan Pesanan Live Alert Banner for Chef / Kitchen */}
      {ordersWithAdditions.length > 0 && (
        <div className="bg-gradient-to-r from-[#50260B] via-[#75370E] to-[#3B1905] border-2 border-amber-400 rounded-2xl p-4 text-white shadow-xl shadow-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 animate-in fade-in ring-2 ring-amber-400/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Flame className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span>🔔</span>
                  <span>TAMBAHAN PESANAN BARU ({ordersWithAdditions.length} Meja)</span>
                </span>
                <span className="text-xs font-bold text-amber-200">
                  Perlu Segera Dimasak / Diracik!
                </span>
              </div>
              <p className="text-xs text-[#FCEBD9] mt-1">
                Waitress menambahkan menu baru ke meja:{' '}
                <span className="font-extrabold text-amber-300">
                  {ordersWithAdditions.map((o) => `Meja #${o.tableNumber} (${o.orderNumber})`).join(', ')}
                </span>
                . Cek item berlabel <span className="bg-amber-400/30 text-amber-200 px-1 rounded font-bold">TAMBAHAN (+Qty)</span> pada tiket antrean.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => soundAlerts.playAdditionalItemChime()}
              className="p-2 rounded-xl bg-[#3B1905] hover:bg-[#522509] border border-amber-400/40 text-amber-300 transition-all cursor-pointer"
              title="Bunyikan Ulang Bel Tambahan"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStationFilter('additions')}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>Fokus Menu Tambahan ({ordersWithAdditions.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Delayed Alert Notification Banner (15 - 20 minutes reminder) */}
      {delayedOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-[#3D1D09] to-red-950 border-2 border-amber-500/80 rounded-2xl p-4 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-black uppercase tracking-wider">
                  Pengingat Dapur 15 - 20 Menit
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {delayedOrders.length} Pesanan Belum Selesai!
                </span>
              </div>
              <p className="text-xs text-[#F2DFD0] mt-0.5">
                Meja terdampak:{' '}
                <strong className="text-amber-200">
                  {delayedOrders.map((d) => `Meja #${d.tableNumber} (${getElapsedMinutes(d.createdAt)}m)`).join(', ')}
                </strong>
                . Harap prioritaskan peracikan dan hidangan meja tersebut.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStationFilter('delayed')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer shrink-0"
          >
            Fokus Tiket Terlambat ({delayedOrders.length})
          </button>
        </div>
      )}

      {/* KDS Header */}
      <div className="bg-[#1C130B] rounded-2xl p-5 text-[#FFF5EA] border border-[#3D2513] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8C5223] to-[#542F10] flex items-center justify-center text-white border border-[#A8713D]/40 shadow-inner">
            {activeRole === 'barista' || stationFilter === 'bar' ? (
              <Coffee className="w-7 h-7 text-amber-300" />
            ) : (
              <ChefHat className="w-7 h-7 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[#F7E6D4] leading-tight">
                {activeRole === 'barista'
                  ? 'Bar Display System (BDS)'
                  : activeRole === 'chef'
                  ? 'Kitchen Display System (KDS)'
                  : 'Kitchen & Bar Display'}
              </h1>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeRole === 'barista'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : activeRole === 'chef'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-stone-500/20 text-stone-300 border border-stone-500/40'
              }`}>
                {activeRole === 'barista' ? '☕ Barista (Minuman)' : activeRole === 'chef' ? '👨‍🍳 Chef (Makanan)' : 'Mode Gabungan'}
              </span>
            </div>
            <p className="text-sm text-[#C4AD99] mt-0.5">
              {activeRole === 'barista'
                ? 'Stasiun Bar & Minuman • Antrean Racik Kopi & Minuman Segar'
                : activeRole === 'chef'
                ? 'Stasiun Dapur & Makanan • Antrean Masak Makanan Ringan & Berat'
                : 'Live monitoring pesanan antrean Dapur dan Bar.'}
            </p>
          </div>
        </div>

        {/* Station Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-[#2B1B0F] p-1.5 rounded-xl border border-[#4A2E19]">
          <button
            onClick={() => setStationFilter('all')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              stationFilter === 'all'
                ? 'bg-[#7D4F27] text-white font-bold shadow-sm'
                : 'text-[#C4AD99] hover:text-white'
            }`}
          >
            Semua ({kitchenTickets.length})
          </button>
          <button
            onClick={() => setStationFilter('bar')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              stationFilter === 'bar'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[#C4AD99] hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-300" />
            <span>Bar Minuman ({barTicketsCount})</span>
          </button>
          <button
            onClick={() => setStationFilter('kitchen')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              stationFilter === 'kitchen'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[#C4AD99] hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4 text-orange-300" />
            <span>Dapur Makanan ({kitchenOnlyTicketsCount})</span>
          </button>
          <button
            onClick={() => setStationFilter('additions')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              stationFilter === 'additions'
                ? 'bg-amber-500 text-black shadow-sm'
                : ordersWithAdditions.length > 0
                ? 'text-amber-300 bg-amber-950/70 animate-pulse'
                : 'text-[#C4AD99] hover:text-white'
            }`}
            title="Tiket dengan menu tambahan dari Waitress"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>+Tambahan ({ordersWithAdditions.length})</span>
          </button>
          <button
            onClick={() => setStationFilter('delayed')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              stationFilter === 'delayed'
                ? 'bg-red-700 text-white shadow-sm'
                : delayedOrders.length > 0
                ? 'text-red-400 bg-red-950/40'
                : 'text-[#C4AD99] hover:text-white'
            }`}
            title="Tiket pesanan di atas 15 menit"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>⚠️ Terlambat ({delayedOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      {displayedTickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E3D3C4] space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#2C1D11]">
            {stationFilter === 'additions' 
              ? 'Tidak Ada Menu Tambahan Baru! ✨' 
              : stationFilter === 'delayed' 
              ? 'Tidak Ada Pesanan Terlambat! ✨' 
              : 'Semua Pesanan Bersih!'}
          </h2>
          <p className="text-xs text-[#7A614D]">
            {stationFilter === 'additions'
              ? 'Belum ada permintaan menu tambahan baru dari tamu/waitress yang perlu disiapkan.'
              : stationFilter === 'delayed'
              ? 'Seluruh pesanan selesai dimasak dalam batas waktu standar di bawah 15 menit.'
              : 'Tidak ada tiket pesanan yang sedang menunggu di antrean Bar ataupun Kitchen.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedTickets.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isCriticalDelay = elapsed >= 20 && order.status !== 'ready';
            const isWarningDelay = elapsed >= 15 && elapsed < 20 && order.status !== 'ready';
            const isUrgent = elapsed >= 10 && elapsed < 15 && order.status !== 'ready';
            const orderHasAdditions = order.hasNewAdditions || order.items.some((it) => it.isAdditional && it.status !== 'ready');

            // Filter items by selected station
            const relevantItems = order.items.filter((it) => {
              if (stationFilter === 'additions') {
                return it.isAdditional || order.hasNewAdditions;
              }
              if (stationFilter === 'all' || stationFilter === 'delayed') return true;
              return it.station === stationFilter;
            });

            if (relevantItems.length === 0) return null;

            const readyItemsCount = order.items.filter((it) => it.status === 'ready').length;
            const totalItemsCount = order.items.length;
            const progressPercent = Math.round((readyItemsCount / totalItemsCount) * 100);

            const barItems = order.items.filter((it) => it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi');
            const kitchenItems = order.items.filter((it) => it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat');

            const hasBarItems = barItems.length > 0;
            const hasKitchenItems = kitchenItems.length > 0;

            const isBarAllReady = hasBarItems && barItems.every((it) => it.status === 'ready');
            const isBarCooking = hasBarItems && barItems.some((it) => it.status === 'cooking' || it.status === 'ready') && !isBarAllReady;

            const isKitchenAllReady = hasKitchenItems && kitchenItems.every((it) => it.status === 'ready');
            const isKitchenCooking = hasKitchenItems && kitchenItems.some((it) => it.status === 'cooking' || it.status === 'ready') && !isKitchenAllReady;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border flex flex-col justify-between overflow-hidden shadow-sm transition-all ${
                  orderHasAdditions
                    ? 'border-amber-500 ring-2 ring-amber-400 shadow-lg shadow-amber-900/15'
                    : isCriticalDelay
                    ? 'border-red-500 ring-2 ring-red-400 shadow-red-100'
                    : isWarningDelay
                    ? 'border-amber-500 ring-2 ring-amber-300 shadow-amber-100'
                    : isUrgent
                    ? 'border-orange-400 ring-1 ring-orange-300'
                    : order.status === 'ready'
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : 'border-[#E3D3C4]'
                }`}
              >
                {/* Ticket Top Banner */}
                <div
                  className={`p-3.5 text-white flex items-center justify-between ${
                    orderHasAdditions
                      ? 'bg-gradient-to-r from-amber-700 to-[#7D4F27]'
                      : order.status === 'ready'
                      ? 'bg-emerald-800'
                      : isCriticalDelay
                      ? 'bg-red-800'
                      : isWarningDelay
                      ? 'bg-amber-800'
                      : order.status === 'cooking'
                      ? 'bg-[#7D4F27]'
                      : 'bg-[#3D2513]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-lg">
                        Meja #{order.tableNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
                        {order.orderNumber}
                      </span>
                      {orderHasAdditions && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-300 text-black animate-pulse flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>+TAMBAHAN</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-200">
                      Tamu: {order.customerName} • Waitress: {order.waitressName || 'Waitress'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md ${
                        orderHasAdditions
                          ? 'bg-amber-200 text-amber-950 font-black ring-1 ring-amber-400'
                          : isCriticalDelay
                          ? 'bg-red-100 text-red-900 ring-1 ring-red-300 animate-pulse font-black'
                          : isWarningDelay
                          ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300 animate-pulse font-extrabold'
                          : isUrgent
                          ? 'bg-orange-100 text-orange-900'
                          : 'bg-stone-700 text-stone-200'
                      }`}
                    >
                      {orderHasAdditions ? (
                        <Flame className="w-3.5 h-3.5 text-amber-800" />
                      ) : isCriticalDelay ? (
                        <AlertOctagon className="w-3.5 h-3.5 text-red-700" />
                      ) : isWarningDelay ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{elapsed} mnt</span>
                    </span>

                    <span className="text-[10px] text-stone-300 block mt-0.5">
                      {orderHasAdditions
                        ? '🔥 Ada Menu Tambahan'
                        : isCriticalDelay
                        ? '🚨 >20 Menit (Overdue)'
                        : isWarningDelay
                        ? '⚠️ 15-20 Menit (Perhatian)'
                        : formatShortTime(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Addition Banner inside Ticket if hasNewAdditions flag is set */}
                {order.hasNewAdditions && (
                  <div className="bg-amber-400 text-black px-3.5 py-2 flex items-center justify-between text-xs font-bold border-b border-amber-500 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-black animate-bounce shrink-0" />
                      <span className="font-extrabold text-[11px] sm:text-xs">
                        🔔 TAMBAHAN MENU BARU MASUK
                      </span>
                    </div>
                    <button
                      onClick={() => acknowledgeOrderAdditions(order.id)}
                      className="px-2.5 py-1 rounded-lg bg-black text-amber-300 hover:text-white text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                      title="Konfirmasi bahwa koki telah melihat menu tambahan ini"
                    >
                      <Check className="w-3 h-3" />
                      <span>✓ Diterima Koki</span>
                    </button>
                  </div>
                )}

                {/* Readiness Progress Header */}
                <div className="px-4 py-2 bg-[#FBF8F5] border-b border-[#EADBCE] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#6E4F36]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Kesiapan: {readyItemsCount}/{totalItemsCount} Menu Siap ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progressPercent === 100
                          ? 'bg-emerald-500'
                          : progressPercent > 50
                          ? 'bg-amber-500'
                          : 'bg-[#8C5223]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Separated Station Readiness Badges (Bar vs Dapur) */}
                <div className="px-3.5 py-1.5 bg-[#FAF3EC] border-b border-[#EADBCE] flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hasBarItems && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isBarAllReady
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isBarCooking
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-700 border border-stone-300'
                      }`}>
                        <Coffee className="w-3 h-3 text-amber-700" />
                        <span>Bar: {isBarAllReady ? 'Siap Saji ✨' : isBarCooking ? 'Sedang Diracik' : 'Antrean'}</span>
                      </span>
                    )}

                    {hasKitchenItems && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isKitchenAllReady
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isKitchenCooking
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : 'bg-stone-100 text-stone-700 border border-stone-300'
                      }`}>
                        <Utensils className="w-3 h-3 text-orange-700" />
                        <span>Dapur: {isKitchenAllReady ? 'Siap Saji ✨' : isKitchenCooking ? 'Sedang Dimasak' : 'Antrean'}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-stone-500 font-medium">
                    {hasBarItems && hasKitchenItems ? 'Stasiun Terpisah' : hasBarItems ? 'Hanya Minuman' : 'Hanya Makanan'}
                  </div>
                </div>

                {/* Fast Beverage Delivery Notice when drinks are ready faster than kitchen cooking */}
                {hasBarItems && hasKitchenItems && isBarAllReady && !isKitchenAllReady && (
                  <div className="bg-sky-50 border-b border-sky-200 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-sky-950 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-amber-500 text-xs">⚡</span>
                      <span>Minuman Bar Siap Lebih Dulu! Waitress dapat mengantar ke meja tamu sekarang.</span>
                    </div>
                    <span className="text-[9px] bg-sky-200/80 text-sky-900 px-1.5 py-0.5 rounded font-black uppercase">
                      Dapur Masih Masak
                    </span>
                  </div>
                )}

                {/* Ticket Items List - PER-ITEM STATUS & READY TOGGLE */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[320px]">
                  <div className="divide-y divide-[#F0E4D8]">
                    {relevantItems.map((item) => {
                      const isItemReady = item.status === 'ready';
                      const isItemCooking = item.status === 'cooking';
                      const portion = item.portionSize || item.customization?.portionSize || 'Reguler';

                      return (
                        <div
                          key={item.id}
                          className={`py-3 first:pt-0 last:pb-0 flex flex-col gap-2 rounded-xl p-2.5 transition-all ${
                            item.isAdditional && !isItemReady
                              ? 'bg-amber-500/10 border-2 border-amber-400 shadow-xs'
                              : isItemReady 
                              ? 'bg-emerald-50/50' 
                              : isItemCooking 
                              ? 'bg-amber-50/40' 
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-black px-2 py-0.5 rounded ${
                                    item.isAdditional && !isItemReady
                                      ? 'bg-amber-500 text-black font-extrabold'
                                      : isItemReady
                                      ? 'bg-emerald-600 text-white'
                                      : isItemCooking
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-[#FAEDCD] text-[#7D4F27]'
                                  }`}
                                >
                                  {item.quantity}x
                                </span>
                                <span
                                  className={`text-xs sm:text-sm font-bold ${
                                    isItemReady ? 'text-emerald-900' : 'text-[#2C1D11]'
                                  }`}
                                >
                                  {item.name}
                                </span>

                                {/* Tambahan Pesanan Badge */}
                                {item.isAdditional && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-wider bg-amber-400 text-black flex items-center gap-1 shadow-xs animate-pulse">
                                    <Flame className="w-3 h-3 text-black" />
                                    <span>TAMBAHAN (+{item.quantity})</span>
                                    {item.addedAt && (
                                      <span className="text-[9px] text-amber-950 font-bold">
                                        • {formatShortTime(item.addedAt)}
                                      </span>
                                    )}
                                  </span>
                                )}

                                {/* Portion Badge */}
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                                    portion === 'Large'
                                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                      : 'bg-stone-100 text-stone-700 border border-stone-200'
                                  }`}
                                >
                                  {portion === 'Large' ? '⭐ LARGE' : 'REGULER'}
                                </span>

                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold">
                                  {item.station === 'bar' ? 'Bar ☕' : 'Kitchen 🍳'}
                                </span>
                              </div>

                              {/* Customization & Add Request Badges */}
                              {item.customization && (
                                <div className="text-[11px] text-[#8C5223] font-medium bg-white p-2 rounded-lg border border-[#EADBCE] space-y-1 mt-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {item.customization.sugarLevel && (
                                      <span className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 text-stone-800 font-semibold text-[10px]">
                                        🍬 {item.customization.sugarLevel}
                                      </span>
                                    )}
                                    {item.customization.iceLevel && (
                                      <span className="bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-sky-800 font-semibold text-[10px]">
                                        🧊 {item.customization.iceLevel}
                                      </span>
                                    )}
                                    {item.customization.spicyLevel && (
                                      <span className="bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-red-800 font-semibold text-[10px]">
                                        🌶️ {item.customization.spicyLevel}
                                      </span>
                                    )}
                                    {item.customization.addOns && item.customization.addOns.map((ad, idx) => (
                                      <span key={idx} className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold text-[10px]">
                                        + {ad}
                                      </span>
                                    ))}
                                  </div>

                                  {item.customization.notes && (
                                    <div className="text-red-700 font-bold text-[11px] pt-0.5 flex items-center gap-1">
                                      ⚠️ Request: &quot;{item.customization.notes}&quot;
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Per-Item Status Indicator & Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F0E4D8]/80 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isItemReady
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isItemCooking
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-stone-100 text-stone-600 border border-stone-300'
                                }`}
                              >
                                {isItemReady ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Siap Saji ✨ {item.readyAt ? `(${formatShortTime(item.readyAt)})` : ''}</span>
                                  </>
                                ) : isItemCooking ? (
                                  <>
                                    <Flame className="w-3 h-3 text-amber-600" />
                                    <span>Sedang Dimasak</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-stone-500" />
                                    <span>Menunggu Antrean</span>
                                  </>
                                )}
                              </span>

                              {item.served && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                  Telah Diantar 🍽️
                                </span>
                              )}
                            </div>

                            {/* Action Buttons Per Item */}
                            <div className="flex items-center gap-1.5">
                              {!isItemReady && !isItemCooking && (
                                <button
                                  onClick={() => updateOrderItemStatus(order.id, item.id, 'cooking')}
                                  className="px-2.5 py-1 rounded-lg bg-[#7D4F27] hover:bg-[#633C1B] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Mulai racik/masak menu ini"
                                >
                                  <Flame className="w-3 h-3" />
                                  <span>Mulai</span>
                                </button>
                              )}

                              {!isItemReady && (
                                <button
                                  onClick={() => updateOrderItemStatus(order.id, item.id, 'ready')}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Tandai menu ini siap saji (Kirim notifikasi ke waitress)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tandai Siap Saji</span>
                                </button>
                              )}

                              {isItemReady && (
                                <button
                                  onClick={() => updateOrderItemStatus(order.id, item.id, 'cooking')}
                                  className="px-2 py-1 rounded-lg text-stone-500 hover:text-stone-800 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                                  title="Batalkan status siap saji jika salah klik"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Batal</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Action Footer */}
                <div className="p-3.5 bg-[#FBF8F5] border-t border-[#EADBCE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-stone-500 block text-[10px] uppercase font-bold">
                      Status Tiket Keseluruhan:
                    </span>
                    <span
                      className={`font-bold capitalize ${
                        order.status === 'ready'
                          ? 'text-emerald-700'
                          : order.status === 'cooking'
                          ? 'text-orange-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {order.status === 'pending' && 'Menunggu Antrean'}
                      {order.status === 'cooking' && (
                        isBarAllReady && !isKitchenAllReady
                          ? '☕ Minuman Siap • Makanan Dimasak'
                          : !isBarAllReady && isKitchenAllReady
                          ? '🍳 Makanan Siap • Minuman Diracik'
                          : 'Sedang Diproses'
                      )}
                      {order.status === 'ready' && 'Seluruh Menu Siap Saji ✨'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                    {/* Barista / Bar Specific View */}
                    {(activeRole === 'barista' || stationFilter === 'bar') ? (
                      hasBarItems && !isBarAllReady ? (
                        <button
                          onClick={() => markStationItemsReady(order.id, 'bar')}
                          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          title="Tandai semua racikan minuman di tiket ini siap saji (Barista)"
                        >
                          <Coffee className="w-3.5 h-3.5" />
                          <span>☕ Minuman Siap Saji</span>
                        </button>
                      ) : hasBarItems && isBarAllReady ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5 select-none opacity-90 cursor-not-allowed" title="Semua minuman bar telah selesai dan siap saji">
                          <CheckCheck className="w-4 h-4 text-emerald-700 font-bold" />
                          <span>✓✓ Minuman Bar Selesai</span>
                        </span>
                      ) : null
                    ) : (activeRole === 'chef' || stationFilter === 'kitchen') ? (
                      /* Chef / Kitchen Specific View */
                      hasKitchenItems && !isKitchenAllReady ? (
                        <button
                          onClick={() => markStationItemsReady(order.id, 'kitchen')}
                          className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          title="Tandai semua masakan dapur di tiket ini siap saji (Chef)"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>🍳 Makanan Siap Saji</span>
                        </button>
                      ) : hasKitchenItems && isKitchenAllReady ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5 select-none opacity-90 cursor-not-allowed" title="Semua masakan dapur telah selesai dan siap saji">
                          <CheckCheck className="w-4 h-4 text-emerald-700 font-bold" />
                          <span>✓✓ Makanan Dapur Selesai</span>
                        </span>
                      ) : null
                    ) : (
                      /* Combined / Waitress View: Separate options for Bar and Kitchen */
                      <>
                        {hasBarItems && !isBarAllReady && (
                          <button
                            onClick={() => markStationItemsReady(order.id, 'bar')}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                            title="Tandai pesanan minuman bar siap saji"
                          >
                            <Coffee className="w-3 h-3" />
                            <span>Minuman Siap</span>
                          </button>
                        )}
                        {hasBarItems && isBarAllReady && (
                          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1 select-none cursor-not-allowed">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>✓✓ Bar Selesai</span>
                          </span>
                        )}

                        {hasKitchenItems && !isKitchenAllReady && (
                          <button
                            onClick={() => markStationItemsReady(order.id, 'kitchen')}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                            title="Tandai pesanan makanan dapur siap saji"
                          >
                            <Utensils className="w-3 h-3" />
                            <span>Makanan Siap</span>
                          </button>
                        )}
                        {hasKitchenItems && isKitchenAllReady && (
                          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1 select-none cursor-not-allowed">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>✓✓ Dapur Selesai</span>
                          </span>
                        )}

                        {(!isBarAllReady || !isKitchenAllReady) ? (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                            title="Tandai SEMUA menu di tiket ini siap saji sekaligus"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Semua Siap</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-200 text-emerald-900 text-[11px] font-extrabold border border-emerald-400 flex items-center gap-1 select-none cursor-not-allowed">
                            <CheckCheck className="w-4 h-4 text-emerald-800" />
                            <span>✓✓ Semua Selesai</span>
                          </span>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => handleNotifyWaitress(order.orderNumber, order.tableNumber)}
                      className="px-3 py-2 rounded-xl bg-[#2B1B0F] hover:bg-[#3D2817] text-[#F3D7B5] text-xs font-bold border border-[#523219] shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      title="Kirim panggilan suara bel ke waitress"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Bel Waitress</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

