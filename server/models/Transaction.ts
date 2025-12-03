import mongoose, { Schema, Document } from 'mongoose';
import { Transaction as TransactionInterface, TransactionType, TransactionStatus, MetalType } from '@shared/schema';

export interface ITransaction extends Omit<TransactionInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  metalType: {
    type: String,
    enum: ['gold', 'silver'],
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt' },
  collection: 'transactions'
});

// Indexes for performance
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ userId: 1, metalType: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);