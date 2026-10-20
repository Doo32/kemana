import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Pocket from '@/models/Pocket';
import Transaction from '@/models/Transaction';

// POST: Alokasi saldo manual ke target aktif tertentu
// Body: { pocketId: string, amount: number }
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { pocketId, amount } = body;

    // Validasi input
    if (!pocketId) {
      return NextResponse.json(
        { success: false, error: 'ID target (pocketId) wajib disertakan' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal alokasi harus berupa angka positif (> 0)' },
        { status: 400 }
      );
    }

    // 1. Cari pocket/target yang dipilih
    const pocket = await Pocket.findById(pocketId);
    if (!pocket) {
      return NextResponse.json(
        { success: false, error: 'Target tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Hitung total saldo bersih saat ini (INCOME - EXPENSE) untuk validasi backend
    const incomeAgg = await Transaction.aggregate([
      { $match: { type: 'INCOME' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const expenseAgg = await Transaction.aggregate([
      { $match: { type: 'EXPENSE' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalIncome = incomeAgg.length > 0 ? incomeAgg[0].total : 0;
    const totalExpense = expenseAgg.length > 0 ? expenseAgg[0].total : 0;
    const currentBalance = totalIncome - totalExpense;

    if (numAmount > currentBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Saldo tidak cukup. Saldo bersih saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    // 3. Update current_balance pada pocket (tambahkan nominal alokasi)
    const previousBalance = pocket.current_balance || 0;
    pocket.current_balance = previousBalance + numAmount;
    await pocket.save();

    // 4. Buat transaksi EXPENSE sebagai catatan alokasi (mengurangi saldo bersih)
    const allocTransaction = await Transaction.create({
      name: `Alokasi: ${pocket.name}`,
      type: 'EXPENSE',
      amount: numAmount,
      date: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Berhasil mengalokasikan Rp ${numAmount.toLocaleString('id-ID')} ke "${pocket.name}"`,
        data: {
          pocket: {
            _id: pocket._id,
            name: pocket.name,
            previous_balance: previousBalance,
            new_balance: pocket.current_balance,
            target_amount: pocket.target_amount,
          },
          transaction: allocTransaction,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal melakukan alokasi saldo' },
      { status: 500 }
    );
  }
}
