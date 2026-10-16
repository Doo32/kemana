import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface ITransaction extends Document {
  name: string;
  type: TransactionType;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama transaksi harus diisi'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['INCOME', 'EXPENSE'],
        message: 'Tipe harus INCOME atau EXPENSE',
      },
      required: [true, 'Tipe transaksi harus diisi'],
    },
    amount: {
      type: Number,
      required: [true, 'Nominal transaksi harus diisi'],
      min: [0, 'Nominal transaksi tidak boleh negatif'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
