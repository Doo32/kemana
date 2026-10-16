import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

// GET: Ambil daftar transaksi dari MongoDB
export async function GET() {
  try {
    await connectToDatabase();
    const transactions = await Transaction.find().sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data transaksi' },
      { status: 500 }
    );
  }
}

// POST: Simpan transaksi baru ke MongoDB
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, type, amount, date } = body;

    if (!name || !type || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Field name, type, dan amount wajib diisi' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Amount harus berupa angka non-negatif' },
        { status: 400 }
      );
    }

    const newTransaction = await Transaction.create({
      name: name.trim(),
      type,
      amount: numAmount,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Transaksi berhasil disimpan',
        data: newTransaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan transaksi' },
      { status: 400 }
    );
  }
}

// DELETE: Hapus transaksi dari MongoDB
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = req.nextUrl.searchParams;
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || body._id;
      } catch {
        // body might be empty if id was passed in query parameter
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID transaksi wajib disertakan' },
        { status: 400 }
      );
    }

    const deletedTransaction = await Transaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transaksi berhasil dihapus',
        data: deletedTransaction,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus transaksi' },
      { status: 500 }
    );
  }
}
