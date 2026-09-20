import React from 'react';
import { Order } from '../types';
import { formatRupiah, formatFullDateTime } from '../utils/formatters';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden">
        
        {/* Top Warning Banner */}
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm sm:text-base">
              Konfirmasi Hapus Transaksi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-rose-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-stone-700">
            Apakah Anda yakin ingin menghapus data transaksi pembayaran berikut secara permanen?
          </p>

          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 text-rose-950">
            <div className="flex justify-between font-bold text-sm text-[#2C1D11]">
              <span>{order.orderNumber}</span>
              <span className="text-rose-700">{formatRupiah(order.total)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Meja #{order.tableNumber}</span>
              <span>Pelanggan: {order.customerName}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-[11px] pt-1 border-t border-rose-100">
              <span>Waktu: {formatFullDateTime(order.updatedAt || order.createdAt)}</span>
              <span className="uppercase font-semibold">{order.paymentMethod || 'cash'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span>
              <strong>Perhatian:</strong> Data transaksi yang dihapus akan tersimpan secara permanen dan <strong>tidak akan ditampilkan kembali</strong> saat refresh aplikasi atau login ulang. Laporan kas masuk/keluar dan laba rugi akan diperbarui secara otomatis.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0E4D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(order.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Ya, Hapus Transaksi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
