import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { 
  X, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, showToast } = useCafe();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (currentPin.trim() !== currentUser.pin) {
      setErrorMsg('PIN / Sandi lama yang Anda masukkan salah.');
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMsg('Sandi/PIN baru minimal harus terdiri dari 4 karakter.');
      return;
    }

    if (newPin.trim() !== confirmNewPin.trim()) {
      setErrorMsg('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    if (currentPin.trim() === newPin.trim()) {
      setErrorMsg('Sandi/PIN baru tidak boleh sama dengan sandi lama.');
      return;
    }

    // Success! Update password in state & localStorage via updateUser
    updateUser(currentUser.id, { pin: newPin.trim() });
    showToast('PIN/Sandi berhasil diperbarui!');
    
    // Reset fields & close
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#1C120A]/70 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E3D3C4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#24170D] text-[#FFF5EA] px-6 py-5 flex items-center justify-between border-b border-[#3D2513]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7D4F27] flex items-center justify-center">
              <KeyRound className="w-4.5 h-4.5 text-[#F7E6D4]" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-[#F7E6D4]">
                Ganti PIN / Sandi Akses
              </h2>
              <p className="text-[10px] text-[#C4AD99]">
                Keamanan akun {currentUser.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#3D2513] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current PIN */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
              Sandi / PIN Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Sandi lama Anda..."
                className="w-full text-sm py-2.5 pl-3.5 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="h-px bg-[#F0E4D8]"></div>

          {/* New PIN */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
              Sandi / PIN Baru (Min. 4 Karakter)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Masukkan sandi baru..."
                maxLength={16}
                className="w-full text-sm py-2.5 pl-3.5 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New PIN */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
              Konfirmasi Sandi / PIN Baru
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder="Ulangi sandi baru..."
                maxLength={16}
                className="w-full text-sm py-2.5 pl-3.5 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-all cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              Simpan Sandi Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
