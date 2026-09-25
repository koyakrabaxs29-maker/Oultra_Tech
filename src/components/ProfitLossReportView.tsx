import React, { useState, useMemo } from 'react';
import { useCafe } from '../context/CafeContext';
import { ExpenseCategory, OperationalExpense } from '../types';
import { formatRupiah, formatFullDateTime } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  PieChart, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  Printer, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Building2, 
  Coffee, 
  Users, 
  Zap, 
  Package, 
  Wrench, 
  Megaphone,
  X
} from 'lucide-react';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Gaji & Karyawan',
  'Sewa & Lokasi',
  'Utilitas (Listrik/Air/Wifi/Gas)',
  'Bahan Penunjang & Kebersihan',
  'Pemeliharaan & Alat',
  'Pemasaran & Lainnya',
];

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  'Gaji & Karyawan': <Users className="w-4 h-4 text-blue-600" />,
  'Sewa & Lokasi': <Building2 className="w-4 h-4 text-purple-600" />,
  'Utilitas (Listrik/Air/Wifi/Gas)': <Zap className="w-4 h-4 text-amber-600" />,
  'Bahan Penunjang & Kebersihan': <Package className="w-4 h-4 text-emerald-600" />,
  'Pemeliharaan & Alat': <Wrench className="w-4 h-4 text-orange-600" />,
  'Pemasaran & Lainnya': <Megaphone className="w-4 h-4 text-rose-600" />,
};

type PeriodOption = 'today' | '7days' | '30days' | 'all';

export const ProfitLossReportView: React.FC = () => {
  const { completedOrders, menuItems, expenses, addExpense, updateExpense, deleteExpense, clearAllExpenses } = useCafe();

  const [period, setPeriod] = useState<PeriodOption>('today');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    name: '',
    category: 'Gaji & Karyawan' as ExpenseCategory,
    amount: 100000,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return completedOrders.filter((order) => {
      const orderTime = new Date(order.updatedAt || order.createdAt).getTime();
      if (period === 'today') return orderTime >= todayStart;
      if (period === '7days') return orderTime >= sevenDaysAgo;
      if (period === '30days') return orderTime >= thirtyDaysAgo;
      return true; // 'all'
    });
  }, [completedOrders, period]);

  // Filter expenses by period
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return expenses.filter((exp) => {
      const expTime = new Date(exp.date).getTime();
      if (period === 'today') {
        return exp.date === todayStr || expTime >= todayStart;
      }
      if (period === '7days') return expTime >= sevenDaysAgo;
      if (period === '30days') return expTime >= thirtyDaysAgo;
      return true; // 'all'
    });
  }, [expenses, period]);

  // Financial Calculations
  const grossSales = filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalTax = filteredOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
  const totalServiceCharge = filteredOrders.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);
  const totalCashInflow = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Map menu item cost prices for COGS calculation
  const menuItemCostMap = useMemo(() => {
    const map: Record<string, number> = {};
    menuItems.forEach((item) => {
      // If menu item has costPrice specified, use it; otherwise estimate 35% of regular price
      map[item.id] = item.costPrice !== undefined ? item.costPrice : Math.round(item.price * 0.35);
    });
    return map;
  }, [menuItems]);

  // Calculate COGS (Harga Pokok Penjualan)
  const totalCOGS = useMemo(() => {
    let cost = 0;
    filteredOrders.forEach((order) => {
      order.items.forEach((it) => {
        const itemCost = menuItemCostMap[it.menuItemId] ?? Math.round(it.price * 0.35);
        cost += itemCost * it.quantity;
      });
    });
    return cost;
  }, [filteredOrders, menuItemCostMap]);

  // Gross Profit (Laba Kotor)
  const grossProfit = grossSales - totalCOGS;
  const grossMarginPercent = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : '0';

  // Operational Expenses (Beban Operasional)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Expenses grouped by Category
  const expensesByCategory = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      'Gaji & Karyawan': 0,
      'Sewa & Lokasi': 0,
      'Utilitas (Listrik/Air/Wifi/Gas)': 0,
      'Bahan Penunjang & Kebersihan': 0,
      'Pemeliharaan & Alat': 0,
      'Pemasaran & Lainnya': 0,
    };
    filteredExpenses.forEach((exp) => {
      if (map[exp.category] !== undefined) {
        map[exp.category] += exp.amount;
      }
    });
    return map;
  }, [filteredExpenses]);

  // Operating Net Profit / Loss (Laba / Rugi Bersih)
  const netProfit = grossProfit - totalExpenses;
  const isProfitable = netProfit >= 0;
  const netMarginPercent = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(1) : '0';

  // Category sales breakdown
  const categorySales = useMemo(() => {
    const map: Record<string, number> = {
      'Kopi': 0,
      'Non-Kopi': 0,
      'Makanan Ringan': 0,
      'Makanan Berat': 0,
    };
    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        if (map[it.category] !== undefined) {
          map[it.category] += it.price * it.quantity;
        }
      });
    });
    return map;
  }, [filteredOrders]);

  // Modal Handlers
  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      name: '',
      category: 'Gaji & Karyawan',
      amount: 50000,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp: OperationalExpense) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      name: exp.name,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      notes: exp.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = () => {
    if (!expenseForm.name.trim()) return;
    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        name: expenseForm.name,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        notes: expenseForm.notes,
      });
    } else {
      addExpense({
        name: expenseForm.name,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        notes: expenseForm.notes,
      });
    }
    setIsExpenseModalOpen(false);
  };

  // Export CSV P&L Statement
  const handleExportCSV = () => {
    const lines = [
      ['LAPORAN LABA RUGI (INCOME STATEMENT) - NADIRA CAFE & RESTO'],
      [`Periode: ${period.toUpperCase()}`],
      [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
      [''],
      ['KETERANGAN / POS KEUANGAN', 'NOMINAL (IDR)', 'PERSENTASE'],
      ['1. PENDAPATAN USAHA (REVENUE)'],
      ['   Penjualan Makanan & Minuman (Net Sales)', grossSales, '100%'],
      ['   PPN Restoran 10%', totalTax, ''],
      ['   Biaya Layanan (Service Charge 5%)', totalServiceCharge, ''],
      ['   TOTAL PENERIMAAN KAS', totalCashInflow, ''],
      [''],
      ['2. HARGA POKOK PENJUALAN (HPP / COGS)'],
      ['   Beban Bahan Baku & Produksi Menu', totalCOGS, `${grossSales > 0 ? ((totalCOGS / grossSales) * 100).toFixed(1) : 0}%`],
      ['   LABA KOTOR (GROSS PROFIT)', grossProfit, `${grossMarginPercent}%`],
      [''],
      ['3. BEBAN OPERASIONAL (OPERATIONAL EXPENSES)'],
      ...EXPENSE_CATEGORIES.map((cat) => [
        `   - ${cat}`,
        expensesByCategory[cat],
        `${grossSales > 0 ? ((expensesByCategory[cat] / grossSales) * 100).toFixed(1) : 0}%`
      ]),
      ['   TOTAL BEBAN OPERASIONAL (OPEX)', totalExpenses, `${grossSales > 0 ? ((totalExpenses / grossSales) * 100).toFixed(1) : 0}%`],
      [''],
      ['4. HASIL AKHIR (NET INCOME)'],
      [`   HASIL AKHIR: ${isProfitable ? 'LABA BERSIH (PROFIT)' : 'RUGI BERSIH (LOSS)'}`, netProfit, `${netMarginPercent}%`],
      [''],
      ['RINCIAN PENGELUARAN OPERASIONAL TERCATAT:'],
      ['Nama Pengeluaran', 'Kategori', 'Tanggal', 'Nominal (IDR)', 'Catatan'],
      ...filteredExpenses.map((e) => [
        `"${e.name}"`,
        e.category,
        e.date,
        e.amount,
        `"${e.notes || ''}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Laba_Rugi_NADIRA_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#E3D3C4] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#2C1D11]">
              Laporan Keuangan Laba Rugi (Profit & Loss Statement)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Executive View
            </span>
          </div>
          <p className="text-xs text-[#7A614D] mt-1">
            Analisis komprehensif omset penjualan, harga pokok bahan baku (HPP), beban operasional kafe, dan margin laba bersih.
          </p>
        </div>

        {/* Period Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#FBF8F5] p-1 rounded-xl border border-[#E3D3C4] text-xs font-semibold">
            {[
              { key: 'today', label: 'Hari Ini' },
              { key: '7days', label: '7 Hari' },
              { key: '30days', label: 'Bulan Ini' },
              { key: 'all', label: 'Semua' },
            ].map((p) => (
              <button
                key={p.key}
                id={`btn-period-${p.key}`}
                onClick={() => setPeriod(p.key as PeriodOption)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === p.key
                    ? 'bg-[#7D4F27] text-white shadow-xs font-bold'
                    : 'text-[#7A614D] hover:text-[#2C1D11]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            id="btn-add-expense"
            onClick={handleOpenAddExpense}
            className="px-3.5 py-2 rounded-xl bg-[#2C1D11] hover:bg-[#422B19] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Catat Pengeluaran</span>
          </button>

          <button
            id="btn-export-csv-pl"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#5A3E29] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV Laba Rugi"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#5A3E29] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Cetak Laporan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue, COGS, Gross Profit, OPEX, Net Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Penjualan Bersih */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
              Penjualan Bersih (Net Sales)
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2C1D11]">
            {formatRupiah(grossSales)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7A614D]">
            <span>Dari {filteredOrders.length} transaksi selesai</span>
            <span className="font-semibold text-emerald-600">100% Omset</span>
          </div>
        </div>

        {/* Card 2: HPP (COGS) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
              Beban Bahan Baku (HPP)
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Coffee className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900">
            {formatRupiah(totalCOGS)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7A614D]">
            <span>Biaya Pokok Menu</span>
            <span className="font-semibold text-amber-700">
              {grossSales > 0 ? ((totalCOGS / grossSales) * 100).toFixed(1) : 0}% dari Omset
            </span>
          </div>
        </div>

        {/* Card 3: Beban Operasional (OPEX) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
              Beban Operasional (OPEX)
            </span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-900">
            {formatRupiah(totalExpenses)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7A614D]">
            <span>Gaji, sewa, listrik, utilitas</span>
            <span className="font-semibold text-rose-600">
              {filteredExpenses.length} Pos Dicatat
            </span>
          </div>
        </div>

        {/* Card 4: Laba / Rugi Bersih (Net Profit/Loss) */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-1 ${
          isProfitable 
            ? 'bg-emerald-50/70 border-emerald-300' 
            : 'bg-rose-50/70 border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              isProfitable ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              {isProfitable ? 'Laba Bersih (Net Profit)' : 'Rugi Bersih (Net Loss)'}
            </span>
            <span className={`p-1.5 rounded-lg ${
              isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black ${
            isProfitable ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {formatRupiah(Math.abs(netProfit))}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-semibold ${isProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isProfitable ? 'STATUS: SURPLUS LABA' : 'STATUS: DEFISIT RUGI'}
            </span>
            <span className={`font-bold ${isProfitable ? 'text-emerald-800' : 'text-rose-800'}`}>
              Margin: {netMarginPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Structured Profit & Loss Statement Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Official Financial Income Statement (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0E4D8] pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#2C1D11]">
                Rincian Laporan Laba Rugi Komprehensif
              </h3>
              <span className="text-xs text-[#7A614D]">Format Standar Akuntansi Usaha Restoran & Kafe</span>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
              Periode: {period === 'today' ? 'Hari Ini' : period === '7days' ? '7 Hari Terakhir' : period === '30days' ? '30 Hari Terakhir' : 'Semua Waktu'}
            </span>
          </div>

          <div className="space-y-4 text-xs font-sans">
            
            {/* Section I: Revenue */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-[#FBF8F5] p-2.5 rounded-xl font-bold text-[#2C1D11] border border-[#E3D3C4]">
                <span className="text-sm uppercase tracking-wider text-[#7D4F27]">I. Pendapatan Usaha (Revenue)</span>
                <span className="text-sm">{formatRupiah(grossSales)}</span>
              </div>
              <div className="px-3 space-y-1.5 text-stone-700">
                <div className="flex justify-between py-1 border-b border-dashed border-stone-200">
                  <span className="pl-2">• Penjualan Makanan & Minuman</span>
                  <span className="font-semibold">{formatRupiah(grossSales)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-stone-200 text-stone-500 text-[11px]">
                  <span className="pl-2">• PPN Restoran (10%)</span>
                  <span>{formatRupiah(totalTax)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-stone-200 text-stone-500 text-[11px]">
                  <span className="pl-2">• Service Charge Layanan (5%)</span>
                  <span>{formatRupiah(totalServiceCharge)}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-[#2C1D11]">
                  <span className="pl-2">Total Penerimaan Kas Kafe</span>
                  <span>{formatRupiah(totalCashInflow)}</span>
                </div>
              </div>
            </div>

            {/* Section II: COGS & Gross Profit */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center bg-[#FBF8F5] p-2.5 rounded-xl font-bold text-[#2C1D11] border border-[#E3D3C4]">
                <span className="text-sm uppercase tracking-wider text-[#7D4F27]">II. Harga Pokok Penjualan (HPP / COGS)</span>
                <span className="text-sm text-amber-900">({formatRupiah(totalCOGS)})</span>
              </div>
              <div className="px-3 space-y-1.5 text-stone-700">
                <div className="flex justify-between py-1 border-b border-dashed border-stone-200">
                  <span className="pl-2">• Biaya Bahan Baku Biji Kopi, Susu, Bumbu & Daging</span>
                  <span className="font-semibold text-amber-900">({formatRupiah(totalCOGS)})</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-amber-50/70 border border-amber-200 font-bold text-[#2C1D11]">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <div className="text-right">
                    <span className="text-sm text-[#7D4F27]">{formatRupiah(grossProfit)}</span>
                    <span className="text-[10px] text-stone-500 block">Margin: {grossMarginPercent}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section III: Operational Expenses (OPEX) */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center bg-[#FBF8F5] p-2.5 rounded-xl font-bold text-[#2C1D11] border border-[#E3D3C4]">
                <span className="text-sm uppercase tracking-wider text-[#7D4F27]">III. Beban Operasional (OPEX)</span>
                <span className="text-sm text-rose-900">({formatRupiah(totalExpenses)})</span>
              </div>
              
              <div className="px-3 space-y-1.5 text-stone-700">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const amount = expensesByCategory[cat];
                  const percentOfSales = grossSales > 0 ? ((amount / grossSales) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-dashed border-stone-200">
                      <div className="flex items-center gap-2 pl-2">
                        {CATEGORY_ICONS[cat]}
                        <span>{cat}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{formatRupiah(amount)}</span>
                        {amount > 0 && (
                          <span className="text-[10px] text-stone-400 ml-2">({percentOfSales}%)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="flex justify-between py-1.5 font-bold text-stone-800">
                  <span className="pl-2">Total Beban Operasional</span>
                  <span className="text-rose-700">({formatRupiah(totalExpenses)})</span>
                </div>
              </div>
            </div>

            {/* Section IV: Final Bottom Line (Net Profit / Loss) */}
            <div className={`p-4 rounded-xl border mt-4 ${
              isProfitable 
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                : 'bg-rose-600 text-white border-rose-700 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold opacity-90 block">
                    IV. HASIL AKHIR LAPORAN KEUANGAN
                  </span>
                  <h4 className="text-base sm:text-lg font-black tracking-tight">
                    {isProfitable ? 'LABA BERSIH TAHUN/BULAN BERJALAN' : 'RUGI BERSIH OPERASIONAL'}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-black">
                    {formatRupiah(netProfit)}
                  </div>
                  <span className="text-xs font-semibold opacity-95">
                    Net Profit Margin: {netMarginPercent}%
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Visual Breakdown & Expense Management (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Visual Financial Structure */}
          <div className="bg-white p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-[#2C1D11] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#7D4F27]" />
              Struktur Alokasi Pendapatan
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-stone-700">Bahan Baku (HPP)</span>
                  <span className="text-amber-800 font-bold">{grossSales > 0 ? ((totalCOGS / grossSales) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className="h-full bg-amber-600 rounded-full" 
                    style={{ width: `${Math.min(100, grossSales > 0 ? (totalCOGS / grossSales) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-stone-700">Biaya Operasional (OPEX)</span>
                  <span className="text-rose-700 font-bold">{grossSales > 0 ? ((totalExpenses / grossSales) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full" 
                    style={{ width: `${Math.min(100, grossSales > 0 ? (totalExpenses / grossSales) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-stone-700">Margin Laba Bersih</span>
                  <span className={`font-bold ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>{netMarginPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isProfitable ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(0, grossSales > 0 ? (netProfit / grossSales) * 100 : 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Manage Recorded Operational Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-[#2C1D11]">
                  Pos Pengeluaran ({filteredExpenses.length})
                </h3>
                <span className="text-[11px] text-[#7A614D]">Kelola biaya operasional</span>
              </div>
              <div className="flex items-center gap-1.5">
                {expenses.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Kosongkan semua data pengeluaran operasional?')) {
                        clearAllExpenses();
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Kosongkan semua pengeluaran"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Kosongkan</span>
                  </button>
                )}
                <button
                  onClick={handleOpenAddExpense}
                  className="p-1.5 rounded-lg bg-[#7D4F27] text-white hover:bg-[#633C1B] transition-colors cursor-pointer"
                  title="Tambah Pengeluaran"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#F0E4D8] border border-[#E3D3C4] rounded-xl overflow-y-auto max-h-[360px] scrollbar-thin">
              {filteredExpenses.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500">
                  Belum ada pengeluaran operasional pada periode ini.
                </div>
              ) : (
                filteredExpenses.map((exp) => (
                  <div key={exp.id} className="p-3 bg-white hover:bg-stone-50 flex items-center justify-between text-xs transition-colors">
                    <div className="space-y-0.5 pr-2">
                      <div className="font-bold text-[#2C1D11] line-clamp-1">{exp.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                        <span>{exp.category}</span>
                        <span>•</span>
                        <span>{exp.date}</span>
                      </div>
                      {exp.notes && (
                        <div className="text-[10px] text-stone-400 italic line-clamp-1">{exp.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-700 whitespace-nowrap">
                        {formatRupiah(exp.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* EXPENSE MODAL (ADD / EDIT) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#E3D3C4] overflow-hidden">
            <div className="p-4 bg-[#2C1D11] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingExpenseId ? 'Edit Pos Pengeluaran' : 'Catat Pengeluaran Operasional Baru'}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#2C1D11]">Nama / Keterangan Pengeluaran *</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Gas Elpiji 12kg & Es Kristal"
                  value={expenseForm.name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2C1D11]">Kategori Pos Biaya *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#2C1D11]">Nominal Biaya (Rp) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#2C1D11]">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#2C1D11]">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Nota #123 dari agen es kristal, bon pembelian dapur..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0E4D8]">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveExpense}
                  className="px-4 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  {editingExpenseId ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
