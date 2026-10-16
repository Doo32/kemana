# Architecture & Database Plan - Kemana?

## 1. System Architecture Overview
Aplikasi dibangun menggunakan arsitektur modern full-stack yang ringan, cepat, dan mobile-first:
- **Frontend Framework:** Next.js (App Router)
- **Styling & Icons:** Tailwind CSS + Lucide Icons
- **Backend / API:** Next.js API Routes / Route Handlers
- **Database Layer:** LocalStorage (Untuk tahap awal MVP agar cepat) / Migrasi ke MongoDB (Mongoose) atau PostgreSQL (Prisma ORM) untuk tahap produksi.

---

## 2. Database Schema (ERD & Data Models)

### A. Pocket (Kantong Alokasi)
```typescript
interface Pocket {
  id: string;
  name: string; // Contoh: "Parkir & Transport", "Nongs/Jajan Harian"
  type: 'DAILY_EXPENSE' | 'SAVINGS' | 'DEBT_PAYMENT';
  balance: number; // Saldo saat ini (Bisa minus/Soft Limit)
  weeklyBudgetLimit?: number; // Batas maksimal budget jajan minggu ini
  createdAt: Date;
}
```

### B. Goal (Unified Targeting System)
```typescript
interface Goal {
  id: string;
  title: string; // Contoh: "Paylater TikTok", "Makan AYCE"
  type: 'DEBT' | 'SAVINGS'; // DEBT = target turun ke 0, SAVINGS = target naik ke targetAmount
  targetAmount: number; // Rp3.410.000 (DEBT) atau Rp150.000 (SAVINGS)
  currentAmount: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW'; // Prioritas penanganan
  isActive: boolean; // Maksimal 3 target aktif bersamaan
  createdAt: Date;
}
```

### C. IncomeLog (Uang Masuk)
```typescript
interface IncomeLog {
  id: string;
  source: string; // Contoh: "Lalamove", "Uang Saku Ortu", "KJMU"
  totalAmount: number; // Nominal utuh pemasukan
  createdAt: Date;
}
```

### D. AllocationLog (Jejak Alokasi Pemasukan)
```typescript
interface AllocationLog {
  id: string;
  incomeId: string; // Relasi ke IncomeLog
  pocketId?: string; // Relasi ke Pocket (jika dialokasikan ke kantong rutin)
  goalId?: string; // Relasi ke Goal (jika dialokasikan ke Paylater/Tabungan)
  amount: number; // Nominal yang dipecah masuk ke sini
  createdAt: Date;
}
```

### E. ExpenseLog (Pengeluaran Harian)
```typescript
interface ExpenseLog {
  id: string;
  pocketId: string; // Relasi ke Pocket
  amount: number;
  description: string; // Contoh: "Nongkrong kawan UPI", "Parkir Kampus"
  isWarningTriggered: boolean; // True jika memicu saldo minus / overbudget akhir pekan
  createdAt: Date;
}
```

---

## 3. API Endpoints Contract

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/income/allocate` | Menerima data uang masuk (`IncomeLog`) dan membagikan pecahan nominal ke beberapa `pocketId` atau `goalId`. |
| **GET** | `/api/pockets` | Mengambil daftar seluruh kantong beserta sisa saldo saat ini dan status warning. |
| **POST** | `/api/expense` | Mencatat pengeluaran dari kantong tertentu, memotong saldo, dan melakukan pengecekan logika *Weekend Warning*. |
| **GET** | `/api/goals` | Mengambil maksimal 3 target aktif (Paylater & Wishlist) beserta perhitungan persentase progres terkini. |
| **POST** | `/api/goals` | Membuat target pelunasan utang baru atau tabungan (Maksimal 3 target aktif). |

---

## 4. UI Flow & Component Structure (Mobile-First Layout)

### A. Header Section
- **Ringkasan Total Saldo Bebas:** Akumulasi gabungan dari seluruh kantong rutin yang tersisa.
- **Status Indikator Kesehatan Keuangan:** Banner tipis melayang (Hijau: Keuangan aman | Merah berkedip: Peringatan saldo minus/Overbudget nongkrong).

### B. Daily Income Splitter Bar
- **Form Input Cepat:** Field input nominal instan untuk pendapatan fleksibel (misal: Ketik Rp60.000 hasil Lalamove).
- **Split Sliders / Input Fields:** Kolom dinamis untuk langsung memecah uang tersebut ke Kantong Parkir, Nongs, Cicilan Paylater, atau Tabungan AYCE sebelum disimpan.

### C. Active Pocket Cards Grid
- **Visual Card Parkir & Transportasi:** Tampilan minimalis menunjukkan sisa ongkos aman.
- **Visual Card Nongs & Jajan:** Dilengkapi badge peringatan dengan efek *High Contrast Red Accent* jika Anda mencoba menginput pengeluaran akhir pekan padahal Senin-Jumat kantong ini tidak diisi.

### D. Goals & Debt Progress Trackers
- **Debt Progress Bar (Aksen Merah/Orange):** Menampilkan nominal utang Paylater (TikTok, GoPay, Shopee) yang bergerak turun dari target menuju Rp0 seiring alokasi yang Anda masukkan.
- **Savings Progress Bar (Aksen Hijau/Sky):** Menampilkan tabungan wishlist (seperti target makan AYCE) yang bergerak naik dari Rp0 menuju target.

### E. Expense Tracker Form & History
- **Form Input Pengeluaran Cepat:** Dropdown pilih kantong → masukkan nominal pengeluaran → simpan.
- **Tabel Transaksi Terakhir:** List 5 transaksi terbaru dengan tag indikator warna merah mencolok untuk setiap pengeluaran yang status `isWarningTriggered`-nya bernilai `true`.

---

## 5. API Request/Response Payload Specifications (JSON Contract)

### A. POST /api/income/allocate
- **Request Payload:**
```json
{
  "source": "Lalamove",
  "totalAmount": 60000,
  "allocations": [
    { "pocketId": "p1", "amount": 20000 },
    { "goalId": "g1", "amount": 40000 }
  ]
}
```
- **Validation Logic:** Total jumlah `allocations.amount` wajib sama dengan `totalAmount`.

### B. POST /api/expense
- **Request Payload:**
```json
{
  "pocketId": "p2",
  "amount": 50000,
  "description": "Nongkrong Sabtu Malam"
}
```
- **Response Payload (Weekend Warning Trigger):**
```json
{
  "success": true,
  "isWarningTriggered": true, 
  "message": "Warning: Pengeluaran weekend terdeteksi tanpa alokasi rutin di hari kerja!"
}
```

## 6. Frontend Tailwind Component Tokens (Figma Alternative)
AI Agent wajib menyusun UI menggunakan struktur komponen modular Next.js berikut:
1. `<BalanceHeader />`: Container `bg-slate-900` dengan text `text-slate-100` ukuran `text-2xl font-bold`.
2. `<IncomeSplitter />`: Form horizontal. Menggunakan input text ringkas dan tombol eksekusi `bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold`.
3. `<PocketGrid />`: Grid dengan `grid-cols-2 gap-4`. Setiap card memiliki border `border-slate-800`. Jika saldo minus, tambahkan class secara dinamis: `bg-rose-950/40 border-rose-500 text-rose-400`.
4. `<GoalProgressBar />`: Container progress bar menggunakan `w-full bg-slate-800 h-3 rounded-full`. Indikator progres menggunakan `bg-gradient-to-r from-sky-500 to-emerald-500 h-3 rounded-full`.