import mongoose, { Schema, Document } from 'mongoose';
import { Portfolio as PortfolioInterface } from '@shared/schema';

export interface IPortfolio extends Omit<PortfolioInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const PortfolioSchema = new Schema<IPortfolio>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalPortfolioValue: {
    amount: { type: Number, required: true, default: 0 },
    changePercent: { type: Number, required: true, default: 0 },
    comparisonPeriod: { type: String, required: true, default: '24h' }
  },
  goldHoldings: {
    valueUSD: { type: Number, required: true, default: 0 },
    tokens: { type: Number, required: true, default: 0 },
    amountSpentUSD: { type: Number, required: true, default: 0 }
  },
  silverHoldings: {
    valueUSD: { type: Number, required: true, default: 0 },
    tokens: { type: Number, required: true, default: 0 },
    amountSpentUSD: { type: Number, required: true, default: 0 }
  },
  portfolioPerformance: {
    currentValue: { type: Number, required: true, default: 0 },
    monthlyChangeUSD: { type: Number, required: true, default: 0 },
    ytdChangePercent: { type: Number, required: true, default: 0 },
    monthlyChangePercent: { type: Number, required: true, default: 0 },
    bestMonth: {
      month: { type: String, required: true, default: '' },
      changePercent: { type: Number, required: true, default: 0 }
    }
  },
  assetAllocation: {
    goldPercent: { type: Number, required: true, default: 0 },
    silverPercent: { type: Number, required: true, default: 0 }
  },
  priceTrends: {
    period: { type: String, required: true, default: '30d' },
    goldPrices: [{
      date: { type: Date, required: true },
      price: { type: Number, required: true }
    }],
    silverPrices: [{
      date: { type: Date, required: true },
      price: { type: Number, required: true }
    }]
  },
  performanceTrendLabel: {
    type: String,
    required: true,
    default: 'stable'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { updatedAt: 'lastUpdated' },
  collection: 'portfolios'
});

// Indexes for performance
PortfolioSchema.index({ userId: 1 }, { unique: true });
PortfolioSchema.index({ lastUpdated: -1 });

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);