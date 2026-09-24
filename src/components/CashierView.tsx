import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { Order, PaymentMethod } from '../types';
import { formatRupiah, formatFullDateTime, formatShortTime } from '../utils/formatters';
import { 
  ReceiptText, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  Search, 
  Clock, 
  X, 
  Share2, 
  Coffee,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NadiraLogo } from './NadiraLogo';

export const CashierView: React.FC = () => {
  const { 
    activeOrders, 
    completedOrders, 
    processPayment 
  } = useCafe();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [bankRef, setBankRef] = useState<string>('');

  // Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const unpaidOrders = activeOrders.filter((o) => o.paymentStatus === 'unpaid');
  const paidOrders = completedOrders.filter((o) => o.paymentStatus === 'paid');

  const displayedOrders = (activeTab === 'unpaid' ? unpaidOrders : paidOrders).filter((o) =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.tableNumber.toString().includes(searchQuery)
  );

  const selectedOrder = activeOrders.find((o) => o.id === selectedOrderId) || 
    completedOrders.find((o) => o.id === selectedOrderId) ||
    unpaidOrders[0] ||
    null;

  // Open payment modal
  const handleOpenPayment = (order: Order) => {
    setSelectedOrderId(order.id);
    setSelectedMethod('cash');
    setCashGiven(order.total);
    setBankRef(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedOrder) return;

    let details: { cashReceived?: number; changeReturned?: number; referenceNumber?: string } = {};

    if (selectedMethod === 'cash') {
      const change = Math.max(0, cashGiven - selectedOrder.total);
      details = {
        cashReceived: cashGiven,
        changeReturned: change,
      };
    } else if (selectedMethod === 'qris') {
      details = {
        referenceNumber: `QRIS-NDR-${Date.now().toString().slice(-7)}`,
      };
    } else {
      details = {
        referenceNumber: bankRef || `TRF-BCA-${Date.now().toString().slice(-6)}`,
      };
    }

    processPayment(selectedOrder.id, selectedMethod, details);

    // Prepare receipt
    const finalizedOrder: Order = {
      ...selectedOrder,
      status: 'paid',
      paymentStatus: 'paid',
      paymentMethod: selectedMethod,
      paymentDetails: {
        ...details,
        paidAt: new Date().toISOString(),
      },
    };

    setReceiptOrder(finalizedOrder);
    setIsPaymentModalOpen(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const cashShortage = selectedOrder ? Math.max(0, selectedOrder.total - cashGiven) : 0;
  const cashChange = selectedOrder ? Math.max(0, cashGiven - selectedOrder.total) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FAEDCD] flex items-center justify-center text-[#7D4F27]">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C1D11]">
              Kasir POS & Sistem Pembayaran
            </h1>
            <p className="text-xs text-[#7A614D]">
              Kelola tagihan meja, konfirmasi pembayaran Tunai/QRIS/Transfer, dan cetak struk resmi.
            </p>
          </div>
        </div>

        {/* Tab switcher: Tagihan Aktif vs Riwayat */}
        <div className="flex items-center gap-1.5 bg-[#FBF8F5] p-1.5 rounded-xl border border-[#E3D3C4]">
          <button
            id="tab-unpaid-bills"
            onClick={() => setActiveTab('unpaid')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'unpaid'
                ? 'bg-[#7D4F27] text-white shadow-sm'
                : 'text-[#6E4F36] hover:bg-stone-200'
            }`}
          >
            Tagihan Menunggu Bayar ({unpaidOrders.length})
          </button>
          <button
            id="tab-history-bills"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#7D4F27] text-white shadow-sm'
                : 'text-[#6E4F36] hover:bg-stone-200'
            }`}
          >
            Riwayat Pembayaran ({paidOrders.length})
          </button>
        </div>
      </div>

      {/* Main Split Layout: Orders List vs Bill Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Orders List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C705A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. order, meja, atau nama..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E3D3C4] bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
            />
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {displayedOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E3D3C4]">
                <ReceiptText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-medium">Tidak ada data tagihan ditemukan.</p>
              </div>
            ) : (
              displayedOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    id={`cashier-order-${order.id}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#7D4F27] shadow-md ring-2 ring-[#7D4F27]/20'
                        : 'bg-white border-[#E3D3C4] hover:border-[#A8713D]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#2C1D11]">
                            Meja #{order.tableNumber}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FBF8F5] border border-[#E3D3C4] text-[#7A614D]">
                            {order.orderNumber}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E4F36] mt-0.5 font-medium">
                          {order.customerName} • {order.items.length} Menu
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#7D4F27] block">
                          {formatRupiah(order.total)}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {formatShortTime(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#F0E4D8] flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.paymentStatus === 'paid' ? `Lunas (${order.paymentMethod})` : 'Belum Dibayar'}
                      </span>

                      {order.paymentStatus === 'unpaid' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayment(order);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Bayar
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptOrder(order);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#5A3E29] font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Struk</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Receipt & Payment Trigger */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-[#E3D3C4] p-5 sm:p-6 shadow-sm space-y-5">
              
              {/* Receipt Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3D3C4] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-bold text-[#2C1D11]">
                      Rincian Tagihan {selectedOrder.orderNumber}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      selectedOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedOrder.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      selectedOrder.status === 'completed'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : selectedOrder.status === 'served' || selectedOrder.items.every((i) => i.served)
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {selectedOrder.status === 'completed'
                        ? '✓ Orderan Selesai'
                        : selectedOrder.status === 'served' || selectedOrder.items.every((i) => i.served)
                        ? '✓ Sudah Disajikan'
                        : 'Sedang Diproses'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A614D] mt-0.5">
                    Meja #{selectedOrder.tableNumber} • Tamu: {selectedOrder.customerName} • Waitress: {selectedOrder.waitressName || '-'}
                  </p>
                </div>

                <div className="text-xs text-stone-500 sm:text-right">
                  <span>Waktu Order:</span>
                  <p className="font-semibold text-stone-700">
                    {formatFullDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="border border-[#E3D3C4] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FBF8F5] text-[#5A3E29] font-bold border-b border-[#E3D3C4]">
                      <tr>
                        <th className="p-3">Menu</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Harga Satuan</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E4D8]">
                      {selectedOrder.items.map((it) => (
                        <tr key={it.id} className="hover:bg-stone-50">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#2C1D11]">{it.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                (it.portionSize || it.customization?.portionSize) === 'Large'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}>
                                {it.portionSize || it.customization?.portionSize || 'Reguler'}
                              </span>
                              {it.served ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Disajikan
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-stone-100 text-stone-600">
                                  Belum Saji
                                </span>
                              )}
                            </div>

                            {it.customization && (
                              <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#8C705A] mt-0.5">
                                {it.customization.sugarLevel && <span>• {it.customization.sugarLevel}</span>}
                                {it.customization.iceLevel && <span>• {it.customization.iceLevel}</span>}
                                {it.customization.spicyLevel && <span>• {it.customization.spicyLevel}</span>}
                                {it.customization.addOns && it.customization.addOns.map((ad, idx) => (
                                  <span key={idx} className="bg-amber-50 text-amber-800 px-1 rounded">+{ad}</span>
                                ))}
                                {it.customization.notes && <span className="italic text-stone-500">(&quot;{it.customization.notes}&quot;)</span>}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-[#7D4F27]">{it.quantity}</td>
                          <td className="p-3 text-right text-stone-600">{formatRupiah(it.price)}</td>
                          <td className="p-3 text-right font-bold text-[#2C1D11]">
                            {formatRupiah(it.price * it.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-[#FBF8F5] p-4 rounded-xl border border-[#E3D3C4] space-y-2">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal Pesanan:</span>
                  <span className="font-semibold">{formatRupiah(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>PPN Resto (10%):</span>
                  <span className="font-semibold">{formatRupiah(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Biaya Layanan & Kebersihan (5%):</span>
                  <span className="font-semibold">{formatRupiah(selectedOrder.serviceCharge)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-[#2C1D11] pt-2 border-t border-[#E3D3C4]">
                  <span>Total Tagihan (Grand Total):</span>
                  <span className="text-[#7D4F27]">{formatRupiah(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Payment Details if already paid */}
              {selectedOrder.paymentStatus === 'paid' && selectedOrder.paymentDetails && (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Pembayaran Telah Diverifikasi Lunas</span>
                  </div>
                  <div className="text-emerald-800">
                    Metode: <strong>{selectedOrder.paymentMethod?.toUpperCase()}</strong>
                    {selectedOrder.paymentDetails.referenceNumber && (
                      <span> • Ref: {selectedOrder.paymentDetails.referenceNumber}</span>
                    )}
                    {selectedOrder.paymentDetails.cashReceived && (
                      <span> • Diterima: {formatRupiah(selectedOrder.paymentDetails.cashReceived)} • Kembali: {formatRupiah(selectedOrder.paymentDetails.changeReturned || 0)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {selectedOrder.paymentStatus === 'unpaid' ? (
                  <button
                    id="btn-process-checkout"
                    onClick={() => handleOpenPayment(selectedOrder)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran ({formatRupiah(selectedOrder.total)})</span>
                  </button>
                ) : (
                  <button
                    id="btn-print-receipt-main"
                    onClick={() => setReceiptOrder(selectedOrder)}
                    className="px-5 py-2.5 rounded-xl bg-[#2C1D11] hover:bg-[#3D2817] text-[#FFF5EA] text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-[#D4A373]" />
                    <span>Cetak Bukti Pembayaran (Struk)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E3D3C4] p-12 text-center text-stone-500">
              <ReceiptText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">Pilih salah satu pesanan dari daftar di sebelah kiri untuk melihat rincian tagihan.</p>
            </div>
          )}
        </div>

      </div>

      {/* PAYMENT MODAL (Tunai, QRIS, Bank Transfer) */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E3D3C4] flex flex-col max-h-[95vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Proses Pembayaran</h3>
                <p className="text-xs text-[#C4AD99]">
                  {selectedOrder.orderNumber} • Meja #{selectedOrder.tableNumber} • {formatRupiah(selectedOrder.total)}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Methods Tabs */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-[#FBF8F5] border-b border-[#E3D3C4]">
              <button
                onClick={() => setSelectedMethod('cash')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'bg-[#7D4F27] text-white shadow-sm'
                    : 'bg-white text-[#5A3E29] border border-[#E3D3C4] hover:bg-stone-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai (Cash)</span>
              </button>

              <button
                onClick={() => setSelectedMethod('qris')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedMethod === 'qris'
                    ? 'bg-[#7D4F27] text-white shadow-sm'
                    : 'bg-white text-[#5A3E29] border border-[#E3D3C4] hover:bg-stone-100'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS Dinamis</span>
              </button>

              <button
                onClick={() => setSelectedMethod('bank_transfer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedMethod === 'bank_transfer'
                    ? 'bg-[#7D4F27] text-white shadow-sm'
                    : 'bg-white text-[#5A3E29] border border-[#E3D3C4] hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfer Bank</span>
              </button>
            </div>

            {/* Method Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* CASH PAYMENT */}
              {selectedMethod === 'cash' && (
                <div className="space-y-3">
                  <div className="bg-[#FAEDCD]/50 p-3 rounded-xl border border-[#D4A373] text-center">
                    <span className="text-xs text-[#7A614D] font-bold uppercase">Total yang Harus Dibayar:</span>
                    <div className="text-2xl font-extrabold text-[#7D4F27]">
                      {formatRupiah(selectedOrder.total)}
                    </div>
                  </div>

                  {/* Cash Given Input */}
                  <div>
                    <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                      Uang Diterima dari Pelanggan:
                    </label>
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      placeholder="Masukkan jumlah uang tunai..."
                      className="w-full text-base font-bold p-3 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                    />
                  </div>

                  {/* Quick Denominations */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                      Pilihan Cepat Nominal:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setCashGiven(selectedOrder.total)}
                        className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-[#2C1D11]"
                      >
                        Uang Pas
                      </button>
                      {[50000, 100000, 200000, 300000, 500000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashGiven(val)}
                          className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-[#2C1D11]"
                        >
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kembalian Calculation */}
                  <div className="p-3.5 rounded-xl border border-[#E3D3C4] bg-[#FBF8F5] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#7A614D] block font-semibold">Uang Kembalian:</span>
                      <span className="text-lg font-extrabold text-emerald-700">
                        {formatRupiah(cashChange)}
                      </span>
                    </div>
                    {cashShortage > 0 && (
                      <span className="text-xs font-bold text-red-600">
                        Kurang: {formatRupiah(cashShortage)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* QRIS PAYMENT */}
              {selectedMethod === 'qris' && (
                <div className="text-center space-y-3">
                  <div className="inline-block p-4 bg-white rounded-2xl border-2 border-stone-800 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226600016ID.CO.QRIS.WWW01189360099900000000010215NADIRACAFE${selectedOrder.total}5802ID5918NADIRA_CAFE_RESTO6007JAKARTA5406${selectedOrder.total}53033606304`}
                      alt="QRIS NADIRA"
                      className="w-44 h-44 mx-auto rounded-lg"
                    />
                    <div className="mt-2 text-[11px] font-bold text-stone-700">
                      NMID: ID1029384756291
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#7A614D]">Scan dengan GoPay, OVO, Dana, BCA Mobile, dll</span>
                    <p className="text-xl font-extrabold text-[#7D4F27]">
                      {formatRupiah(selectedOrder.total)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Sistem akan otomatis mendeteksi ketika pembayaran QRIS berhasil diselesaikan oleh pelanggan.
                  </div>
                </div>
              )}

              {/* BANK TRANSFER */}
              {selectedMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  <div className="bg-[#FBF8F5] p-3 rounded-xl border border-[#E3D3C4] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#2C1D11]">BCA Virtual Account:</span>
                      <span className="font-mono font-extrabold text-[#7D4F27] bg-white px-2 py-0.5 rounded border">
                        8800 1209 8472 991
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#2C1D11]">Mandiri Virtual Account:</span>
                      <span className="font-mono font-extrabold text-[#7D4F27] bg-white px-2 py-0.5 rounded border">
                        8992 0182 7364 002
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      A.N. PT NADIRA KULINER NUSANTARA
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                      Nomor Referensi / Bukti Transfer:
                    </label>
                    <input
                      type="text"
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                      placeholder="Contoh: TRF-BCA-981240"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Action */}
            <div className="p-4 bg-[#FBF8F5] border-t border-[#E3D3C4] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={selectedMethod === 'cash' && cashShortage > 0}
                onClick={handleConfirmPayment}
                className="flex-1 py-3 px-4 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs sm:text-sm shadow-md disabled:bg-stone-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Lunas & Terbitkan Struk</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* THERMAL RECEIPT PRINT MODAL */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-300 flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-3.5 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#D4A373]" />
                <span className="font-bold text-xs">Struk Pembayaran (Thermal 80mm)</span>
              </div>
              <button
                onClick={() => setReceiptOrder(null)}
                className="p-1 rounded text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Box */}
            <div className="p-4 overflow-y-auto flex-1 bg-white">
              <div
                id="printable-receipt"
                className="bg-white text-black font-mono text-[11px] leading-tight space-y-2 p-3 border border-dashed border-stone-300 rounded-lg"
              >
                {/* Brand Header */}
                <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                  <NadiraLogo size={28} color="#000000" className="mx-auto mb-1.5" />
                  <div className="font-bold text-sm tracking-wider">NADIRA CAFÉ & RESTO</div>
                  <div className="text-[10px]">Specialty Coffee & Kitchen</div>
                  <div className="text-[9px]">Jalan Lubuk Semut, Kec. Karimun, Kepulauan Riau</div>
                  <div className="text-[9px]">Telp: (021) 782-9988 • IG: @nadiracafe</div>
                </div>

                {/* Metadata */}
                <div className="border-b border-dashed border-black py-1.5 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>No: {receiptOrder.orderNumber}</span>
                    <span>Meja: #{receiptOrder.tableNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tgl: {formatShortTime(receiptOrder.updatedAt)}</span>
                    <span>Kasir: Budi S.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamu: {receiptOrder.customerName}</span>
                    <span>Waitress: {receiptOrder.waitressName || '-'}</span>
                  </div>
                </div>

                {/* Itemized List */}
                <div className="border-b border-dashed border-black py-1.5 space-y-1">
                  {receiptOrder.items.map((it) => {
                    const portion = it.portionSize || it.customization?.portionSize || 'Reguler';
                    return (
                      <div key={it.id} className="flex justify-between">
                        <div className="max-w-[170px]">
                          <div className="font-semibold">{it.quantity}x {it.name} [{portion}]</div>
                          {it.customization && (
                            <div className="text-[9px] text-stone-600">
                              {it.customization.sugarLevel && <span>• {it.customization.sugarLevel} </span>}
                              {it.customization.iceLevel && <span>• {it.customization.iceLevel} </span>}
                              {it.customization.spicyLevel && <span>• {it.customization.spicyLevel} </span>}
                              {it.customization.notes && <span>*{it.customization.notes}</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-right">{formatRupiah(it.price * it.quantity)}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-b border-dashed border-black py-1.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(receiptOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN Resto (10%):</span>
                    <span>{formatRupiah(receiptOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge (5%):</span>
                    <span>{formatRupiah(receiptOrder.serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(receiptOrder.total)}</span>
                  </div>
                </div>

                {/* Payment Detail */}
                <div className="py-1 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Metode Bayar:</span>
                    <span className="uppercase font-bold">{receiptOrder.paymentMethod}</span>
                  </div>
                  {receiptOrder.paymentDetails?.cashReceived && (
                    <>
                      <div className="flex justify-between">
                        <span>Tunai Diterima:</span>
                        <span>{formatRupiah(receiptOrder.paymentDetails.cashReceived)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kembalian:</span>
                        <span>{formatRupiah(receiptOrder.paymentDetails.changeReturned || 0)}</span>
                      </div>
                    </>
                  )}
                  {receiptOrder.paymentDetails?.referenceNumber && (
                    <div className="flex justify-between">
                      <span>Ref ID:</span>
                      <span>{receiptOrder.paymentDetails.referenceNumber}</span>
                    </div>
                  )}
                </div>

                {/* Footer Message */}
                <div className="text-center pt-2 text-[9px] space-y-0.5 border-t border-dashed border-black">
                  <div>=== TERIMA KASIH ===</div>
                  <div>Silakan Berkunjung Kembali di NADIRA Café!</div>
                  <div>WiFi: NADIRA_GUEST • Password: kopienak2026</div>
                </div>
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="p-3 bg-[#FBF8F5] border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Thermal</span>
              </button>
              <button
                onClick={() => setReceiptOrder(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-[#2C1D11] text-xs font-semibold cursor-pointer"
              >
                Selesai
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
