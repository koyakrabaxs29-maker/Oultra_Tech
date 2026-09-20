import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Terminal, 
  Cpu, 
  BookOpen, 
  X, 
  Copy, 
  Check, 
  Printer, 
  ShieldAlert,
  Layers,
  Wrench,
  Wifi,
  Tablet,
  CheckCircle2
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'erd' | 'api' | 'backend' | 'guide'>('guide');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sqlDDL = `-- =========================================================================
-- NADIRA CAFÉ & RESTO - RELATIONAL DATABASE SCHEMA (PostgreSQL 14+)
-- Arsitektur POS, Kitchen Display & Multi-Role Staff
-- =========================================================================

-- 1. Tabel Master Pengguna & Karyawan (RBAC)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'cashier', 'waitress', 'chef')),
    pin_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Denah 30 Meja Kafe
CREATE TABLE dining_tables (
    table_number INT PRIMARY KEY,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'billing')),
    current_order_id VARCHAR(36)
);

-- 3. Tabel Kategori Menu
CREATE TABLE menu_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'Kopi', 'Non-Kopi', 'Makanan Ringan', 'Makanan Berat'
    sort_order INT DEFAULT 0
);

-- 4. Tabel Katalog Menu & Harga (Dengan Opsi Tambahan Porsi Large)
CREATE TABLE menu_items (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) REFERENCES menu_categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(12, 2) NOT NULL, -- Harga Porsi Reguler
    large_price_addition DECIMAL(12, 2) DEFAULT 6000, -- Tambahan Porsi Large (+Rp 6.000 / +Rp 12.000)
    description TEXT,
    image_url TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    prep_time_minutes INT DEFAULT 5,
    station VARCHAR(20) DEFAULT 'bar' CHECK (station IN ('bar', 'kitchen')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Pesanan (Header Transaksi)
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL, -- e.g. #NDR-101
    table_number INT REFERENCES dining_tables(table_number),
    customer_name VARCHAR(100) NOT NULL,
    waitress_id VARCHAR(36) REFERENCES users(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL, -- PPN 10%
    service_charge DECIMAL(12, 2) NOT NULL, -- Service 5%
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'ready', 'paid', 'cancelled')),
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Detail Item Pesanan (Dengan Porsi & Detail Add Requests)
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(36) REFERENCES menu_items(id),
    item_name VARCHAR(150) NOT NULL,
    portion_size VARCHAR(20) DEFAULT 'Reguler' CHECK (portion_size IN ('Reguler', 'Large')),
    price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    sugar_level VARCHAR(30), -- 'Normal Sugar', 'Less Sugar (50%)', 'Low Sugar (25%)', 'No Sugar (0%)', 'Extra Sweet'
    ice_level VARCHAR(30),   -- 'Normal Ice', 'Less Ice', 'No Ice', 'Hot / Panas'
    spicy_level VARCHAR(30), -- 'Tidak Pedas', 'Pedas Sedang', 'Pedas Mantap', 'Extra Pedas'
    add_ons JSONB,           -- ['Extra Espresso Shot', 'Whipped Cream', 'Telur Mata Sapi']
    special_notes TEXT,
    item_status VARCHAR(20) DEFAULT 'pending' CHECK (item_status IN ('pending', 'cooking', 'ready')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Pembayaran & Settlement Kasir
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE REFERENCES orders(id),
    cashier_id VARCHAR(36) REFERENCES users(id),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'qris', 'bank_transfer')),
    amount_paid DECIMAL(12, 2) NOT NULL,
    cash_given DECIMAL(12, 2),
    change_returned DECIMAL(12, 2),
    qris_reference VARCHAR(100),
    payment_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Manajemen Stok Bahan Baku (Inventory)
CREATE TABLE inventory_items (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    stock_quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'liter', 'pack', 'pcs'
    min_threshold DECIMAL(10, 2) NOT NULL,
    cost_per_unit DECIMAL(12, 2) NOT NULL,
    last_restocked_at DATE DEFAULT CURRENT_DATE
);`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#1C120A] text-[#F3E5D8] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#422915] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#25180E] border-b border-[#3D2513] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C5223] to-[#542F10] flex items-center justify-center text-white border border-[#A8713D]/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#F7E6D4]">
                Arsitektur & Panduan Perakitan NADIRA Café & Resto
              </h2>
              <p className="text-xs text-[#A88B74]">
                Blueprint rancangan database, endpoint REST API, dan panduan teknis implementasi produksi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A88B74] hover:text-white hover:bg-[#3D2513] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#150D06] border-b border-[#311A0C] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-[#7D4F27] text-white shadow-sm'
                : 'text-[#A88B74] hover:text-[#F3E5D8]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Panduan Perakitan Langkah demi Langkah</span>
          </button>

          <button
            onClick={() => setActiveTab('erd')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'erd'
                ? 'bg-[#7D4F27] text-white shadow-sm'
                : 'text-[#A88B74] hover:text-[#F3E5D8]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Skema Database (SQL DDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'bg-[#7D4F27] text-white shadow-sm'
                : 'text-[#A88B74] hover:text-[#F3E5D8]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>REST API Endpoints</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: Panduan Perakitan Langkah demi Langkah */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#25180E] rounded-xl border border-[#422915] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#F7E6D4] flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#D4A373]" /> Panduan Lengkap Implementasi & Perakitan (Production Setup)
                  </h3>
                  <p className="text-[11px] text-[#DEC4B0] mt-0.5">
                    Ikuti langkah berikut untuk mengimplementasikan sistem NADIRA Café & Resto dari kode sumber hingga operasional staf di lapangan.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="p-4 bg-[#150D06] rounded-xl border border-[#311A0C] space-y-2">
                  <div className="flex items-center gap-2 text-[#D4A373] font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#7D4F27] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Persiapan Repositori & Stack Frontend/Backend</span>
                  </div>
                  <p className="text-[#C4AD99] leading-relaxed pl-7">
                    Aplikasi ini dirancang menggunakan <strong>React 19 + TypeScript + Tailwind CSS</strong> di frontend dan <strong>Node.js / Express</strong> di backend. Untuk menjalankan di lokal:
                  </p>
                  <pre className="ml-7 p-2.5 rounded-lg bg-[#0C0704] text-[#7BD492] font-mono text-[11px] overflow-x-auto">
{`# 1. Clone repository & install dependencies
git clone https://github.com/nadira-cafe/pos-system.git
cd pos-system
npm install

# 2. Jalankan mode development
npm run dev
# Server akan aktif di http://localhost:3000`}
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-[#150D06] rounded-xl border border-[#311A0C] space-y-2">
                  <div className="flex items-center gap-2 text-[#D4A373] font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#7D4F27] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Setup Database PostgreSQL & Eksekusi Skema DDL</span>
                  </div>
                  <p className="text-[#C4AD99] leading-relaxed pl-7">
                    Buat database PostgreSQL (bisa via Docker, Supabase, Neon, atau Google Cloud SQL). Salin skrip dari tab <strong>Skema Database (SQL DDL)</strong> di atas dan jalankan migrasi untuk membuat tabel <code>dining_tables</code> (30 meja kafe), <code>menu_items</code> (dengan kolom <code>large_price_addition</code>), <code>orders</code>, dan <code>order_items</code> (dengan <code>portion_size</code>, <code>sugar_level</code>, <code>ice_level</code>, <code>spicy_level</code>).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-[#150D06] rounded-xl border border-[#311A0C] space-y-2">
                  <div className="flex items-center gap-2 text-[#D4A373] font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#7D4F27] text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Perakitan Hardware di 4 Titik Operasional Staf</span>
                  </div>
                  <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#DEC4B0]">
                    <div className="p-3 bg-[#1C120A] rounded-lg border border-[#3D2513] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Tablet className="w-3.5 h-3.5" /> Tablet Waitress (2 Unit)
                      </div>
                      <p className="text-[11px] text-[#A88B74]">
                        Tablet Android 10&quot; dipegang waitress yang bertugas berkeliling di 30 meja kafe untuk mencatat pesanan, porsi Reguler/Large, level gula/es, dan tingkat pedas tamu.
                      </p>
                    </div>

                    <div className="p-3 bg-[#1C120A] rounded-lg border border-[#3D2513] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Printer className="w-3.5 h-3.5" /> Kasir POS & Thermal Printer
                      </div>
                      <p className="text-[11px] text-[#A88B74]">
                        PC Kasir / All-in-One POS touchscreen terhubung dengan Thermal Printer 80mm ESC/POS (USB/LAN). Langsung cetak struk via fitur Cetak Struk dan auto cash drawer kick-out.
                      </p>
                    </div>

                    <div className="p-3 bg-[#1C120A] rounded-lg border border-[#3D2513] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-sky-300">
                        <Wifi className="w-3.5 h-3.5" /> KDS Bar Minuman
                      </div>
                      <p className="text-[11px] text-[#A88B74]">
                        Tablet/Layar KDS di stasiun Barista yang diset ke filter <em>Bar</em> untuk memproses pesanan kopi, latte, dan non-kopi sesuai level gula dan es.
                      </p>
                    </div>

                    <div className="p-3 bg-[#1C120A] rounded-lg border border-[#3D2513] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300">
                        <Layers className="w-3.5 h-3.5" /> KDS Dapur Makanan
                      </div>
                      <p className="text-[11px] text-[#A88B74]">
                        Tablet/Layar KDS di stasiun Dapur Panas dengan filter <em>Kitchen</em> untuk memproses pesanan steak, pasta, nasi goreng, dan cemilan dengan indikator tingkat kepedasan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 bg-[#150D06] rounded-xl border border-[#311A0C] space-y-2">
                  <div className="flex items-center gap-2 text-[#D4A373] font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#7D4F27] text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Integrasi Payment Gateway QRIS & Bank Transfer</span>
                  </div>
                  <p className="text-[#C4AD99] leading-relaxed pl-7">
                    Untuk live settlement QRIS otomatis, daftarkan akun merchant di <strong>Midtrans / Xendit / BCA API</strong>. Pasang webhook URL ke endpoint <code>POST /api/v1/payments/webhook</code>. Setiap ada pembayaran sukses dari m-Banking pelanggan, server otomatis mengupdate status pesanan menjadi <code>paid</code> dan mencetak nomor referensi transaksi resmi.
                  </p>
                </div>

                {/* Step 5 */}
                <div className="p-4 bg-[#150D06] rounded-xl border border-[#311A0C] space-y-2">
                  <div className="flex items-center gap-2 text-[#D4A373] font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#7D4F27] text-white flex items-center justify-center text-[10px]">5</span>
                    <span>Deployment ke Produksi (Cloud Run / VPS Docker)</span>
                  </div>
                  <p className="text-[#C4AD99] leading-relaxed pl-7">
                    Build container aplikasi menggunakan Dockerfile standar:
                  </p>
                  <pre className="ml-7 p-2.5 rounded-lg bg-[#0C0704] text-[#7BD492] font-mono text-[11px] overflow-x-auto">
{`# Build production image
docker build -t nadira-pos-production .

# Jalankan container di port 3000
docker run -d -p 3000:3000 --env-file .env nadira-pos-production`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL DDL */}
          {activeTab === 'erd' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F7E6D4]">
                  Skrip DDL Relasional Lengkap (PostgreSQL / CockroachDB):
                </span>
                <button
                  onClick={() => copyToClipboard(sqlDDL, 'sql')}
                  className="px-3 py-1 rounded-lg bg-[#3F2B1B] hover:bg-[#523823] text-[#F3D7B5] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'sql' ? 'Tersalin!' : 'Salin SQL DDL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[#120A05] text-[#7BD492] font-mono text-[11px] leading-relaxed overflow-x-auto border border-[#311A0C] max-h-[400px]">
                {sqlDDL}
              </pre>
            </div>
          )}

          {/* TAB 3: REST API */}
          {activeTab === 'api' && (
            <div className="space-y-3">
              <span className="font-bold text-[#F7E6D4] block">
                Daftar Kontrak RESTful API v1 (Backend Express):
              </span>

              <div className="space-y-2">
                {[
                  {
                    method: 'POST',
                    path: '/api/v1/orders',
                    role: 'Waitress',
                    desc: 'Membuat pesanan baru untuk meja outdoor dengan detail porsi (Reguler/Large), level gula, es, tingkat pedas, dan request khusus.',
                  },
                  {
                    method: 'POST',
                    path: '/api/v1/orders/:id/items',
                    role: 'Waitress',
                    desc: 'Add Order: menambahkan item menu baru ke pesanan meja yang sedang berjalan.',
                  },
                  {
                    method: 'POST',
                    path: '/api/v1/orders/:id/cancel',
                    role: 'Waitress & Owner',
                    desc: 'Membatalkan pesanan aktif dengan alasan pembatalan resmi serta mereset status meja.',
                  },
                  {
                    method: 'PATCH',
                    path: '/api/v1/orders/:id/status',
                    role: 'Chef & Barista',
                    desc: 'KDS: Memperbarui status tiket peracikan dari pending -> cooking -> ready.',
                  },
                  {
                    method: 'POST',
                    path: '/api/v1/payments/checkout',
                    role: 'Kasir POS',
                    desc: 'Memproses pembayaran Tunai, QRIS dinamis, atau Bank Transfer dan mencetak bukti struk resmi.',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/tables',
                    role: 'Waitress & Kasir',
                    desc: 'Mengambil status realtime 30 meja kafe (Nomor Meja 01 - 30).',
                  },
                  {
                    method: 'POST / PUT / DELETE',
                    path: '/api/v1/owner/menu',
                    role: 'Owner Only',
                    desc: 'CRUD menu kafe, pengaturan harga porsi Reguler dan Large, serta toggle stok bahan.',
                  },
                  {
                    method: 'PATCH',
                    path: '/api/v1/owner/inventory/:id',
                    role: 'Owner Only',
                    desc: 'Restock bahan baku atau penyesuaian stok opname gudang.',
                  }
                ].map((ep, idx) => (
                  <div key={idx} className="p-3 bg-[#150D06] rounded-xl border border-[#311A0C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          ep.method.includes('POST') ? 'bg-emerald-900 text-emerald-200' :
                          ep.method.includes('PUT') || ep.method.includes('PATCH') ? 'bg-amber-900 text-amber-200' :
                          ep.method.includes('DELETE') ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs text-[#F7E6D4] font-bold">{ep.path}</span>
                      </div>
                      <p className="text-[11px] text-[#A88B74] mt-1">{ep.desc}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#2C1D11] text-[#D4A373] font-semibold self-start sm:self-auto">
                      Akses: {ep.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#25180E] border-t border-[#3D2513] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#7D4F27] hover:bg-[#633C1B] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
};
