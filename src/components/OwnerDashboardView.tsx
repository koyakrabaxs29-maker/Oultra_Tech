import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { MenuCategory, MenuItem, InventoryItem, UserAccount, UserRole, Order, MenuAddOn, DEFAULT_CATEGORY_ADDONS } from '../types';
import { formatRupiah, formatFullDateTime } from '../utils/formatters';
import { ProfitLossReportView } from './ProfitLossReportView';
import { EditTransactionModal } from './EditTransactionModal';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { OrdersListView } from './OrdersListView';
import { ChangePasswordModal } from './ChangePasswordModal';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingBag, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  Search, 
  Layers, 
  Boxes, 
  PackagePlus, 
  Download,
  Coffee,
  PieChart,
  UploadCloud,
  ImageIcon,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  FileUp,
  Receipt,
  Filter,
  UtensilsCrossed,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Scale,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogIn,
  Key,
  KeyRound
} from 'lucide-react';

// Preset kurasi foto kafe berkualitas tinggi untuk mempermudah Owner
const PRESET_CAFE_IMAGES: { category: MenuCategory; name: string; url: string }[] = [
  // Kopi
  { category: 'Kopi', name: 'Caramel Macchiato', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80' },
  { category: 'Kopi', name: 'Espresso Romano', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { category: 'Kopi', name: 'Cafe Latte Art', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' },
  { category: 'Kopi', name: 'Cappuccino Foam', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
  { category: 'Kopi', name: 'Manual Brew V60', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80' },
  
  // Non-Kopi
  { category: 'Non-Kopi', name: 'Matcha Green Tea', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80' },
  { category: 'Non-Kopi', name: 'Earl Grey Artisan Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { category: 'Non-Kopi', name: 'Red Velvet Ice Blend', url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80' },
  { category: 'Non-Kopi', name: 'Fresh Berry Mojito', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },

  // Makanan Ringan
  { category: 'Makanan Ringan', name: 'French Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { category: 'Makanan Ringan', name: 'Truffle Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },
  { category: 'Makanan Ringan', name: 'Churros Cinnamon', url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80' },
  { category: 'Makanan Ringan', name: 'Pisang Keju Crispy', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },

  // Makanan Berat
  { category: 'Makanan Berat', name: 'Wagyu Sirloin Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { category: 'Makanan Berat', name: 'Truffle Cream Pasta', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  { category: 'Makanan Berat', name: 'Nasi Goreng Wagyu', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80' },
  { category: 'Makanan Berat', name: 'Gourmet Beef Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
];

export const OwnerDashboardView: React.FC = () => {
  const { 
    menuItems, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleMenuStock,
    completedOrders, 
    activeOrders, 
    updateCompletedOrder,
    deleteCompletedOrder,
    inventory, 
    updateInventoryStock, 
    addInventoryItem, 
    deleteInventoryItem,
    expenses,
    users, 
    addUser, 
    updateUser, 
    deleteUser,
    currentUser,
    onlineSessions
  } = useCafe();

  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'profit_loss' | 'menu' | 'inventory' | 'users'>('analytics');
  const [cashflowPeriod, setCashflowPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // OWNER ACCESS AUTHENTICATION STATE
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nadira_owner_authenticated') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Harap isi username dan password / PIN Anda.');
      return;
    }

    const foundOwner = users.find(
      (usr) => 
        usr.role === 'owner' && 
        usr.username.toLowerCase() === usernameInput.trim().toLowerCase() && 
        usr.pin === passwordInput.trim()
    );

    if (foundOwner) {
      if (!foundOwner.active) {
        setLoginError('Akun Owner ini sedang dinonaktifkan.');
        return;
      }
      setLoginError(null);
      setIsOwnerAuthenticated(true);
      sessionStorage.setItem('nadira_owner_authenticated', 'true');
      sessionStorage.setItem('nadira_owner_id', foundOwner.id);
    } else {
      setLoginError('Username atau PIN/Password salah.');
    }
  };

  // TRANSACTION EDIT & DELETE STATE
  const [editingTransaction, setEditingTransaction] = useState<Order | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Order | null>(null);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionPaymentFilter, setTransactionPaymentFilter] = useState<'all' | 'cash' | 'qris' | 'bank_transfer'>('all');

  // MENU CRUD STATE
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Kopi' as MenuCategory,
    price: 25000,
    largePriceAddition: 6000,
    hasLargePortion: true,
    description: '',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    prepTimeMinutes: 5,
    station: 'bar' as 'bar' | 'kitchen',
    tags: 'Favorit, Signature',
    inStock: true,
    availableAddOns: [] as MenuAddOn[],
  });

  // ADD-ON SUB-STATE FOR MENU MODAL
  const [newAddOnName, setNewAddOnName] = useState('');
  const [newAddOnPrice, setNewAddOnPrice] = useState<number>(5000);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [editingAddOnName, setEditingAddOnName] = useState('');
  const [editingAddOnPrice, setEditingAddOnPrice] = useState<number>(5000);

  // PHOTO UPLOAD & SELECTION STATE
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processAndCompressImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Mohon pilih file gambar (.jpg, .png, .webp, .jpeg).');
      return;
    }

    setUploadError(null);
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setMenuForm((prev) => ({ ...prev, image: compressedDataUrl }));
        } else {
          setMenuForm((prev) => ({ ...prev, image: dataUrl }));
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setUploadError('Gagal memproses file gambar. Silakan coba gambar lain.');
        setIsProcessingImage(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file gambar.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // INVENTORY CRUD STATE
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [invForm, setInvForm] = useState({
    name: '',
    category: 'Kopi & Biji' as InventoryItem['category'],
    stockQuantity: 10,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 50000,
  });

  // RESTOCK MODAL STATE
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(5);

  // USER CRUD STATE
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showModalPin, setShowModalPin] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordTarget, setChangePasswordTarget] = useState<UserAccount | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [showAllPins, setShowAllPins] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    role: 'waitress' as UserRole,
    pin: '1234',
    email: '',
    phone: '',
    active: true,
    avatar: '☕',
  });

  // Helper for cashflow date filtering
  const isDateInPeriod = (dateStr?: string, period: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (period === 'daily') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    } else if (period === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    } else if (period === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return itemDate >= thirtyDaysAgo && itemDate <= now;
    }
    return true;
  };

  // Cashflow summaries for all periods
  const getCashflowStats = (period: 'daily' | 'weekly' | 'monthly') => {
    const periodOrders = completedOrders.filter(o => isDateInPeriod(o.updatedAt || o.createdAt, period));
    const periodExpenses = expenses.filter(e => isDateInPeriod(e.date, period));

    const totalInflow = periodOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOutflow = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netCashflow = totalInflow - totalOutflow;
    const orderCount = periodOrders.length;
    const expenseCount = periodExpenses.length;

    return {
      totalInflow,
      totalOutflow,
      netCashflow,
      orderCount,
      expenseCount,
      periodOrders,
      periodExpenses
    };
  };

  const dailyCashflow = getCashflowStats('daily');
  const weeklyCashflow = getCashflowStats('weekly');
  const monthlyCashflow = getCashflowStats('monthly');

  const currentCashflow = cashflowPeriod === 'daily' 
    ? dailyCashflow 
    : cashflowPeriod === 'weekly' 
      ? weeklyCashflow 
      : monthlyCashflow;

  // KPI Calculations
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTransactions = completedOrders.length;
  const avgBasketSize = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  
  // Best seller item analysis
  const itemCounts: { [name: string]: { qty: number; revenue: number } } = {};
  completedOrders.forEach((order) => {
    order.items.forEach((it) => {
      if (!itemCounts[it.name]) itemCounts[it.name] = { qty: 0, revenue: 0 };
      itemCounts[it.name].qty += it.quantity;
      itemCounts[it.name].revenue += it.price * it.quantity;
    });
  });

  const bestSellerEntries = Object.entries(itemCounts).sort((a, b) => b[1].qty - a[1].qty);
  const bestSeller = bestSellerEntries[0] ? bestSellerEntries[0][0] : 'Es Kopi Susu Aren Nadira';

  // Category revenue breakdown
  const categoryRevenue: { [cat: string]: number } = {
    'Kopi': 0,
    'Non-Kopi': 0,
    'Makanan Ringan': 0,
    'Makanan Berat': 0,
  };
  completedOrders.forEach((order) => {
    order.items.forEach((it) => {
      if (categoryRevenue[it.category] !== undefined) {
        categoryRevenue[it.category] += it.price * it.quantity;
      }
    });
  });

  // Low stock alerts
  const lowStockItems = inventory.filter((inv) => inv.stockQuantity <= inv.minThreshold);

  // Export transactions as CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Meja', 'Pelanggan', 'Tanggal', 'Metode Bayar', 'Subtotal', 'PPN', 'Total'];
    const rows = completedOrders.map((o) => [
      o.orderNumber,
      `Meja ${o.tableNumber}`,
      `"${o.customerName}"`,
      formatFullDateTime(o.updatedAt),
      o.paymentMethod || 'cash',
      o.subtotal,
      o.tax,
      o.total,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_NADIRA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MENU ACTIONS
  const handleOpenAddMenu = () => {
    setEditingMenuId(null);
    setUploadError(null);
    setPhotoInputMode('upload');
    const initialAddons = DEFAULT_CATEGORY_ADDONS['Kopi'] ? [...DEFAULT_CATEGORY_ADDONS['Kopi']] : [];
    setMenuForm({
      name: '',
      category: 'Kopi',
      price: 25000,
      largePriceAddition: 6000,
      hasLargePortion: true,
      description: '',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 5,
      station: 'bar',
      tags: 'Favorit',
      inStock: true,
      availableAddOns: initialAddons,
    });
    setNewAddOnName('');
    setNewAddOnPrice(5000);
    setEditingAddOnId(null);
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item: MenuItem) => {
    setEditingMenuId(item.id);
    setUploadError(null);
    setPhotoInputMode('upload');
    const currentAddons = item.availableAddOns && item.availableAddOns.length > 0
      ? [...item.availableAddOns]
      : (DEFAULT_CATEGORY_ADDONS[item.category] ? [...DEFAULT_CATEGORY_ADDONS[item.category]] : []);
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      largePriceAddition: item.largePriceAddition || 6000,
      hasLargePortion: item.hasLargePortion !== false,
      description: item.description,
      image: item.image,
      prepTimeMinutes: item.prepTimeMinutes,
      station: item.station,
      tags: item.tags.join(', '),
      inStock: item.inStock,
      availableAddOns: currentAddons,
    });
    setNewAddOnName('');
    setNewAddOnPrice(5000);
    setEditingAddOnId(null);
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = () => {
    const tagsArray = menuForm.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingMenuId) {
      updateMenuItem(editingMenuId, {
        name: menuForm.name,
        category: menuForm.category,
        price: Number(menuForm.price),
        largePriceAddition: menuForm.hasLargePortion ? Number(menuForm.largePriceAddition || 6000) : undefined,
        hasLargePortion: menuForm.hasLargePortion,
        description: menuForm.description,
        image: menuForm.image,
        prepTimeMinutes: Number(menuForm.prepTimeMinutes),
        station: menuForm.station,
        tags: tagsArray,
        inStock: menuForm.inStock,
        availableAddOns: menuForm.availableAddOns,
      });
    } else {
      addMenuItem({
        name: menuForm.name,
        category: menuForm.category,
        price: Number(menuForm.price),
        largePriceAddition: menuForm.hasLargePortion ? Number(menuForm.largePriceAddition || 6000) : undefined,
        hasLargePortion: menuForm.hasLargePortion,
        description: menuForm.description,
        image: menuForm.image,
        prepTimeMinutes: Number(menuForm.prepTimeMinutes),
        station: menuForm.station,
        tags: tagsArray,
        inStock: menuForm.inStock,
        availableAddOns: menuForm.availableAddOns,
      });
    }
    setIsMenuModalOpen(false);
  };

  // INVENTORY ACTIONS
  const handleSaveInventory = () => {
    addInventoryItem({
      name: invForm.name,
      category: invForm.category,
      stockQuantity: Number(invForm.stockQuantity),
      unit: invForm.unit,
      minThreshold: Number(invForm.minThreshold),
      costPerUnit: Number(invForm.costPerUnit),
      lastRestocked: new Date().toISOString().split('T')[0],
    });
    setIsInventoryModalOpen(false);
  };

  const handleConfirmRestock = () => {
    if (!restockItem) return;
    updateInventoryStock(restockItem.id, restockItem.stockQuantity + Number(restockAmount));
    setRestockItem(null);
  };

  // USER ACTIONS
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setShowModalPin(false);
    setUserForm({
      name: '',
      username: '',
      role: 'waitress',
      pin: '1234',
      email: '',
      phone: '',
      active: true,
      avatar: '☕',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (usr: UserAccount) => {
    setEditingUserId(usr.id);
    setShowModalPin(false);
    setUserForm({
      name: usr.name,
      username: usr.username,
      role: usr.role,
      pin: usr.pin,
      email: usr.email,
      phone: usr.phone,
      active: usr.active,
      avatar: usr.avatar,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUserId) {
      updateUser(editingUserId, userForm);
    } else {
      addUser(userForm);
    }
    setIsUserModalOpen(false);
  };

  if (!isOwnerAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-[#E3D3C4] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-[#24170D] text-[#FFF5EA] px-6 py-8 text-center relative border-b border-[#3D2513]">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#A8713D] to-[#6E421B] flex items-center justify-center text-white border border-[#C58E55]/30 shadow-md mb-3">
              <Lock className="w-6 h-6 text-[#F7E6D4]" />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-[#F7E6D4]">
              Otentikasi Owner / CEO
            </h2>
            <p className="text-xs text-[#C4AD99] mt-1">
              NADIRA Café & Resto • Panel Manajemen Terproteksi
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5A3E29] uppercase tracking-wider block">
                Username Owner
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username owner..."
                  className="w-full text-sm py-3 px-4 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27] focus:border-[#7D4F27] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5A3E29] uppercase tracking-wider block">
                Sandi / PIN Akses
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan PIN / Sandi..."
                  maxLength={16}
                  className="w-full text-sm py-3 pl-4 pr-11 rounded-xl border border-[#E3D3C4] bg-[#FAF6F2] text-[#2C1D11] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27] focus:border-[#7D4F27] tracking-wider transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 cursor-pointer animate-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Panel Owner</span>
            </button>

            <div className="pt-2 border-t border-[#F0E4D8] text-center">
              <p className="text-[11px] text-[#8A715C] leading-relaxed">
                Butuh bantuan? Silakan gunakan Username <code className="bg-[#FAF6F2] px-1 py-0.5 rounded font-bold border border-[#E3D3C4]">owner</code> & PIN <code className="bg-[#FAF6F2] px-1 py-0.5 rounded font-bold border border-[#E3D3C4]">1122</code> (Akses Utama Sistem).
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & Navigation */}
      <div className="bg-[#24170D] text-[#FFF5EA] p-4 sm:p-5 rounded-2xl border border-[#422915] shadow-md flex flex-col gap-4">
        {/* Header Title Row */}
        <div className="flex items-center justify-between gap-3 border-b border-[#3D2513]/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#A8713D] to-[#6E421B] flex items-center justify-center text-white border border-[#C58E55]/30 shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 id="heading-owner-ceo-dashboard" className="font-display text-lg sm:text-2xl font-bold text-[#F7E6D4] tracking-tight">
              Owner & CEO Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#C4AD99] mr-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sistem Operasional Aktif</span>
            </div>
            
            <button
              id="btn-owner-logout"
              onClick={() => {
                sessionStorage.removeItem('nadira_owner_authenticated');
                sessionStorage.removeItem('nadira_owner_id');
                setIsOwnerAuthenticated(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="Kunci / Keluar dari Sesi Owner"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>

        {/* Tab Selector - Repositioned for high visibility & ease of touch/click */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#1C120A] p-2 rounded-xl border border-[#3D2513]">
          {[
            { key: 'analytics', label: 'Laporan & Omset', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'orders', label: 'Data Pemesanan', icon: <UtensilsCrossed className="w-4 h-4" />, badge: activeOrders.length },
            { key: 'profit_loss', label: 'Laba Rugi (P&L)', icon: <Receipt className="w-4 h-4" /> },
            { key: 'menu', label: 'Menu & Harga', icon: <Coffee className="w-4 h-4" /> },
            { key: 'inventory', label: 'Stok Bahan Baku', icon: <Boxes className="w-4 h-4" />, badge: lowStockItems.length },
            { key: 'users', label: 'Pengguna & Staf', icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              id={`tab-owner-${tab.key}`}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#8C582B] to-[#7D4F27] text-white shadow-md ring-1 ring-[#D4A373]/40'
                  : 'text-[#C4AD99] hover:text-white hover:bg-[#2C1C10]'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-black shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
            Total Omset Hari Ini
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#7D4F27]">
            {formatRupiah(totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            ↑ 18.5% dari target harian
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
            Total Transaksi Selesai
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#2C1D11]">
            {totalTransactions} Transaksi
          </div>
          <span className="text-[11px] text-[#7A614D] font-medium block">
            {activeOrders.length} pesanan aktif sedang berjalan
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
            Rata-rata Nilai Transaksi
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-[#2C1D11]">
            {formatRupiah(avgBasketSize)}
          </div>
          <span className="text-[11px] text-[#7A614D] font-medium block">
            Per struk / per bill meja
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A715C]">
            Menu Terlaris (Best Seller)
          </span>
          <div className="text-sm font-bold text-[#7D4F27] truncate">
            {bestSeller}
          </div>
          <span className="text-[11px] text-stone-500 font-medium block">
            Favorit pengunjung NADIRA
          </span>
        </div>

      </div>

      {/* SUB-TAB 1: Laporan & Analitik Penjualan */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">

          {/* LAPORAN UANG MASUK & KELUAR (HARIAN, MINGGUAN, BULANAN) */}
          <div className="bg-white rounded-2xl border border-[#E3D3C4] p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F0E4D8]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#7D4F27] text-white flex items-center justify-center font-bold shadow-xs">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#2C1D11]">
                    Laporan Uang Masuk & Keluar
                  </h3>
                </div>
                <p className="text-xs text-[#7A614D] mt-1">
                  Monitoring arus kas masuk (pembayaran pesanan pelanggan) & uang keluar (biaya operasional kafe).
                </p>
              </div>

              {/* Tombol Pemilih Periode: Harian, Mingguan, Bulanan */}
              <div className="flex items-center gap-1.5 p-1 bg-[#FBF8F5] border border-[#E3D3C4] rounded-xl self-start md:self-auto">
                <button
                  id="btn-period-daily"
                  onClick={() => setCashflowPeriod('daily')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cashflowPeriod === 'daily'
                      ? 'bg-[#7D4F27] text-white shadow-xs'
                      : 'text-[#7A614D] hover:bg-[#F3ECE4]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Harian</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${cashflowPeriod === 'daily' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
                    Hari Ini
                  </span>
                </button>

                <button
                  id="btn-period-weekly"
                  onClick={() => setCashflowPeriod('weekly')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cashflowPeriod === 'weekly'
                      ? 'bg-[#7D4F27] text-white shadow-xs'
                      : 'text-[#7A614D] hover:bg-[#F3ECE4]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Mingguan</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${cashflowPeriod === 'weekly' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
                    7 Hari
                  </span>
                </button>

                <button
                  id="btn-period-monthly"
                  onClick={() => setCashflowPeriod('monthly')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cashflowPeriod === 'monthly'
                      ? 'bg-[#7D4F27] text-white shadow-xs'
                      : 'text-[#7A614D] hover:bg-[#F3ECE4]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Bulanan</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${cashflowPeriod === 'monthly' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
                    30 Hari
                  </span>
                </button>
              </div>
            </div>

            {/* 3 Kartu Ringkasan: Uang Masuk, Uang Keluar, Arus Kas Bersih */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Uang Masuk */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    Uang Masuk (Pemasukan)
                  </span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    {currentCashflow.orderCount} Transaksi
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-700">
                  {formatRupiah(currentCashflow.totalInflow)}
                </div>
                <p className="text-[11px] text-emerald-800/80">
                  Periode {cashflowPeriod === 'daily' ? 'Hari Ini' : cashflowPeriod === 'weekly' ? '7 Hari Terakhir' : '30 Hari Terakhir'}
                </p>
              </div>

              {/* Uang Keluar */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                  <span className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    Uang Keluar (Pengeluaran)
                  </span>
                  <span className="text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
                    {currentCashflow.expenseCount} Pos Biaya
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-rose-700">
                  {formatRupiah(currentCashflow.totalOutflow)}
                </div>
                <p className="text-[11px] text-rose-800/80">
                  Biaya operasional, gaji & bahan penunjang
                </p>
              </div>

              {/* Kas Bersih */}
              <div className={`p-4 rounded-xl border space-y-1 ${
                currentCashflow.netCashflow >= 0 
                  ? 'border-amber-200 bg-[#FFFDF9]' 
                  : 'border-rose-200 bg-rose-50/30'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold text-[#5A3E29]">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#7D4F27]" />
                    Selisih Kas Bersih (Net Cash)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    currentCashflow.netCashflow >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {currentCashflow.netCashflow >= 0 ? 'Surplus' : 'Defisit'}
                  </span>
                </div>
                <div className={`text-2xl font-extrabold ${
                  currentCashflow.netCashflow >= 0 ? 'text-[#7D4F27]' : 'text-rose-600'
                }`}>
                  {formatRupiah(currentCashflow.netCashflow)}
                </div>
                <p className="text-[11px] text-stone-500">
                  {currentCashflow.netCashflow >= 0 
                    ? `Surplus kas sebesar ${formatRupiah(currentCashflow.netCashflow)}`
                    : `Pengeluaran melebihi pemasukan kas`}
                </p>
              </div>

            </div>

            {/* Rincian Komparasi 3 Periode Sekaligus (Harian, Mingguan, Bulanan) */}
            <div className="rounded-xl border border-[#E3D3C4] overflow-hidden">
              <div className="bg-[#FBF8F5] px-4 py-3 border-b border-[#E3D3C4] flex items-center justify-between">
                <span className="font-bold text-xs text-[#2C1D11] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7D4F27]" />
                  Tabel Ringkasan Komparasi: Harian, Mingguan & Bulanan
                </span>
                <span className="text-[11px] text-[#7A614D]">
                  Data sinkron otomatis dengan kasir & log pengeluaran
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F0] text-[#5A3E29] font-bold border-b border-[#E3D3C4]">
                    <tr>
                      <th className="p-3">Periode Waktu</th>
                      <th className="p-3 text-right text-emerald-700">Uang Masuk</th>
                      <th className="p-3 text-right text-rose-700">Uang Keluar</th>
                      <th className="p-3 text-right text-[#2C1D11]">Kas Bersih (Net)</th>
                      <th className="p-3 text-center">Status Keuangan</th>
                      <th className="p-3 text-center">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E4D8]">
                    {/* Harian */}
                    <tr className={`hover:bg-stone-50 transition-colors ${cashflowPeriod === 'daily' ? 'bg-[#FAEDCD]/20' : ''}`}>
                      <td className="p-3 font-bold text-[#2C1D11] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <div>
                          <div>Harian (Hari Ini)</div>
                          <span className="text-[10px] text-stone-500 font-normal">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {formatRupiah(dailyCashflow.totalInflow)}
                        <span className="block text-[10px] text-stone-400 font-normal">({dailyCashflow.orderCount} pesanan)</span>
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700">
                        {formatRupiah(dailyCashflow.totalOutflow)}
                        <span className="block text-[10px] text-stone-400 font-normal">({dailyCashflow.expenseCount} biaya)</span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#7D4F27]">
                        {formatRupiah(dailyCashflow.netCashflow)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dailyCashflow.netCashflow >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {dailyCashflow.netCashflow >= 0 ? 'Surplus' : 'Defisit'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setCashflowPeriod('daily')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            cashflowPeriod === 'daily' ? 'bg-[#7D4F27] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          }`}
                        >
                          Lihat Rincian
                        </button>
                      </td>
                    </tr>

                    {/* Mingguan */}
                    <tr className={`hover:bg-stone-50 transition-colors ${cashflowPeriod === 'weekly' ? 'bg-[#FAEDCD]/20' : ''}`}>
                      <td className="p-3 font-bold text-[#2C1D11] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <div>
                          <div>Mingguan (7 Hari Terakhir)</div>
                          <span className="text-[10px] text-stone-500 font-normal">Rentang 7 hari operasional</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {formatRupiah(weeklyCashflow.totalInflow)}
                        <span className="block text-[10px] text-stone-400 font-normal">({weeklyCashflow.orderCount} pesanan)</span>
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700">
                        {formatRupiah(weeklyCashflow.totalOutflow)}
                        <span className="block text-[10px] text-stone-400 font-normal">({weeklyCashflow.expenseCount} biaya)</span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#7D4F27]">
                        {formatRupiah(weeklyCashflow.netCashflow)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          weeklyCashflow.netCashflow >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {weeklyCashflow.netCashflow >= 0 ? 'Surplus' : 'Defisit'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setCashflowPeriod('weekly')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            cashflowPeriod === 'weekly' ? 'bg-[#7D4F27] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          }`}
                        >
                          Lihat Rincian
                        </button>
                      </td>
                    </tr>

                    {/* Bulanan */}
                    <tr className={`hover:bg-stone-50 transition-colors ${cashflowPeriod === 'monthly' ? 'bg-[#FAEDCD]/20' : ''}`}>
                      <td className="p-3 font-bold text-[#2C1D11] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <div>
                          <div>Bulanan (30 Hari Terakhir)</div>
                          <span className="text-[10px] text-stone-500 font-normal">Akumulasi siklus bulanan kafe</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {formatRupiah(monthlyCashflow.totalInflow)}
                        <span className="block text-[10px] text-stone-400 font-normal">({monthlyCashflow.orderCount} pesanan)</span>
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700">
                        {formatRupiah(monthlyCashflow.totalOutflow)}
                        <span className="block text-[10px] text-stone-400 font-normal">({monthlyCashflow.expenseCount} biaya)</span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#7D4F27]">
                        {formatRupiah(monthlyCashflow.netCashflow)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          monthlyCashflow.netCashflow >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {monthlyCashflow.netCashflow >= 0 ? 'Surplus' : 'Defisit'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setCashflowPeriod('monthly')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            cashflowPeriod === 'monthly' ? 'bg-[#7D4F27] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          }`}
                        >
                          Lihat Rincian
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-Rincian Item Arus Kas yang Aktif Dipilih */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Kolom Kiri: Rincian Uang Masuk */}
              <div className="border border-[#E3D3C4] rounded-xl p-4 space-y-3 bg-[#FDFBF9]">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0E4D8]">
                  <span className="font-bold text-xs text-[#2C1D11] flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    Rincian Pemasukan ({cashflowPeriod === 'daily' ? 'Hari Ini' : cashflowPeriod === 'weekly' ? '7 Hari' : '30 Hari'})
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Total: {formatRupiah(currentCashflow.totalInflow)}
                  </span>
                </div>

                {currentCashflow.periodOrders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2 text-center">Belum ada transaksi pada periode ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentCashflow.periodOrders.slice(0, 6).map((ord) => (
                      <div key={ord.id} className="bg-white p-2.5 rounded-lg border border-[#E3D3C4]/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#2C1D11]">{ord.orderNumber} - {ord.customerName}</div>
                          <span className="text-[10px] text-stone-400">Meja #{ord.tableNumber} • {ord.paymentMethod?.toUpperCase()}</span>
                        </div>
                        <span className="font-bold text-emerald-700">{formatRupiah(ord.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Rincian Uang Keluar */}
              <div className="border border-[#E3D3C4] rounded-xl p-4 space-y-3 bg-[#FDFBF9]">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0E4D8]">
                  <span className="font-bold text-xs text-[#2C1D11] flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    Rincian Pengeluaran ({cashflowPeriod === 'daily' ? 'Hari Ini' : cashflowPeriod === 'weekly' ? '7 Hari' : '30 Hari'})
                  </span>
                  <span className="text-[11px] font-bold text-rose-700">
                    Total: {formatRupiah(currentCashflow.totalOutflow)}
                  </span>
                </div>

                {currentCashflow.periodExpenses.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2 text-center">Tidak ada catatan pengeluaran pada periode ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentCashflow.periodExpenses.map((exp) => (
                      <div key={exp.id} className="bg-white p-2.5 rounded-lg border border-[#E3D3C4]/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#2C1D11]">{exp.name}</div>
                          <span className="text-[10px] text-stone-400">{exp.category} • {exp.date}</span>
                        </div>
                        <span className="font-bold text-rose-700">{formatRupiah(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Category Revenue Breakdown */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-[#2C1D11] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#7D4F27]" />
                Proporsi Omset per Kategori Menu
              </h3>
              
              <div className="space-y-3">
                {Object.entries(categoryRevenue).map(([cat, amount]) => {
                  const percent = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 25;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#2C1D11]">{cat}</span>
                        <span className="text-[#7D4F27] font-bold">{formatRupiah(amount)} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full bg-[#7D4F27] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Seller Rank */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#E3D3C4] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#2C1D11]">
                  Peringkat Menu Paling Laris
                </h3>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-[#5A3E29] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="divide-y divide-[#F0E4D8] border border-[#E3D3C4] rounded-xl overflow-hidden">
                {bestSellerEntries.slice(0, 5).map(([name, data], idx) => (
                  <div key={name} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#FAEDCD] text-[#7D4F27] font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#2C1D11]">{name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#7D4F27] block">{data.qty} porsi terjual</span>
                      <span className="text-[10px] text-stone-500">{formatRupiah(data.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Full Transaction History Table with Edit & Delete */}
          <div className="bg-white rounded-2xl border border-[#E3D3C4] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#2C1D11]">
                  Riwayat Transaksi Pembayaran Resmi ({completedOrders.length})
                </h3>
                <p className="text-xs text-[#7A614D]">
                  Kelola, edit rincian pembayaran, atau hapus transaksi tercatat bila terjadi koreksi kasir.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 rounded-lg bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari No. Order (#NDR), Pelanggan, Meja..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-2 focus:ring-[#7D4F27] bg-[#FDFBF9]"
                />
                {transactionSearch && (
                  <button
                    onClick={() => setTransactionSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
                <span className="text-[11px] text-stone-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Metode:
                </span>
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'cash', label: 'Tunai' },
                  { key: 'qris', label: 'QRIS' },
                  { key: 'bank_transfer', label: 'Transfer' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTransactionPaymentFilter(f.key as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      transactionPaymentFilter === f.key
                        ? 'bg-[#7D4F27] text-white font-bold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="border border-[#E3D3C4] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBF8F5] text-[#5A3E29] font-bold border-b border-[#E3D3C4]">
                  <tr>
                    <th className="p-3">No. Order</th>
                    <th className="p-3">Meja</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Waktu Bayar</th>
                    <th className="p-3">Metode</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Total Transaksi</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4D8]">
                  {completedOrders
                    .filter((order) => {
                      const matchesSearch = 
                        order.orderNumber.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                        order.customerName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                        `meja ${order.tableNumber}`.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                        `#${order.tableNumber}`.includes(transactionSearch);
                      
                      const matchesMethod = 
                        transactionPaymentFilter === 'all' || 
                        (order.paymentMethod || 'cash') === transactionPaymentFilter;

                      return matchesSearch && matchesMethod;
                    })
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 font-bold text-[#7D4F27] whitespace-nowrap">{order.orderNumber}</td>
                        <td className="p-3 font-semibold whitespace-nowrap">Meja #{order.tableNumber}</td>
                        <td className="p-3 text-stone-700 font-medium">{order.customerName}</td>
                        <td className="p-3 text-stone-500 whitespace-nowrap">{formatFullDateTime(order.updatedAt || order.createdAt)}</td>
                        <td className="p-3">
                          <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {order.paymentMethod || 'cash'}
                          </span>
                        </td>
                        <td className="p-3 text-right text-stone-600">{formatRupiah(order.subtotal)}</td>
                        <td className="p-3 text-right font-extrabold text-[#2C1D11]">{formatRupiah(order.total)}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-edit-tx-${order.id}`}
                              onClick={() => setEditingTransaction(order)}
                              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Edit className="w-3 h-3 text-[#7D4F27]" />
                              <span>Edit</span>
                            </button>
                            <button
                              id={`btn-del-tx-${order.id}`}
                              onClick={() => setDeletingTransaction(order)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {completedOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-stone-500">
                        Belum ada riwayat transaksi pembayaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Data Pemesanan & Status Saji */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E3D3C4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#2C1D11]">
                Data Pemesanan & Status Penyajian Meja Kafe
              </h2>
              <p className="text-xs text-[#7A614D]">
                Pantau pesanan berjalan secara langsung, tandai &quot;Makanan/Minuman Sudah Disajikan&quot; dan konfirmasi &quot;Orderan Selesai&quot;.
              </p>
            </div>
          </div>
          <OrdersListView role="owner" />
        </div>
      )}

      {/* SUB-TAB: Laporan Keuangan Laba Rugi (Profit & Loss) */}
      {activeTab === 'profit_loss' && (
        <ProfitLossReportView />
      )}

      {/* SUB-TAB 2: Manajemen Menu & Harga (CRUD) */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-2xl border border-[#E3D3C4] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#2C1D11]">
                Katalog Menu & Manajemen Harga
              </h3>
              <p className="text-xs text-[#7A614D]">
                Tambah menu baru, ubah harga, hapus, dan atur ketersediaan stok dapur secara instan.
              </p>
            </div>
            <button
              id="btn-add-new-menu"
              onClick={handleOpenAddMenu}
              className="px-4 py-2.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>

          <div className="border border-[#E3D3C4] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF8F5] text-[#5A3E29] font-bold border-b border-[#E3D3C4]">
                <tr>
                  <th className="p-3">Foto & Nama Menu</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Stasiun Dapur</th>
                  <th className="p-3">Porsi & Add-ons</th>
                  <th className="p-3 text-right">Harga Jual</th>
                  <th className="p-3 text-center">Status Stok</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4D8]">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-[#E3D3C4]"
                        />
                        <div>
                          <span className="font-bold text-[#2C1D11] block">{item.name}</span>
                          <span className="text-[10px] text-[#8A715C] line-clamp-1 max-w-[220px]">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-stone-700">{item.category}</td>
                    <td className="p-3">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {item.station}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {item.hasLargePortion !== false && (
                          <div className="text-[10px] text-stone-600 font-medium">
                            Large: +{formatRupiah(item.largePriceAddition || 6000)}
                          </div>
                        )}
                        {item.availableAddOns && item.availableAddOns.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="px-1.5 py-0.5 bg-amber-100 text-[#7D4F27] border border-amber-200 font-bold text-[9px] rounded">
                              {item.availableAddOns.length} Add-on
                            </span>
                            {item.availableAddOns.slice(0, 2).map((a) => (
                              <span key={a.id} className="text-[9px] text-stone-600 bg-stone-100 px-1 py-0.5 rounded">
                                {a.name} (+{formatRupiah(a.price)})
                              </span>
                            ))}
                            {item.availableAddOns.length > 2 && (
                              <span className="text-[9px] text-[#7D4F27] font-semibold">
                                +{item.availableAddOns.length - 2} lagi
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">Standar Kategori</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-extrabold text-[#7D4F27] text-sm">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleMenuStock(item.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          item.inStock
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {item.inStock ? 'Tersedia' : 'Habis'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditMenu(item)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-[#7D4F27] hover:bg-stone-100 transition-colors"
                          title="Edit Menu"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus menu "${item.name}" dari katalog kafe?`)) {
                              deleteMenuItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Manajemen Stok Bahan Baku */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-[#E3D3C4] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#2C1D11]">
                Manajemen Stok Bahan Baku Sederhana
              </h3>
              <p className="text-xs text-[#7A614D]">
                Pantau sisa biji kopi, susu UHT/oats, sirup, daging, kentang dan kemasan dengan peringatan stok kritis.
              </p>
            </div>
            <button
              onClick={() => setIsInventoryModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Tambah Bahan Baku</span>
            </button>
          </div>

          {/* Critical stock alert banner */}
          {lowStockItems.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Peringatan Restock ({lowStockItems.length} bahan menipis):</strong>{' '}
                {lowStockItems.map((i) => `${i.name} (sisa ${i.stockQuantity} ${i.unit})`).join(', ')}. Segera lakukan pemesanan ulang ke supplier.
              </div>
            </div>
          )}

          <div className="border border-[#E3D3C4] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF8F5] text-[#5A3E29] font-bold border-b border-[#E3D3C4]">
                <tr>
                  <th className="p-3">Nama Bahan Baku</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Sisa Stok</th>
                  <th className="p-3 text-right">Batas Kritis</th>
                  <th className="p-3 text-right">Biaya Modal / Unit</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4D8]">
                {inventory.map((inv) => {
                  const isLow = inv.stockQuantity <= inv.minThreshold;
                  return (
                    <tr key={inv.id} className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-[#2C1D11]">{inv.name}</td>
                      <td className="p-3 text-stone-600">{inv.category}</td>
                      <td className="p-3 text-right font-extrabold text-[#7D4F27] text-sm">
                        {inv.stockQuantity} {inv.unit}
                      </td>
                      <td className="p-3 text-right text-stone-500">{inv.minThreshold} {inv.unit}</td>
                      <td className="p-3 text-right text-stone-600">{formatRupiah(inv.costPerUnit)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRestockItem(inv);
                              setRestockAmount(5);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FAEDCD] hover:bg-[#F5DEB3] text-[#7D4F27] font-bold text-[11px] transition-colors"
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus bahan baku "${inv.name}"?`)) {
                                deleteInventoryItem(inv.id);
                              }
                            }}
                            className="p-1 rounded text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Manajemen Pengguna & Staf */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#E3D3C4] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#2C1D11]">
                Pengguna Aplikasi & Hak Akses Staf
              </h3>
              <p className="text-xs text-[#7A614D]">
                Kelola akun kasir, waitress, chef, dan owner dengan PIN otentikasi login cepat di tablet POS.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllPins(!showAllPins)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  showAllPins
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-[#FAF6F2] hover:bg-[#F3ECE4] text-[#7D4F27] border-[#E3D3C4]'
                }`}
                title={showAllPins ? "Sembunyikan semua PIN staf" : "Tampilkan semua PIN staf"}
              >
                {showAllPins ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-[#7D4F27]" />}
                <span>{showAllPins ? 'Tutup Semua PIN' : 'Lihat Semua PIN'}</span>
              </button>

              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2.5 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Staf Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((usr) => {
              const isSelf = currentUser?.id === usr.id;
              const onlineSess = Object.values(onlineSessions).find(
                (sess) => sess.user?.id === usr.id && (Date.now() - sess.lastSeen < 25000)
              );
              const isOnline = isSelf || !!onlineSess;

              // Calculate operational metrics for this staff to help Owner monitor productivity
              let performanceBadge = null;
              if (usr.role === 'waitress') {
                const wOrders = [...activeOrders, ...completedOrders].filter(
                  (o) => o.waitressName?.toLowerCase() === usr.name.toLowerCase() ||
                         o.waitressName?.toLowerCase().includes(usr.name.split(' ')[0].toLowerCase())
                );
                performanceBadge = (
                  <div className="text-[11px] text-[#7A614D] font-bold bg-[#FAF6F2] border border-[#EADBCE] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="text-xs">🛎️</span>
                    <span>{wOrders.length} Order Diinput</span>
                  </div>
                );
              } else if (usr.role === 'barista') {
                const preparedDrinks = [...activeOrders, ...completedOrders].reduce((sum, o) => {
                  return sum + o.items.filter(it => (it.station === 'bar' || it.category === 'Kopi' || it.category === 'Non-Kopi') && (it.status === 'ready' || o.status === 'completed')).reduce((s, it) => s + it.quantity, 0);
                }, 0);
                performanceBadge = (
                  <div className="text-[11px] text-amber-900 font-bold bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="text-xs">☕</span>
                    <span>{preparedDrinks} Minuman Bar</span>
                  </div>
                );
              } else if (usr.role === 'chef') {
                const preparedFood = [...activeOrders, ...completedOrders].reduce((sum, o) => {
                  return sum + o.items.filter(it => (it.station === 'kitchen' || it.category === 'Makanan Ringan' || it.category === 'Makanan Berat') && (it.status === 'ready' || o.status === 'completed')).reduce((s, it) => s + it.quantity, 0);
                }, 0);
                performanceBadge = (
                  <div className="text-[11px] text-orange-700 font-bold bg-orange-50 border border-orange-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="text-xs">🍳</span>
                    <span>{preparedFood} Makanan Dapur</span>
                  </div>
                );
              } else if (usr.role === 'cashier') {
                performanceBadge = (
                  <div className="text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="text-xs">💳</span>
                    <span>{completedOrders.length} Transaksi Sukses</span>
                  </div>
                );
              } else if (usr.role === 'owner') {
                const totalStafCount = users.filter(u => u.role !== 'owner').length;
                performanceBadge = (
                  <div className="text-[11px] text-purple-700 font-bold bg-purple-50 border border-purple-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="text-xs">👑</span>
                    <span>Memantau {totalStafCount} Staf</span>
                  </div>
                );
              }

              return (
                <div key={usr.id} className="p-4 rounded-2xl border border-[#E3D3C4] bg-white hover:border-[#C4AD99] hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between relative overflow-hidden">
                  {/* Decorative background indicator */}
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-5 filter blur-xl ${isOnline ? 'bg-emerald-500' : 'bg-stone-500'}`} />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl filter drop-shadow-sm">{usr.avatar}</span>
                        {/* Real-time online/offline status pill */}
                        <span className={`text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isOnline 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' 
                            : 'bg-stone-100 text-stone-500 border border-stone-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                          {isOnline ? (isSelf ? 'Online (Sesi Ini)' : 'Online (Peer)') : 'Offline'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        usr.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        usr.role === 'cashier' ? 'bg-blue-100 text-blue-800' :
                        usr.role === 'barista' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        usr.role === 'chef' ? 'bg-orange-100 text-orange-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {usr.role === 'barista' ? '☕ Barista' : usr.role === 'chef' ? '👨‍🍳 Chef' : usr.role}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#2C1D11] flex items-center gap-1.5">
                        {usr.name}
                        {isSelf && <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded-full">Anda</span>}
                      </h4>
                      <p className="text-xs text-[#7A614D] flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>@{usr.username}</span>
                        <span>•</span>
                        <span>PIN:</span>
                        <code className="bg-stone-100 px-1.5 py-0.2 rounded font-mono font-bold text-black border border-stone-200">
                          {(showAllPins || revealedPins[usr.id]) ? usr.pin : '••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() => setRevealedPins(prev => ({ ...prev, [usr.id]: !(showAllPins || prev[usr.id]) }))}
                          className="p-0.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                          title={(showAllPins || revealedPins[usr.id]) ? "Sembunyikan PIN" : "Lihat PIN"}
                        >
                          {(showAllPins || revealedPins[usr.id]) ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 select-all">✉️ {usr.email}</p>
                    </div>
                  </div>

                  {/* Operational Performance & Online Info */}
                  <div className="space-y-3">
                    {performanceBadge}

                    <div className="pt-2 border-t border-[#E3D3C4] flex items-center justify-between">
                      <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${usr.active ? 'text-emerald-700' : 'text-red-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${usr.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {usr.active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setChangePasswordTarget(usr);
                            setIsChangePasswordOpen(true);
                          }}
                          className="p-1 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Ganti PIN / Sandi Staf"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditUser(usr)}
                          className="p-1 rounded text-stone-600 hover:text-[#7D4F27] hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Edit Staf"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {usr.role !== 'owner' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus akun ${usr.name}?`)) {
                                deleteUser(usr.id);
                              }
                            }}
                            className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Staf"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Menu */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#E3D3C4] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingMenuId ? 'Edit Menu & Harga' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-stone-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#2C1D11] block mb-1">Nama Menu:</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="Contoh: Affogato Vanilla Caramel"
                  className="w-full p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Kategori:</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value as MenuCategory })}
                    className="w-full p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                  >
                    <option value="Kopi">Kopi</option>
                    <option value="Non-Kopi">Non-Kopi</option>
                    <option value="Makanan Ringan">Makanan Ringan</option>
                    <option value="Makanan Berat">Makanan Berat</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Harga Jual Reguler (Rp):</label>
                  <input
                    type="number"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                  />
                </div>
              </div>

              {/* PORSI LARGE DENGAN HARGA KUSTOM (Ubah / Hapus) */}
              <div className="bg-[#FAF6F2] p-3.5 rounded-xl border border-[#EADBCE] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-[#2C1D11] block">Porsi Large (Harga Kustom)</label>
                    <span className="text-[10px] text-stone-500 block">Aktifkan jika item memiliki variasi porsi besar dengan harga kustom tambahan</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={menuForm.hasLargePortion}
                    onChange={(e) => setMenuForm({ ...menuForm, hasLargePortion: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#7D4F27] cursor-pointer"
                  />
                </div>

                {menuForm.hasLargePortion && (
                  <div className="pt-2.5 border-t border-[#EADBCE] space-y-1.5">
                    <label className="font-bold text-[#2C1D11] block">Selisih Tambahan Harga Porsi Large (+Rp):</label>
                    <input
                      type="number"
                      value={menuForm.largePriceAddition}
                      onChange={(e) => setMenuForm({ ...menuForm, largePriceAddition: Number(e.target.value) })}
                      placeholder="Contoh: 6000 atau 12000"
                      className="w-full p-2.5 rounded-xl border border-[#E3D3C4] bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                    />
                    <p className="text-[10px] text-[#7A614D] font-semibold">
                      Harga Porsi Large otomatis: {formatRupiah(menuForm.price)} + {formatRupiah(menuForm.largePriceAddition || 0)} = <span className="text-[#7D4F27]">{formatRupiah(menuForm.price + (menuForm.largePriceAddition || 0))}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* KELOLA ADD-ONS & TOPPING TAMBAHAN (TAMBAH & UBAH HARGA) */}
              <div className="bg-[#FAF6F2] p-3.5 rounded-xl border border-[#EADBCE] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-[#2C1D11] flex items-center gap-1.5">
                      <span>Pilihan Add-ons & Topping Tambahan</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7D4F27] text-white font-bold">
                        {menuForm.availableAddOns.length} Opsi
                      </span>
                    </label>
                    <span className="text-[10px] text-stone-500 block">
                      Atur nama dan harga tambahan topping/add-on yang bisa dipesan pelanggan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = DEFAULT_CATEGORY_ADDONS[menuForm.category] || [];
                      setMenuForm((prev) => ({ ...prev, availableAddOns: [...presets] }));
                    }}
                    className="text-[10px] text-[#7D4F27] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    title="Muat opsi add-on rekomendasi kategori ini"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Rekomendasi Kategori</span>
                  </button>
                </div>

                {/* List of Add-ons */}
                {menuForm.availableAddOns.length === 0 ? (
                  <div className="text-center py-3 px-2 bg-white rounded-lg border border-dashed border-[#D5C2B1] text-stone-500 text-[11px]">
                    Belum ada add-on untuk menu ini. Tambahkan di bawah atau klik &quot;Rekomendasi Kategori&quot;.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {menuForm.availableAddOns.map((addon) => {
                      const isEditingThis = editingAddOnId === addon.id;
                      if (isEditingThis) {
                        return (
                          <div key={addon.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-300">
                            <input
                              type="text"
                              value={editingAddOnName}
                              onChange={(e) => setEditingAddOnName(e.target.value)}
                              placeholder="Nama Add-on"
                              className="flex-1 p-1.5 text-xs bg-white rounded border border-amber-300 font-semibold focus:outline-none"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-500 font-bold">+Rp</span>
                              <input
                                type="number"
                                value={editingAddOnPrice}
                                onChange={(e) => setEditingAddOnPrice(Number(e.target.value))}
                                placeholder="Harga"
                                className="w-20 p-1.5 text-xs bg-white rounded border border-amber-300 font-bold text-[#7D4F27] focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingAddOnName.trim()) return;
                                setMenuForm((prev) => ({
                                  ...prev,
                                  availableAddOns: prev.availableAddOns.map((a) =>
                                    a.id === addon.id
                                      ? { ...a, name: editingAddOnName.trim(), price: Number(editingAddOnPrice) || 0 }
                                      : a
                                  ),
                                }));
                                setEditingAddOnId(null);
                              }}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              title="Simpan Perubahan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAddOnId(null)}
                              className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-xs cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E3D3C4] hover:border-[#C9B39F] transition-all text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#7D4F27]"></span>
                            <span className="font-bold text-stone-800">{addon.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-[#7D4F27] font-extrabold rounded text-[11px] border border-amber-200">
                              +{formatRupiah(addon.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddOnId(addon.id);
                                setEditingAddOnName(addon.name);
                                setEditingAddOnPrice(addon.price);
                              }}
                              className="p-1 text-stone-500 hover:text-[#7D4F27] hover:bg-stone-100 rounded cursor-pointer"
                              title="Ubah Add-on & Harga"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuForm((prev) => ({
                                  ...prev,
                                  availableAddOns: prev.availableAddOns.filter((a) => a.id !== addon.id),
                                }));
                              }}
                              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Hapus Add-on"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Form Tambah Add-on Baru */}
                <div className="pt-2 border-t border-[#EADBCE]">
                  <label className="font-bold text-[11px] text-[#2C1D11] block mb-1">
                    Tambah Add-on / Topping Baru:
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={newAddOnName}
                      onChange={(e) => setNewAddOnName(e.target.value)}
                      placeholder="Contoh: Keju Leleh, Extra Shot, Telur..."
                      className="w-full sm:flex-1 p-2 bg-white rounded-lg border border-[#E3D3C4] text-xs focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                    />
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <span className="text-[11px] text-stone-500 font-bold">+Rp</span>
                      <input
                        type="number"
                        value={newAddOnPrice || ''}
                        onChange={(e) => setNewAddOnPrice(Number(e.target.value))}
                        placeholder="5000"
                        className="w-24 p-2 bg-white rounded-lg border border-[#E3D3C4] text-xs font-bold text-[#7D4F27] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAddOnName.trim()) return;
                          const newAddon: MenuAddOn = {
                            id: `addon-${Date.now()}-${Math.random().toString().slice(-4)}`,
                            name: newAddOnName.trim(),
                            price: Number(newAddOnPrice) || 0,
                          };
                          setMenuForm((prev) => ({
                            ...prev,
                            availableAddOns: [...prev.availableAddOns, newAddon],
                          }));
                          setNewAddOnName('');
                          setNewAddOnPrice(5000);
                        }}
                        disabled={!newAddOnName.trim()}
                        className="px-3 py-2 bg-[#7D4F27] hover:bg-[#633C1B] disabled:bg-stone-300 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Add-on</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2C1D11] block mb-1">Deskripsi Resep / Menu:</label>
                <textarea
                  rows={2}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Jelaskan aroma, bahan pilihan, dan keunikan menu..."
                  className="w-full p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                />
              </div>

              {/* FOTO MENU: UPLOAD DRAG-AND-DROP, PRESET KAFE, DAN URL */}
              <div className="space-y-2 p-3 bg-[#FAF6F2] rounded-xl border border-[#EADBCE]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#2C1D11] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#7D4F27]" />
                    <span>Foto Menu Makanan / Minuman:</span>
                  </label>
                  <span className="text-[10px] text-[#8C705A]">
                    {menuForm.image?.startsWith('data:image') ? 'Foto Diunggah (Lokal)' : 'Foto Tautan / Preset'}
                  </span>
                </div>

                {/* Preview Foto Saat Ini */}
                {menuForm.image && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#E3D3C4] shadow-xs">
                    <img
                      src={menuForm.image}
                      alt="Preview menu"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover border border-[#D5C2B1] shadow-xs flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2C1D11] text-xs truncate">
                        {menuForm.name || 'Foto Menu Baru'}
                      </p>
                      <p className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5 font-medium">
                        <Check className="w-3 h-3 text-emerald-600" /> Foto siap ditampilkan di katalog kafe
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-[#7D4F27] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <FileUp className="w-3 h-3" /> Ganti Foto
                        </button>
                        <span className="text-stone-300">•</span>
                        <button
                          type="button"
                          onClick={() => setMenuForm({ ...menuForm, image: '' })}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Opsi Tab Pemilihan Sumber Foto */}
                <div className="flex items-center gap-1 bg-[#EFE6DC] p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      photoInputMode === 'upload'
                        ? 'bg-white text-[#7D4F27] shadow-xs'
                        : 'text-[#8C705A] hover:text-[#2C1D11]'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload File Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('preset')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      photoInputMode === 'preset'
                        ? 'bg-white text-[#7D4F27] shadow-xs'
                        : 'text-[#8C705A] hover:text-[#2C1D11]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Galeri Pilihan Kafe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('url')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      photoInputMode === 'url'
                        ? 'bg-white text-[#7D4F27] shadow-xs'
                        : 'text-[#8C705A] hover:text-[#2C1D11]'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Input Link URL</span>
                  </button>
                </div>

                {/* TAB 1: Upload File Langsung (Drag & Drop + File Explorer) */}
                {photoInputMode === 'upload' && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processAndCompressImage(file);
                      }}
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processAndCompressImage(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDraggingFile
                          ? 'border-[#7D4F27] bg-[#F4EDE5] scale-[1.01]'
                          : 'border-[#D5C2B1] bg-white hover:bg-[#FDFBF9] hover:border-[#7D4F27]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FAF3EC] text-[#7D4F27] flex items-center justify-center mb-2">
                        {isProcessingImage ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <p className="font-bold text-[#2C1D11] text-xs">
                        {isProcessingImage ? 'Mengompresi & Memproses Gambar...' : 'Tarik & Lepaskan File Gambar ke Sini'}
                      </p>
                      <p className="text-[10px] text-[#8C705A] mt-0.5">
                        Atau <span className="text-[#7D4F27] font-bold underline">klik untuk memilih dari komputer / galeri HP</span>
                      </p>
                      <p className="text-[9px] text-stone-400 mt-1">
                        Format: JPG, PNG, WEBP, JPEG • Otomatis dikompresi agar ringan dan cepat
                      </p>
                    </div>

                    {uploadError && (
                      <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}

                {/* TAB 2: Koleksi Foto Kafe NADIRA (Preset Rekomendasi) */}
                {photoInputMode === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#8C705A]">
                      Klik salah satu foto aesthetic untuk kategori <strong className="text-[#2C1D11]">{menuForm.category}</strong>:
                    </p>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {PRESET_CAFE_IMAGES
                        .filter(img => img.category === menuForm.category)
                        .concat(PRESET_CAFE_IMAGES.filter(img => img.category !== menuForm.category))
                        .map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setMenuForm({ ...menuForm, image: preset.url })}
                            className={`group relative rounded-lg overflow-hidden border transition-all text-left cursor-pointer ${
                              menuForm.image === preset.url
                                ? 'border-[#7D4F27] ring-2 ring-[#7D4F27]'
                                : 'border-[#E3D3C4] hover:border-[#7D4F27]'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-14 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="p-1 bg-white/95">
                              <span className="text-[9px] font-bold text-[#2C1D11] block truncate">
                                {preset.name}
                              </span>
                            </div>
                            {menuForm.image === preset.url && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#7D4F27] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Input URL Manual */}
                {photoInputMode === 'url' && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={menuForm.image}
                      onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                      placeholder="Tempel tautan web: https://images.unsplash.com/..."
                      className="w-full p-2.5 rounded-xl border border-[#E3D3C4] bg-white focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
                    />
                    <p className="text-[9px] text-[#8C705A]">
                      Masukkan URL gambar dari CDN, Unsplash, Google Drive publik, atau hosting Anda.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Stasiun Peracikan:</label>
                  <select
                    value={menuForm.station}
                    onChange={(e) => setMenuForm({ ...menuForm, station: e.target.value as 'bar' | 'kitchen' })}
                    className="w-full p-2.5 rounded-xl border border-[#E3D3C4]"
                  >
                    <option value="bar">Bar (Minuman)</option>
                    <option value="kitchen">Kitchen (Makanan)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Estimasi Masak (Menit):</label>
                  <input
                    type="number"
                    value={menuForm.prepTimeMinutes}
                    onChange={(e) => setMenuForm({ ...menuForm, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#E3D3C4]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2C1D11] block mb-1">Tags (Pisahkan koma):</label>
                <input
                  type="text"
                  value={menuForm.tags}
                  onChange={(e) => setMenuForm({ ...menuForm, tags: e.target.value })}
                  placeholder="Favorit, Best Seller, Dingin..."
                  className="w-full p-2.5 rounded-xl border border-[#E3D3C4]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FBF8F5] border-t border-[#E3D3C4] flex justify-end gap-2">
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl"
              >
                Batal
              </button>
              <button
                disabled={!menuForm.name.trim()}
                onClick={handleSaveMenu}
                className="px-5 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs shadow-md disabled:bg-stone-300"
              >
                Simpan Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Restock Item */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#E3D3C4] p-5 space-y-4">
            <h3 className="font-bold text-base text-[#2C1D11]">
              Restock: {restockItem.name}
            </h3>
            <p className="text-xs text-[#7A614D]">
              Sisa stok saat ini: <strong>{restockItem.stockQuantity} {restockItem.unit}</strong>
            </p>

            <div>
              <label className="text-xs font-bold text-[#2C1D11] block mb-1">
                Jumlah Penambahan ({restockItem.unit}):
              </label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(Number(e.target.value))}
                min={1}
                className="w-full text-base font-bold p-2.5 rounded-xl border border-[#E3D3C4] focus:outline-none focus:ring-1 focus:ring-[#7D4F27]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRestockItem(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRestock}
                className="px-4 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs shadow-sm"
              >
                Konfirmasi Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Inventory Item */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E3D3C4] overflow-hidden flex flex-col">
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between">
              <h3 className="font-bold text-sm">Tambah Bahan Baku Baru</h3>
              <button onClick={() => setIsInventoryModalOpen(false)} className="text-stone-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#2C1D11] block mb-1">Nama Bahan:</label>
                <input
                  type="text"
                  value={invForm.name}
                  onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                  placeholder="Contoh: Bubuk Kakao 100%"
                  className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Kategori:</label>
                  <select
                    value={invForm.category}
                    onChange={(e) => setInvForm({ ...invForm, category: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  >
                    <option value="Kopi & Biji">Kopi & Biji</option>
                    <option value="Susu & Dairy">Susu & Dairy</option>
                    <option value="Sirup & Pemanis">Sirup & Pemanis</option>
                    <option value="Bahan Makanan">Bahan Makanan</option>
                    <option value="Kemasan">Kemasan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Satuan Unit:</label>
                  <input
                    type="text"
                    value={invForm.unit}
                    onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                    placeholder="kg, liter, pcs..."
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Stok Awal:</label>
                  <input
                    type="number"
                    value={invForm.stockQuantity}
                    onChange={(e) => setInvForm({ ...invForm, stockQuantity: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Batas Minimal (Alert):</label>
                  <input
                    type="number"
                    value={invForm.minThreshold}
                    onChange={(e) => setInvForm({ ...invForm, minThreshold: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FBF8F5] border-t border-[#E3D3C4] flex justify-end gap-2">
              <button
                onClick={() => setIsInventoryModalOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
              >
                Batal
              </button>
              <button
                disabled={!invForm.name.trim()}
                onClick={handleSaveInventory}
                className="px-4 py-1.5 rounded-lg bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs"
              >
                Simpan Bahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E3D3C4] overflow-hidden flex flex-col">
            <div className="p-4 bg-[#2C1D11] text-[#FFF5EA] flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUserId ? 'Edit Akun Staf' : 'Tambah Staf Kafe'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-stone-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#2C1D11] block mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Username:</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="rian_pos"
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">Role / Peran:</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  >
                    <option value="cashier">Kasir (POS & Billing)</option>
                    <option value="waitress">Waitress (Floor & Order Meja)</option>
                    <option value="barista">Barista (Bar & Minuman)</option>
                    <option value="chef">Chef (Dapur & Makanan)</option>
                    <option value="owner">Owner / Manager (Laporan & Menu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#2C1D11] text-xs">PIN Akses Tablet (4 digit):</label>
                    <button
                      type="button"
                      onClick={() => setShowModalPin(!showModalPin)}
                      className="text-[10px] font-bold text-[#7D4F27] hover:text-[#5A3515] flex items-center gap-1 cursor-pointer"
                    >
                      {showModalPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showModalPin ? 'Tutup' : 'Lihat'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPin ? 'text' : 'password'}
                      maxLength={6}
                      value={userForm.pin}
                      onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                      placeholder="1234"
                      className="w-full p-2 pr-9 rounded-lg border border-[#E3D3C4] font-mono text-sm tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPin(!showModalPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title={showModalPin ? "Sembunyikan PIN" : "Lihat PIN"}
                    >
                      {showModalPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-[#2C1D11] block mb-1">No. HP / WhatsApp:</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="+628..."
                    className="w-full p-2 rounded-lg border border-[#E3D3C4]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FBF8F5] border-t border-[#E3D3C4] flex justify-end gap-2">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
              >
                Batal
              </button>
              <button
                disabled={!userForm.name.trim()}
                onClick={handleSaveUser}
                className="px-4 py-1.5 rounded-lg bg-[#7D4F27] hover:bg-[#633C1B] text-white font-bold text-xs"
              >
                Simpan Staf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TRANSACTION MODAL */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        order={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={(id, updates) => updateCompletedOrder(id, updates)}
      />

      {/* DELETE TRANSACTION MODAL */}
      <DeleteTransactionModal
        isOpen={!!deletingTransaction}
        order={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={(id) => deleteCompletedOrder(id)}
      />

      {/* CHANGE PASSWORD MODAL */}
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
