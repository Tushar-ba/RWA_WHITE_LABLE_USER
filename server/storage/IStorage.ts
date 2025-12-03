import { 
  User, 
  Portfolio, 
  Transaction, 
  Wallet,
  Gifting,
  Redemption,
  PurchaseHistory,
  InsertTransaction, 
  SignupData, 
  UserInfo,
  InsertGifting, 
  InsertRedemption, 
  InsertPurchaseHistory,
  WalletLabel,
  UpdateUserProfile
} from "@shared/schema";

// Common storage interface that both MongoDB and Mongoose implementations must follow
export interface IStorage {
  // Connection methods
  connect(): Promise<void>;
  disconnect?(): Promise<void>;

  // User operations
  createUser(userData: SignupData): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  getUser(userId: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByPartyId(partyId: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | null>;
  updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<User | null>;
  getUserInfo(userId: string): Promise<UserInfo | null>;

  // Wallet operations
  createWallet(userId: string, address: string, type: string, label?: WalletLabel): Promise<Wallet>;
  getWallets(userId: string): Promise<Wallet[]>;
  findWalletsByUserId(userId: string): Promise<Wallet[]>;
  findWalletByAddress(address: string): Promise<Wallet | null>;
  updateWalletLabel(walletId: string, label: WalletLabel): Promise<Wallet | null>;
  deleteWallet(walletId: string): Promise<boolean>;
  checkWalletExists(userId: string, address: string): Promise<boolean>;
  checkWalletExistsGlobally(address: string): Promise<boolean>;
  getUserIdByWalletAddress(address: string): Promise<string | null>;

  // Portfolio operations
  createPortfolio(userId: string, portfolioData: Partial<Portfolio>): Promise<Portfolio>;
  findPortfolioByUserId(userId: string): Promise<Portfolio | null>;
  getPortfolio(userId: string): Promise<Portfolio | null>;
  updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | null>;
  updatePortfolioAfterPurchase?(userId: string, metal: 'gold' | 'silver', tokenAmount: string, usdAmount: string): Promise<void>;

  // Transaction operations
  createTransaction(transactionData: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: string): Promise<Transaction[]>;
  findTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransaction(transactionId: string): Promise<Transaction | null>;
  updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction | null>;

  // Gifting operations
  createGifting(giftingData: InsertGifting): Promise<Gifting>;
  getGiftingsByUser(userId: string): Promise<Gifting[]>;
  findGiftingsByUserId(userId: string): Promise<Gifting[]>;
  getGiftingByTransactionHash(transactionHash: string): Promise<Gifting | null>;
  updateGifting(giftingId: string, updates: Partial<Gifting>): Promise<Gifting | null>;

  // Redemption operations
  createRedemption(redemptionData: InsertRedemption): Promise<Redemption>;
  getRedemptionsByUser(userId: string): Promise<Redemption[]>;
  findRedemptionsByUserId(userId: string): Promise<Redemption[]>;
  getRedemptionsByUserPaginated(userId: string, skip: number, limit: number): Promise<{ redemptions: Redemption[], total: number }>;
  getRedemptionByTransactionHash(transactionHash: string): Promise<Redemption | null>;
  getRedemptionById(redemptionId: string): Promise<Redemption | null>;
  updateRedemption(redemptionId: string, updates: Partial<Redemption>): Promise<Redemption | null>;
  updateRedemptionByTransactionHash(transactionHash: string, updates: Partial<Redemption>): Promise<Redemption | null>;

  // Purchase History operations
  createPurchaseHistory(purchaseData: InsertPurchaseHistory): Promise<PurchaseHistory>;
  getPurchaseHistoryByUser(userId: string): Promise<PurchaseHistory[]>;
  findPurchaseHistoryByUserId(userId: string): Promise<PurchaseHistory[]>;
  getPurchaseHistoryByUserPaginated(userId: string, skip: number, limit: number): Promise<{ purchases: PurchaseHistory[], total: number }>;
  getPurchaseHistoryByTransactionHash(transactionHash: string): Promise<PurchaseHistory | null>;
  updatePurchaseHistory(purchaseId: string, updates: Partial<PurchaseHistory>): Promise<PurchaseHistory | null>;

  // Enhanced methods with populate (optional for Mongoose implementations)
  getUserWithWallets?(userId: string): Promise<{ user: User, wallets: Wallet[] } | null>;
  getGiftingsWithPopulation?(userId: string): Promise<Gifting[]>;
  getRedemptionsWithPopulation?(userId: string): Promise<Redemption[]>;
  getPurchaseHistoryWithPopulation?(userId: string): Promise<PurchaseHistory[]>;

  // Notification operations
  createNotification(notification: any): Promise<any>;
}