import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferNotification extends Document {
  transactionHash: string;
  tokenType: 'GOLD' | 'SILVER';
  network: 'Ethereum' | 'Solana';
  fromAddress: string;
  toAddress: string;
  amount: string;
  blockNumber?: number;
  slot?: number;
  senderNotified: boolean;
  recipientNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransferNotificationSchema: Schema = new Schema({
  transactionHash: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  tokenType: {
    type: String,
    enum: ['GOLD', 'SILVER'],
    required: true
  },
  network: {
    type: String,
    enum: ['Ethereum', 'Solana'],
    required: true
  },
  fromAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  toAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number,
    required: false
  },
  slot: {
    type: Number,
    required: false
  },
  senderNotified: {
    type: Boolean,
    default: false
  },
  recipientNotified: {
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
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Index for efficient queries
TransferNotificationSchema.index({ transactionHash: 1 });
TransferNotificationSchema.index({ fromAddress: 1 });
TransferNotificationSchema.index({ toAddress: 1 });
TransferNotificationSchema.index({ tokenType: 1, network: 1 });

export default mongoose.model<ITransferNotification>('TransferNotification', TransferNotificationSchema);