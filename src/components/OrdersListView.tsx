import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { Order, OrderStatus } from '../types';
import { formatRupiah, formatShortTime, getElapsedMinutes } from '../utils/formatters';
import { 
  UtensilsCrossed, 
  Coffee, 
  Check, 
  CheckCircle2, 
  CheckCheck, 
  Clock, 
  Flame, 
  Sparkles, 
  Search, 
  X, 
  Filter, 
  Plus, 
  ChevronRight, 
  CreditCard, 
  Receipt,
  RotateCcw,
  Soup,
  Timer,
  Trash2
} from 'lucide-react';

interface OrdersListViewProps {
  role?: 'waitress' | 'owner' | 'cashier';
  onSelectTable?: (tableNumber: number) => void;
  onAddMenuForOrder?: (order: Order) => void;
  onOpenNewOrder?: () => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  role = 'waitress',
  onSelectTable,
  onAddMenuForOrder,
  onOpenNewOrder,
}) => {
  const {
    activeOrders,
    completedOrders,
    allOrders,
    markItemServed,
    markStationItemsServed,
    markAllOrderItemsServed,
    markOrderServed,
    markOrderCompleted,
    clearAllActiveTransactionsToHistory,
    deleteAllOrdersData,
    setActiveRole,
  } = useCafe();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_cooking' | 'ready' | 'served' | 'completed'>('all');
  const [scopeFilter, setScopeFilter] = useState<'active' | 'all'>('active');

  // Pool of orders based on scope
  const sourceOrders = scopeFilter === 'active' 
    ? activeOrders 
    : [...activeOrders, ...completedOrders.slice(0, 30)];

  // Metrics count across active orders
  const pendingCookingCount = activeOrders.filter((o) => o.status === 'pending' || o.status === 'cooking').length;
  const readyCount = activeOrders.filter((o) => o.status === 'ready').length;
  const servedCount = activeOrders.filter((o) => o.status === 'served' || (o.items.length > 0 && o.items.every((it) => it.served))).length;
  const completedCount = activeOrders.filter((o) => o.status === 'completed').length;

  // Filtered orders
  const filteredOrders = sourceOrders.filter((order) => {
    // Status filter
    if (statusFilter === 'pending_cooking') {
      if (order.status !== 'pending' && order.status !== 'cooking') return false;
    } else if (statusFilter === 'ready') {
      if (order.status !== 'ready') return false;
    } else if (statusFilter === 'served') {
      const isAllServed = order.status === 'served' || (order.items.length > 0 && order.items.every((it) => it.served));
      if (!isAllServed) return false;
    } else if (statusFilter === 'completed') {
      if (order.status !== 'completed') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchCustomer = order.customerName.toLowerCase().includes(q);
      const matchTable = `meja ${order.tableNumber}`.includes(q) || order.tableNumber.toString() === q.replace('#', '');
      const matchItem = order.items.some((it) => it.name.toLowerCase().includes(q));
      if (!matchNumber && !matchCustomer && !matchTable && !matchItem) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Metric summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#7D4F27] text-white border-[#7D4F27] shadow-sm'
              : 'bg-white text-[#4A321F] border-[#E3D3C4] hover:bg-[#FAF6F2]'
          }`}
        >
          <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">Total Berjalan</div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{activeOrders.length}</div>
          <div className="text-[10px] mt-1 opacity-90">Semua pesanan aktif</div>
        </button>

        <button
          onClick={() => setStatusFilter('pending_cooking')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending_cooking'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50/60'
          }`}
        >
          <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3" /> Antrean Dapur
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{pendingCookingCount}</div>
          <div className="text-[10px] mt-1 opacity-90">Menunggu & dimasak</div>
        </button>

        <button
          onClick={() => setStatusFilter('ready')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50/60'
          }`}
        >
          <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Siap Saji
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{readyCount}</div>
          <div className="text-[10px] mt-1 opacity-90">Siap diantar ke meja</div>
        </button>

        <button
          onClick={() => setStatusFilter('served')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'served'
              ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-sm'
              : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100/70'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3" /> Sudah Disajikan
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{servedCount}</div>
          <div className="text-[10px] mt-1 font-semibold text-emerald-800">Makanan & minuman di meja</div>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'completed'
              ? 'bg-[#1565C0] text-white border-[#1565C0] shadow-sm'
              : 'bg-blue-50 text-blue-950 border-blue-200 hover:bg-blue-100/70'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCheck className="w-3 h-3" /> Orderan Selesai
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{completedCount}</div>
          <div className="text-[10px] mt-1 font-semibold text-blue-800">Selesai disajikan</div>
        </button>
      </div>

      {/* Control bar: search, status filter pills, scope */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E3D3C4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C705A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor order (#NDR-xxx), nomor meja, nama pelanggan, atau nama menu..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter buttons & Scope toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#FAF6F2] p-1 rounded-xl border border-[#E3D3C4] text-xs font-semibold">
            <button
              onClick={() => setScopeFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                scopeFilter === 'active' ? 'bg-[#7D4F27] text-white shadow-xs' : 'text-[#6B513C] hover:text-black'
              }`}
            >
              Pesanan Aktif ({activeOrders.length})
            </button>
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                scopeFilter === 'all' ? 'bg-[#7D4F27] text-white shadow-xs' : 'text-[#6B513C] hover:text-black'
              }`}
            >
              Semua (+Riwayat)
            </button>
          </div>

          {onOpenNewOrder && role === 'waitress' && (
            <button
              onClick={onOpenNewOrder}
              className="px-3.5 py-1.5 rounded-xl bg-[#7D4F27] hover:bg-[#623C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Order Baru</span>
            </button>
          )}

          {activeOrders.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Arsipkan semua transaksi aktif ke riwayat dan kosongkan meja untuk memulai transaksi baru?')) {
                  clearAllActiveTransactionsToHistory();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus semua transaksi aktif dan arsipkan ke riwayat"
            >
              <Receipt className="w-4 h-4 text-amber-700" />
              <span>Arsipkan Semua Transaksi</span>
            </button>
          )}

          {allOrders.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Hapus semua data pemesanan (aktif & riwayat/demo)? Seluruh meja akan dikosongkan dan daftar pesanan dibersihkan.')) {
                  deleteAllOrdersData();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus semua data pemesanan aktif dan demo/riwayat"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Semua Pesanan/Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Orders List Container */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-[#D6C4B2] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF6F2] flex items-center justify-center mx-auto text-[#8C705A]">
            <UtensilsCrossed className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="font-display text-base font-bold text-[#3E2A1C]">
            Tidak ada data pemesanan yang sesuai
          </h3>
          <p className="text-xs text-[#7A614D] max-w-md mx-auto">
            {searchQuery
              ? `Tidak ditemukan pesanan dengan kata kunci "${searchQuery}". Coba ubah kata kunci pencarian atau reset filter.`
              : 'Belum ada pesanan dengan status yang dipilih.'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-4 py-1.5 rounded-xl bg-[#7D4F27] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const totalItemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
            const servedItemsCount = order.items.filter((it) => it.served).reduce((sum, it) => sum + it.quantity, 0);
            const isAllServed = order.items.length > 0 && order.items.every((it) => it.served);
            const isCompleted = order.status === 'completed';
            const isReady = order.status === 'ready' || order.items.some((it) => it.status === 'ready' && !it.served);

            const barItems = order.items.filter((it) => it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi');
            const kitchenItems = order.items.filter((it) => it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat');
            const unservedBarReady = barItems.filter((it) => it.status === 'ready' && !it.served);
            const unservedKitchenReady = kitchenItems.filter((it) => it.status === 'ready' && !it.served);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isCompleted
                    ? 'border-blue-300 ring-1 ring-blue-200'
                    : isAllServed
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : order.status === 'ready'
                    ? 'border-amber-300'
                    : 'border-[#E3D3C4]'
                }`}
              >
                {/* Order Top Bar Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF6F2] to-white border-b border-[#F0E4D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Table Pill */}
                    <span className="px-3 py-1 rounded-xl bg-[#7D4F27] text-white text-xs font-black tracking-wide shadow-xs flex items-center gap-1.5">
                      <span>MEJA #{order.tableNumber}</span>
                    </span>

                    {/* Order Number */}
                    <span className="text-xs font-mono font-bold text-[#5A3E29]">
                      {order.orderNumber}
                    </span>

                    {/* Customer & Waitress */}
                    <span className="text-xs text-[#7A614D] flex items-center gap-1">
                      <span className="font-bold text-[#3A2210]">{order.customerName}</span>
                      {order.waitressName && (
                        <span className="text-[11px] text-stone-500">· Staf: {order.waitressName}</span>
                      )}
                    </span>

                    {/* Elapsed Time */}
                    <span className="text-[11px] text-stone-500 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#E8DDD2]">
                      <Clock className="w-3 h-3 text-[#8C705A]" />
                      <span>{elapsed} mnt lalu ({formatShortTime(order.createdAt)})</span>
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Serving Status Badge */}
                    {isCompleted ? (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black flex items-center gap-1 shadow-xs">
                        <CheckCheck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Orderan Selesai</span>
                      </span>
                    ) : isAllServed || order.status === 'served' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1 shadow-xs">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Makanan/Minuman Sudah Disajikan</span>
                      </span>
                    ) : (
                      <>
                        {unservedBarReady.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center gap-1 animate-pulse shadow-xs">
                            <Coffee className="w-3.5 h-3.5 text-amber-700" />
                            <span>☕ Minuman Siap ({unservedBarReady.length})</span>
                          </span>
                        )}

                        {unservedKitchenReady.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-950 border border-orange-300 text-xs font-extrabold flex items-center gap-1 animate-pulse shadow-xs">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-orange-700" />
                            <span>🍳 Makanan Siap ({unservedKitchenReady.length})</span>
                          </span>
                        )}

                        {unservedBarReady.length === 0 && unservedKitchenReady.length === 0 && order.status === 'ready' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Menu Siap Saji ✨</span>
                          </span>
                        )}

                        {order.status === 'cooking' && unservedBarReady.length === 0 && unservedKitchenReady.length === 0 && (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-600" />
                            <span>Sedang Dimasak / Diracik</span>
                          </span>
                        )}

                        {order.status === 'pending' && (
                          <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5 text-stone-600" />
                            <span>Menunggu Antrean</span>
                          </span>
                        )}
                      </>
                    )}

                    {/* Payment Status Badge */}
                    {order.paymentStatus === 'paid' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        Lunas
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        Belum Bayar
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar of items served */}
                <div className="bg-[#FAF6F2] px-4 sm:px-5 py-2 border-b border-[#F0E4D8] flex items-center justify-between text-xs text-[#6B513C]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Progress Penyajian:</span>
                    <span className="font-mono font-bold text-[#2C1D11]">
                      {servedItemsCount} / {totalItemsCount} Menu Disajikan
                    </span>
                    <div className="w-24 sm:w-36 h-2 bg-stone-200 rounded-full overflow-hidden ml-1">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isAllServed || isCompleted ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${totalItemsCount > 0 ? (servedItemsCount / totalItemsCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {order.servedAt && (
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Disajikan jam {formatShortTime(order.servedAt)}
                    </span>
                  )}
                </div>

                {/* Menu items list */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {order.items.map((it) => {
                      const isItemReady = it.status === 'ready';
                      const isItemCooking = it.status === 'cooking';

                      return (
                        <div
                          key={it.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                            it.served
                              ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                              : isItemReady
                              ? 'bg-amber-50/50 border-amber-200 text-stone-900'
                              : 'bg-[#FAF6F2]/70 border-[#EADECE] text-stone-800'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-[#2C1D11]">
                                {it.quantity}x {it.name}
                              </span>
                              {it.portionSize && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  it.portionSize === 'Large' ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {it.portionSize}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                                {it.station === 'bar' ? 'Barista' : 'Dapur'}
                              </span>
                            </div>

                            {/* Customization Details */}
                            {it.customization && (
                              <div className="flex flex-wrap gap-1 text-[10px] text-stone-600">
                                {it.customization.sugarLevel && (
                                  <span className="bg-white/80 border border-stone-200 px-1.5 py-0.5 rounded">
                                    Gula: {it.customization.sugarLevel}
                                  </span>
                                )}
                                {it.customization.iceLevel && (
                                  <span className="bg-white/80 border border-stone-200 px-1.5 py-0.5 rounded">
                                    Es: {it.customization.iceLevel}
                                  </span>
                                )}
                                {it.customization.spicyLevel && (
                                  <span className="bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                                    🌶️ {it.customization.spicyLevel}
                                  </span>
                                )}
                                {it.customization.addOns && it.customization.addOns.map((ad, idx) => (
                                  <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                    +{ad}
                                  </span>
                                ))}
                                {it.customization.notes && (
                                  <span className="text-stone-500 italic block w-full mt-0.5">
                                    &quot;{it.customization.notes}&quot;
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Item status label */}
                            <div className="text-[11px] font-medium pt-0.5">
                              {it.served ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Telah disajikan ke meja {it.servedAt ? `(${formatShortTime(it.servedAt)})` : ''}</span>
                                </span>
                              ) : isItemReady ? (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Siap saji di pantry / dapur</span>
                                </span>
                              ) : isItemCooking ? (
                                <span className="text-amber-600 flex items-center gap-1">
                                  <Flame className="w-3 h-3" />
                                  <span>Sedang disiapkan / diracik</span>
                                </span>
                              ) : (
                                <span className="text-stone-500">Menunggu antrean koki/barista</span>
                              )}
                            </div>
                          </div>

                          {/* Quick Serve Toggle Button for each item */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            {it.served ? (
                              <button
                                onClick={() => markItemServed(order.id, it.id, false)}
                                title="Klik untuk membatalkan tanda sudah disajikan"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Sudah Saji</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => markItemServed(order.id, it.id, true)}
                                title="Tandai menu makanan/minuman ini telah disajikan ke meja"
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-600 hover:text-white border border-emerald-500 text-emerald-700 text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <UtensilsCrossed className="w-3 h-3" />
                                <span>Sajikan</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action Footer: Food/Drink Served & Order Completed buttons */}
                <div className="p-4 sm:p-5 bg-gradient-to-b from-[#FAF6F2] to-[#F5ECE1] border-t border-[#EADECE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#7A614D]">Total Tagihan:</span>
                    <span className="text-base sm:text-lg font-black text-[#2C1D11]">
                      {formatRupiah(order.total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Fast Station Serving Buttons */}
                    {unservedBarReady.length > 0 && (
                      <button
                        onClick={() => markStationItemsServed(order.id, 'bar')}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Antar racikan minuman bar yang sudah selesai ke meja tamu"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>☕ Antar Minuman ({unservedBarReady.length})</span>
                      </button>
                    )}

                    {unservedKitchenReady.length > 0 && (
                      <button
                        onClick={() => markStationItemsServed(order.id, 'kitchen')}
                        className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Antar masakan dapur yang sudah matang ke meja tamu"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>🍳 Antar Makanan ({unservedKitchenReady.length})</span>
                      </button>
                    )}

                    {/* Button 1: Makanan & Minuman Sudah Disajikan */}
                    <button
                      onClick={() => markOrderServed(order.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        isAllServed
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>
                        {isAllServed ? '✓ Makanan & Minuman Sudah Disajikan' : 'Makanan/Minuman Sudah Disajikan'}
                      </span>
                    </button>

                    {/* Button 2: Orderan Selesai */}
                    <button
                      onClick={() => markOrderCompleted(order.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        isCompleted
                          ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200'
                          : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white'
                      }`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{isCompleted ? '✓ Orderan Telah Selesai' : 'Orderan Selesai'}</span>
                    </button>

                    {/* Button 3: Add Items / Details */}
                    {onSelectTable && (
                      <button
                        onClick={() => onSelectTable(order.tableNumber)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF6F2] text-[#5A3E29] border border-[#D6C4B2] text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>Kelola Meja #{order.tableNumber}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Button 4: Add Menu if waitress */}
                    {onAddMenuForOrder && (
                      <button
                        onClick={() => onAddMenuForOrder(order)}
                        className="px-3 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Menu</span>
                      </button>
                    )}
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
