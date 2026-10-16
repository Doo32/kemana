import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Pocket from '@/models/Pocket';

// POST: Auto-Waterfall Distribution untuk sisa uang harian
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal amount sisa uang harus berupa angka positif' },
        { status: 400 }
      );
    }

    // 1. Ambil semua data Pocket dari database dan urutkan berdasarkan priority secara ascending (1, lalu 2, dst)
    const pockets = await Pocket.find().sort({ priority: 1, createdAt: 1 });

    if (pockets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Belum ada data Pocket di database untuk didistribusikan' },
        { status: 404 }
      );
    }

    let remaining = amount;
    const distributedLogs: Array<{
      id: string;
      name: string;
      priority: number;
      allocated: number;
      previous_balance: number;
      new_balance: number;
      target_amount: number;
    }> = [];

    // 2. Tambahkan amount ke Pocket Prioritas 1 terlebih dahulu.
    // 3. Jika saldo Pocket Prioritas 1 sudah menyentuh target_amount, sisa uang otomatis ditambahkan (waterfall) ke Pocket berikutnya.
    for (let i = 0; i < pockets.length; i++) {
      if (remaining <= 0) break;

      const pocket = pockets[i];
      const prevBalance = pocket.current_balance || 0;
      const capacity = Math.max(0, pocket.target_amount - prevBalance);
      const isLastPocket = i === pockets.length - 1;

      let allocated = 0;

      if (capacity > 0) {
        allocated = Math.min(remaining, capacity);

        // Jika ini pocket terakhir dan sisa uang masih melebihi capacity, masukkan seluruh sisa ke pocket ini
        if (isLastPocket && remaining > capacity) {
          allocated = remaining;
        }
      } else if (isLastPocket) {
        // Jika pocket terakhir sudah penuh tapi masih ada sisa dana
        allocated = remaining;
      }

      if (allocated > 0) {
        pocket.current_balance = prevBalance + allocated;
        remaining -= allocated;

        // 4. Simpan perubahan ke database MongoDB
        await pocket.save();

        distributedLogs.push({
          id: pocket._id.toString(),
          name: pocket.name,
          priority: pocket.priority,
          allocated,
          previous_balance: prevBalance,
          new_balance: pocket.current_balance,
          target_amount: pocket.target_amount,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Auto-waterfall berhasil mendistribusikan dana ke kantong',
        total_requested: amount,
        total_distributed: amount - remaining,
        unallocated_remainder: remaining,
        data: distributedLogs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menjalankan proses auto-waterfall distribute' },
      { status: 500 }
    );
  }
}
