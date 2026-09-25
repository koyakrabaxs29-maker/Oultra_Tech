import React, { useState, useEffect } from 'react';
import { useCafe } from '../context/CafeContext';
import { UserAccount } from '../types';
import { 
  X, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UserAccount | null;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  targetUser,
  onSuccess 
}) => {
  const { currentUser, users, updateUser, showToast } = useCafe();

  // If a targetUser is provided, use that; otherwise use currentUser, or allow selecting
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  
  // View password states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync selected user when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setShowAllPasswords(false);

      if (targetUser) {
        setSelectedUserId(targetUser.id);
      } else if (currentUser) {
        setSelectedUserId(currentUser.id);
      } else if (users.length > 0) {
        setSelectedUserId(users[0].id);
      }
    }
  }, [isOpen, targetUser, currentUser, users]);

  // Handle "Show All Passwords" master toggle
  const toggleShowAll = () => {
    const nextState = !showAllPasswords;
    setShowAllPasswords(nextState);
    setShowCurrent(nextState);
    setShowNew(nextState);
    setShowConfirm(nextState);
  };

  if (!isOpen) return null;

  const activeAccount = users.find((u) => u.id === selectedUserId) || targetUser || currentUser;
  const isOwnerAdminReset = currentUser?.role === 'owner' && activeAccount && activeAccount.id !== currentUser.id;

  // Calculate password strength
  const getPasswordStrength = (pin: string) => {
    if (!pin) return { label: '', color: '', percent: 0 };
    if (pin.length < 4) return { label: 'Terlalu Pendek (Min 4)', color: 'bg-red-500 text-red-700', percent: 25 };
    const hasLetters = /[a-zA-Z]/.test(pin);
    const hasNumbers = /[0-9]/.test(pin);
    const isLong = pin.length >= 6;

    if (hasLetters && hasNumbers && isLong) {
      return { label: 'Sangat Kuat (Kombinasi Huruf & Angka)', color: 'bg-emerald-500 text-emerald-700', percent: 100 };
    }
    if (pin.length >= 4 && (hasNumbers || hasLetters)) {
      return { label: 'Kuat & Cukup Aman', color: 'bg-blue-500 text-blue-700', percent: 70 };
    }
    return { label: 'Standar (PIN 4 Digit)', color: 'bg-amber-500 text-amber-700', percent: 50 };
  };

  const strength = getPasswordStrength(newPin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!activeAccount) {
      setErrorMsg('Pilih akun staf yang ingin diganti sandinya.');
      return;
    }

    // If not owner admin bypass, require old PIN verification
    if (!isOwnerAdminReset) {
      if (currentPin.trim() !== activeAccount.pin) {
        setErrorMsg('Sandi / PIN lama yang Anda masukkan salah.');
        return;
      }
    }

    if (newPin.trim().length < 4) {
      setErrorMsg('Sandi / PIN baru minimal harus terdiri dari 4 karakter.');
      return;
    }

    if (newPin.trim() !== confirmNewPin.trim()) {
      setErrorMsg('Konfirmasi sandi baru tidak cocok. Pastikan kedua sandi sama.');
      return;
    }

    if (currentPin.trim() === newPin.trim()) {
      setErrorMsg('Sandi / PIN baru tidak boleh persis sama dengan sandi lama.');
      return;
    }

    // Success! Update password in state & localStorage via updateUser
    updateUser(activeAccount.id, { pin: newPin.trim() });
    setSuccessMsg(`Sandi / PIN untuk ${activeAccount.name} berhasil diperbarui!`);
    showToast(`🔑 PIN/Sandi ${activeAccount.name} berhasil diperbarui!`);
    
    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      onClose();
    }, 900);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7D4F27] flex items-center justify-center shadow-inner border border-[#D4A373]/30">
              <KeyRound className="w-5 h-5 text-[#F7E6D4]" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-[#F7E6D4] flex items-center gap-2">
                Ganti Sandi / PIN Akses
              </h2>
              <p className="text-[11px] text-[#C4AD99]">
                {activeAccount ? `Pengaturan keamanan akun: ${activeAccount.name}` : 'Ubah PIN staf / kasir'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#3D2513] transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Selector (if opened without a specific user locked) */}
          {!targetUser && !currentUser && users.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
                Pilih Akun Staf
              </label>
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27]"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.avatar} {u.name} (@{u.username}) - {u.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selected Account Badge */}
          {activeAccount && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF6F2] border border-[#EBE0D5]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl filter drop-shadow-sm">{activeAccount.avatar}</span>
                <div>
                  <h4 className="text-xs font-black text-[#25180E]">{activeAccount.name}</h4>
                  <p className="text-[10px] font-bold text-[#7D4F27] uppercase tracking-wide">
                    {activeAccount.role} • @{activeAccount.username}
                  </p>
                </div>
              </div>
              
              {/* Master View Password Button */}
              <button
                type="button"
                onClick={toggleShowAll}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  showAllPasswords
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
                title={showAllPasswords ? "Sembunyikan semua sandi" : "Lihat semua sandi"}
              >
                {showAllPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>Tutup Sandi</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#7D4F27]" />
                    <span>Lihat Sandi</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Current PIN (Hidden if Owner Admin Reset) */}
          {isOwnerAdminReset ? (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>Mode Owner:</strong> Anda memiliki wewenang untuk mengatur ulang PIN akun staf ini tanpa memerlukan PIN lama.
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
                  Sandi / PIN Saat Ini
                </label>
                <span className="text-[10px] text-stone-400 font-medium">Wajib diisi</span>
              </div>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="Masukkan sandi/PIN lama Anda..."
                  className="w-full text-sm py-2.5 pl-3.5 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  title={showCurrent ? "Sembunyikan sandi" : "Lihat sandi"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-[#F0E4D8]"></div>

          {/* New PIN */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
                Sandi / PIN Baru (Min. 4 Karakter)
              </label>
              {strength.label && (
                <span className={`text-[10px] font-bold ${strength.color}`}>
                  {strength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Masukkan sandi/PIN baru..."
                maxLength={20}
                className="w-full text-sm py-2.5 pl-3.5 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                title={showNew ? "Sembunyikan sandi" : "Lihat sandi"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Bar */}
            {newPin.length > 0 && (
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.percent <= 25 ? 'bg-red-500 w-1/4' :
                    strength.percent <= 50 ? 'bg-amber-500 w-2/4' :
                    strength.percent <= 75 ? 'bg-blue-500 w-3/4' :
                    'bg-emerald-500 w-full'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Confirm New PIN */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-[#5A3E29] uppercase tracking-wider block">
                Konfirmasi Sandi / PIN Baru
              </label>
              {confirmNewPin && (
                <span className={`text-[10px] font-bold ${newPin === confirmNewPin ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {newPin === confirmNewPin ? '✓ Cocok' : '✗ Belum cocok'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder="Ulangi sandi baru..."
                maxLength={20}
                className={`w-full text-sm py-2.5 pl-3.5 pr-11 rounded-xl border bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] transition-all font-mono ${
                  confirmNewPin && newPin !== confirmNewPin ? 'border-red-300' : 'border-[#E3D3C4]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                title={showConfirm ? "Sembunyikan sandi" : "Lihat sandi"}
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Simpan Sandi Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
