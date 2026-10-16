import mongoose, { Schema, Document, Model } from 'mongoose';

export type PocketType = 'ROLLOVER' | 'FIXED_DEBT';

export interface IPocket extends Document {
  name: string;
  type: PocketType;
  current_balance: number;
  target_amount: number;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const PocketSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama kantong/target harus diisi'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['ROLLOVER', 'FIXED_DEBT'],
        message: 'Tipe harus ROLLOVER atau FIXED_DEBT',
      },
      required: [true, 'Tipe kantong harus diisi'],
    },
    current_balance: {
      type: Number,
      default: 0,
    },
    target_amount: {
      type: Number,
      required: [true, 'Nominal target harus diisi'],
    },
    priority: {
      type: Number,
      required: [true, 'Prioritas harus diisi'],
    },
  },
  {
    timestamps: true,
  }
);

const Pocket: Model<IPocket> =
  mongoose.models.Pocket || mongoose.model<IPocket>('Pocket', PocketSchema);

export default Pocket;
