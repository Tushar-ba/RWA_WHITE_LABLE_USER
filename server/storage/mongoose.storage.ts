import mongoose, { Schema, Document } from 'mongoose';
import { 
  User as UserInterface, 
  Portfolio as PortfolioInterface, 
  Transaction as TransactionInterface,
  Wallet as WalletInterface,
  Gifting as GiftingInterface,
  Redemption as RedemptionInterface,
  PurchaseHistory as PurchaseHistoryInterface,
  InsertTransaction, 
  SignupData, 
  UserInfo,
  InsertGifting, 
  InsertRedemption, 
  InsertPurchaseHistory,
  WalletLabel,
  TokenType,
  NetworkType,
  GiftingStatus,
  RedemptionStatus,
  PurchaseStatus,
  UpdateUserProfile
} from "@shared/schema";
import { IStorage } from './IStorage';
import bcrypt from 'bcrypt';

// Define Mongoose document interfaces and schemas within this file
interface IUser extends Omit<UserInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
}

interface IWallet extends Omit<WalletInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

interface IPortfolio extends Omit<PortfolioInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

interface ITransaction extends Omit<TransactionInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

interface IGifting extends Omit<GiftingInterface, '_id' | 'userId' | 'recipientWallet'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recipientWallet: string; // Keep as string for now to match interface
}

interface IRedemption extends Omit<RedemptionInterface, '_id' | 'userId'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

interface IPurchaseHistory extends Omit<PurchaseHistoryInterface, '_id' | 'userId' | 'walletAddress'>, Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  walletAddress: string; // Keep as string for now to match interface
}

// Define schemas inline
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  first_name: String,
  middle_name: String,
  last_name: String,
  phone_number: String,
  organization_name: String,
  // Address fields (common for both account types)
  address1: String,
  address2: String,
  city: String,
  zipcode: String,
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  account_type: { type: String, enum: ['individual', 'institutional'] },
  userType: { type: String, enum: ['individual', 'institutional'] },
  // Individual account fields
  dob: String,
  profession: String,
  // Institutional account fields
  company_name: String,
  registration_id: String, // Business registration ID
  company_website: String,
  company_phone: String,
  // Business address fields (for institutional)
  business_address1: String,
  business_address2: String,
  business_city: String,
  business_country: String,
  business_state: String,
  business_zipcode: String,
  authorized_signatory_name: String,
  authorized_signatory_email: String,
  authorized_signatory_phone: String,
  account_status: { type: String, enum: ['unverified', 'verified', 'suspended'], default: 'unverified' },
  email_verified: { type: Boolean, default: false },
  email_verification_token: String,
  email_verification_expires: Date,
  otp_attempts: { type: Number, default: 0 },
  password_reset_token: String,
  password_reset_expires: Date,
  last_otp_sent: Date,
  referral_code: String,
  terms_accepted: { type: Boolean, required: true },
  last_login: Date,
  two_factor_enabled: { type: Boolean, default: false },
  two_factor_token: String,
  two_factor_expires: Date,
  isOnboarded: { type: Boolean, default: false },
  // Account Profile fields
  purpose_of_account: String,
  expected_transaction_activity: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'users' });

const WalletSchema = new Schema<IWallet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  label: { type: String, enum: ['primary', 'secondary'], default: 'secondary' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'wallets' });

const PortfolioSchema = new Schema<IPortfolio>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPortfolioValue: {
    amount: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    comparisonPeriod: { type: String, default: '24h' }
  },
  goldHoldings: {
    valueUSD: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    amountSpentUSD: { type: Number, default: 0 }
  },
  silverHoldings: {
    valueUSD: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    amountSpentUSD: { type: Number, default: 0 }
  },
  portfolioPerformance: {
    currentValue: { type: Number, default: 0 },
    monthlyChangeUSD: { type: Number, default: 0 },
    ytdChangePercent: { type: Number, default: 0 },
    monthlyChangePercent: { type: Number, default: 0 },
    bestMonth: {
      month: { type: String, default: '' },
      changePercent: { type: Number, default: 0 }
    }
  },
  assetAllocation: {
    goldPercent: { type: Number, default: 0 },
    silverPercent: { type: Number, default: 0 }
  },
  priceTrends: {
    period: { type: String, default: '30d' },
    goldPrices: [{ date: Date, price: Number }],
    silverPrices: [{ date: Date, price: Number }]
  },
  performanceTrendLabel: { type: String, default: 'stable' },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'portfolios' });

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['buy', 'sell', 'mint'], required: true },
  metalType: { type: String, enum: ['gold', 'silver'], required: true },
  amount: { type: String, required: true },
  value: { type: String, required: true },
  price: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionHash: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'transactions' });

const GiftingSchema = new Schema<IGifting>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, enum: ['gold', 'silver'], required: true },
  quantity: { type: String, required: true },
  recipientWallet: { type: String, required: true },
  network: { type: String, enum: ['ethereum', 'solana'], required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  transactionHash: String,
  errorMessage: String,
  networkFee: { type: String, default: '0' },
  tokenValueUSD: { type: String, default: '0' },
  platformFeeUSD: { type: String, default: '0' },
  totalCostUSD: { type: String, default: '0' },
  gramsAmount: { type: String, default: '0' },
  currentTokenPrice: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'giftings' });

const RedemptionSchema = new Schema<IRedemption>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, enum: ['gold', 'silver'], required: true },
  quantity: { type: String, required: true },
  gramsAmount: { type: String, required: true },
  tokenValueUSD: { type: String, required: true },
  network: { type: String, enum: ['ethereum', 'solana'], required: true },
  deliveryAddress: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'], default: 'pending' },
  transactionHash: String,
  requestId: String,
  errorMessage: String,
  deliveryFee: { type: String, default: '0' },
  totalCostUSD: { type: String, default: '0' },
  approvedAt: Date,
  completedAt: Date,
  currentTokenPrice: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'redemptions' });

const PurchaseHistorySchema = new Schema<IPurchaseHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  metal: { type: String, enum: ['gold', 'silver'], required: true },
  tokenAmount: { type: String, required: true },
  usdAmount: { type: String, required: true },
  feeAmount: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  networkType: { type: String, enum: ['public', 'testnet'], required: true },
  paymentMethod: { type: String, enum: ['wallet', 'card', 'bank'], required: true },
  transactionHash: String,
  walletAddress: String,
  errorMessage: String,
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'purchase_history' });

// Create models
let User: mongoose.Model<IUser>;
let Wallet: mongoose.Model<IWallet>;
let Portfolio: mongoose.Model<IPortfolio>;
let Transaction: mongoose.Model<ITransaction>;
let Gifting: mongoose.Model<IGifting>;
let Redemption: mongoose.Model<IRedemption>;
let PurchaseHistory: mongoose.Model<IPurchaseHistory>;

export class MongooseStorage implements IStorage {
  constructor() {}

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      await mongoose.connect(mongoUri, {
        dbName: 'vaulted_assets'
      });

      // Initialize models after connection
      User = mongoose.model<IUser>('User', UserSchema);
      Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
      Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
      Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

      console.log('✅ Connected to MongoDB with Mongoose');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  // User operations
  async createUser(userData: SignupData | any): Promise<UserInterface> {
    // Handle new simplified SignupData structure (name, email, password, confirm_password, terms_accepted)
    // or legacy structure with first_name, last_name, etc.
    let hashedPassword: string;
    let userDoc: any = {
      account_status: 'unverified',
      email_verified: false,
      terms_accepted: userData.terms_accepted || false,
      two_factor_enabled: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (userData.password_hash) {
      // Password already hashed (from auth controller)
      hashedPassword = userData.password_hash;
      userDoc.password_hash = hashedPassword;
      userDoc.email = userData.email;
      // Copy other fields
      if (userData.first_name) userDoc.first_name = userData.first_name;
      if (userData.last_name) userDoc.last_name = userData.last_name;
      if (userData.country) userDoc.country = userData.country;
      if (userData.state) userDoc.state = userData.state;
      if (userData.isOnboarded !== undefined) userDoc.isOnboarded = userData.isOnboarded;
      if (userData.kyc_status) userDoc.kyc_status = userData.kyc_status;
    } else if (userData.password) {
      // Hash password from SignupData
      hashedPassword = await bcrypt.hash(userData.password, 10);
      userDoc.password_hash = hashedPassword;
      userDoc.email = userData.email;
      
      // Handle new simplified structure with 'name' field
      if (userData.name) {
        const nameParts = userData.name.trim().split(/\s+/);
        userDoc.first_name = nameParts[0] || userData.name;
        userDoc.last_name = nameParts.slice(1).join(' ') || '';
      } else {
        // Legacy structure
        if (userData.first_name) userDoc.first_name = userData.first_name;
        if (userData.last_name) userDoc.last_name = userData.last_name;
      }
      
      // Copy other fields
      if (userData.country) userDoc.country = userData.country;
      if (userData.state) userDoc.state = userData.state;
    } else {
      throw new Error('Password or password_hash is required');
    }
    
    const user = new User(userDoc);
    const savedUser = await user.save();
    return this.userDocumentToInterface(savedUser);
  }

  async findUserByEmail(email: string): Promise<UserInterface | null> {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user ? this.userDocumentToInterface(user) : null;
  }

  async findUserById(userId: string): Promise<UserInterface | null> {
    const user = await User.findById(userId);
    return user ? this.userDocumentToInterface(user) : null;
  }

  async getUser(userId: string): Promise<UserInterface | null> {
    return this.findUserById(userId);
  }

  async updateUser(userId: string, updates: Partial<UserInterface>): Promise<UserInterface | null> {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    return user ? this.userDocumentToInterface(user) : null;
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserInterface | null> {
    const user = await User.findByIdAndUpdate(userId, { ...updates, updated_at: new Date() }, { new: true });
    return user ? this.userDocumentToInterface(user) : null;
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    
    return {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      country: user.country,
      state: user.state,
      phoneNumber: user.phone_number || '',
      organizationName: user.organization_name || ''
    };
  }

  // Updated method to get user with wallets using populate
  async getUserWithWallets(userId: string): Promise<{ user: UserInterface, wallets: WalletInterface[] } | null> {
    const user = await User.findById(userId);
    if (!user) return null;

    const wallets = await Wallet.find({ userId }).populate('userId', 'email first_name last_name');
    
    return {
      user: this.userDocumentToInterface(user),
      wallets: wallets.map(wallet => this.walletDocumentToInterface(wallet))
    };
  }

  // Wallet operations
  async createWallet(userId: string, address: string, type: string, label?: WalletLabel): Promise<WalletInterface> {
    const wallet = new Wallet({
      userId,
      address,
      type,
      label: label || 'secondary',
      createdAt: new Date()
    });

    const savedWallet = await wallet.save();
    return this.walletDocumentToInterface(savedWallet);
  }

  async getWallets(userId: string): Promise<WalletInterface[]> {
    const wallets = await Wallet.find({ userId }).populate('userId', 'email first_name last_name');
    return wallets.map(wallet => this.walletDocumentToInterface(wallet));
  }

  async findWalletsByUserId(userId: string): Promise<WalletInterface[]> {
    return this.getWallets(userId);
  }

  async findWalletByAddress(address: string): Promise<WalletInterface | null> {
    const wallet = await Wallet.findOne({ address }).populate('userId', 'email first_name last_name');
    return wallet ? this.walletDocumentToInterface(wallet) : null;
  }

  async updateWalletLabel(walletId: string, label: WalletLabel): Promise<WalletInterface | null> {
    const wallet = await Wallet.findByIdAndUpdate(walletId, { label }, { new: true }).populate('userId', 'email first_name last_name');
    return wallet ? this.walletDocumentToInterface(wallet) : null;
  }

  async deleteWallet(walletId: string): Promise<boolean> {
    const result = await Wallet.findByIdAndDelete(walletId);
    return !!result;
  }

  async checkWalletExists(userId: string, address: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ userId, address });
    return !!wallet;
  }

  async checkWalletExistsGlobally(address: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ address });
    return !!wallet;
  }

  async getUserIdByWalletAddress(address: string): Promise<string | null> {
    const wallet = await Wallet.findOne({ address });
    return wallet ? wallet.userId.toString() : null;
  }

  // Converter methods
  private userDocumentToInterface(doc: IUser): UserInterface {
    return {
      _id: doc._id.toString(),
      email: doc.email,
      password_hash: doc.password_hash,
      first_name: doc.first_name,
      last_name: doc.last_name,
      phone_number: doc.phone_number,
      organization_name: doc.organization_name,
      country: doc.country,
      state: doc.state,
      account_status: doc.account_status,
      email_verified: doc.email_verified,
      email_verification_token: doc.email_verification_token,
      email_verification_expires: doc.email_verification_expires,
      otp_attempts: doc.otp_attempts,
      password_reset_token: doc.password_reset_token,
      password_reset_expires: doc.password_reset_expires,
      last_otp_sent: doc.last_otp_sent,
      referral_code: doc.referral_code,
      terms_accepted: doc.terms_accepted,
      last_login: doc.last_login,
      two_factor_enabled: doc.two_factor_enabled,
      two_factor_token: doc.two_factor_token,
      two_factor_expires: doc.two_factor_expires,
      created_at: doc.created_at,
      updated_at: doc.updated_at
    };
  }

  private walletDocumentToInterface(doc: IWallet): WalletInterface {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      address: doc.address,
      type: doc.type,
      label: doc.label,
      createdAt: doc.createdAt
    };
  }

  // Portfolio operations
  async createPortfolio(userId: string, portfolioData: Partial<PortfolioInterface>): Promise<PortfolioInterface> {
    const portfolio = new Portfolio({
      userId,
      ...portfolioData,
      lastUpdated: new Date()
    });

    const savedPortfolio = await portfolio.save();
    return this.portfolioDocumentToInterface(savedPortfolio);
  }

  async findPortfolioByUserId(userId: string): Promise<PortfolioInterface | null> {
    const portfolio = await Portfolio.findOne({ userId }).populate('userId', 'email first_name last_name');
    return portfolio ? this.portfolioDocumentToInterface(portfolio) : null;
  }

  async getPortfolio(userId: string): Promise<PortfolioInterface | null> {
    return this.findPortfolioByUserId(userId);
  }

  async updatePortfolio(userId: string, updates: Partial<PortfolioInterface>): Promise<PortfolioInterface | null> {
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId }, 
      { ...updates, lastUpdated: new Date() }, 
      { new: true, upsert: true }
    ).populate('userId', 'email first_name last_name');
    
    return portfolio ? this.portfolioDocumentToInterface(portfolio) : null;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<TransactionInterface> {
    const transaction = new Transaction({
      ...transactionData,
      createdAt: new Date()
    });

    const savedTransaction = await transaction.save();
    return this.transactionDocumentToInterface(savedTransaction);
  }

  async getTransactions(userId: string): Promise<TransactionInterface[]> {
    const transactions = await Transaction.find({ userId })
      .populate('userId', 'email first_name last_name')
      .sort({ createdAt: -1 });
    return transactions.map(tx => this.transactionDocumentToInterface(tx));
  }

  async findTransactionsByUserId(userId: string): Promise<TransactionInterface[]> {
    return this.getTransactions(userId);
  }

  async getTransaction(transactionId: string): Promise<TransactionInterface | null> {
    const transaction = await Transaction.findById(transactionId).populate('userId', 'email first_name last_name');
    return transaction ? this.transactionDocumentToInterface(transaction) : null;
  }

  // Additional converter methods
  private portfolioDocumentToInterface(doc: IPortfolio): PortfolioInterface {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      totalPortfolioValue: doc.totalPortfolioValue,
      goldHoldings: doc.goldHoldings,
      silverHoldings: doc.silverHoldings,
      portfolioPerformance: doc.portfolioPerformance,
      assetAllocation: doc.assetAllocation,
      priceTrends: doc.priceTrends,
      performanceTrendLabel: doc.performanceTrendLabel,
      lastUpdated: doc.lastUpdated
    };
  }

  private transactionDocumentToInterface(doc: ITransaction): TransactionInterface {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      type: doc.type,
      metalType: doc.metalType,
      amount: doc.amount,
      value: doc.value,
      price: doc.price,
      status: doc.status,
      createdAt: doc.createdAt
    };
  }

  async findUserById(userId: string): Promise<UserInterface | null> {
    const user = await User.findById(userId);
    return user ? this.userDocumentToInterface(user) : null;
  }

  async updateUser(userId: string, updates: Partial<UserInterface>): Promise<UserInterface | null> {
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updated_at: new Date() },
      { new: true }
    );
    return user ? this.userDocumentToInterface(user) : null;
  }

  // Wallet operations
  async createWallet(userId: string, address: string, type: string, label?: WalletLabel): Promise<WalletInterface> {
    const wallet = new Wallet({
      userId,
      address,
      type,
      label: label || 'secondary',
      createdAt: new Date()
    });

    const savedWallet = await wallet.save();
    return this.walletDocumentToInterface(savedWallet);
  }

  async findWalletsByUserId(userId: string): Promise<WalletInterface[]> {
    const wallets = await Wallet.find({ userId }).populate('userId', 'email first_name last_name');
    return wallets.map(wallet => this.walletDocumentToInterface(wallet));
  }

  async findWalletByAddress(address: string): Promise<WalletInterface | null> {
    const wallet = await Wallet.findOne({ address });
    return wallet ? this.walletDocumentToInterface(wallet) : null;
  }

  async updateWalletLabel(walletId: string, label: WalletLabel): Promise<WalletInterface | null> {
    const wallet = await Wallet.findByIdAndUpdate(
      walletId,
      { label },
      { new: true }
    );
    return wallet ? this.walletDocumentToInterface(wallet) : null;
  }

  async deleteWallet(walletId: string): Promise<boolean> {
    const result = await Wallet.findByIdAndDelete(walletId);
    return !!result;
  }

  // Portfolio operations
  async createPortfolio(userId: string, portfolioData: Partial<PortfolioInterface>): Promise<PortfolioInterface> {
    const portfolio = new Portfolio({
      userId,
      ...portfolioData,
      lastUpdated: new Date()
    });

    const savedPortfolio = await portfolio.save();
    return this.portfolioDocumentToInterface(savedPortfolio);
  }

  async findPortfolioByUserId(userId: string): Promise<PortfolioInterface | null> {
    const portfolio = await Portfolio.findOne({ userId }).populate('userId', 'email first_name last_name');
    return portfolio ? this.portfolioDocumentToInterface(portfolio) : null;
  }

  async updatePortfolio(userId: string, updates: Partial<PortfolioInterface>): Promise<PortfolioInterface | null> {
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId },
      { ...updates, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    return portfolio ? this.portfolioDocumentToInterface(portfolio) : null;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<TransactionInterface> {
    const transaction = new Transaction({
      ...transactionData,
      createdAt: new Date()
    });

    const savedTransaction = await transaction.save();
    return this.transactionDocumentToInterface(savedTransaction);
  }

  async findTransactionsByUserId(userId: string): Promise<TransactionInterface[]> {
    const transactions = await Transaction.find({ userId })
      .populate('userId', 'email first_name last_name')
      .sort({ createdAt: -1 });
    return transactions.map(transaction => this.transactionDocumentToInterface(transaction));
  }

  // Gifting operations  
  async createGifting(giftingData: InsertGifting & { userId: string, recipientWallet: string }): Promise<GiftingInterface> {
    const gifting = new Gifting({
      ...giftingData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedGifting = await gifting.save();
    return this.giftingDocumentToInterface(savedGifting);
  }

  async findGiftingsByUserId(userId: string): Promise<GiftingInterface[]> {
    const giftings = await Gifting.find({ userId })
      .populate('userId', 'email first_name last_name')
      .populate('recipientWallet', 'address')
      .sort({ createdAt: -1 });
    return giftings.map(gifting => this.giftingDocumentToInterface(gifting));
  }

  async updateGifting(giftingId: string, updates: Partial<GiftingInterface>): Promise<GiftingInterface | null> {
    const gifting = await Gifting.findByIdAndUpdate(
      giftingId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    return gifting ? this.giftingDocumentToInterface(gifting) : null;
  }

  async getGiftingByTransactionHash(transactionHash: string): Promise<GiftingInterface | null> {
    const gifting = await Gifting.findOne({ transactionHash });
    return gifting ? this.giftingDocumentToInterface(gifting) : null;
  }

  async getGiftingsByUser(userId: string): Promise<GiftingInterface[]> {
    return this.findGiftingsByUserId(userId);
  }

  // Redemption operations
  async createRedemption(redemptionData: InsertRedemption & { userId: string }): Promise<RedemptionInterface> {
    const redemption = new Redemption({
      ...redemptionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedRedemption = await redemption.save();
    return this.redemptionDocumentToInterface(savedRedemption);
  }

  async findRedemptionsByUserId(userId: string): Promise<RedemptionInterface[]> {
    const redemptions = await Redemption.find({ userId })
      .populate('userId', 'email first_name last_name')
      .sort({ createdAt: -1 });
    return redemptions.map(redemption => this.redemptionDocumentToInterface(redemption));
  }

  async getRedemptionById(redemptionId: string): Promise<RedemptionInterface | null> {
    const redemption = await Redemption.findById(redemptionId)
      .populate('userId', 'email first_name last_name');
    return redemption ? this.redemptionDocumentToInterface(redemption) : null;
  }

  async getRedemptionByTransactionHash(transactionHash: string): Promise<RedemptionInterface | null> {
    const redemption = await Redemption.findOne({ transactionHash })
      .populate('userId', 'email first_name last_name');
    return redemption ? this.redemptionDocumentToInterface(redemption) : null;
  }

  async updateRedemption(redemptionId: string, updates: Partial<RedemptionInterface>): Promise<RedemptionInterface | null> {
    const redemption = await Redemption.findByIdAndUpdate(
      redemptionId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    return redemption ? this.redemptionDocumentToInterface(redemption) : null;
  }

  // Purchase History operations
  async createPurchaseHistory(purchaseData: InsertPurchaseHistory & { userId: string, walletAddress: string }): Promise<PurchaseHistoryInterface> {
    const purchase = new PurchaseHistory({
      ...purchaseData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedPurchase = await purchase.save();
    return this.purchaseHistoryDocumentToInterface(savedPurchase);
  }

  async findPurchaseHistoryByUserId(userId: string): Promise<PurchaseHistoryInterface[]> {
    const purchases = await PurchaseHistory.find({ userId })
      .populate('userId', 'email first_name last_name')
      .populate('walletAddress', 'address')
      .sort({ createdAt: -1 });
    return purchases.map(purchase => this.purchaseHistoryDocumentToInterface(purchase));
  }

  // Helper methods to convert Mongoose documents to interfaces
  private userDocumentToInterface(user: IUser): UserInterface {
    return {
      _id: user._id.toString(),
      email: user.email,
      password_hash: user.password_hash,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      organization_name: user.organization_name,
      country: user.country,
      state: user.state,
      account_status: user.account_status,
      email_verified: user.email_verified,
      email_verification_token: user.email_verification_token,
      email_verification_expires: user.email_verification_expires,
      otp_attempts: user.otp_attempts,
      password_reset_token: user.password_reset_token,
      password_reset_expires: user.password_reset_expires,
      last_otp_sent: user.last_otp_sent,
      referral_code: user.referral_code,
      terms_accepted: user.terms_accepted,
      last_login: user.last_login,
      two_factor_enabled: user.two_factor_enabled,
      two_factor_token: user.two_factor_token,
      two_factor_expires: user.two_factor_expires,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  private walletDocumentToInterface(wallet: IWallet): WalletInterface {
    return {
      _id: wallet._id.toString(),
      userId: wallet.userId.toString(),
      address: wallet.address,
      type: wallet.type,
      label: wallet.label,
      createdAt: wallet.createdAt
    };
  }

  private portfolioDocumentToInterface(portfolio: IPortfolio): PortfolioInterface {
    return {
      _id: portfolio._id.toString(),
      userId: portfolio.userId.toString(),
      totalPortfolioValue: portfolio.totalPortfolioValue,
      goldHoldings: portfolio.goldHoldings,
      silverHoldings: portfolio.silverHoldings,
      portfolioPerformance: portfolio.portfolioPerformance,
      assetAllocation: portfolio.assetAllocation,
      priceTrends: portfolio.priceTrends,
      performanceTrendLabel: portfolio.performanceTrendLabel,
      lastUpdated: portfolio.lastUpdated
    };
  }

  private transactionDocumentToInterface(transaction: ITransaction): TransactionInterface {
    return {
      _id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      type: transaction.type,
      metalType: transaction.metalType,
      amount: transaction.amount,
      value: transaction.value,
      price: transaction.price,
      status: transaction.status,
      createdAt: transaction.createdAt
    };
  }

  private giftingDocumentToInterface(gifting: IGifting): GiftingInterface {
    return {
      _id: gifting._id.toString(),
      userId: {
        id: gifting.userId.toString(),
        name: `${(gifting.userId as any).first_name || ''} ${(gifting.userId as any).last_name || ''}`.trim(),
        email: (gifting.userId as any).email || ''
      },
      recipientWallet: (gifting.recipientWallet as any).address || gifting.recipientWallet.toString(),
      token: gifting.token,
      quantity: gifting.quantity,
      message: gifting.message,
      network: gifting.network,
      status: gifting.status,
      transactionHash: gifting.transactionHash,
      errorMessage: gifting.errorMessage,
      networkFee: gifting.networkFee,
      tokenValueUSD: gifting.tokenValueUSD,
      platformFeeUSD: gifting.platformFeeUSD,
      totalCostUSD: gifting.totalCostUSD,
      gramsAmount: gifting.gramsAmount,
      currentTokenPrice: gifting.currentTokenPrice,
      createdAt: gifting.createdAt,
      updatedAt: gifting.updatedAt
    };
  }

  private redemptionDocumentToInterface(redemption: IRedemption): RedemptionInterface {
    return {
      _id: redemption._id.toString(),
      userId: {
        id: redemption.userId.toString(),
        name: `${(redemption.userId as any).first_name || ''} ${(redemption.userId as any).last_name || ''}`.trim(),
        email: (redemption.userId as any).email || ''
      },
      token: redemption.token,
      quantity: redemption.quantity,
      gramsAmount: redemption.gramsAmount,
      tokenValueUSD: redemption.tokenValueUSD,
      network: redemption.network,
      deliveryAddress: redemption.deliveryAddress,
      streetAddress: redemption.streetAddress,
      city: redemption.city,
      state: redemption.state,
      zipCode: redemption.zipCode,
      country: redemption.country,
      status: redemption.status,
      transactionHash: redemption.transactionHash,
      requestId: redemption.requestId,
      errorMessage: redemption.errorMessage,
      deliveryFee: redemption.deliveryFee,
      totalCostUSD: redemption.totalCostUSD,
      approvedAt: redemption.approvedAt,
      completedAt: redemption.completedAt,
      currentTokenPrice: redemption.currentTokenPrice,
      createdAt: redemption.createdAt,
      updatedAt: redemption.updatedAt
    };
  }

  private purchaseHistoryDocumentToInterface(purchase: IPurchaseHistory): PurchaseHistoryInterface {
    return {
      _id: purchase._id.toString(),
      userId: purchase.userId.toString(),
      metal: purchase.metal,
      tokenAmount: purchase.tokenAmount,
      usdAmount: purchase.usdAmount,
      feeAmount: purchase.feeAmount,
      date: purchase.date,
      time: purchase.time,
      status: purchase.status,
      networkType: purchase.networkType,
      paymentMethod: purchase.paymentMethod,
      transactionHash: purchase.transactionHash,
      walletAddress: (purchase.walletAddress as any).address || purchase.walletAddress.toString(),
      errorMessage: purchase.errorMessage,
      currentTokenPrice: purchase.currentTokenPrice, // Include current token price in interface conversion
      notified: purchase.notified,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt
    };
  }

  // Transaction update method
  async updateTransaction(transactionId: string, updates: Partial<TransactionInterface>): Promise<TransactionInterface | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return null;
      }

      const result = await this.TransactionModel.findByIdAndUpdate(
        transactionId,
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!result) return null;

      return {
        ...result.toObject(),
        _id: result._id.toString(),
        userId: result.userId.toString()
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Purchase History by transaction hash
  async getPurchaseHistoryByTransactionHash(transactionHash: string): Promise<PurchaseHistoryInterface | null> {
    try {
      const result = await this.PurchaseHistoryModel.findOne({ transactionHash });
      
      if (!result) return null;

      return this.purchaseHistoryDocumentToInterface(result);
    } catch (error) {
      console.error('Error getting purchase history by transaction hash:', error);
      throw error;
    }
  }

  // Enhanced methods with populate functionality
  async getUserWithWallets(userId: string): Promise<{ user: UserInterface, wallets: WalletInterface[] } | null> {
    try {
      const user = await this.getUser(userId);
      const wallets = await this.getWallets(userId);
      
      if (!user) return null;
      
      return { user, wallets };
    } catch (error) {
      console.error('Error getting user with wallets:', error);
      throw error;
    }
  }

  async getGiftingsWithPopulation(userId: string): Promise<GiftingInterface[]> {
    return await this.getGiftingsByUser(userId);
  }

  async getRedemptionsWithPopulation(userId: string): Promise<RedemptionInterface[]> {
    return await this.getRedemptionsByUser(userId);
  }

  async getPurchaseHistoryWithPopulation(userId: string): Promise<PurchaseHistoryInterface[]> {
    return await this.getPurchaseHistoryByUser(userId);
  }
}