import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { 
  TableInfo, 
  MenuItem, 
  OrderItem, 
  PortionSize, 
  SugarLevel, 
  IceLevel, 
  SpicyLevel,
  DEFAULT_CATEGORY_ADDONS
} from '../types';
import { formatRupiah, formatShortTime, getElapsedMinutes } from '../utils/formatters';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus,
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
  CheckCheck,
  Smartphone,
  List,
  Grid,
  ShoppingBag,
  ChevronDown
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
    markStationItemsServed,
    markAllOrderItemsServed,
    markOrderServed,
    markOrderCompleted,
    addTable
  } = useCafe();

  const [viewMode, setViewMode] = useState<'tables' | 'orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Add Table / Overflow modal state
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState<number>(31);
  const [newTableCap, setNewTableCap] = useState<number>(4);
  const [newTableSec, setNewTableSec] = useState<string>('Meja Cadangan / Overflow');

  // Order creation/addition state
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [waitressNameInput, setWaitressNameInput] = useState('Siti Rahma');
  const [pickedDrafts, setPickedDrafts] = useState<PickedDraftItem[]>([]);
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

  // Mobile-first catalog browsing preferences
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuLayoutMode, setMenuLayoutMode] = useState<'cards' | 'list'>('cards');
  const [isLargeTouchMode, setIsLargeTouchMode] = useState<boolean>(true);
  const [isCartReviewOpen, setIsCartReviewOpen] = useState<boolean>(false);

  // Item customizer sub-modal inside order creation
  const [customizingMenuItem, setCustomizingMenuItem] = useState<MenuItem | null>(null);
  const [formPortion, setFormPortion] = useState<PortionSize>('Reguler');
  const [formSugar, setFormSugar] = useState<SugarLevel>('Normal Sugar');
  const [formIce, setFormIce] = useState<IceLevel>('Normal Ice');
  const [formSpicy, setFormSpicy] = useState<SpicyLevel>('Pedas Sedang');
  const [formAddOns, setFormAddOns] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formQty, setFormQty] = useState(1);

  // Image loading errors tracker to gracefully show icon fallback
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

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

  const categories = [
    { id: 'all', label: 'Semua', count: menuItems.length, icon: '🍽️' },
    { id: 'Kopi', label: 'Kopi', count: menuItems.filter(m => m.category === 'Kopi').length, icon: '☕' },
    { id: 'Non-Kopi', label: 'Non-Kopi', count: menuItems.filter(m => m.category === 'Non-Kopi').length, icon: '🥤' },
    { id: 'Makanan Berat', label: 'Makanan Utama', count: menuItems.filter(m => m.category === 'Makanan Berat').length, icon: '🥩' },
    { id: 'Makanan Ringan', label: 'Snack & Pastry', count: menuItems.filter(m => m.category === 'Makanan Ringan').length, icon: '🥐' },
  ];

  const filteredCatalog = menuItems.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = !searchMenuQuery.trim() || 
      m.name.toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchMenuQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
    if (portion === 'Large' && item.hasLargePortion !== false) {
      price += item.largePriceAddition || (item.category === 'Makanan Berat' ? 12000 : 6000);
    }
    const available = (item.availableAddOns && item.availableAddOns.length > 0)
      ? item.availableAddOns
      : (DEFAULT_CATEGORY_ADDONS[item.category] || []);

    addOns.forEach((addon) => {
      const matched = available.find(
        (a) => addon === a.name || addon.startsWith(a.name) || addon.includes(a.name)
      );
      if (matched) {
        price += matched.price;
      } else if (addon.includes('Espresso') || addon.includes('Telur') || addon.includes('Oat')) {
        price += 6000;
      } else if (addon.includes('Keju') || addon.includes('Truffle')) {
        price += 7000;
      } else if (addon.includes('Whipped') || addon.includes('Sambal')) {
        price += 5000;
      } else {
        price += 5000;
      }
    });
    return price;
  };

  // Quick add 1 standard item without modal
  const handleQuickAdd = (item: MenuItem) => {
    if (!item.inStock) return;
    const existingIndex = pickedDrafts.findIndex(
      (d) => d.item.id === item.id && d.portionSize === 'Reguler' && !d.notes && d.addOns.length === 0
    );

    if (existingIndex >= 0) {
      setPickedDrafts((prev) =>
        prev.map((d, i) => (i === existingIndex ? { ...d, qty: d.qty + 1 } : d))
      );
    } else {
      const newDraft: PickedDraftItem = {
        tempId: `draft-${Date.now()}-${Math.random().toString().slice(-4)}`,
        item,
        portionSize: 'Reguler',
        sugarLevel: (item.category === 'Kopi' || item.category === 'Non-Kopi') ? 'Normal Sugar' : undefined,
        iceLevel: (item.category === 'Kopi' || item.category === 'Non-Kopi') 
          ? (item.tags.includes('Hot') ? 'Hot / Panas' : 'Normal Ice') 
          : undefined,
        spicyLevel: (item.category === 'Makanan Berat' || item.category === 'Makanan Ringan') ? 'Pedas Sedang' : undefined,
        addOns: [],
        notes: '',
        unitPrice: item.price,
        qty: 1,
      };
      setPickedDrafts((prev) => [...prev, newDraft]);
    }
  };

  // Decrement draft quantity from card
  const handleQuickDecrement = (item: MenuItem) => {
    let existingIndex = -1;
    for (let i = pickedDrafts.length - 1; i >= 0; i--) {
      if (pickedDrafts[i].item.id === item.id) {
        existingIndex = i;
        break;
      }
    }
    if (existingIndex >= 0) {
      const existing = pickedDrafts[existingIndex];
      if (existing.qty > 1) {
        setPickedDrafts((prev) =>
          prev.map((d, i) => (i === existingIndex ? { ...d, qty: d.qty - 1 } : d))
        );
      } else {
        setPickedDrafts((prev) => prev.filter((_, i) => i !== existingIndex));
      }
    }
  };

  const getDraftCountForItem = (itemId: string) => {
    return pickedDrafts
      .filter((d) => d.item.id === itemId)
      .reduce((sum, d) => sum + d.qty, 0);
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

  const handleUpdateDraftQty = (tempId: string, delta: number) => {
    setPickedDrafts((prev) =>
      prev
        .map((d) => {
          if (d.tempId === tempId) {
            const nextQty = d.qty + delta;
            return nextQty > 0 ? { ...d, qty: nextQty } : null;
          }
          return d;
        })
        .filter(Boolean) as PickedDraftItem[]
    );
  };

  const handleOpenNewOrder = (table: TableInfo) => {
    setSelectedTable(table);
    setCustomerNameInput('');
    setPickedDrafts([]);
    setSearchMenuQuery('');
    setSelectedCategory('all');
    setIsCartReviewOpen(false);
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
    const table = selectedTable || tables.find((t) => t.status === 'available') || tables[0];
    if (!table || pickedDrafts.length === 0) return;

    const orderItems = buildOrderItems();

    createOrder({
      tableNumber: table.number,
      customerName: customerNameInput.trim() || `Tamu Meja #${table.number}`,
      items: orderItems,
      waitressName: waitressNameInput,
    });

    setIsNewOrderModalOpen(false);
    setIsCartReviewOpen(false);
    setSelectedTable(null);
    setPickedDrafts([]);
  };

  // Submit additional items to existing table order
  const handleSaveAdditionalItems = () => {
    if (!activeOrderForTable || pickedDrafts.length === 0) return;

    const additionalItems = buildOrderItems();

    addItemsToOrder(activeOrderForTable.id, additionalItems);
    setIsAddItemsModalOpen(false);
    setIsCartReviewOpen(false);
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

  const handleOpenAddTableModal = () => {
    const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 31;
    setNewTableNum(nextNum);
    setNewTableCap(4);
    setNewTableSec('Meja Cadangan / Overflow');
    setIsAddTableModalOpen(true);
  };

  const handleSaveNewTable = () => {
    addTable({
      number: Number(newTableNum),
      capacity: Number(newTableCap),
      section: newTableSec.trim() || 'Meja Cadangan / Overflow',
    });
    setIsAddTableModalOpen(false);
  };

  const totalDraftPrice = pickedDrafts.reduce((sum, d) => sum + d.unitPrice * d.qty, 0);
  const totalDraftQty = pickedDrafts.reduce((sum, d) => sum + d.qty, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Top Bar Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FAEDCD] flex items-center justify-center text-[#7D4F27] shrink-0">
            <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-[#2C1D11]">
                Kitchen & Bar Order
              </h1>
            </div>
            <p className="text-xs text-[#7A614D] line-clamp-1">
              Pemesanan meja, porsi Reguler/Large, level gula, es, dan pedas.
            </p>
          </div>
        </div>

        {/* Quick Action & Occupancy Indicator */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              {availableCount} Kosong
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              {occupiedCount} Terisi
            </span>
          </div>

          <button
            onClick={() => {
              const defaultTbl = tables.find((t) => t.status === 'available') || tables[0];
              handleOpenNewOrder(defaultTbl);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pesanan Cepat</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Layout Meja vs Data Pemesanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-[#E3D3C4] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="btn-view-tables"
            onClick={() => setViewMode('tables')}
            className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'tables'
                ? 'bg-[#7D4F27] text-white shadow-xs'
                : 'bg-[#FAF6F2] text-[#6B513C] hover:bg-[#F3EBE3]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Tata Letak (30 Meja)</span>
          </button>

          <button
            id="btn-view-orders"
            onClick={() => setViewMode('orders')}
            className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'orders'
                ? 'bg-[#7D4F27] text-white shadow-xs'
                : 'bg-[#FAF6F2] text-[#6B513C] hover:bg-[#F3EBE3]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Data Pesanan</span>
            {activeOrders.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                viewMode === 'orders' ? 'bg-amber-400 text-stone-900' : 'bg-[#7D4F27] text-white'
              }`}>
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-[#7A614D] px-2 flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 font-medium">Status Cepat:</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            ✓ Siap Saji
          </span>
          <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
            ✓ Orderan Selesai
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
            const defaultTbl = tables.find((t) => t.status === 'available') || tables[0];
            handleOpenNewOrder(defaultTbl);
          }}
        />
      ) : (
        <>
          {/* Table Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-[#E3D3C4]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-[#5A3E29] shrink-0 mr-1 flex items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5 text-[#7D4F27]" /> Meja:
              </span>
              {[
                { key: 'all', label: `Semua (${tables.length})` },
                { key: 'available', label: `Kosong (${availableCount})` },
                { key: 'occupied', label: `Terisi (${occupiedCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTableStatusFilter(tab.key as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    tableStatusFilter === tab.key
                      ? 'bg-[#7D4F27] text-white shadow-xs'
                      : 'bg-[#FAF6F2] text-[#6B513C] hover:bg-[#F3EBE3]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#8C705A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  placeholder="Cari meja..."
                  className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
                {tableSearchQuery && (
                  <button
                    onClick={() => setTableSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenAddTableModal}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
                title="Tambah meja darurat/cadangan saat kafe penuh"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Meja</span>
              </button>
            </div>
          </div>

          {/* Table Grid Matrix (30 Tables) */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3">
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
                    onClick={() => {
                      setSelectedTable(table);
                      if (isOccupied) {
                        setIsAddItemsModalOpen(true);
                      } else {
                        handleOpenNewOrder(table);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[125px] sm:min-h-[135px] active:scale-[0.98] ${
                      isOccupied
                        ? 'bg-white border-[#D4A373] shadow-md hover:border-[#7D4F27]'
                        : 'bg-[#FBF8F5] border-[#E3D3C4] hover:bg-white hover:border-[#A8713D]'
                    } ${selectedTable?.number === table.number ? 'ring-2 ring-[#7D4F27]' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base sm:text-lg font-extrabold text-[#2C1D11]">
                          Meja #{table.number}
                        </span>
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
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
                        <div className="text-xs font-extrabold text-[#2C1D11]">
                          {formatRupiah(tableOrder.total)}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(() => {
                            const barReady = tableOrder.items.some((it) => (it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi') && it.status === 'ready' && !it.served);
                            const kitchenReady = tableOrder.items.some((it) => (it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat') && it.status === 'ready' && !it.served);

                            if (barReady && kitchenReady) {
                              return (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5 animate-pulse">
                                  ✨ Lengkap Siap!
                                </span>
                              );
                            }
                            if (barReady) {
                              return (
                                <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5 animate-pulse">
                                  ☕ Minuman Siap!
                                </span>
                              );
                            }
                            if (kitchenReady) {
                              return (
                                <span className="text-[10px] font-black text-orange-900 bg-orange-100 border border-orange-300 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5 animate-pulse">
                                  🍳 Makanan Siap!
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 inline-block truncate max-w-full">
                                {tableOrder.items.length} item
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-center">
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block">
                          + Buka Meja
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
            <div className="bg-white rounded-2xl border border-[#D4A373] p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3D3C4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#7D4F27] text-white flex items-center justify-center font-bold text-lg">
                    #{selectedTable.number}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#2C1D11]">
                      Meja #{selectedTable.number} ({selectedTable.section})
                    </h3>
                    <p className="text-xs text-[#7A614D]">
                      Kapasitas: {selectedTable.capacity} Tamu • Status:{' '}
                      <strong className={activeOrderForTable ? 'text-amber-700' : 'text-emerald-700'}>
                        {activeOrderForTable ? 'Sedang Terisi' : 'Kosong (Siap Ditempati)'}
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTable(null)}
                  className="self-end sm:self-center p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* If Table has active order */}
              {activeOrderForTable ? (() => {
                const barItems = activeOrderForTable.items.filter((it) => it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi');
                const kitchenItems = activeOrderForTable.items.filter((it) => it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat');

                const unservedBarReady = barItems.filter((it) => it.status === 'ready' && !it.served);
                const unservedKitchenReady = kitchenItems.filter((it) => it.status === 'ready' && !it.served);
                const unservedKitchenPending = kitchenItems.filter((it) => !it.served && it.status !== 'ready');
                const hasReadyItems = unservedBarReady.length > 0 || unservedKitchenReady.length > 0;

                return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#FBF8F5] p-3 rounded-xl border border-[#E3D3C4]">
                    <div>
                      <span className="text-[11px] text-[#8A715C]">Nomor Pesanan:</span>
                      <p className="text-xs sm:text-sm font-bold text-[#2C1D11] truncate">{activeOrderForTable.orderNumber}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8A715C]">Pelanggan:</span>
                      <p className="text-xs sm:text-sm font-bold text-[#2C1D11] truncate">{activeOrderForTable.customerName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8A715C]">Waktu Dibuat:</span>
                      <p className="text-xs sm:text-sm font-bold text-[#2C1D11]">
                        {formatShortTime(activeOrderForTable.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8A715C]">Total Tagihan:</span>
                      <p className="text-sm sm:text-base font-extrabold text-[#7D4F27]">
                        {formatRupiah(activeOrderForTable.total)}
                      </p>
                    </div>
                  </div>

                  {/* Fast Drink Ready Alert Banner */}
                  {unservedBarReady.length > 0 && unservedKitchenPending.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
                          ☕
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                            <span>Minuman Bar Selesai Lebih Awal! ({unservedBarReady.length} Minuman)</span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-black">RACIKAN BARISTA SIAP</span>
                          </div>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Minuman lebih cepat dibuat dibandingkan memasak makanan. Antar minuman ke Meja #{selectedTable.number} sekarang selagi segar tanpa harus menunggu masakan dapur.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => markStationItemsServed(activeOrderForTable.id, 'bar')}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Antar Minuman Duluan</span>
                      </button>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#5A3E29] uppercase tracking-wider flex items-center gap-2">
                        <span>Daftar Pesanan ({activeOrderForTable.items.length} Menu)</span>
                        {unservedBarReady.length > 0 && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            ☕ {unservedBarReady.length} Minuman Siap Saji
                          </span>
                        )}
                        {unservedKitchenReady.length > 0 && (
                          <span className="text-[10px] font-bold text-orange-900 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded-full">
                            🍳 {unservedKitchenReady.length} Makanan Siap Saji
                          </span>
                        )}
                      </h4>
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
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-[#2C1D11]">
                                  {it.quantity}x {it.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF6F2] text-[#7D4F27] border border-[#E3D3C4] font-medium">
                                  {it.portionSize}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  it.status === 'ready'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : it.status === 'cooking'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {it.status === 'ready' ? 'Siap Saji' : it.status === 'cooking' ? 'Sedang Dimasak' : 'Menunggu'}
                                </span>
                              </div>

                              {it.customization && (
                                <div className="flex flex-wrap gap-1 text-[11px] text-[#7A614D]">
                                  {it.customization.sugarLevel && <span>• {it.customization.sugarLevel}</span>}
                                  {it.customization.iceLevel && <span>• {it.customization.iceLevel}</span>}
                                  {it.customization.spicyLevel && <span>• {it.customization.spicyLevel}</span>}
                                  {it.customization.addOns && it.customization.addOns.length > 0 && (
                                    <span>• Add: {it.customization.addOns.join(', ')}</span>
                                  )}
                                  {it.customization.notes && (
                                    <span className="text-stone-500 italic">
                                      &quot;{it.customization.notes}&quot;
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                              <span className="text-xs sm:text-sm font-bold text-[#5A3E29]">
                                {formatRupiah(it.price * it.quantity)}
                              </span>

                              {it.served ? (
                                <button
                                  onClick={() => markItemServed(activeOrderForTable.id, it.id, false)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Disajikan</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => markItemServed(activeOrderForTable.id, it.id, true)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 ${
                                    isReady
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-400'
                                  }`}
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
                    <button
                      id="btn-mark-order-served"
                      onClick={() => markOrderServed(activeOrderForTable.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeOrderForTable.status === 'served' || (activeOrderForTable.items.length > 0 && activeOrderForTable.items.every((it) => it.served))
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>
                        {activeOrderForTable.status === 'served' || (activeOrderForTable.items.length > 0 && activeOrderForTable.items.every((it) => it.served))
                          ? '✓ Makanan Sudah Disajikan'
                          : 'Makanan Sudah Disajikan'}
                      </span>
                    </button>

                    <button
                      id="btn-mark-order-completed"
                      onClick={() => markOrderCompleted(activeOrderForTable.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeOrderForTable.status === 'completed'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white'
                      }`}
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{activeOrderForTable.status === 'completed' ? '✓ Orderan Selesai' : 'Orderan Selesai'}</span>
                    </button>

                    {/* Separate action buttons for serving Bar vs Kitchen */}
                    {unservedBarReady.length > 0 ? (
                      <button
                        onClick={() => markStationItemsServed(activeOrderForTable.id, 'bar')}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        title="Antar semua racikan minuman yang sudah siap ke meja tamu"
                      >
                        <Coffee className="w-4 h-4" />
                        <span>☕ Antar Minuman Saja ({unservedBarReady.length})</span>
                      </button>
                    ) : activeOrderForTable.items.some(it => (it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi') && it.status === 'ready') ? (
                      <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold border border-emerald-300 flex items-center gap-1.5 select-none cursor-not-allowed">
                        <CheckCheck className="w-4 h-4 text-emerald-700" />
                        <span>✓✓ Minuman Selesai Diantar</span>
                      </span>
                    ) : null}

                    {unservedKitchenReady.length > 0 ? (
                      <button
                        onClick={() => markStationItemsServed(activeOrderForTable.id, 'kitchen')}
                        className="px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        title="Antar semua masakan dapur yang sudah matang ke meja tamu"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>🍳 Antar Makanan Saja ({unservedKitchenReady.length})</span>
                      </button>
                    ) : activeOrderForTable.items.some(it => (it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat') && it.status === 'ready') ? (
                      <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold border border-emerald-300 flex items-center gap-1.5 select-none cursor-not-allowed">
                        <CheckCheck className="w-4 h-4 text-emerald-700" />
                        <span>✓✓ Makanan Selesai Diantar</span>
                      </span>
                    ) : null}

                    {hasReadyItems ? (
                      <button
                        onClick={() => markAllOrderItemsServed(activeOrderForTable.id)}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        title="Antar seluruh menu yang sudah siap saji sekaligus"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Antar Semua Siap Saji</span>
                      </button>
                    ) : activeOrderForTable.items.length > 0 && activeOrderForTable.items.every(it => it.status === 'ready' || it.served) ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-200 text-emerald-950 text-xs font-extrabold border border-emerald-400 flex items-center gap-1.5 select-none cursor-not-allowed">
                        <CheckCheck className="w-4 h-4 text-emerald-800" />
                        <span>✓✓ Semua Proses Selesai & Terantar</span>
                      </span>
                    ) : null}

                    <button
                      id="btn-waitress-add-items"
                      onClick={() => {
                        setPickedDrafts([]);
                        setSearchMenuQuery('');
                        setSelectedCategory('all');
                        setIsCartReviewOpen(false);
                        setIsAddItemsModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Menu (Add Order)</span>
                    </button>

                    <button
                      id="btn-waitress-cancel-order"
                      onClick={() => setIsCancelModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Batalkan Pesanan</span>
                    </button>
                  </div>
                </div>
              );
            })() : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs sm:text-sm text-[#7A614D]">
                    Meja #{selectedTable.number} ({selectedTable.section}) kosong dan siap ditempati tamu.
                  </p>
                  <button
                    id="btn-open-new-order"
                    onClick={() => handleOpenNewOrder(selectedTable)}
                    className="px-6 py-3 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-sm font-extrabold shadow-md transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Buat Pesanan Baru (Pilih Menu)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* FULL-SCREEN RESPONSIVE ORDER SHEET / MENU SELECTION MODAL */}
      {(isNewOrderModalOpen || isAddItemsModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
          <div className="bg-[#FBF8F5] w-full h-full sm:h-[94vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl border border-[#E3D3C4] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Top Order Sheet Header */}
            <div className="p-3.5 sm:p-4 bg-[#2C1D11] text-[#FFF5EA] shrink-0 flex items-center justify-between border-b border-[#4A321F]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#A8713D] text-white flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-xs">
                  #{selectedTable?.number || 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base leading-tight">
                      {isNewOrderModalOpen 
                        ? `Pesanan Baru - Meja #${selectedTable?.number || 1}` 
                        : `Tambah Menu - Meja #${selectedTable?.number || 1}`}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 font-semibold border border-emerald-700/50">
                      POS Waitress
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C4AD99] line-clamp-1">
                    {customerNameInput.trim() ? `Tamu: ${customerNameInput}` : 'Pilih menu makanan & minuman di bawah'}
                  </p>
                </div>
              </div>

              {/* View Control Buttons: Display Size & List/Grid Toggle */}
              <div className="flex items-center gap-2">
                {/* Scale mode toggle: Large Touch Mode vs Standard */}
                <button
                  type="button"
                  onClick={() => setIsLargeTouchMode((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isLargeTouchMode 
                      ? 'bg-amber-400 text-[#2C1D11] border-amber-300 font-extrabold shadow-sm' 
                      : 'bg-[#3F2B1B] text-[#D4A373] border-[#5A3E26]'
                  }`}
                  title="Aktifkan Mode Tombol & Teks Besar untuk Layar HP"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Mode Layar HP</span>
                  <span className="xs:hidden">Besar</span>
                </button>

                {/* View Mode: Card Grid vs Wide List */}
                <div className="hidden sm:flex items-center bg-[#3F2B1B] p-0.5 rounded-xl border border-[#5A3E26]">
                  <button
                    type="button"
                    onClick={() => setMenuLayoutMode('cards')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      menuLayoutMode === 'cards'
                        ? 'bg-[#7D4F27] text-white'
                        : 'text-[#B89F88] hover:text-white'
                    }`}
                    title="Tampilan Kartu Visual"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuLayoutMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      menuLayoutMode === 'list'
                        ? 'bg-[#7D4F27] text-white'
                        : 'text-[#B89F88] hover:text-white'
                    }`}
                    title="Tampilan Daftar Lebar"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsNewOrderModalOpen(false);
                    setIsAddItemsModalOpen(false);
                    setCustomizingMenuItem(null);
                    setIsCartReviewOpen(false);
                  }}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Guest Name & Table Selector Bar */}
            <div className="p-3 sm:px-5 bg-white border-b border-[#E3D3C4] shrink-0 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                {/* Table selector dropdown if multiple available */}
                {isNewOrderModalOpen && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-[#2C1D11] whitespace-nowrap">Meja:</span>
                    <select
                      value={selectedTable?.number || 1}
                      onChange={(e) => {
                        const tblNum = Number(e.target.value);
                        const found = tables.find((t) => t.number === tblNum);
                        if (found) setSelectedTable(found);
                      }}
                      className="text-xs sm:text-sm font-bold py-2 px-3 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:ring-1 focus:ring-[#7D4F27] focus:outline-none"
                    >
                      {tables.map((t) => (
                        <option key={t.number} value={t.number}>
                          Meja #{t.number} ({t.status === 'available' ? 'Kosong' : 'Terisi'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer name input */}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="Nama Tamu (Misal: Ibu Maya / Tamu Meja)"
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                  />
                </div>

                {/* Waitress Name Input */}
                <div className="hidden md:flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-stone-500 font-medium">Waitress:</span>
                  <input
                    type="text"
                    value={waitressNameInput}
                    onChange={(e) => setWaitressNameInput(e.target.value)}
                    className="text-xs py-2 px-2.5 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] w-28 text-stone-700"
                  />
                </div>
              </div>

              {/* Search Menu Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C705A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMenuQuery}
                  onChange={(e) => setSearchMenuQuery(e.target.value)}
                  placeholder="Cari kopi, mie aceh, steak, croissant, atau mocktail..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
                {searchMenuQuery && (
                  <button
                    onClick={() => setSearchMenuQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Scrollable Category Filter Bar (Large Thumb Hitboxes) */}
            <div className="px-3 sm:px-5 py-2.5 bg-[#FAF6F2] border-b border-[#E3D3C4] shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                      isActive
                        ? 'bg-[#7D4F27] text-white shadow-sm ring-1 ring-[#633C1B]'
                        : 'bg-white text-[#5A3E29] border border-[#E3D3C4] hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#FAF6F2] text-[#7D4F27]'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MAIN MENU CATALOG BODY */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              {filteredCatalog.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Coffee className="w-12 h-12 text-[#B89F88] mx-auto opacity-50" />
                  <p className="text-sm font-bold text-[#4A321F]">
                    Tidak ada menu yang sesuai dengan &quot;{searchMenuQuery}&quot;
                  </p>
                  <button
                    onClick={() => {
                      setSearchMenuQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#7D4F27] text-white text-xs font-bold"
                  >
                    Tampilkan Semua Menu
                  </button>
                </div>
              ) : menuLayoutMode === 'list' ? (
                /* WIDE TOUCH LIST VIEW */
                <div className="space-y-2.5">
                  {filteredCatalog.map((item) => {
                    const draftQty = getDraftCountForItem(item.id);
                    const isImgBroken = brokenImages[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          item.inStock
                            ? draftQty > 0
                              ? 'bg-amber-50/60 border-[#7D4F27] shadow-xs'
                              : 'bg-white border-[#E3D3C4] hover:border-[#7D4F27]'
                            : 'bg-stone-100 border-stone-200 opacity-60'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-[#E3D3C4]">
                          {!isImgBroken && item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-[#FAEDCD] to-[#D4A373]">
                              {item.category === 'Kopi' ? '☕' : item.category === 'Non-Kopi' ? '🥤' : '🍽️'}
                            </div>
                          )}
                          {draftQty > 0 && (
                            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                              {draftQty}x
                            </span>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-sm sm:text-base text-[#2C1D11] leading-tight truncate">
                              {item.name}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 uppercase">
                              {item.station}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A614D] line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm sm:text-base font-black text-[#7D4F27]">
                              {formatRupiah(item.price)}
                            </span>
                            {item.tags.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold hidden sm:inline">
                                {item.tags[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {item.inStock ? (
                            draftQty > 0 ? (
                              <div className="flex items-center gap-1 bg-[#FAF6F2] p-1 rounded-xl border border-[#E3D3C4]">
                                <button
                                  type="button"
                                  onClick={() => handleQuickDecrement(item)}
                                  className="w-9 h-9 rounded-lg bg-white border border-[#E3D3C4] flex items-center justify-center font-bold text-base active:scale-95 text-stone-700"
                                >
                                  -
                                </button>
                                <span className="w-7 text-center font-black text-sm text-[#7D4F27]">
                                  {draftQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(item)}
                                  className="w-9 h-9 rounded-lg bg-[#7D4F27] text-white flex items-center justify-center font-bold text-base active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartCustomize(item)}
                                  className="h-10 px-2.5 rounded-xl border border-[#D4A373] bg-[#FAF6F2] hover:bg-[#F3EBE3] text-[#7D4F27] text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  title="Kustomisasi porsi, gula, es"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(item)}
                                  className="h-10 px-3.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Pilih</span>
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                              Habis
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LARGE CARDS GRID VIEW (BEST FOR MOBILE PHONES) */
                <div className={`grid gap-3 sm:gap-4 ${
                  isLargeTouchMode 
                    ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                }`}>
                  {filteredCatalog.map((item) => {
                    const draftQty = getDraftCountForItem(item.id);
                    const isImgBroken = brokenImages[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs ${
                          item.inStock
                            ? draftQty > 0
                              ? 'bg-white border-[#7D4F27] ring-2 ring-[#7D4F27]/30 shadow-md'
                              : 'bg-white border-[#E3D3C4] hover:border-[#7D4F27] hover:shadow-sm'
                            : 'bg-stone-100 border-stone-200 opacity-60'
                        }`}
                      >
                        {/* Image Banner */}
                        <div 
                          onClick={() => item.inStock && handleStartCustomize(item)}
                          className="relative w-full h-36 xs:h-40 sm:h-44 bg-stone-200 overflow-hidden cursor-pointer group"
                        >
                          {!isImgBroken && item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[#FAEDCD] to-[#D4A373]">
                              {item.category === 'Kopi' ? '☕' : item.category === 'Non-Kopi' ? '🥤' : '🍽️'}
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Badges on Image */}
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                              {item.station}
                            </span>
                            {item.tags.length > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4A373] text-[#2C1D11] shadow-xs">
                                {item.tags[0]}
                              </span>
                            )}
                          </div>

                          {/* Draft counter badge */}
                          {draftQty > 0 && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 animate-pulse">
                              <Check className="w-3.5 h-3.5" />
                              <span>{draftQty}x Dipilih</span>
                            </div>
                          )}

                          {/* Price Tag Overlay on Image bottom */}
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                            <span className="text-base sm:text-lg font-black tracking-tight drop-shadow-md">
                              {formatRupiah(item.price)}
                            </span>
                            <span className="text-[11px] text-stone-200 font-medium drop-shadow-sm flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {item.prepTimeMinutes}m
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#2C1D11] leading-snug line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-xs text-[#7A614D] line-clamp-2 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Action Row */}
                          <div className="pt-2 border-t border-[#F0E4D8] flex items-center justify-between gap-2">
                            {item.inStock ? (
                              draftQty > 0 ? (
                                <div className="w-full flex items-center justify-between bg-[#FAF6F2] p-1 rounded-xl border border-[#E3D3C4]">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickDecrement(item)}
                                    className="min-h-[44px] w-12 rounded-lg bg-white border border-[#E3D3C4] flex items-center justify-center font-black text-lg text-stone-700 active:scale-95 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <div className="text-center">
                                    <span className="text-sm font-black text-[#7D4F27] block leading-none">
                                      {draftQty} Porsi
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-bold">
                                      {formatRupiah(item.price * draftQty)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdd(item)}
                                    className="min-h-[44px] w-12 rounded-lg bg-[#7D4F27] text-white flex items-center justify-center font-black text-lg active:scale-95 cursor-pointer shadow-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartCustomize(item)}
                                    className="min-h-[44px] px-3 rounded-xl border border-[#D4A373] bg-[#FAF6F2] hover:bg-[#F3EBE3] text-[#7D4F27] text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                    title="Kustomisasi Porsi, Gula, Es, Level Pedas"
                                  >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span>Kustom</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdd(item)}
                                    className="min-h-[44px] flex-1 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>+ Tambah</span>
                                  </button>
                                </>
                              )
                            ) : (
                              <div className="w-full py-2.5 text-center rounded-xl bg-stone-100 text-stone-500 font-bold text-xs">
                                Stok Saat Ini Habis
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STICKY BOTTOM FLOATING CART BAR (GRAB/TOAST POS STYLE FOR MOBILE) */}
            {pickedDrafts.length > 0 && (
              <div className="sticky bottom-0 z-30 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-[#E3D3C4] shadow-xl flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCartReviewOpen(true)}
                  className="flex items-center gap-3 text-left cursor-pointer flex-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#7D4F27] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    {totalDraftQty}
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-semibold block">
                      {pickedDrafts.length} Macam Menu Terpilih:
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#7D4F27] leading-tight">
                      {formatRupiah(totalDraftPrice)}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCartReviewOpen(true)}
                    className="min-h-[46px] px-4 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Lihat & Kirim</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* If no items picked yet, standard footer */}
            {pickedDrafts.length === 0 && (
              <div className="p-3 bg-[#FAF6F2] border-t border-[#E3D3C4] flex items-center justify-between text-xs text-[#7A614D] shrink-0">
                <span>Pilih menu di atas untuk menambahkan ke pesanan Meja #{selectedTable?.number || 1}.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOrderModalOpen(false);
                    setIsAddItemsModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-stone-600 hover:bg-stone-200 font-bold"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED ITEM CUSTOMIZER BOTTOM SHEET / DRAWER */}
      {customizingMenuItem && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E3D3C4] flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  {customizingMenuItem.category === 'Kopi' ? '☕' : customizingMenuItem.category === 'Non-Kopi' ? '🥤' : '🍽️'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                    {customizingMenuItem.name}
                  </h4>
                  <span className="text-xs text-[#D4A373] font-bold">
                    Harga Dasar: {formatRupiah(customizingMenuItem.price)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingMenuItem(null)}
                className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customizer Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              
              {/* 1. UKURAN PORSI (REGULER vs LARGE) */}
              {customizingMenuItem.hasLargePortion !== false && (
                <div>
                  <label className="text-xs sm:text-sm font-extrabold text-[#2C1D11] block mb-2">
                    Pilih Ukuran Porsi:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormPortion('Reguler')}
                      className={`min-h-[50px] p-3 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex flex-col justify-center cursor-pointer ${
                        formPortion === 'Reguler'
                          ? 'bg-[#7D4F27] text-white border-[#7D4F27] shadow-sm'
                          : 'bg-[#FAF6F2] text-[#2C1D11] border-[#E3D3C4] hover:bg-white'
                      }`}
                    >
                      <span>Porsi Reguler</span>
                      <span className={formPortion === 'Reguler' ? 'text-amber-200' : 'text-[#7D4F27]'}>
                        {formatRupiah(customizingMenuItem.price)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormPortion('Large')}
                      className={`min-h-[50px] p-3 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex flex-col justify-center cursor-pointer ${
                        formPortion === 'Large'
                          ? 'bg-[#7D4F27] text-white border-[#7D4F27] shadow-sm'
                          : 'bg-[#FAF6F2] text-[#2C1D11] border-[#E3D3C4] hover:bg-white'
                      }`}
                    >
                      <span>Porsi Large / Jumbo</span>
                      <span className={formPortion === 'Large' ? 'text-amber-200' : 'text-[#7D4F27]'}>
                        {formatRupiah(customizingMenuItem.price + (customizingMenuItem.largePriceAddition || (customizingMenuItem.category === 'Makanan Berat' ? 12000 : 6000)))}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. MINUMAN: LEVEL GULA & ES */}
              {(customizingMenuItem.category === 'Kopi' || customizingMenuItem.category === 'Non-Kopi') && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs sm:text-sm font-extrabold text-[#2C1D11] block mb-1.5">
                      Level Gula (Sugar Request):
                    </label>
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                      {(['Normal Sugar', 'Less Sugar (50%)', 'Low Sugar (25%)', 'No Sugar (0%)'] as SugarLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormSugar(lvl)}
                          className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                            formSugar === lvl
                              ? 'bg-[#7D4F27] text-white border-[#7D4F27]'
                              : 'bg-[#FAF6F2] text-stone-700 border-[#E3D3C4]'
                          }`}
                        >
                          {lvl.replace(' Sugar', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-extrabold text-[#2C1D11] block mb-1.5">
                      Suhu & Es (Ice Request):
                    </label>
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                      {(['Normal Ice', 'Less Ice', 'No Ice', 'Hot / Panas'] as IceLevel[]).map((ice) => (
                        <button
                          key={ice}
                          type="button"
                          onClick={() => setFormIce(ice)}
                          className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                            formIce === ice
                              ? 'bg-[#7D4F27] text-white border-[#7D4F27]'
                              : 'bg-[#FAF6F2] text-stone-700 border-[#E3D3C4]'
                          }`}
                        >
                          {ice}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MAKANAN: SPICY LEVEL */}
              {(customizingMenuItem.category === 'Makanan Berat' || customizingMenuItem.category === 'Makanan Ringan') && (
                <div>
                  <label className="text-xs sm:text-sm font-extrabold text-[#2C1D11] block mb-1.5 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600" /> Tingkat Kepedasan:
                  </label>
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                    {(['Tidak Pedas', 'Pedas Sedang', 'Pedas Mantap', 'Extra Pedas'] as SpicyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormSpicy(lvl)}
                        className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                          formSpicy === lvl
                            ? 'bg-red-600 text-white border-red-700'
                            : 'bg-[#FAF6F2] text-stone-700 border-[#E3D3C4]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. ADD-ONS / TOPPING */}
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-[#2C1D11] block mb-1.5">
                  Topping / Add-ons Tambahan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    const available = (customizingMenuItem.availableAddOns && customizingMenuItem.availableAddOns.length > 0)
                      ? customizingMenuItem.availableAddOns
                      : (DEFAULT_CATEGORY_ADDONS[customizingMenuItem.category] || []);

                    if (available.length === 0) {
                      return (
                        <div className="col-span-2 py-3 px-3 text-center bg-[#FAF6F2] rounded-xl text-stone-500 text-xs border border-[#E3D3C4]">
                          Tidak ada opsi add-on tambahan untuk menu ini.
                        </div>
                      );
                    }

                    return available.map((addon) => {
                      const addonLabel = `${addon.name} (+${formatRupiah(addon.price)})`;
                      const isSelected = formAddOns.includes(addonLabel) || formAddOns.includes(addon.name);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormAddOns(formAddOns.filter((a) => a !== addonLabel && a !== addon.name));
                            } else {
                              setFormAddOns([...formAddOns, addonLabel]);
                            }
                          }}
                          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100 text-[#7D4F27] border-[#7D4F27]'
                              : 'bg-[#FAF6F2] text-stone-700 border-[#E3D3C4] hover:border-[#7D4F27]'
                          }`}
                        >
                          <span className="truncate mr-1">{addon.name}</span>
                          <span className="shrink-0 font-extrabold text-[11px]">
                            {isSelected ? '✓ ' : '+ '}{formatRupiah(addon.price)}
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 5. NOTES & QUANTITY */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs sm:text-sm font-extrabold text-[#2C1D11] block mb-1">
                    Catatan Khusus untuk Dapur / Bar:
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Misal: jangan pakai seledri, kuah dipisah, ekstra panas..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs sm:text-sm font-extrabold text-[#2C1D11]">
                    Jumlah Porsi Menu Ini:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormQty((q) => Math.max(1, q - 1))}
                      className="w-11 h-11 rounded-xl bg-stone-200 hover:bg-stone-300 font-black text-lg flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-base text-[#2C1D11]">
                      {formQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormQty((q) => q + 1)}
                      className="w-11 h-11 rounded-xl bg-[#7D4F27] text-white hover:bg-[#633C1B] font-black text-lg flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customizer Action Footer */}
            <div className="p-4 bg-[#FAF6F2] border-t border-[#E3D3C4] flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-[11px] text-stone-500 font-semibold block">Subtotal Kustom:</span>
                <span className="text-base sm:text-lg font-black text-[#7D4F27]">
                  {formatRupiah(calculateCustomizedPrice(customizingMenuItem, formPortion, formAddOns) * formQty)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddDraft}
                className="min-h-[48px] px-5 sm:px-6 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Tambahkan ke Pesanan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART REVIEW DRAWER / SHEET (`isCartReviewOpen`) */}
      {isCartReviewOpen && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E3D3C4] flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7D4F27] text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                    Ringkasan Pesanan (Meja #{selectedTable?.number || 1})
                  </h4>
                  <p className="text-xs text-[#C4AD99]">
                    {pickedDrafts.length} Menu • {totalDraftQty} Porsi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartReviewOpen(false)}
                className="p-1.5 rounded-xl text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {pickedDrafts.map((d) => (
                <div 
                  key={d.tempId} 
                  className="p-3.5 rounded-2xl bg-[#FBF8F5] border border-[#E3D3C4] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#2C1D11]">
                        {d.item.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold uppercase">
                        {d.portionSize}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[11px] text-[#7A614D]">
                      {d.sugarLevel && <span>• {d.sugarLevel}</span>}
                      {d.iceLevel && <span>• {d.iceLevel}</span>}
                      {d.spicyLevel && <span>• {d.spicyLevel}</span>}
                      {d.addOns.length > 0 && <span>• Add: {d.addOns.join(', ')}</span>}
                      {d.notes && <span className="italic text-stone-600 block">(&quot;{d.notes}&quot;)</span>}
                    </div>

                    <span className="text-xs font-black text-[#7D4F27] block pt-0.5">
                      {formatRupiah(d.unitPrice * d.qty)} ({d.qty}x @ {formatRupiah(d.unitPrice)})
                    </span>
                  </div>

                  {/* Stepper + Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E3D3C4]">
                      <button
                        type="button"
                        onClick={() => handleUpdateDraftQty(d.tempId, -1)}
                        className="w-8 h-8 rounded-lg bg-[#FAF6F2] hover:bg-stone-200 font-black text-sm text-stone-700 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-xs text-[#2C1D11]">
                        {d.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateDraftQty(d.tempId, 1)}
                        className="w-8 h-8 rounded-lg bg-[#7D4F27] text-white font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDraft(d.tempId)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-4 bg-[#FAF6F2] border-t border-[#E3D3C4] space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-stone-600 font-medium">Total Tagihan ({totalDraftQty} Porsi):</span>
                <span className="text-lg sm:text-xl font-black text-[#7D4F27]">
                  {formatRupiah(totalDraftPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartReviewOpen(false)}
                  className="min-h-[48px] rounded-xl bg-white border border-[#E3D3C4] text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  + Tambah Menu Lain
                </button>

                <button
                  type="button"
                  disabled={pickedDrafts.length === 0}
                  onClick={isNewOrderModalOpen ? handleSaveNewOrder : handleSaveAdditionalItems}
                  className="min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:bg-stone-300"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {isNewOrderModalOpen ? 'Kirim ke Dapur' : 'Simpan Tambahan'}
                  </span>
                </button>
              </div>
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
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
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

      {/* MODAL: Add Backup/Overflow Table */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E3D3C4] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D3C4] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                  🪑
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2C1D11]">
                    Tambah Meja Cadangan / Overflow
                  </h3>
                  <p className="text-[11px] text-[#7A614D]">
                    Antisipasi penuhnya tamu dengan membuka meja darurat baru.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddTableModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                  Nomor Meja Cadangan:
                </label>
                <input
                  type="number"
                  min={1}
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Nomor meja baru akan langsung aktif dan bisa dipesan oleh waitress atau kasir.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                  Kapasitas Kursi (Orang):
                </label>
                <select
                  value={newTableCap}
                  onChange={(e) => setNewTableCap(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                >
                  <option value={2}>2 Orang (Couple / Kecil)</option>
                  <option value={4}>4 Orang (Standar)</option>
                  <option value={6}>6 Orang (Keluarga)</option>
                  <option value={8}>8 Orang (Grup Besar)</option>
                  <option value={10}>10 Orang (VIP / Gathering)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                  Keterangan / Area (Section):
                </label>
                <input
                  type="text"
                  value={newTableSec}
                  onChange={(e) => setNewTableSec(e.target.value)}
                  placeholder="Contoh: Outdoor Tambahan, VIP Cadangan, Indoor Samping Bar"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3D3C4]">
              <button
                onClick={() => setIsAddTableModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNewTable}
                className="px-4 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan & Aktifkan Meja</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
