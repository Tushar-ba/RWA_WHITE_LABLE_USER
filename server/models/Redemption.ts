import mongoose, { Schema, Document } from 'mongoose';
import { Redemption as RedemptionInterface, TokenType, NetworkType, RedemptionStatus } from '@shared/schema';

export interface IRedemption extends Omit<RedemptionInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Reference to User instead of UserInfo object
  walletAddress: string; // Wallet address that created the redemption request
}

const RedemptionSchema = new Schema<IRedemption>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
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
  gramsAmount: {
    type: String,
    required: true
  },
  tokenValueUSD: {
    type: String,
    required: true
  },
  network: {
    type: String,
    enum: ['public', 'solana', 'canton'],
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true,
    trim: true
  },
  streetAddress: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionHash: {
    type: String,
    trim: true
  },
  requestId: {
    type: String,
    trim: true
  },
  errorMessage: {
    type: String,
    trim: true
  },
  deliveryFee: {
    type: String,
    required: true
  },
  totalCostUSD: {
    type: String,
    required: true
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  currentTokenPrice: {
    type: String,
    required: true
  },
  // Separate notification tracking for each redemption event type
  notificationStatus: {
    requestNotified: {
      type: Boolean,
      default: false
    },
    processingNotified: {
      type: Boolean,
      default: false
    },
    fulfilledNotified: {
      type: Boolean,
      default: false
    },
    cancelledNotified: {
      type: Boolean,
      default: false
    }
  },
  // Legacy field for backward compatibility - will be deprecated
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
  collection: 'redemptions',
  id: false, // Disable virtual id field to prevent E11000 duplicate key errors
  versionKey: false // Remove __v field as well
});

// Indexes for performance
RedemptionSchema.index({ userId: 1 });
RedemptionSchema.index({ createdAt: -1 });
RedemptionSchema.index({ status: 1 });
RedemptionSchema.index({ userId: 1, status: 1 });
RedemptionSchema.index({ transactionHash: 1 });

export const Redemption = mongoose.model<IRedemption>('Redemption', RedemptionSchema);