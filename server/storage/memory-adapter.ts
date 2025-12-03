/**
 * In-memory storage adapter for development fallback
 * When PostgreSQL is not available, this provides basic functionality
 */

import { randomUUID } from "crypto";
import { type User, type Portfolio, type Transaction, type InsertTransaction, type SignupData, type Wallet, type WalletLabel, type Gifting, type InsertGifting, type Redemption, type InsertRedemption, type PurchaseHistory, type InsertPurchaseHistory, type UserInfo } from "@shared/schema";

/**
 * Normalizes wallet address based on blockchain type
 * Ethereum addresses (0x...) are lowercased for consistency
 * Solana addresses preserve case as they are Base58 encoded
 */
function normalizeWalletAddress(address: string): string {
  const trimmed = address.trim();
  
  // Ethereum addresses start with 0x and should be lowercase
  if (trimmed.startsWith('0x')) {
    return trimmed.toLowerCase();
  }
  
  // Solana addresses are Base58 encoded and case-sensitive
  // Keep exact case for Solana addresses
  return trimmed;
}

export class MemoryAdapter {
  private users: Map<string, User> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private wallets: Map<string, Wallet> = new Map();
  private notifications: Map<string, any> = new Map();

  async connect(): Promise<void> {
    console.log('✅ Connected to in-memory storage (development mode)');
  }

  async disconnect(): Promise<void> {
    console.log('📦 Disconnected from in-memory storage');
  }

  // User operations
  async getUser(userId: string): Promise<User | undefined> {
    return this.users.get(userId);
  }

  async getUserInfo(userId: string): Promise<UserInfo | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return {
      id: user._id!,
      name: fullName || user.email,
      email: user.email
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(signupData: SignupData): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    
    const user: User = {
      _id: id,
      email: signupData.email.toLowerCase(),
      password_hash: signupData.password,
      first_name: signupData.first_name,
      last_name: signupData.last_name,
      phone_number: signupData.phone_number,
      organization_name: signupData.organization_name,
      country: signupData.country,
      state: signupData.state,
      account_status: 'unverified',
      email_verified: false,
      terms_accepted: signupData.terms_accepted,
      two_factor_enabled: true,
      created_at: now,
      updated_at: now
    };
    
    this.users.set(id, user);
    
    // Create initial portfolio
    await this.createPortfolio(id);
    
    return user;
  }

  // Portfolio operations
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    for (const portfolio of this.portfolios.values()) {
      if (portfolio.userId === userId) {
        return portfolio;
      }
    }
    return undefined;
  }

  async createPortfolio(userId: string): Promise<Portfolio> {
    const id = randomUUID();
    const now = new Date();
    
    const portfolio: Portfolio = {
      _id: id,
      userId: userId,
      totalPortfolioValue: { amount: 0, changePercent: 0, comparisonPeriod: 'last month' },
      goldHoldings: { valueUSD: 0, tokens: 0, amountSpentUSD: 0 },
      silverHoldings: { valueUSD: 0, tokens: 0, amountSpentUSD: 0 },
      portfolioPerformance: {
        currentValue: 0, monthlyChangeUSD: 0, ytdChangePercent: 0,
        monthlyChangePercent: 0, bestMonth: { month: '', changePercent: 0 }
      },
      assetAllocation: { goldPercent: 0, silverPercent: 0 },
      priceTrends: { period: '1M', goldPrices: [], silverPrices: [] },
      performanceTrendLabel: 'Building Portfolio',
      lastUpdated: now
    };
    
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  // Wallet operations
  async getWallets(userId: string): Promise<Wallet[]> {
    const userWallets = [];
    for (const wallet of this.wallets.values()) {
      if (wallet.userId === userId) {
        userWallets.push(wallet);
      }
    }
    return userWallets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createWallet(userId: string, address: string, type: string, label?: string): Promise<Wallet> {
    const id = randomUUID();
    const now = new Date();
    
    // Check if this is the first wallet for the user
    const existingWallets = await this.getWallets(userId);
    const isFirstWallet = existingWallets.length === 0;
    const walletLabel = label || (isFirstWallet ? 'primary' : 'secondary');
    
    const wallet: Wallet = {
      _id: id,
      userId: userId,
      address: normalizeWalletAddress(address),
      type: type,
      label: walletLabel as WalletLabel,
      createdAt: now
    };
    
    this.wallets.set(id, wallet);
    return wallet;
  }

  async checkWalletExists(userId: string, address: string): Promise<boolean> {
    const normalizedAddress = normalizeWalletAddress(address);
    for (const wallet of this.wallets.values()) {
      if (wallet.userId === userId && wallet.address === normalizedAddress) {
        return true;
      }
    }
    return false;
  }

  async checkWalletExistsGlobally(address: string): Promise<boolean> {
    const normalizedAddress = normalizeWalletAddress(address);
    for (const wallet of this.wallets.values()) {
      if (wallet.address === normalizedAddress) {
        return true;
      }
    }
    return false;
  }

  async getUserIdByWalletAddress(address: string): Promise<string | null> {
    const normalizedAddress = normalizeWalletAddress(address);
    for (const wallet of this.wallets.values()) {
      if (wallet.address === normalizedAddress) {
        return wallet.userId as string;
      }
    }
    return null;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const now = new Date();
    
    const newTransaction: Transaction = {
      _id: id,
      userId: transaction.userId as string,
      type: transaction.type,
      metalType: transaction.metalType,
      amount: transaction.amount,
      value: transaction.value,
      price: transaction.price,
      status: 'pending',
      createdAt: now
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const userTransactions = [];
    for (const transaction of this.transactions.values()) {
      if (transaction.userId === userId) {
        userTransactions.push(transaction);
      }
    }
    return userTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Notification operations
  async createNotification(notification: any): Promise<any> {
    const id = randomUUID();
    const now = new Date();
    
    const newNotification = {
      _id: id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId,
      priority: notification.priority || 'normal',
      isRead: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  // Simplified implementations for missing methods
  async createGifting(giftingData: InsertGifting): Promise<Gifting> {
    throw new Error('Not implemented in memory adapter');
  }

  async createRedemption(redemptionData: InsertRedemption): Promise<Redemption> {
    throw new Error('Not implemented in memory adapter');
  }

  async createPurchaseHistory(purchaseData: InsertPurchaseHistory): Promise<PurchaseHistory> {
    throw new Error('Not implemented in memory adapter');
  }
}