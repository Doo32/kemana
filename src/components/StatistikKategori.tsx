"use client";

import React, { useState, useMemo } from 'react';

interface Transaction {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

interface StatistikKategoriProps {
  transactions?: Transaction[];
}

const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export default function StatistikKategori({ transactions = [] }: StatistikKategoriProps) {
  // 2. Tab Pemasukan & Pengeluaran
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Hitung akumulasi nama transaksi berdasarkan tab yang aktif
  const kategoriStats = useMemo(() => {
    const list = transactions.filter((t) => t.type === activeTab);
    const totalAmount = list.reduce((acc, curr) => acc + curr.amount, 0);

    if (totalAmount === 0) return [];

    // Kelompokkan berdasarkan nama transaksi
    const groupedMap = new Map<string, number>();
    list.forEach((item) => {
      const cleanName = item.name.trim();
      const currentVal = groupedMap.get(cleanName) || 0;
      groupedMap.set(cleanName, currentVal + item.amount);
    });

    // Ubah ke array dan hitung persentase
    const result = Array.from(groupedMap.entries()).map(([nama, nominal], index) => {
      const persen = Math.round((nominal / totalAmount) * 100);
      return {
        id: index + 1,
        nama,
        nominal,
        persen,
      };
    });

    // Urutkan dari nominal terbesar
    return result.sort((a, b) => b.nominal - a.nominal);
  }, [transactions, activeTab]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Statistik Kategori</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {activeTab === 'EXPENSE'
              ? 'Persentase pengeluaran berdasarkan pos anggaran'
              : 'Persentase sumber pemasukan yang tercatat'}
          </p>
        </div>

        {/* Toggle Tombol Tab: Pengeluaran vs Pemasukan */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('EXPENSE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INCOME')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'INCOME'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {kategoriStats.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-xs font-medium">
            {activeTab === 'EXPENSE'
              ? 'Belum ada pengeluaran tercatat di database.'
              : 'Belum ada pemasukan tercatat di database.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {kategoriStats.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">{item.nama}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium text-xs">{formatRp(item.nominal)}</span>
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                      activeTab === 'EXPENSE'
                        ? 'text-rose-500 bg-rose-50'
                        : 'text-emerald-600 bg-emerald-50'
                    }`}
                  >
                    {item.persen}%
                  </span>
                </div>
              </div>

              {/* Progress Bar:
                  Jika EXPENSE: Fill merah (bg-rose-500)
                  Jika INCOME: Fill hijau (bg-emerald-500) */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeTab === 'EXPENSE' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, item.persen))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
