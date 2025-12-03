import mongoose, { Schema, Document } from 'mongoose';
import { PurchaseHistory as PurchaseHistoryInterface, PurchaseStatus, PaymentMethodType } from '@shared/schema';

export interface IPurchaseHistory extends Omit<PurchaseHistoryInterface, '_id' | 'userId' | 'walletAddress'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  walletAddress: mongoose.Types.ObjectId; // Reference to Wallet
}

const PurchaseHistorySchema = new Schema<IPurchaseHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metal: {
    type: String,
    enum: ['gold', 'silver'],
    required: true
  },
  tokenAmount: {
    type: String,
    required: true
  },
  usdAmount: {
    type: String,
    required: true
  },
  feeAmount: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  networkType: {
    type: String,
    enum: ['canton', 'public', 'solana'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['fiat', 'wallet'],
    required: true
  },
  transactionHash: {
    type: String,
    trim: true
  },
  walletAddress: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  errorMessage: {
    type: String,
    trim: true
  },
  currentTokenPrice: {
    type: String,
    required: true,
    default: '0'
  },
  notified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'purchasehistory'
});

// Indexes for performance
PurchaseHistorySchema.index({ userId: 1 });
PurchaseHistorySchema.index({ createdAt: -1 });
PurchaseHistorySchema.index({ transactionHash: 1 });
PurchaseHistorySchema.index({ userId: 1, status: 1 });
PurchaseHistorySchema.index({ walletAddress: 1 });

export const PurchaseHistory = mongoose.model<IPurchaseHistory>('PurchaseHistory', PurchaseHistorySchema);