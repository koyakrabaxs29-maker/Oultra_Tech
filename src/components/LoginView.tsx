import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { UserAccount } from '../types';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Coffee, 
  UserCheck, 
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Key,
  KeyRound
} from 'lucide-react';
import { NadiraLogo } from './NadiraLogo';
import { LiveClockWidget } from './LiveClockWidget';
import { ChangePasswordModal } from './ChangePasswordModal';

export const LoginView: React.FC = () => {
  const { users, setCurrentUser, setActiveRole, showToast } = useCafe();
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // State for manual username login fallback
  const [isManualMode, setIsManualMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  // Change Password Modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordTarget, setChangePasswordTarget] = useState<UserAccount | null>(null);

  const activeUsers = users.filter(u => u.active);

  const handleQuickSelect = (user: UserAccount) => {
    setSelectedUser(user);
    setPinInput('');
    setLoginError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    let userToAuth: UserAccount | undefined;

    if (isManualMode) {
      if (!usernameInput.trim() || !pinInput.trim()) {
        setLoginError('Harap isi username dan PIN/Sandi.');
        return;
      }
      userToAuth = users.find(
        (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
      );
    } else {
      userToAuth = selectedUser || undefined;
    }

    if (!userToAuth) {
      setLoginError('Username atau Pengguna tidak ditemukan.');
      return;
    }

    if (!userToAuth.active) {
      setLoginError('Akun ini sedang dinonaktifkan oleh Owner.');
      return;
    }

    if (userToAuth.pin === pinInput.trim()) {
      // Login Success!
      setCurrentUser(userToAuth);
      setActiveRole(userToAuth.role);
      showToast(`Selamat datang kembali, ${userToAuth.name}!`);
    } else {
      setLoginError('PIN atau Sandi yang dimasukkan salah.');
    }
  };

  const handleBackToSelect = () => {
    setSelectedUser(null);
    setPinInput('');
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E8DCCF]/40 blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#E5D5C5]/30 blur-3xl -z-10"></div>

      {/* Top-Right Page Live Day, Date & Time Widget */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
        <LiveClockWidget theme="light" />
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] border border-[#EBE0D5] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] z-10">
        
        {/* Left Side: Coffee Branding banner */}
        <div className="hidden md:flex md:col-span-5 bg-[#25180E] p-8 flex-col justify-between text-[#F5EBE1] border-r border-[#3A2617] relative">
          {/* Overlay pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#C58E55_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#3F2B1B] flex items-center justify-center border border-[#D4A373]/30 shadow-lg mb-6">
              <NadiraLogo size={36} color="#FFF5EA" />
            </div>
            
            <h1 className="font-display text-3xl font-extrabold tracking-tight leading-none text-[#FFF5EA]">
              NADIRA
            </h1>
            <p className="text-xs text-[#D4A373] tracking-widest uppercase font-bold mt-1">
              Café & Resto
            </p>
            
            <div className="h-[2px] w-12 bg-[#7D4F27] my-5"></div>
            
            <p className="text-sm text-[#C4AD99] leading-relaxed font-medium">
              Sistem POS & Kitchen Display System terintegrasi. Masuk ke panel Anda untuk mengelola order, dapur, kasir, dan laporan keuangan.
            </p>
          </div>

          <div className="relative z-10 pt-6 border-t border-[#3D2817]">
            <p className="text-[11px] text-[#A88C74] font-medium leading-relaxed">
              © {new Date().getFullYear()} NADIRA POS • Keamanan Multi-Perangkat Terenkripsi.
            </p>
          </div>
        </div>

        {/* Right Side: Login Interactive Panel */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F0E4D8]/80">
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-[#25180E] flex items-center justify-center">
                <NadiraLogo size={22} color="white" />
              </div>
              <span className="font-display text-lg font-bold text-[#25180E]">
                NADIRA Café
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setChangePasswordTarget(selectedUser || null);
                  setIsChangePasswordOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6F2] hover:bg-[#F3ECE4] text-[#7D4F27] border border-[#E3D3C4] text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Ganti PIN / Sandi Akun"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Ganti Sandi</span>
              </button>

              <button
                onClick={() => {
                  setIsManualMode(!isManualMode);
                  handleBackToSelect();
                }}
                className="text-xs font-bold text-[#7D4F27] hover:text-[#5A3515] transition-all underline underline-offset-4 cursor-pointer"
              >
                {isManualMode ? 'Pilih Profil' : 'Mode Manual'}
              </button>
            </div>
          </div>

          <div className="my-auto py-6">
            
            {/* 1. Quick Select Mode - Tap on Profile Card */}
            {!isManualMode && !selectedUser && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[#25180E] tracking-tight font-display">
                    Pilih Akun Staf
                  </h2>
                  <p className="text-xs sm:text-sm text-[#705642]">
                    Silakan pilih profil Anda untuk memulai transaksi operasional hari ini.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Grid of users */}
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                  {activeUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickSelect(user)}
                      className="group flex flex-col items-center p-4 rounded-3xl border border-[#EAE0D5] bg-[#FAF8F5] hover:bg-[#F3EDE6] hover:border-[#C4AD99] hover:shadow-md transition-all text-center cursor-pointer active:scale-95 duration-200"
                    >
                      <span className="text-3xl sm:text-4xl filter drop-shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        {user.avatar}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-[#25180E] line-clamp-1">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-stone-500 capitalize tracking-wide mt-0.5 bg-stone-200/50 px-2 py-0.5 rounded-full">
                        {user.role === 'barista' ? 'Barista (Bar)' : user.role === 'chef' ? 'Chef (Dapur)' : user.role === 'cashier' ? 'Kasir POS' : user.role === 'waitress' ? 'Waitress' : 'Owner/CEO'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 text-center">
                  <button 
                    type="button"
                    onClick={() => {
                      setChangePasswordTarget(null);
                      setIsChangePasswordOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#7D4F27] hover:text-[#5A3515] font-bold cursor-pointer hover:underline py-1 px-3 rounded-lg hover:bg-[#FAF6F2] transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Lupa atau ingin ubah PIN staf? Klik untuk Ganti Sandi</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. PIN Entry Screen for Selected User */}
            {!isManualMode && selectedUser && (
              <form onSubmit={handleLoginSubmit} className="space-y-6 max-w-sm mx-auto">
                <div className="text-center space-y-2">
                  <span className="text-5xl filter drop-shadow-md inline-block animate-bounce">
                    {selectedUser.avatar}
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-[#25180E] tracking-tight font-display">
                      {selectedUser.name}
                    </h3>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-0.5">
                      {selectedUser.role === 'barista' ? 'Barista (Bar Minuman)' : selectedUser.role === 'chef' ? 'Chef (Dapur Makanan)' : selectedUser.role === 'cashier' ? 'Kasir POS' : selectedUser.role === 'waitress' ? 'Waitress' : 'Owner / CEO'}
                    </p>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#5A3E29] uppercase tracking-wider block">
                      Sandi / PIN Akses
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[11px] font-bold text-[#7D4F27] hover:text-[#5A3515] flex items-center gap-1 cursor-pointer transition-colors"
                      title={showPin ? "Sembunyikan sandi" : "Lihat sandi"}
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPin ? 'Tutup Sandi' : 'Lihat Sandi'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      autoFocus
                      required
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Masukkan PIN Akses..."
                      className="w-full text-center text-lg tracking-widest py-3 pl-4 pr-12 rounded-2xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      title={showPin ? "Sembunyikan sandi" : "Lihat sandi"}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordTarget(selectedUser);
                        setIsChangePasswordOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#7D4F27] hover:text-[#5A3515] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" />
                      <span>Ganti PIN / Sandi Akun Ini</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToSelect}
                    className="flex-1 py-3 px-4 rounded-xl border border-[#C4AD99] text-stone-700 text-xs font-bold hover:bg-stone-50 transition-all cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 px-4 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Aplikasi</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. Manual Username & Password Login Fallback */}
            {isManualMode && (
              <form onSubmit={handleLoginSubmit} className="space-y-5 max-w-sm mx-auto">
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl font-black text-[#25180E] tracking-tight font-display">
                    Masuk Akun Staf
                  </h2>
                  <p className="text-xs text-[#705642]">
                    Masukkan kredensial terdaftar untuk masuk ke aplikasi.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#5A3E29] uppercase tracking-wider block">
                    Username Staf
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full text-sm py-3 px-4 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#5A3E29] uppercase tracking-wider block">
                      PIN / Sandi Akses
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[11px] font-bold text-[#7D4F27] hover:text-[#5A3515] flex items-center gap-1 cursor-pointer transition-colors"
                      title={showPin ? "Sembunyikan sandi" : "Lihat sandi"}
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPin ? 'Tutup Sandi' : 'Lihat Sandi'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Masukkan PIN / Sandi..."
                      className="w-full text-sm py-3 pl-4 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D4F27] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      title={showPin ? "Sembunyikan sandi" : "Lihat sandi"}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordTarget(null);
                        setIsChangePasswordOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#7D4F27] hover:text-[#5A3515] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" />
                      <span>Ganti PIN / Sandi</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Aplikasi</span>
                </button>
              </form>
            )}

          </div>

          {/* Quick Info & Default Credentials section */}
          <div className="pt-4 border-t border-[#F0E4D8]">
            <div className="bg-[#FAF6F2] border border-[#E3D3C4] rounded-2xl p-3.5 space-y-2">
              <span className="text-[10px] font-black text-[#7D4F27] uppercase tracking-wider block">
                🔑 Kredensial Akses Staf:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px] text-[#5A3E29] font-medium">
                <div>👑 Owner: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">owner</code> (1122)</div>
                <div>💳 Kasir: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">kasir</code> (2233)</div>
                <div>🛎️ Waitress: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">waitress</code> (3344)</div>
                <div>☕ Barista: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">barista</code> (5566)</div>
                <div>👨‍🍳 Chef: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">chef</code> (4455)</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => {
          setIsChangePasswordOpen(false);
          setChangePasswordTarget(null);
        }}
        targetUser={changePasswordTarget}
      />
    </div>
  );
};
