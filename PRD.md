# Product Requirement Document (PRD) - Kemana?

## 1. Product Overview & Problem Statement
Aplikasi **Kemana** adalah *personal money tracker* dan *allocation engine* yang dirancang untuk merapikan alur kas harian yang dinamis (pendapatan Lalamove, uang saku kuliah, hingga dana rapelan besar seperti KJMU). Fokus utamanya adalah melunasi utang Paylater senilai Rp3.410.000 (TikTok Rp600k, GoPay Rp600k, Shopee Mic Rp1,6M, Shopee Gym Rp1M) secepat mungkin secara riil, serta mengontrol anggaran nongkrong mingguan agar tidak overbudget.

## 2. User Profile & Core Needs
- **User:** Mahasiswa dengan pemasukan variatif (hasil Lalamove, uang saku harian/bulanan dari orang tua, dana berkala KJMU).
- **Pain Points:**
  - Pengeluaran impulsif saat diajak nongkrong/AYCE akhir pekan.
  - Kesulitan memantau progres pelunasan Paylater yang tersebar di beberapa platform.
  - Risiko kehabisan uang harian untuk kebutuhan rutin (seperti parkir dan makan harian).
  - Habit buruk menambah utang Paylater karena merasa "akan mendapat uang besar di masa depan".

## 3. Core Features
### A. Dynamic Daily Income & Allocation Engine
- Input uang masuk harian/berkala yang fleksibel (misal: Lalamove Rp60.000, uang saku Rp30.000, atau pencairan sebagian dana KJMU semisal Rp1.500.000).
- Fitur pembagian manual/otomatis ke beberapa kantong:
  - **Kantong Rutin:** Parkir & Transportasi, Jajan/Nongkrong Harian.
  - **Kantong Target:** Alokasi Paylater, Alokasi Tabungan/Wishlist.

### B. Unified Targeting System (Max 3 Active Goals)
- **Paylater Tracker (Debt Payoff):** Pelunasan terarah untuk total utang Rp3,41 Juta dengan perhitungan target berkurang menuju Rp0.
- **Wishlist Tracker (Savings Goal):** Tabungan fleksibel (contoh: AYCE Rp150.000 atau barang impian) yang nominalnya bertambah dari Rp0 menuju target.
- **Business Logic Constraints:**
  - Pengguna hanya diperbolehkan memiliki maksimal 3 target aktif secara bersamaan agar tetap fokus.
  - Setiap target memiliki tingkat prioritas (*Priority Level*: High, Medium, Low).
  - *Note:* TIDAK ADA countdown waktu pencairan dana. Uang hanya dihitung jika sudah masuk ke sistem input pemasukan secara riil.

### C. Weekend Nongs Warning & Budget Guard
- Akumulasi harian dari alokasi kantong *Jajan/Nongkrong*.
- **Smart Warning:** Jika user tidak menyisihkan uang ke kantong jajan selama hari kerja (Senin–Jumat) lalu mencatat pengeluaran nongkrong di akhir pekan, sistem akan menampilkan indikator peringatan merah.
- Memperbolehkan nilai saldo minus (*Soft Limit*) untuk mencatat kondisi riil, namun memberikan visual peringatan bahaya pada UI.

## 4. UI/UX & Non-Functional Requirements

### A. Technical Constraints
- **Mobile-First Responsive:** Layout wajib menggunakan container maksimal `max-w-md` di tengah layar agar menyerupai aplikasi HP saat dibuka di desktop.
- **Strict Performance:** Tidak menggunakan library grafik/chart pihak ketiga yang berat. Semua visualisasi (progress bar) wajib menggunakan Tailwind murni.

### B. "Deep Ocean" Design System Tokens (Tailwind CSS)
Agar visual konsisten dan terhindar dari AI Slop, AI Agent wajib menggunakan palette warna Tailwind berikut:
- **Background Utama (Dark Mode):** `bg-slate-950` (Hitam kebiruan pekat)
- **Card / Container:** `bg-slate-900` dengan border tipis `border-slate-800`
- **Teks Utama:** `text-slate-100` (Putih lembut) dan `text-slate-400` (Untuk keterangan/sub-teks)
- **Warna Aksen Utama (Brand):** `text-sky-400` atau `bg-sky-500` (Melambangkan air/ocean yang jernih)
- **High Contrast Alerts (Penting!):** 
  - Saldo Minus / Warning Weekend Nongs: `bg-rose-950/50` dengan border `border-rose-500` dan teks `text-rose-400`.
  - Sukses / Target Tercapai: `text-emerald-400`.

### C. Core Screen Layout Architecture
1. **Header:** Profile Ringkas & Ringkasan Total Saldo Bersih (Tanpa prediksi masa depan).
2. **Main Section:** 
   - Grid Kantong (Rutin vs Target) beserta sisa saldonya.
   - Section **Goals Tracker** (Maksimal 3 card aktif bertumpuk vertikal dengan progress bar horizontal).
3. **Sticky Bottom Navigation:** Menu navigasi melayang di bawah layar (Home, Goals, Add Transaction).