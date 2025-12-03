import mongoose, { Schema, Document } from 'mongoose';
import { Wallet as WalletInterface, WalletLabel } from '@shared/schema';

export interface IWallet extends Omit<WalletInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const WalletSchema = new Schema<IWallet>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    enum: ['primary', 'secondary'],
    default: 'secondary'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt' },
  collection: 'wallets'
});

// Indexes for performance
WalletSchema.index({ userId: 1 });
WalletSchema.index({ address: 1 }, { unique: true });
WalletSchema.index({ userId: 1, label: 1 });

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);