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
  ShieldAlert
} from 'lucide-react';
import { NadiraLogo } from './NadiraLogo';

export const LoginView: React.FC = () => {
  const { users, setCurrentUser, showToast } = useCafe();
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // State for manual username login fallback
  const [isManualMode, setIsManualMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-[#25180E] flex items-center justify-center">
                <NadiraLogo size={22} color="white" />
              </div>
              <span className="font-display text-lg font-bold text-[#25180E]">
                NADIRA Café
              </span>
            </div>

            <button
              onClick={() => {
                setIsManualMode(!isManualMode);
                handleBackToSelect();
              }}
              className="text-xs font-bold text-[#7D4F27] hover:text-[#5A3515] transition-all underline underline-offset-4 ml-auto cursor-pointer"
            >
              {isManualMode ? 'Kembali ke Pilih Staf' : 'Gunakan Username Manual'}
            </button>
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
                        {user.role === 'chef' ? 'Chef / Barista' : user.role === 'cashier' ? 'Kasir POS' : user.role === 'waitress' ? 'Waitress' : 'Owner/CEO'}
                      </span>
                    </button>
                  ))}
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
                      {selectedUser.role === 'chef' ? 'Chef & Barista' : selectedUser.role === 'cashier' ? 'Kasir POS' : selectedUser.role === 'waitress' ? 'Waitress' : 'Owner / CEO'}
                    </p>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#5A3E29] uppercase tracking-wider block">
                    Sandi / PIN Akses
                  </label>
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
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  <label className="text-xs font-black text-[#5A3E29] uppercase tracking-wider block">
                    PIN / Sandi Akses
                  </label>
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
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                🔑 Kredensial Bawaan Demo (Gunakan untuk Uji Coba):
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#5A3E29] font-medium">
                <div>👑 Owner: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">owner</code> / PIN <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">1122</code></div>
                <div>💳 Kasir: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">kasir</code> / PIN <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">2233</code></div>
                <div>🛎️ Waitress: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">waitress</code> / PIN <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">3344</code></div>
                <div>👨‍🍳 Chef: <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">chef</code> / PIN <code className="bg-stone-200/60 px-1 py-0.5 rounded font-black text-black">4455</code></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
