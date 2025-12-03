import mongoose, { Schema, Document } from 'mongoose';
import { Gifting as GiftingInterface, TokenType, NetworkType, GiftingStatus } from '@shared/schema';

export interface IGifting extends Omit<GiftingInterface, '_id' | 'userId' | 'recipientWallet'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Reference to User instead of UserInfo object
  recipientWallet: mongoose.Types.ObjectId; // Reference to Wallet
}

// UserInfo subdocument schema for populated data
const UserInfoSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true }
}, { _id: false });

const GiftingSchema = new Schema<IGifting>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientWallet: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  token: {
    type: String,
    enum: ['gold', 'silver'],
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  network: {
    type: String,
    enum: ['public', 'solana', 'private'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'pending'
  },
  transactionHash: {
    type: String,
    trim: true
  },
  errorMessage: {
    type: String,
    trim: true
  },
  networkFee: {
    type: String,
    required: true
  },
  tokenValueUSD: {
    type: String,
    required: true
  },
  platformFeeUSD: {
    type: String,
    required: true
  },
  totalCostUSD: {
    type: String,
    required: true
  },
  gramsAmount: {
    type: String,
    required: true
  },
  currentTokenPrice: {
    type: String,
    required: true
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
  collection: 'giftings'
});

// Indexes for performance
GiftingSchema.index({ userId: 1 });
GiftingSchema.index({ recipientWallet: 1 });
GiftingSchema.index({ createdAt: -1 });
GiftingSchema.index({ transactionHash: 1 });
GiftingSchema.index({ userId: 1, status: 1 });

export const Gifting = mongoose.model<IGifting>('Gifting', GiftingSchema);