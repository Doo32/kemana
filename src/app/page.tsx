"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Plus, ChevronRight, Wallet, 
  Target, History, MoreVertical, X, CheckCircle2,
  Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle, Pencil,
  Settings, LogOut
} from 'lucide-react';
import Image from 'next/image';
import StatistikKategori from '@/components/StatistikKategori';

type Pocket = { id: string; name: string; budget: number; };

type TransactionItem = {
  _id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  createdAt?: string;
};

type MongoPocket = {
  _id: string;
  name: string;
  type: 'ROLLOVER' | 'FIXED_DEBT';
  current_balance: number;
  target_amount: number;
  priority: number;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;
const formatNumberWithDots = (val: string) => {
  const raw = val.replace(/\D/g, '');
  if (!raw) return '';
  return Number(raw).toLocaleString('id-ID');
};

export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [pockets, setPockets] = useState<Pocket[]>([]);

  // Dynamic MongoDB States (Tanpa Cache)
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [mongoPockets, setMongoPockets] = useState<MongoPocket[]>([]);
  const [isLoadingPockets, setIsLoadingPockets] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Simplified Quick Input State
  const [quickTxType, setQuickTxType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [quickTxTitle, setQuickTxTitle] = useState('');
  const [quickTxAmount, setQuickTxAmount] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // 3. Modal Tambah Target State
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newTargetPriority, setNewTargetPriority] = useState<number>(1);
  const [isSubmittingTarget, setIsSubmittingTarget] = useState(false);

  // Topbar & Notification States
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Kantong Modal States
  const [activeModal, setActiveModal] = useState<string>('none');
  const [modalData, setModalData] = useState<any>(null);

  // Fetch Transactions Tanpa Cache ({ cache: 'no-store' })
  const fetchTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const res = await fetch('/api/transactions', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTransactions(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data transactions dari MongoDB:', err);
    } finally {
      setIsLoadingTx(false);
    }
  };

  // Fetch Pockets Tanpa Cache ({ cache: 'no-store' })
  const fetchPockets = async () => {
    setIsLoadingPockets(true);
    try {
      const res = await fetch('/api/pockets', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMongoPockets(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data pockets dari MongoDB:', err);
    } finally {
      setIsLoadingPockets(false);
    }
  };

  useEffect(() => {
    const p = localStorage.getItem('kemana_pockets');
    if (p) setPockets(JSON.parse(p));
    setIsLoaded(true);

    fetchTransactions();
    fetchPockets();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('kemana_pockets', JSON.stringify(pockets));
  }, [pockets, isLoaded]);

  // Bersihkan timer notifikasi saat unmount
  useEffect(() => {
    return () => {
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current);
      }
    };
  }, []);

  const closeModal = () => {
    setActiveModal('none');
    setModalData(null);
  };

  // Handler Notifikasi dengan Auto-Close 5 detik
  const handleToggleNotif = () => {
    setShowNotif((prev) => {
      const nextState = !prev;
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current);
        notifTimeoutRef.current = null;
      }
      if (nextState) {
        notifTimeoutRef.current = setTimeout(() => {
          setShowNotif(false);
        }, 5000);
      }
      return nextState;
    });
  };

  // 1. Submit Transaksi + Trigger Auto-Waterfall saat Pemasukan
  const handleQuickTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawNumber = quickTxAmount.replace(/\./g, '').trim();
    const amount = Number(rawNumber);
    if (!rawNumber || isNaN(amount) || amount <= 0) {
      alert('Masukkan nominal yang valid');
      return;
    }

    const title = quickTxTitle.trim() || (quickTxType === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran');
    const backendType = quickTxType === 'pemasukan' ? 'INCOME' : 'EXPENSE';

    setIsSubmittingTx(true);
    try {
      // 1. Simpan transaksi ke /api/transactions
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title,
          type: backendType,
          amount: amount,
          date: new Date(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Jika bertipe 'INCOME' (Pemasukan), jalankan POST ke /api/distribute (Auto-Waterfall)
        if (backendType === 'INCOME') {
          try {
            await fetch('/api/distribute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount }),
            });
          } catch (distErr) {
            console.error('Gagal menjalankan auto-waterfall distribute:', distErr);
          }
        }

        alert(`Transaksi "${title}" senilai ${formatRp(amount)} berhasil disimpan!`);
        setQuickTxTitle('');
        setQuickTxAmount('');

        // Refresh data transaksi dan target aktif secara bersamaan agar UI langsung ter-update
        await Promise.all([fetchTransactions(), fetchPockets()]);
      } else {
        alert(`Gagal menyimpan: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (error: any) {
      alert(`Terjadi error saat menghubungi server: ${error.message || error}`);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // 3. Handler Submit Tambah Target Baru (POST /api/pockets)
  const handleAddTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawTargetAmount = newTargetAmount.replace(/\./g, '').trim();
    const targetAmountNum = Number(rawTargetAmount);
    if (!newTargetName.trim() || isNaN(targetAmountNum) || targetAmountNum <= 0) {
      alert('Mohon isi nama target dan nominal target yang valid');
      return;
    }

    setIsSubmittingTarget(true);
    try {
      const res = await fetch('/api/pockets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTargetName.trim(),
          type: 'FIXED_DEBT',
          current_balance: 0,
          target_amount: targetAmountNum,
          priority: Number(newTargetPriority),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Target "${newTargetName}" berhasil ditambahkan!`);
        setNewTargetName('');
        setNewTargetAmount('');
        setNewTargetPriority(1);
        setShowAddTargetModal(false);
        await fetchPockets();
      } else {
        alert(`Gagal menambahkan target: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`Error saat menghubungi server: ${err.message || err}`);
    } finally {
      setIsSubmittingTarget(false);
    }
  };

  // Fungsi Handler Hapus Target dari MongoDB (DELETE /api/pockets?id=...)
  const handleDeletePocket = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus target ini?')) return;

    try {
      const res = await fetch(`/api/pockets?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Target berhasil dihapus!');
        // Refresh data agar target langsung hilang dari layar tanpa reload
        await fetchPockets();
      } else {
        alert(`Gagal menghapus target: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`Terjadi error saat menghapus target: ${err.message || err}`);
    }
  };

  // 2. Fungsi Handler Hapus Transaksi dari MongoDB (DELETE /api/transactions?id=...)
  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;

    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Transaksi berhasil dihapus!');
        // Refresh data transaksi dan kalkulasi saldo otomatis ter-update
        await fetchTransactions();
      } else {
        alert(`Gagal menghapus transaksi: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`Terjadi error saat menghapus transaksi: ${err.message || err}`);
    }
  };

  // Kalkulasi Dinamis Total Saldo Bersih: INCOME - EXPENSE dari database
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Filter pencarian
  const filteredTransactions = transactions.filter((tx) =>
    tx.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredMongoPockets = mongoPockets.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPockets = pockets.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Kantong Rutin Local Handlers
  const onPocketSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const budget = Number(form.get('budget'));

    if (modalData?.id) {
      setPockets(prev => prev.map(p => p.id === modalData.id ? { ...p, name, budget } : p));
    } else {
      setPockets(prev => [...prev, { id: generateId(), name, budget }]);
    }
    closeModal();
  };

  const deletePocket = (id: string) => {
    if (!confirm('Yakin ingin menghapus kantong ini?')) return;
    setPockets(prev => prev.filter(x => x.id !== id));
    closeModal();
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#F8FAFC]"></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-24 md:pb-12">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40 w-full relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 relative">
            <Image src="/killua.png" alt="Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-bold text-[#0EA5E9] tracking-tight">Kemana</span>
        </div>

        <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2 w-[350px] lg:w-[400px] border border-slate-200/50">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi, kantong, atau target..." 
            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 placeholder-slate-400" 
          />
          <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 flex items-center justify-center">
            <span className="text-[10px] font-medium text-slate-500">⌘ K</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Button */}
          <div className="relative">
            <button 
              onClick={handleToggleNotif} 
              className="relative text-slate-500 hover:text-slate-700 transition flex items-center p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Notifikasi Transaksi"
            >
              <Bell size={20} />
              {transactions.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#0EA5E9] rounded-full border-2 border-white"></span>
              )}
            </button>

            {showNotif && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => {
                    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
                    setShowNotif(false);
                  }} 
                />
                <div className="absolute top-10 right-0 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-800">Riwayat Terakhir</h4>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      Tutup otomatis (5s)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {transactions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Belum ada riwayat transaksi.</p>
                    ) : (
                      transactions.slice(0, 3).map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                item.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                              }`}
                            >
                              {item.type === 'INCOME' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-700 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(item.date).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-bold ml-2 flex-shrink-0 ${
                              item.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'
                            }`}
                          >
                            {item.type === 'INCOME' ? '+' : '-'}
                            {formatRp(item.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="flex items-center gap-3 border-l border-slate-200 pl-4 hover:opacity-85 transition cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">Pengguna</p>
                <p className="text-xs text-slate-500">Ringkasan akun</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-sky-100 text-[#0EA5E9] flex items-center justify-center font-bold text-sm border border-sky-200">
                US
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">Pengguna</p>
                    <p className="text-xs text-slate-500 truncate">user@kemana.id</p>
                  </div>
                  <div className="py-1">
                    <button 
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Settings size={16} className="text-slate-400" />
                      <span>Pengaturan</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button 
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut size={16} className="text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-8">
        
        {/* LAYOUT CARD UTAMA RESPONSIVE */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
          
          {/* CARD 1: TOTAL SALDO BERSIH */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-slate-500 font-medium text-sm">Total Saldo Bersih</h2>
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${totalBalance < 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {totalBalance < 0 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />} 
                  {totalBalance < 0 ? 'Defisit' : 'Keuangan Aman'}
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight mt-1">
                {formatRp(totalBalance)}
              </h1>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              <span className="text-slate-400 text-xs font-medium">
                Masuk: <span className="text-emerald-600 font-semibold">{formatRp(totalIncome)}</span> | Keluar: <span className="text-rose-600 font-semibold">{formatRp(totalExpense)}</span>
              </span>
              <span className="text-slate-300 text-xs">• Real-time</span>
            </div>
          </div>

          {/* CARD 2: FORM INPUT TRANSAKSI (DENGAN TRIGGER AUTO-WATERFALL) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-800 font-bold text-base">Input Transaksi</h2>
                <span className="text-xs text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-md">
                  Auto-Waterfall
                </span>
              </div>

              {/* Dua Tombol Opsi: Pemasukan & Pengeluaran */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setQuickTxType('pemasukan')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    quickTxType === 'pemasukan'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  + Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTxType('pengeluaran')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    quickTxType === 'pengeluaran'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  - Pengeluaran
                </button>
              </div>

              {/* Form Input Transaksi */}
              <form onSubmit={handleQuickTxSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={quickTxTitle}
                  onChange={(e) => setQuickTxTitle(e.target.value)}
                  placeholder={quickTxType === 'pemasukan' ? "Nama transaksi (misal: Gaji, Bonus)" : "Nama transaksi (misal: Makan Siang)"}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-xs text-slate-800 placeholder-slate-400 transition"
                />

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quickTxAmount}
                    onChange={(e) => setQuickTxAmount(formatNumberWithDots(e.target.value))}
                    placeholder="0"
                    required
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-xs text-slate-800 placeholder-slate-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs text-white transition shadow-sm disabled:opacity-50 ${
                    quickTxType === 'pemasukan' 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {isSubmittingTx ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </form>
            </div>
          </div>

          {/* CARD 3: TARGET AKTIF (DENGAN TOMBOL TAMBAH + AKTIF) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-slate-800 font-bold text-base">Target Aktif</h2>
                  <p className="text-slate-400 text-xs">Auto-Waterfall Pockets</p>
                </div>
                {/* 3. Tombol Tambah Target (+) Memunculkan Modal */}
                <button 
                  onClick={() => setShowAddTargetModal(true)} 
                  className="w-7 h-7 rounded-full bg-sky-50 text-[#0EA5E9] flex items-center justify-center hover:bg-sky-100 transition cursor-pointer"
                  title="Tambah Target Baru"
                >
                  <Plus size={16} />
                </button>
              </div>

              {isLoadingPockets ? (
                <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[140px]">
                  Memuat target...
                </div>
              ) : filteredMongoPockets.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <Target size={28} className="text-slate-300 mb-2" />
                  <p className="text-slate-500 text-xs">
                    {searchQuery ? 'Tidak ada target yang cocok.' : 'Belum ada target aktif di database.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredMongoPockets.map(target => {
                    const percentage = target.target_amount > 0 
                      ? Math.min(100, (target.current_balance / target.target_amount) * 100) 
                      : 0;
                    return (
                      <div key={target._id} className="group relative">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span className="font-semibold text-slate-700 truncate">
                              {target.name}
                            </span>
                            <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                              P{target.priority}
                            </span>
                            {/* Tombol Hapus: Ikon X dan teks Hapus kecil berwarna merah */}
                            <button
                              onClick={() => handleDeletePocket(target._id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-1 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5 text-[11px] font-medium flex-shrink-0"
                              title="Hapus Target"
                            >
                              <X size={12} />
                              <span>Hapus</span>
                            </button>
                          </div>
                          <span className="text-slate-400 font-medium flex-shrink-0">{percentage.toFixed(0)}%</span>
                        </div>
                        {/* Progress bar kecil */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                          <div 
                            className="h-full bg-[#0EA5E9] rounded-full transition-all duration-300" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span>{formatRp(target.current_balance)}</span>
                          <span>dari {formatRp(target.target_amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-xs font-medium">Prioritas Keuangan</span>
              <button 
                onClick={() => setShowAddTargetModal(true)} 
                className="text-[#0EA5E9] hover:text-sky-600 text-xs font-semibold flex items-center gap-0.5 transition cursor-pointer"
              >
                + Tambah <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>

        {/* SECTION: TRANSAKSI TERAKHIR & STATISTIK KATEGORI */}
        <div className="mt-8 flex flex-col gap-8">
          
          {/* Kantong Rutin Section */}
          {pockets.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">Kantong Rutin</h2>
                  <p className="text-slate-500 text-xs md:text-sm mt-0.5">Pos pengeluaran harian</p>
                </div>
                <button onClick={() => { setModalData(null); setActiveModal('pocketForm'); }} className="text-[#0EA5E9] text-sm font-semibold hover:text-sky-700 flex items-center gap-1">
                  + Tambah <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPockets.map(pocket => (
                  <div key={pocket.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative group">
                    <button onClick={() => deletePocket(pocket.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={16} />
                    </button>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-sky-50 text-[#0EA5E9] mb-4">
                      <Wallet size={18} />
                    </div>
                    <h3 className="text-slate-700 font-medium text-sm mb-1">{pocket.name}</h3>
                    <p className="text-xs text-slate-400">Batas: {formatRp(pocket.budget)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transaksi Terakhir */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">Transaksi Terakhir</h2>
                <p className="text-slate-500 text-xs md:text-sm mt-0.5">Riwayat transaksi tersimpan di database</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[160px]">
              {isLoadingTx ? (
                <div className="p-8 text-center text-slate-400 text-sm">Memuat transaksi dari database...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <History size={30} className="text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">
                    {searchQuery ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-50 text-emerald-500'
                              : 'bg-rose-50 text-rose-500'
                          }`}
                        >
                          {tx.type === 'INCOME' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-800 font-medium text-sm truncate">{tx.name}</p>
                          <p className="text-slate-500 text-xs truncate">
                            {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 mb-0.5">
                            {new Date(tx.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p
                            className={`font-semibold text-sm ${
                              tx.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-700'
                            }`}
                          >
                            {tx.type === 'INCOME' ? '+' : '-'}
                            {formatRp(tx.amount)}
                          </p>
                        </div>
                        {/* 2. Tombol Hapus Transaksi */}
                        <button
                          onClick={() => handleDeleteTransaction(tx._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={15} />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 2. STATISTIK KATEGORI DENGAN TOGGLE PENGELUARAN & PEMASUKAN */}
          <StatistikKategori transactions={transactions} />

        </div>
      </main>

      {/* --- MODAL TAMBAH TARGET BARU (POST /api/pockets) --- */}
      {showAddTargetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Tambah Target Baru</h3>
              <button 
                onClick={() => setShowAddTargetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTargetSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nama Target</label>
                <input 
                  type="text"
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  placeholder="Misal: Paylater, Dana Darurat"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-sm text-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nominal Target (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(formatNumberWithDots(e.target.value))}
                    placeholder="0"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-sm text-slate-800 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Prioritas Alokasi (Auto-Waterfall)</label>
                <select
                  value={newTargetPriority}
                  onChange={(e) => setNewTargetPriority(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-sm text-slate-800 transition cursor-pointer"
                >
                  <option value={1}>Prioritas 1 (Target Utama - Pertama diisi)</option>
                  <option value={2}>Prioritas 2 (Sekunder - Diisi setelah P1 penuh)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTargetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTarget}
                  className="flex-1 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTarget ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KANTONG RUTIN --- */}
      {activeModal === 'pocketForm' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {modalData?.id ? 'Edit Kantong' : 'Tambah Kantong Baru'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={onPocketSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nama Kantong</label>
                <input name="name" type="text" defaultValue={modalData?.name || ''} required placeholder="Misal: Jajan & Makan" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Batas Budget / Bulan (Rp)</label>
                <input name="budget" type="number" defaultValue={modalData?.budget || ''} required placeholder="0" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-sm text-slate-800" />
              </div>
              <button type="submit" className="w-full mt-2 py-2.5 bg-[#0EA5E9] hover:bg-sky-600 text-white font-semibold rounded-xl text-xs transition shadow-sm">
                Simpan Kantong
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
