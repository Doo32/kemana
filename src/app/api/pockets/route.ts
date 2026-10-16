import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Pocket from '@/models/Pocket';

// GET: Ambil semua data kantong (diurutkan berdasarkan priority)
export async function GET() {
  try {
    await connectToDatabase();
    const pockets = await Pocket.find().sort({ priority: 1, createdAt: 1 });
    return NextResponse.json({ success: true, data: pockets }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data pockets' },
      { status: 500 }
    );
  }
}

// POST: Buat kantong baru
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, type, current_balance, target_amount, priority } = body;

    const newPocket = await Pocket.create({
      name,
      type,
      current_balance: current_balance ?? 0,
      target_amount,
      priority,
    });

    return NextResponse.json({ success: true, data: newPocket }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat pocket baru' },
      { status: 400 }
    );
  }
}

// PUT: Update kantong / saldo
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, _id, ...updateFields } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'ID kantong wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedPocket = await Pocket.findByIdAndUpdate(
      targetId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedPocket) {
      return NextResponse.json(
        { success: false, error: 'Pocket tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPocket }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pocket' },
      { status: 400 }
    );
  }
}

// DELETE: Hapus kantong
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
        // body might be empty if id was expected in searchParams
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID kantong wajib disertakan' },
        { status: 400 }
      );
    }

    const deletedPocket = await Pocket.findByIdAndDelete(id);

    if (!deletedPocket) {
      return NextResponse.json(
        { success: false, error: 'Pocket tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Pocket berhasil dihapus', data: deletedPocket },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus pocket' },
      { status: 500 }
    );
  }
}
