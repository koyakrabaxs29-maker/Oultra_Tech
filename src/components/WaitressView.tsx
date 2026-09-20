import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { 
  TableInfo, 
  MenuItem, 
  OrderItem, 
  PortionSize, 
  SugarLevel, 
  IceLevel, 
  SpicyLevel 
} from '../types';
import { formatRupiah, formatShortTime, getElapsedMinutes } from '../utils/formatters';
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Search, 
  Check, 
  X, 
  Clock, 
  Coffee,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  CheckCircle2,
  LayoutGrid,
  ClipboardList,
  CheckCheck
} from 'lucide-react';
import { OrdersListView } from './OrdersListView';

interface PickedDraftItem {
  tempId: string;
  item: MenuItem;
  portionSize: PortionSize;
  sugarLevel?: SugarLevel;
  iceLevel?: IceLevel;
  spicyLevel?: SpicyLevel;
  addOns: string[];
  notes: string;
  unitPrice: number;
  qty: number;
}

export const WaitressView: React.FC = () => {
  const { 
    tables, 
    activeOrders, 
    menuItems, 
    createOrder, 
    addItemsToOrder, 
    cancelOrder,
    markItemServed,
    markAllOrderItemsServed,
    markOrderServed,
    markOrderCompleted
  } = useCafe();

  const [viewMode, setViewMode] = useState<'tables' | 'orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Order creation/addition state
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [waitressNameInput, setWaitressNameInput] = useState('Siti Rahma');
  const [pickedDrafts, setPickedDrafts] = useState<PickedDraftItem[]>([]);
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

  // Item customizer sub-modal inside order creation
  const [customizingMenuItem, setCustomizingMenuItem] = useState<MenuItem | null>(null);
  const [formPortion, setFormPortion] = useState<PortionSize>('Reguler');
  const [formSugar, setFormSugar] = useState<SugarLevel>('Normal Sugar');
  const [formIce, setFormIce] = useState<IceLevel>('Normal Ice');
  const [formSpicy, setFormSpicy] = useState<SpicyLevel>('Pedas Sedang');
  const [formAddOns, setFormAddOns] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formQty, setFormQty] = useState(1);

  // Find active order for selected table
  const activeOrderForTable = selectedTable?.currentOrderId
    ? activeOrders.find((o) => o.id === selectedTable.currentOrderId)
    : activeOrders.find((o) => o.tableNumber === selectedTable?.number && o.paymentStatus === 'unpaid');

  const occupiedCount = tables.filter((t) => t.status !== 'available').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;

  const filteredTables = tables.filter((t) => {
    if (tableStatusFilter === 'available' && t.status !== 'available') return false;
    if (tableStatusFilter === 'occupied' && t.status === 'available') return false;
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.trim().toLowerCase().replace('#', '').replace('meja', '').trim();
      if (!t.number.toString().includes(q)) return false;
    }
    return true;
  });

  const filteredCatalog = menuItems.filter((m) =>
    m.name.toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchMenuQuery.toLowerCase())
  );

  // Open customizer when selecting a menu item
  const handleStartCustomize = (item: MenuItem) => {
    setCustomizingMenuItem(item);
    setFormPortion('Reguler');
    setFormSugar('Normal Sugar');
    setFormIce(item.tags.includes('Hot') ? 'Hot / Panas' : 'Normal Ice');
    setFormSpicy('Pedas Sedang');
    setFormAddOns([]);
    setFormNotes('');
    setFormQty(1);
  };

  const calculateCustomizedPrice = (item: MenuItem, portion: PortionSize, addOns: string[]) => {
    let price = item.price;
    if (portion === 'Large') {
      price += item.largePriceAddition || (item.category === 'Makanan Berat' ? 12000 : 6000);
    }
    // Add-on prices
    addOns.forEach((addon) => {
      if (addon.includes('Espresso') || addon.includes('Telur') || addon.includes('Oat')) price += 6000;
      else if (addon.includes('Keju') || addon.includes('Truffle')) price += 7000;
      else if (addon.includes('Whipped') || addon.includes('Sambal')) price += 5000;
      else price += 5000;
    });
    return price;
  };

  const handleConfirmAddDraft = () => {
    if (!customizingMenuItem) return;

    const unitPrice = calculateCustomizedPrice(customizingMenuItem, formPortion, formAddOns);

    const newDraft: PickedDraftItem = {
      tempId: `draft-${Date.now()}-${Math.random().toString().slice(-4)}`,
      item: customizingMenuItem,
      portionSize: formPortion,
      sugarLevel: (customizingMenuItem.category === 'Kopi' || customizingMenuItem.category === 'Non-Kopi') ? formSugar : undefined,
      iceLevel: (customizingMenuItem.category === 'Kopi' || customizingMenuItem.category === 'Non-Kopi') ? formIce : undefined,
      spicyLevel: (customizingMenuItem.category === 'Makanan Berat' || customizingMenuItem.category === 'Makanan Ringan') ? formSpicy : undefined,
      addOns: formAddOns,
      notes: formNotes.trim(),
      unitPrice,
      qty: formQty,
    };

    setPickedDrafts((prev) => [...prev, newDraft]);
    setCustomizingMenuItem(null);
  };

  const handleRemoveDraft = (tempId: string) => {
    setPickedDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const handleOpenNewOrder = (table: TableInfo) => {
    setSelectedTable(table);
    setCustomerNameInput('');
    setPickedDrafts([]);
    setSearchMenuQuery('');
    setIsNewOrderModalOpen(true);
  };

  // Convert drafts to OrderItem[]
  const buildOrderItems = (): OrderItem[] => {
    return pickedDrafts.map((d) => ({
      id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
      menuItemId: d.item.id,
      name: `${d.item.name} (${d.portionSize})`,
      portionSize: d.portionSize,
      price: d.unitPrice,
      quantity: d.qty,
      category: d.item.category,
      station: d.item.station,
      customization: {
        portionSize: d.portionSize,
        sugarLevel: d.sugarLevel,
        iceLevel: d.iceLevel,
        spicyLevel: d.spicyLevel,
        addOns: d.addOns.length > 0 ? d.addOns : undefined,
        notes: d.notes || undefined,
      },
      status: 'pending',
    }));
  };

  // Submit brand new order
  const handleSaveNewOrder = () => {
    if (!selectedTable || pickedDrafts.length === 0) return;

    const orderItems = buildOrderItems();

    createOrder({
      tableNumber: selectedTable.number,
      customerName: customerNameInput.trim() || `Tamu Meja #${selectedTable.number}`,
      items: orderItems,
      waitressName: waitressNameInput,
    });

    setIsNewOrderModalOpen(false);
    setSelectedTable(null);
    setPickedDrafts([]);
  };

  // Submit additional items to existing table order
  const handleSaveAdditionalItems = () => {
    if (!activeOrderForTable || pickedDrafts.length === 0) return;

    const additionalItems = buildOrderItems();

    addItemsToOrder(activeOrderForTable.id, additionalItems);
    setIsAddItemsModalOpen(false);
    setPickedDrafts([]);
  };

  // Confirm cancel order
  const handleConfirmCancel = () => {
    if (!activeOrderForTable || !cancelReason.trim()) return;
    cancelOrder(activeOrderForTable.id, cancelReason.trim());
    setIsCancelModalOpen(false);
    setCancelReason('');
    setSelectedTable(null);
  };

  const totalDraftPrice = pickedDrafts.reduce((sum, d) => sum + d.unitPrice * d.qty, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Bar Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FAEDCD] flex items-center justify-center text-[#7D4F27]">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C1D11]">
                Waitress Station & Pemesanan 30 Meja Kafe
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                30 Meja Aktif
              </span>
            </div>
            <p className="text-xs text-[#7A614D]">
              Kelola pemesanan 30 meja kafe, detail porsi Reguler/Large, level gula & es, tingkat pedas, dan request khusus.
            </p>
          </div>
        </div>

        {/* Occupancy Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
            {availableCount} Meja Kosong
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
            {occupiedCount} Meja Terisi
          </div>
        </div>
      </div>

      {/* View Switcher: Layout Meja vs Data Pemesanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-[#E3D3C4] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="btn-view-tables"
            onClick={() => setViewMode('tables')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'tables'
                ? 'bg-[#7D4F27] text-white shadow-xs'
                : 'bg-[#FAF6F2] text-[#6B513C] hover:bg-[#F3EBE3]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Tata Letak Meja (30 Meja)</span>
          </button>

          <button
            id="btn-view-orders"
            onClick={() => setViewMode('orders')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'orders'
                ? 'bg-[#7D4F27] text-white shadow-xs'
                : 'bg-[#FAF6F2] text-[#6B513C] hover:bg-[#F3EBE3]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Data Pemesanan</span>
            {activeOrders.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                viewMode === 'orders' ? 'bg-amber-400 text-stone-900' : 'bg-[#7D4F27] text-white'
              }`}>
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-[#7A614D] px-2 flex items-center gap-2">
          <span>Fitur:</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Makanan/Minuman Disajikan
          </span>
          <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Orderan Selesai
          </span>
        </div>
      </div>

      {viewMode === 'orders' ? (
        <OrdersListView
          role="waitress"
          onSelectTable={(tableNum) => {
            const tbl = tables.find((t) => t.number === tableNum);
            if (tbl) {
              setSelectedTable(tbl);
              setViewMode('tables');
            }
          }}
          onAddMenuForOrder={(ord) => {
            const tbl = tables.find((t) => t.number === ord.tableNumber);
            if (tbl) {
              setSelectedTable(tbl);
              setViewMode('tables');
              setPickedDrafts([]);
              setSearchMenuQuery('');
              setIsAddItemsModalOpen(true);
            }
          }}
          onOpenNewOrder={() => {
            setIsNewOrderModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Table Filter Controls: Status Tabs & Quick Table Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E3D3C4]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-[#5A3E29] shrink-0 mr-1 flex items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5 text-[#7D4F27]" /> Status:
              </span>
              {[
                { key: 'all', label: `Semua (${tables.length} Meja)` },
                { key: 'available', label: `Tersedia (${availableCount})` },
                { key: 'occupied', label: `Terisi (${occupiedCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTableStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    tableStatusFilter === tab.key
                      ? 'bg-[#7D4F27] text-white shadow-xs'
                      : 'bg-[#FAF6F2] text-[#6B513C] hover:bg-[#F3EBE3]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C705A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                placeholder="Cari nomor meja (1 - 30)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
              />
              {tableSearchQuery && (
                <button
                  onClick={() => setTableSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

      {/* Table Grid Matrix (30 Tables) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredTables.map((table) => {
            const tableOrder = activeOrders.find(
              (o) => o.tableNumber === table.number && o.paymentStatus === 'unpaid'
            );
            const isOccupied = !!tableOrder;
            const elapsed = tableOrder ? getElapsedMinutes(tableOrder.createdAt) : 0;

            return (
              <div
                key={table.number}
                id={`table-card-${table.number}`}
                onClick={() => setSelectedTable(table)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[135px] ${
                  isOccupied
                    ? 'bg-white border-[#D4A373] shadow-md hover:border-[#7D4F27]'
                    : 'bg-[#FBF8F5] border-[#E3D3C4] hover:bg-white hover:border-[#A8713D]'
                } ${selectedTable?.number === table.number ? 'ring-2 ring-[#7D4F27]' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-[#2C1D11]">
                      Meja #{table.number}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-[#8C705A] block mt-0.5 font-medium">
                    {table.capacity} Kursi
                  </span>
                </div>

                {isOccupied && tableOrder ? (
                  <div className="mt-2 pt-2 border-t border-[#F0E4D8] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#7D4F27] truncate max-w-[80px]">
                        {tableOrder.customerName}
                      </span>
                      <span className={`text-[10px] flex items-center gap-0.5 ${
                        elapsed >= 20 ? 'text-red-600 font-extrabold animate-pulse' : elapsed >= 15 ? 'text-amber-600 font-bold' : 'text-[#A88771]'
                      }`}>
                        <Clock className="w-3 h-3" /> {elapsed}m
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#2C1D11]">
                      {formatRupiah(tableOrder.total)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tableOrder.items.some((it) => it.status === 'ready' && !it.served) ? (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5 inline-flex items-center gap-1 animate-pulse">
                          🍽️ Menu Siap!
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 inline-block truncate max-w-full">
                          {tableOrder.items.length} item • {tableOrder.status}
                        </span>
                      )}
                      {elapsed >= 15 && tableOrder.status !== 'ready' && (
                        <span className="text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-200 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
                          ⚠️ &gt;15m
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block">
                      Tersedia
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Table Action Drawer / Panel */}
      {selectedTable && (
        <div className="bg-white rounded-2xl border border-[#D4A373] p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3D3C4] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7D4F27] text-white flex items-center justify-center font-bold text-lg">
                #{selectedTable.number}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#2C1D11]">
                  Meja #{selectedTable.number}
                </h3>
                <p className="text-xs text-[#7A614D]">
                  Kapasitas: {selectedTable.capacity} Orang • Status:{' '}
                  <strong className={activeOrderForTable ? 'text-amber-700' : 'text-emerald-700'}>
                    {activeOrderForTable ? 'Sedang Terisi' : 'Kosong (Siap Ditempati)'}
                  </strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTable(null)}
              className="self-end sm:self-center p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* If Table has active order */}
          {activeOrderForTable ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FBF8F5] p-3 rounded-xl border border-[#E3D3C4]">
                <div>
                  <span className="text-xs text-[#8A715C]">Nomor Pesanan:</span>
                  <p className="text-sm font-bold text-[#2C1D11]">{activeOrderForTable.orderNumber}</p>
                </div>
                <div>
                  <span className="text-xs text-[#8A715C]">Pelanggan:</span>
                  <p className="text-sm font-bold text-[#2C1D11]">{activeOrderForTable.customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-[#8A715C]">Waktu Dibuat:</span>
                  <p className="text-sm font-bold text-[#2C1D11]">
                    {formatShortTime(activeOrderForTable.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#8A715C]">Total Tagihan:</span>
                  <p className="text-base font-extrabold text-[#7D4F27]">
                    {formatRupiah(activeOrderForTable.total)}
                  </p>
                </div>
              </div>

              {/* Items List with Portions, Ready status, and Antar ke Meja button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#5A3E29] uppercase tracking-wider">
                    Daftar Pesanan ({activeOrderForTable.items.length} Menu)
                  </h4>
                  {activeOrderForTable.items.some((it) => it.status === 'ready' && !it.served) && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                      🍽️ Ada menu siap saji!
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {activeOrderForTable.items.map((it) => {
                    const isReady = it.status === 'ready';
                    return (
                      <div 
                        key={it.id} 
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isReady && !it.served
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-white border-[#E3D3C4]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#7D4F27]">{it.quantity}x</span>
                            <span className="text-xs sm:text-sm font-bold text-[#2C1D11]">{it.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              it.portionSize === 'Large' ? 'bg-purple-100 text-purple-800' : 'bg-stone-100 text-stone-700'
                            }`}>
                              Porsi {it.portionSize || 'Reguler'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              isReady
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : it.status === 'cooking'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-100 text-stone-700'
                            }`}>
                              {isReady ? '✨ Siap Saji' : it.status === 'cooking' ? '🔥 Dimasak' : '⏳ Menunggu'}
                            </span>
                            {it.served && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                🍽️ Sudah Diantar
                              </span>
                            )}
                          </div>

                          {it.customization && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#7A614D]">
                              {it.customization.sugarLevel && (
                                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-stone-700">
                                  🍬 {it.customization.sugarLevel}
                                </span>
                              )}
                              {it.customization.iceLevel && (
                                <span className="bg-sky-50 px-1.5 py-0.5 rounded text-[10px] font-semibold text-sky-800">
                                  🧊 {it.customization.iceLevel}
                                </span>
                              )}
                              {it.customization.spicyLevel && (
                                <span className="bg-red-50 px-1.5 py-0.5 rounded text-[10px] font-semibold text-red-800">
                                  🌶️ {it.customization.spicyLevel}
                                </span>
                              )}
                              {it.customization.addOns && it.customization.addOns.map((ad, idx) => (
                                <span key={idx} className="bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-800">
                                  + {ad}
                                </span>
                              ))}
                              {it.customization.notes && (
                                <span className="text-stone-500 italic">
                                  &quot;{it.customization.notes}&quot;
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                          <span className="text-xs font-semibold text-[#5A3E29]">
                            {formatRupiah(it.price * it.quantity)}
                          </span>

                          {it.served ? (
                            <button
                              onClick={() => markItemServed(activeOrderForTable.id, it.id, false)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                              title="Telah disajikan ke meja (Klik untuk batalkan)"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Disajikan</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => markItemServed(activeOrderForTable.id, it.id, true)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 ${
                                isReady
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-400'
                              }`}
                              title="Tandai menu ini telah disajikan ke tamu meja"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              <span>Sajikan</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Waitress Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0E4D8]">
                {/* Button: Makanan/Minuman Sudah Disajikan */}
                <button
                  id="btn-mark-order-served"
                  onClick={() => markOrderServed(activeOrderForTable.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeOrderForTable.status === 'served' || (activeOrderForTable.items.length > 0 && activeOrderForTable.items.every((it) => it.served))
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>
                    {activeOrderForTable.status === 'served' || (activeOrderForTable.items.length > 0 && activeOrderForTable.items.every((it) => it.served))
                      ? '✓ Makanan & Minuman Sudah Disajikan'
                      : 'Makanan/Minuman Sudah Disajikan'}
                  </span>
                </button>

                {/* Button: Orderan Selesai */}
                <button
                  id="btn-mark-order-completed"
                  onClick={() => markOrderCompleted(activeOrderForTable.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeOrderForTable.status === 'completed'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white'
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>{activeOrderForTable.status === 'completed' ? '✓ Orderan Selesai' : 'Orderan Selesai'}</span>
                </button>

                {activeOrderForTable.items.some((it) => it.status === 'ready' && !it.served) && (
                  <button
                    onClick={() => markAllOrderItemsServed(activeOrderForTable.id)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Antar Menu Siap Saji</span>
                  </button>
                )}

                <button
                  id="btn-waitress-add-items"
                  onClick={() => {
                    setPickedDrafts([]);
                    setSearchMenuQuery('');
                    setIsAddItemsModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Menu (Add Order)</span>
                </button>

                <button
                  id="btn-waitress-cancel-order"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Batalkan Pesanan</span>
                </button>
              </div>
            </div>
          ) : (
            /* If Table is Free */
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-[#7A614D]">
                Meja #{selectedTable.number} di area <strong>{selectedTable.section}</strong> saat ini kosong dan siap ditempati tamu baru.
              </p>
              <button
                id="btn-open-new-order"
                onClick={() => handleOpenNewOrder(selectedTable)}
                className="px-5 py-2.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pesanan Baru (New Order)</span>
              </button>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* MODAL: New Order or Add Items with Rich Portions and Customizations */}
      {(isNewOrderModalOpen || isAddItemsModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E3D3C4] flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  {isNewOrderModalOpen 
                    ? `New Order - Meja #${selectedTable?.number}` 
                    : `Tambah Menu - ${activeOrderForTable?.orderNumber} (Meja #${selectedTable?.number})`}
                </h3>
                <p className="text-[11px] text-[#C4AD99]">
                  Atur porsi Reguler/Large, level gula, es, kepedasan, dan catatan khusus dapur.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewOrderModalOpen(false);
                  setIsAddItemsModalOpen(false);
                  setCustomizingMenuItem(null);
                }}
                className="p-1 rounded-lg text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {isNewOrderModalOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#F0E4D8]">
                  <div>
                    <label className="text-xs font-bold text-[#2C1D11] block mb-1">Nama Tamu / Pelanggan:</label>
                    <input
                      type="text"
                      value={customerNameInput}
                      onChange={(e) => setCustomerNameInput(e.target.value)}
                      placeholder="Contoh: Pak Radit (4 Orang)"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#2C1D11] block mb-1">Waitress Bertugas:</label>
                    <input
                      type="text"
                      value={waitressNameInput}
                      onChange={(e) => setWaitressNameInput(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                    />
                  </div>
                </div>
              )}

              {/* Menu Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C705A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMenuQuery}
                  onChange={(e) => setSearchMenuQuery(e.target.value)}
                  placeholder="Ketik nama menu, kopi, steak, atau snack..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
              </div>

              {/* Available Menu Catalog Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#7A614D] uppercase tracking-wider block">
                  Pilih Menu untuk Dikustomisasi:
                </span>
                <div className="max-h-48 overflow-y-auto divide-y divide-[#F0E4D8] border border-[#E3D3C4] rounded-xl p-2 bg-stone-50/50">
                  {filteredCatalog.map((item) => (
                    <div key={item.id} className="py-2 px-1 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-[#2C1D11] block">{item.name}</span>
                        <div className="text-[11px] text-[#7D4F27] font-semibold flex items-center gap-2">
                          <span>{formatRupiah(item.price)}</span>
                          <span className="text-stone-400">•</span>
                          <span className="text-stone-600">{item.category}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                            Large +{formatRupiah(item.largePriceAddition || 6000)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartCustomize(item)}
                        disabled={!item.inStock}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white disabled:bg-stone-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Pilih</span>
                        <SlidersHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ITEM CUSTOMIZER CARD (If user clicked + Pilih) */}
              {customizingMenuItem && (
                <div className="p-4 rounded-2xl bg-[#FFF9F2] border-2 border-[#7D4F27] space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAD3BE]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D4F27]">Kustomisasi Pesanan:</span>
                      <h4 className="font-bold text-sm text-[#2C1D11]">{customizingMenuItem.name}</h4>
                    </div>
                    <button
                      onClick={() => setCustomizingMenuItem(null)}
                      className="text-stone-400 hover:text-stone-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. DETAIL PORSI (REGULER vs LARGE) */}
                  <div>
                    <label className="text-xs font-bold text-[#2C1D11] block mb-1.5">
                      Pilihan Ukuran Porsi:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormPortion('Reguler')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex justify-between items-center ${
                          formPortion === 'Reguler'
                            ? 'bg-[#7D4F27] text-white border-[#7D4F27] shadow-xs'
                            : 'bg-white text-[#2C1D11] border-[#E3D3C4]'
                        }`}
                      >
                        <span>Porsi Reguler</span>
                        <span>{formatRupiah(customizingMenuItem.price)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormPortion('Large')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex justify-between items-center ${
                          formPortion === 'Large'
                            ? 'bg-[#7D4F27] text-white border-[#7D4F27] shadow-xs'
                            : 'bg-white text-[#2C1D11] border-[#E3D3C4]'
                        }`}
                      >
                        <span>Porsi Large</span>
                        <span>{formatRupiah(customizingMenuItem.price + (customizingMenuItem.largePriceAddition || 6000))}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. ADD REQUEST: MINUMAN (SUGAR & ICE LEVEL) */}
                  {(customizingMenuItem.category === 'Kopi' || customizingMenuItem.category === 'Non-Kopi') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#2C1D11] block mb-1">Level Gula (Sugar Request):</label>
                        <select
                          value={formSugar}
                          onChange={(e) => setFormSugar(e.target.value as SugarLevel)}
                          className="w-full text-xs p-2 rounded-xl border border-[#E3D3C4] bg-white font-medium"
                        >
                          <option value="Normal Sugar">Normal Sugar (100%)</option>
                          <option value="Less Sugar (50%)">Less Sugar (50%)</option>
                          <option value="Low Sugar (25%)">Low Sugar (25%)</option>
                          <option value="No Sugar (0%)">No Sugar (0%)</option>
                          <option value="Extra Sweet">Extra Sweet</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#2C1D11] block mb-1">Suhu & Es (Ice Request):</label>
                        <select
                          value={formIce}
                          onChange={(e) => setFormIce(e.target.value as IceLevel)}
                          className="w-full text-xs p-2 rounded-xl border border-[#E3D3C4] bg-white font-medium"
                        >
                          <option value="Normal Ice">Normal Ice</option>
                          <option value="Less Ice">Less Ice</option>
                          <option value="No Ice">No Ice (Dingin Tanpa Es)</option>
                          <option value="Hot / Panas">Hot / Panas</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 3. ADD REQUEST: MAKANAN (SPICY LEVEL) */}
                  {(customizingMenuItem.category === 'Makanan Berat' || customizingMenuItem.category === 'Makanan Ringan') && (
                    <div>
                      <label className="text-xs font-bold text-[#2C1D11] block mb-1 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-red-600" /> Tingkat Kepedasan:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['Tidak Pedas', 'Pedas Sedang', 'Pedas Mantap', 'Extra Pedas'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setFormSpicy(lvl as SpicyLevel)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                              formSpicy === lvl
                                ? 'bg-red-600 text-white border-red-700'
                                : 'bg-white text-stone-700 border-[#E3D3C4]'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. TOPPING / ADD-ONS */}
                  <div>
                    <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                      Add-ons / Topping Tambahan:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(customizingMenuItem.category === 'Kopi' || customizingMenuItem.category === 'Non-Kopi'
                        ? ['Extra Espresso Shot (+6k)', 'Whipped Cream (+5k)', 'Oat Milk Swap (+6k)']
                        : ['Telur Mata Sapi (+6k)', 'Ekstra Keju (+7k)', 'Ekstra Sambal (+4k)']
                      ).map((addon) => {
                        const isSelected = formAddOns.includes(addon);
                        return (
                          <button
                            key={addon}
                            type="button"
                            onClick={() => {
                              if (isSelected) setFormAddOns(formAddOns.filter((a) => a !== addon));
                              else setFormAddOns([...formAddOns, addon]);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              isSelected
                                ? 'bg-[#7D4F27] text-white border-[#7D4F27]'
                                : 'bg-white text-stone-700 border-[#E3D3C4]'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {addon}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. NOTES & QUANTITY */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-[#2C1D11] block mb-1">Catatan Tambahan Khusus:</label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Misal: saus dipisah, jangan pakai bawang, kuah lebih gurih..."
                        className="w-full text-xs p-2 rounded-lg border border-[#E3D3C4] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#2C1D11] block mb-1">Jumlah Porsi:</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormQty((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{formQty}</span>
                        <button
                          type="button"
                          onClick={() => setFormQty((q) => q + 1)}
                          className="w-8 h-8 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirm item customization */}
                  <div className="pt-2 border-t border-[#EAD3BE] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Subtotal Item:</span>
                      <span className="text-sm font-extrabold text-[#7D4F27]">
                        {formatRupiah(calculateCustomizedPrice(customizingMenuItem, formPortion, formAddOns) * formQty)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmAddDraft}
                      className="px-4 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Masukkan ke Daftar Pesanan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CURRENT PICKED ITEMS LIST */}
              {pickedDrafts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F0E4D8]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#2C1D11]">
                      Ringkasan Item Pesanan ({pickedDrafts.length} item):
                    </h4>
                    <span className="text-xs font-extrabold text-[#7D4F27]">
                      Total: {formatRupiah(totalDraftPrice)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {pickedDrafts.map((d) => (
                      <div key={d.tempId} className="p-3 rounded-xl bg-[#FBF8F5] border border-[#E3D3C4] flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#7D4F27]">{d.qty}x</span>
                            <span className="font-bold text-xs text-[#2C1D11]">{d.item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold uppercase">
                              {d.portionSize}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#7A614D]">
                            {d.sugarLevel && <span>• {d.sugarLevel}</span>}
                            {d.iceLevel && <span>• {d.iceLevel}</span>}
                            {d.spicyLevel && <span>• {d.spicyLevel}</span>}
                            {d.addOns.length > 0 && <span>• Add-ons: {d.addOns.join(', ')}</span>}
                            {d.notes && <span className="italic text-stone-500">(&quot;{d.notes}&quot;)</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2C1D11]">
                            {formatRupiah(d.unitPrice * d.qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraft(d.tempId)}
                            className="p-1 rounded text-stone-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FBF8F5] border-t border-[#E3D3C4] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsNewOrderModalOpen(false);
                  setIsAddItemsModalOpen(false);
                  setCustomizingMenuItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl"
              >
                Batal
              </button>
              <button
                disabled={pickedDrafts.length === 0}
                onClick={isNewOrderModalOpen ? handleSaveNewOrder : handleSaveAdditionalItems}
                className="px-5 py-2.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-bold shadow-md disabled:bg-stone-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isNewOrderModalOpen 
                    ? `Kirim Pesanan (${pickedDrafts.length} Menu) ke Dapur` 
                    : `Tambahkan ${pickedDrafts.length} Menu ke Meja`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Order Reason */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E3D3C4] p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-[#2C1D11]">
                Konfirmasi Batalkan Pesanan
              </h3>
            </div>
            <p className="text-xs text-[#7A614D]">
              Apakah Anda yakin ingin membatalkan pesanan <strong>{activeOrderForTable?.orderNumber}</strong> di Meja #{selectedTable?.number}? Meja akan dikembalikan statusnya menjadi kosong.
            </p>

            <div>
              <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                Alasan Pembatalan (Wajib):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Tamu ganti pikiran, pesanan duplikat, atau pindah meja..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Kembali
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm disabled:bg-stone-300 transition-all cursor-pointer"
              >
                Ya, Batalkan Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
