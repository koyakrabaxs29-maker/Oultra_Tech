import React, { useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../types';
import { formatRupiah } from '../utils/formatters';
import { X, Check, AlertCircle, Edit3, Trash2 } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSave: (orderId: string, updates: Partial<Order>) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  order,
  onClose,
  onSave,
}) => {
  if (!isOpen || !order) return null;

  const [customerName, setCustomerName] = useState(order.customerName);
  const [tableNumber, setTableNumber] = useState(order.tableNumber);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod || 'cash');
  const [cashReceived, setCashReceived] = useState<number>(order.paymentDetails?.cashReceived || order.total);
  const [referenceNumber, setReferenceNumber] = useState(order.paymentDetails?.referenceNumber || '');
  const [subtotal, setSubtotal] = useState(order.subtotal);
  const [tax, setTax] = useState(order.tax);
  const [serviceCharge, setServiceCharge] = useState(order.serviceCharge || Math.round(order.subtotal * 0.05));
  const [customTotal, setCustomTotal] = useState(order.total);
  const [autoCalculateTax, setAutoCalculateTax] = useState(true);

  // Recalculate if subtotal changes and auto-calc is on
  useEffect(() => {
    if (autoCalculateTax) {
      const calculatedTax = Math.round(subtotal * 0.1);
      const calculatedService = Math.round(subtotal * 0.05);
      setTax(calculatedTax);
      setServiceCharge(calculatedService);
      setCustomTotal(subtotal + calculatedTax + calculatedService);
    }
  }, [subtotal, autoCalculateTax]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTotal = autoCalculateTax ? subtotal + tax + serviceCharge : customTotal;
    const finalChange = paymentMethod === 'cash' ? Math.max(0, cashReceived - finalTotal) : 0;

    onSave(order.id, {
      customerName,
      tableNumber: Number(tableNumber),
      paymentMethod,
      subtotal: Number(subtotal),
      tax: Number(tax),
      serviceCharge: Number(serviceCharge),
      total: Number(finalTotal),
      paymentDetails: {
        ...order.paymentDetails,
        cashReceived: paymentMethod === 'cash' ? Number(cashReceived) : undefined,
        changeReturned: finalChange,
        referenceNumber: paymentMethod !== 'cash' ? referenceNumber : undefined,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E3D3C4] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#2C1D11] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Edit Transaksi: {order.orderNumber}
              </h3>
              <span className="text-[11px] text-stone-300">
                Ubah rincian pembayaran, nama pelanggan, atau nominal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          
          {/* Order Identity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#2C1D11]">Nomor Meja *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#2C1D11]">Nama Pelanggan *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="font-bold text-[#2C1D11]">Metode Pembayaran *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', label: 'Tunai (Cash)' },
                { key: 'qris', label: 'QRIS (Gojek/Dana/dll)' },
                { key: 'bank_transfer', label: 'Transfer Bank' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key as PaymentMethod)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === m.key
                      ? 'bg-[#7D4F27] text-white border-[#7D4F27] shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-[#E3D3C4]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details according to Method */}
          {paymentMethod === 'cash' ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="space-y-1">
                <label className="font-bold text-amber-900">Uang Diterima dari Pelanggan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-amber-300 text-amber-950 font-bold focus:outline-none"
                />
              </div>
              <div className="flex justify-between text-[11px] text-amber-900 font-semibold pt-1">
                <span>Kembalian Dihitung:</span>
                <span>{formatRupiah(Math.max(0, cashReceived - (autoCalculateTax ? subtotal + tax + serviceCharge : customTotal)))}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-bold text-[#2C1D11]">Nomor Referensi / ID Transaksi Digital</label>
              <input
                type="text"
                placeholder="Contoh: QRIS-2026-9921 / TRF-BCA-1029"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
              />
            </div>
          )}

          {/* Subtotal and Tax Adjustments */}
          <div className="space-y-3 pt-2 border-t border-[#F0E4D8]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2C1D11]">Penyesuaian Nominal Transaksi</span>
              <label className="flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCalculateTax}
                  onChange={(e) => setAutoCalculateTax(e.target.checked)}
                  className="rounded text-[#7D4F27] focus:ring-[#7D4F27]"
                />
                <span>Hitung Otomatis PPN 10% & Servis 5%</span>
              </label>
            </div>

            <div className="space-y-2 bg-[#FBF8F5] p-3 rounded-xl border border-[#E3D3C4]">
              <div className="flex items-center justify-between">
                <span className="text-stone-700 font-semibold">Subtotal Produk (Rp)</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={subtotal}
                  onChange={(e) => setSubtotal(Number(e.target.value))}
                  className="w-32 px-2 py-1 text-right bg-white rounded-lg border border-[#E3D3C4] font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-stone-600 text-[11px]">
                <span>PPN Restoran (10%)</span>
                {autoCalculateTax ? (
                  <span className="font-semibold">{formatRupiah(tax)}</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-32 px-2 py-1 text-right bg-white rounded-lg border border-[#E3D3C4] font-bold focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-stone-600 text-[11px]">
                <span>Biaya Layanan (Service 5%)</span>
                {autoCalculateTax ? (
                  <span className="font-semibold">{formatRupiah(serviceCharge)}</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(Number(e.target.value))}
                    className="w-32 px-2 py-1 text-right bg-white rounded-lg border border-[#E3D3C4] font-bold focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E3D3C4] font-bold text-sm text-[#2C1D11]">
                <span>Total Akhir Transaksi</span>
                <span className="text-base text-[#7D4F27] font-black">
                  {formatRupiah(autoCalculateTax ? subtotal + tax + serviceCharge : customTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Items Preview */}
          <div className="space-y-1.5 pt-1">
            <span className="font-bold text-[#2C1D11] block">Item Pesanan ({order.items.length})</span>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl max-h-28 overflow-y-auto p-2 bg-stone-50 text-[11px]">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between py-1 text-stone-700">
                  <span>{it.quantity}x {it.name} ({it.portionSize})</span>
                  <span className="font-semibold">{formatRupiah(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F0E4D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
