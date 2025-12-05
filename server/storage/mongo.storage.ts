import {
  type User,
  type Portfolio,
  type Transaction,
  type InsertTransaction,
  type SignupData,
  type Wallet,
  type WalletLabel,
  type Gifting,
  type InsertGifting,
  type Redemption,
  type InsertRedemption,
  type PurchaseHistory,
  type InsertPurchaseHistory,
  type TokenType,
  type NetworkType,
  type GiftingStatus,
  type RedemptionStatus,
  type PurchaseStatus,
  type UserInfo,
  User as UserInterface,
} from "@shared/schema";
import { ENV } from "@shared/constants";
import { randomUUID } from "crypto";
import { MongoClient, Db, Collection, ObjectId, WithId } from "mongodb";

// MongoDB document types (with ObjectId)
type UserDoc = Omit<User, "_id"> & { _id?: ObjectId };

export class MongoStorage {
  protected client: MongoClient | null = null;
  protected db: Db | null = null;
  protected users: Collection<UserDoc> | null = null;
  protected portfolios: Collection<Portfolio> | null = null;
  protected transactions: Collection<Transaction> | null = null;
  protected wallets: Collection<Wallet> | null = null;
  protected giftings: Collection<Gifting> | null = null;
  protected redemptions: Collection<Redemption> | null = null;
  protected purchaseHistory: Collection<PurchaseHistory> | null = null;

  constructor() {}

  /**
   * Normalizes wallet address based on blockchain type
   * Ethereum addresses (0x...) are lowercased for consistency
   * Solana addresses preserve case as they are Base58 encoded
   */
  private normalizeWalletAddress(address: string): string {
    const trimmed = address.trim();

    // Ethereum addresses start with 0x and should be lowercase
    if (trimmed.startsWith("0x")) {
      return trimmed.toLowerCase();
    }

    // Solana addresses are Base58 encoded and case-sensitive
    // Keep exact case for Solana addresses
    return trimmed;
  }

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable is not set");
      }

      this.client = new MongoClient(mongoUri);
      await this.client.connect();

      this.db = this.client.db("vaulted_assets");
      this.users = this.db.collection<UserDoc>("users");
      this.portfolios = this.db.collection<Portfolio>("portfolios");
      this.transactions = this.db.collection<Transaction>("transactions");
      this.wallets = this.db.collection<Wallet>("wallets");
      this.giftings = this.db.collection<Gifting>("giftings");
      this.redemptions = this.db.collection<Redemption>("redemptions");
      this.purchaseHistory =
        this.db.collection<PurchaseHistory>("purchasehistory");

      // Create indexes for better performance
      await this.users.createIndex({ email: 1 }, { unique: true });
      await this.users.createIndex(
        { username: 1 },
        { unique: true, sparse: true },
      );
      await this.portfolios.createIndex({ userId: 1 }, { unique: true });
      await this.transactions.createIndex({ userId: 1 });
      await this.transactions.createIndex({ createdAt: -1 });
      await this.wallets.createIndex({ userId: 1 });
      // Allow multiple users to register the same wallet address if business rules require it.
      // Uniqueness (per-user or global) is enforced in application logic instead of DB constraint.
      await this.wallets.createIndex({ address: 1 });
      await this.giftings.createIndex({ userId: 1 });
      await this.giftings.createIndex({ recipientWallet: 1 });
      await this.giftings.createIndex({ createdAt: -1 });
      await this.giftings.createIndex({ transactionHash: 1 });
      await this.purchaseHistory.createIndex({ userId: 1 });
      await this.purchaseHistory.createIndex({ createdAt: -1 });
      await this.purchaseHistory.createIndex({ transactionHash: 1 });

      console.log("✅ Connected to MongoDB");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log("📦 Disconnected from MongoDB");
    }
  }


  private ensureConnected(): void {
    if (
      !this.users ||
      !this.portfolios ||
      !this.transactions ||
      !this.wallets ||
      !this.giftings ||
      !this.purchaseHistory
    ) {
      throw new Error("MongoDB not connected. Call connect() first.");

    }
  }

  // User operations
  async getUser(userId: string): Promise<User | undefined> {
    this.ensureConnected();

    try {
      // Check if userId is a valid MongoDB ObjectId (24 hex characters)
      if (ObjectId.isValid(userId) && userId.length === 24) {
        console.log(`[Storage] Looking up user with ObjectId: ${userId}`);
        const user = await this.users!.findOne({ _id: new ObjectId(userId) });
        if (user) {
          console.log(`[Storage] User found: ${user.email}`);
          return { ...user, _id: user._id.toString() };
        }
        console.log(`[Storage] User not found with ObjectId: ${userId}`);
        return undefined;
      }

      // If not a valid ObjectId, log the issue and try direct string lookup as fallback
      console.warn(
        `[Storage] Invalid ObjectId format: ${userId} (length: ${userId.length})`,
      );
      return undefined;
    } catch (error) {
      console.error(`[Storage] Error getting user ${userId}:`, error);
      return undefined;
    }
  }

  // Helper method to create UserInfo object from user data
  async getUserInfo(userId: string): Promise<UserInfo | undefined> {
    this.ensureConnected();

    try {
      // Check if userId is a valid MongoDB ObjectId (24 hex characters)
      if (ObjectId.isValid(userId) && userId.length === 24) {
        console.log(`[Storage] Looking up user info with ObjectId: ${userId}`);
        const user = await this.users!.findOne({ _id: new ObjectId(userId) });
        if (user) {
          console.log(`[Storage] User info found: ${user.email}`);
          const fullName = [user.first_name, user.last_name]
            .filter(Boolean)
            .join(" ");
          return {
            id: user._id.toString(),
            name: fullName || user.email, // Use email as fallback if no name
            email: user.email,
          };
        }
        console.log(`[Storage] User info not found with ObjectId: ${userId}`);
        return undefined;
      }

      // If not a valid ObjectId, log the issue
      console.warn(
        `[Storage] Invalid ObjectId format in getUserInfo: ${userId} (length: ${userId.length})`,
      );
      return undefined;
    } catch (error) {
      console.error(`[Storage] Error getting user info for ${userId}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    this.ensureConnected();
    const user = await this.users!.findOne({ email: email.toLowerCase() });
    if (user) {
      return { ...user, _id: user._id.toString() };
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    this.ensureConnected();
    const user = await this.users!.findOne({ username: username });
    if (user) {
      return { ...user, _id: user._id.toString() };
    }
    return undefined;
  }

  async getUserByPartyId(partyId: string): Promise<User | null> {
    this.ensureConnected();

    try {
      console.log(`[Storage] Looking up user with partyId: ${partyId}`);
      const user = await this.users!.findOne({ partyId: partyId });

      if (user) {
        console.log(`[Storage] User found with partyId: ${user.email}`);
        return { ...user, _id: user._id.toString() };
      }

      console.log(`[Storage] No user found with partyId: ${partyId}`);
      return null;
    } catch (error) {
      console.error(
        `[Storage] Error finding user by partyId ${partyId}:`,
        error,
      );
      return null;
    }
  }

  async createUser(userData: (Omit<Extract<SignupData, { account_type: "individual" }>, 'password' | 'confirm_password'> | Omit<Extract<SignupData, { account_type: "institutional" }>, 'password' | 'confirm_password'>) & { password_hash: string }): Promise<User> {
    this.ensureConnected();

    const now = new Date();

    // Build user document based on account type
    const userDoc: UserDoc = {
      email: userData.email.toLowerCase(),
      password_hash: userData.password_hash,
      account_type: userData.account_type,
      country: userData.country,
      account_status: "unverified",
      email_verified: false,
      terms_accepted: userData.terms_accepted,
      two_factor_enabled: true, // 2FA enabled by default
      kyc_status: "not_started", // Initialize KYC status
      created_at: now,
      updated_at: now,
    };

    // Add account-type specific fields with proper type narrowing
    if (userData.account_type === "individual") {
      const individualData = userData as Omit<Extract<SignupData, { account_type: "individual" }>, 'password' | 'confirm_password'> & { password_hash: string };
      userDoc.first_name = individualData.first_name;
      userDoc.last_name = individualData.last_name;
      userDoc.dob = individualData.dob;
      // Set common address fields for individual
      userDoc.address1 = individualData.address1;
      userDoc.address2 = individualData.address2;
      userDoc.city = individualData.city;
      userDoc.zipcode = individualData.zipcode;
      userDoc.profession = individualData.profession;
    } else if (userData.account_type === "institutional") {
      const institutionalData = userData as Omit<Extract<SignupData, { account_type: "institutional" }>, 'password' | 'confirm_password'> & { password_hash: string };
      userDoc.company_name = institutionalData.company_name;
      userDoc.company_website = institutionalData.company_website;
      userDoc.company_phone = institutionalData.company_phone;
      // Set common address fields for institutional
      userDoc.address1 = institutionalData.address1;
      userDoc.address2 = institutionalData.address2;
      userDoc.city = institutionalData.city;
      userDoc.zipcode = institutionalData.zipcode;
      userDoc.profession = institutionalData.profession;
      userDoc.authorized_signatory_name = institutionalData.authorized_signatory_name;
      userDoc.authorized_signatory_email = institutionalData.authorized_signatory_email;
      userDoc.authorized_signatory_phone = institutionalData.authorized_signatory_phone;
    }

    // Debug: Log the userDoc before insertion
    console.log("[Storage] Creating user with data:", {
      email: userDoc.email,
      account_type: userDoc.account_type,
      address1: userDoc.address1,
      address2: userDoc.address2,
      city: userDoc.city,
      zipcode: userDoc.zipcode,
    });

    const result = await this.users!.insertOne(userDoc);
    const createdUser: User = { ...userDoc, _id: result.insertedId.toString() };

    // Create initial portfolio for the user
    await this.createPortfolio(createdUser._id!);

    return createdUser;
  }

  async updateUser(
    userId: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    this.ensureConnected();

    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    const result = await this.users!.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (result) {
      return { ...result, _id: result._id.toString() };
    }
    return undefined;
  }

  // Portfolio operations
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const portfolio = await this.portfolios!.findOne(query);
    if (!portfolio) return undefined;

    // Convert ObjectId userId back to string for interface compatibility
    return {
      ...portfolio,
      userId: portfolio.userId.toString(),
    };
  }

  async createPortfolio(userId: string): Promise<Portfolio> {
    this.ensureConnected();

    const portfolio: Portfolio = {
      userId: new ObjectId(userId), // Store as ObjectId for proper references
      totalPortfolioValue: {
        amount: 0,
        changePercent: 0,
        comparisonPeriod: "last month",
      },
      goldHoldings: {
        valueUSD: 0,
        tokens: 0,
        amountSpentUSD: 0,
      },
      silverHoldings: {
        valueUSD: 0,
        tokens: 0,
        amountSpentUSD: 0,
      },
      portfolioPerformance: {
        currentValue: 0,
        monthlyChangeUSD: 0,
        ytdChangePercent: 0,
        monthlyChangePercent: 0,
        bestMonth: {
          month: "",
          changePercent: 0,
        },
      },
      assetAllocation: {
        goldPercent: 0,
        silverPercent: 0,
      },
      priceTrends: {
        period: "1M",
        goldPrices: [],
        silverPrices: [],
      },
      performanceTrendLabel: "Building Portfolio",
      lastUpdated: new Date(),
    };

    await this.portfolios!.insertOne(portfolio);

    // Return with userId as string for interface compatibility
    return {
      ...portfolio,
      userId: userId,
    };
  }

  async updatePortfolio(
    userId: string,
    updates: Partial<Portfolio>,
  ): Promise<Portfolio | undefined> {
    this.ensureConnected();

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const result = await this.portfolios!.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: "after" },
    );

    return result || undefined;
  }

  /**
   * Update portfolio after token purchase
   */
  async updatePortfolioAfterPurchase(
    userId: string,
    tokenType: "gold" | "silver",
    tokenAmount: string,
    usdAmount: string,
  ): Promise<Portfolio | undefined> {
    this.ensureConnected();

    // Get current portfolio or create if doesn't exist
    let portfolio = await this.getPortfolio(userId);
    if (!portfolio) {
      portfolio = await this.createPortfolio(userId);
    }

    // Get current token prices for calculations
    const goldPrice = 2757.54; // Default gold price (should come from API)
    const silverPrice = 30.89; // Default silver price (should come from API)

    const tokenAmountNum = parseFloat(tokenAmount);
    const usdAmountNum = parseFloat(usdAmount);

    // Handle backward compatibility - if old schema, convert to new schema first
    const isOldSchema = "goldAmount" in portfolio;

    if (isOldSchema) {
      console.log("Converting old portfolio to new schema during update...");
      const oldPortfolio = portfolio as any;

      // Calculate existing values from old schema
      const existingGoldTokens = parseFloat(oldPortfolio.goldAmount || "0");
      const existingGoldSpent = parseFloat(oldPortfolio.goldUsdSpent || "0");
      const existingSilverTokens = parseFloat(oldPortfolio.silverAmount || "0");
      const existingSilverSpent = parseFloat(
        oldPortfolio.silverUsdSpent || "0",
      );

      // Initialize with existing old data converted to new structure
      portfolio.totalPortfolioValue = {
        amount: 0,
        changePercent: 0,
        comparisonPeriod: "last month",
      };
      portfolio.goldHoldings = {
        tokens: existingGoldTokens,
        valueUSD: existingGoldTokens * goldPrice, // Calculate current value
        amountSpentUSD: existingGoldSpent,
      };
      portfolio.silverHoldings = {
        tokens: existingSilverTokens,
        valueUSD: existingSilverTokens * silverPrice, // Calculate current value
        amountSpentUSD: existingSilverSpent,
      };
      portfolio.portfolioPerformance = {
        currentValue: 0,
        monthlyChangeUSD: 0,
        ytdChangePercent: 0,
        monthlyChangePercent: 0,
        bestMonth: { month: "", changePercent: 0 },
      };
      portfolio.assetAllocation = {
        goldPercent: 0,
        silverPercent: 0,
      };
      portfolio.priceTrends = {
        period: "1M",
        goldPrices: [],
        silverPrices: [],
      };
      portfolio.performanceTrendLabel = "Building Portfolio";
      portfolio.lastUpdated = new Date();

      // Remove old schema fields
      delete (portfolio as any).goldAmount;
      delete (portfolio as any).silverAmount;
      delete (portfolio as any).usdcBalance;
      delete (portfolio as any).totalValue;
      delete (portfolio as any).totalUsdSpent;
      delete (portfolio as any).totalTokenValueUsd;
      delete (portfolio as any).goldUsdSpent;
      delete (portfolio as any).silverUsdSpent;
      delete (portfolio as any).updatedAt;
      delete (portfolio as any).id;

      // Save the converted portfolio immediately to prevent repeated conversions
      await this.portfolios!.findOneAndUpdate(
        { userId },
        {
          $set: portfolio,
          $unset: {
            goldAmount: "",
            silverAmount: "",
            usdcBalance: "",
            totalValue: "",
            totalUsdSpent: "",
            totalTokenValueUsd: "",
            goldUsdSpent: "",
            silverUsdSpent: "",
            updatedAt: "",
            id: "",
          },
        },
      );
    }

    // Update holdings based on token type
    if (tokenType === "gold") {
      portfolio.goldHoldings.tokens += tokenAmountNum;
      portfolio.goldHoldings.amountSpentUSD += usdAmountNum;
      portfolio.goldHoldings.valueUSD =
        portfolio.goldHoldings.tokens * goldPrice;
    } else {
      portfolio.silverHoldings.tokens += tokenAmountNum;
      portfolio.silverHoldings.amountSpentUSD += usdAmountNum;
      portfolio.silverHoldings.valueUSD =
        portfolio.silverHoldings.tokens * silverPrice;
    }

    // Calculate total portfolio value
    const totalCurrentValue =
      portfolio.goldHoldings.valueUSD + portfolio.silverHoldings.valueUSD;
    const totalSpentUSD =
      portfolio.goldHoldings.amountSpentUSD +
      portfolio.silverHoldings.amountSpentUSD;

    // Update total portfolio value
    portfolio.totalPortfolioValue.amount = totalCurrentValue;

    // Calculate performance metrics
    portfolio.portfolioPerformance.currentValue = totalCurrentValue;
    const changeUSD = totalCurrentValue - totalSpentUSD;
    const changePercent =
      totalSpentUSD > 0 ? (changeUSD / totalSpentUSD) * 100 : 0;

    portfolio.totalPortfolioValue.changePercent = changePercent;
    portfolio.portfolioPerformance.monthlyChangeUSD = changeUSD;
    portfolio.portfolioPerformance.monthlyChangePercent = changePercent;

    // Update asset allocation percentages
    if (totalCurrentValue > 0) {
      portfolio.assetAllocation.goldPercent =
        (portfolio.goldHoldings.valueUSD / totalCurrentValue) * 100;
      portfolio.assetAllocation.silverPercent =
        (portfolio.silverHoldings.valueUSD / totalCurrentValue) * 100;
    }

    // Update performance trend label based on performance
    if (changePercent > 10) {
      portfolio.performanceTrendLabel = "Strong Performance Trend";
    } else if (changePercent > 0) {
      portfolio.performanceTrendLabel = "Positive Performance Trend";
    } else if (changePercent < -5) {
      portfolio.performanceTrendLabel = "Recovery Focus Needed";
    } else {
      portfolio.performanceTrendLabel = "Stable Performance Trend";
    }

    portfolio.lastUpdated = new Date();

    const result = await this.portfolios!.findOneAndUpdate(
      { userId },
      { $set: portfolio },
      { returnDocument: "after" },
    );

    return result || undefined;
  }

  /**
   * Get current metal prices (placeholder - in real app would call pricing service)
   */
  async getCurrentMetalPrices(): Promise<{
    goldUsdPerOunce: number;
    silverUsdPerOunce: number;
  }> {
    // In a real implementation, this would call the gold/silver pricing API
    // For now, using default values
    return {
      goldUsdPerOunce: 2000.0,
      silverUsdPerOunce: 25.0,
    };
  }

  // Transaction operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const transactions = await this.transactions!.find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId userId back to string for interface compatibility
    return transactions.map((transaction) => ({
      ...transaction,
      userId: transaction.userId.toString(),
    }));
  }

  async createTransaction(
    transaction: InsertTransaction,
  ): Promise<Transaction> {
    this.ensureConnected();

    const newTransaction: Transaction = {
      userId: new ObjectId(transaction.userId as string), // Store as ObjectId for proper references
      type: transaction.type,
      metalType: transaction.metalType,
      amount: transaction.amount,
      value: transaction.value,
      price: transaction.price,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await this.transactions!.insertOne(newTransaction);

    // Return with userId as string for interface compatibility
    return {
      ...newTransaction,
      _id: result.insertedId.toString(),
      userId: transaction.userId as string,
    };
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<Transaction | null> {
    this.ensureConnected();

    const result = await this.transactions!.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (result) {
      return {
        ...result,
        _id: result._id.toString(),
        userId: result.userId.toString(),
      };
    }
    return null;
  }

  // Wallet operations
  async getWallets(userId: string): Promise<Wallet[]> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const wallets = await this.wallets!.find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId userId back to string for interface compatibility
    return wallets.map((wallet) => ({
      ...wallet,
      userId: wallet.userId.toString(),
    }));
  }

  async getWallet(
    userId: string,
    address: string,
  ): Promise<Wallet | undefined> {
    this.ensureConnected();
    const wallet = await this.wallets!.findOne({
      userId,
      address: this.normalizeWalletAddress(address),
    });
    return wallet || undefined;
  }

  async createWallet(
    userId: string,
    address: string,
    type: string,
    label?: string,
  ): Promise<Wallet> {
    this.ensureConnected();

    // Convert userId string to ObjectId for proper referencing
    const userObjectId = new ObjectId(userId);

    // Check if this is the first wallet for the user
    const existingWallets = await this.getWallets(userId);
    const isFirstWallet = existingWallets.length === 0;

    const wallet: Wallet = {
      userId: userObjectId, // Store as ObjectId for proper references
      address: this.normalizeWalletAddress(address),
      type,
      label: (label ||
        (isFirstWallet ? "primary" : "secondary")) as WalletLabel,
      createdAt: new Date(),
    };

    await this.wallets!.insertOne(wallet);

    // Return with userId as string for interface compatibility
    return {
      ...wallet,
      userId: userId, // Convert back to string for return
    };
  }

  async updateWallet(
    userId: string,
    walletId: string,
    updates: Partial<Wallet>,
  ): Promise<Wallet | undefined> {
    this.ensureConnected();

    const result = await this.wallets!.findOneAndUpdate(
      { _id: new ObjectId(walletId) as any, userId },
      { $set: updates },
      { returnDocument: "after" },
    );

    return result || undefined;
  }

  async deleteWallet(userId: string, walletId: string): Promise<boolean> {
    this.ensureConnected();

    const result = await this.wallets!.deleteOne({
      _id: new ObjectId(walletId) as any,
      userId,
    });

    return result.deletedCount === 1;
  }

  async checkWalletExists(userId: string, address: string): Promise<boolean> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? {
          userId: new ObjectId(userId),
          address: this.normalizeWalletAddress(address),
        }
      : { userId, address: this.normalizeWalletAddress(address) };

    const wallet = await this.wallets!.findOne(query);
    return wallet !== null;
  }

  async checkWalletExistsGlobally(address: string): Promise<boolean> {
    this.ensureConnected();

    const wallet = await this.wallets!.findOne({
      address: this.normalizeWalletAddress(address),
    });

    return wallet !== null;
  }

  async getUserIdByWalletAddress(address: string): Promise<string | null> {
    this.ensureConnected();

    const wallet = await this.wallets!.findOne({
      address: this.normalizeWalletAddress(address),
    });

    return wallet ? wallet.userId.toString() : null;
  }

  // Gifting operations
  async createGifting(giftingData: InsertGifting): Promise<Gifting> {
    this.ensureConnected();

    const now = new Date();

    // Validate that userId is a valid string before creating ObjectId
    if (!giftingData.userId || typeof giftingData.userId !== "string") {
      throw new Error(
        `Invalid userId for gifting: ${giftingData.userId}. Must be a valid string.`,
      );
    }

    // Provide defaults for optional fields when creating from minimal API payload
    const gifting: Gifting = {
      userId: new ObjectId(giftingData.userId), // Store as ObjectId using valid string userId
      recipientWallet: giftingData.recipientWallet || "",
      token: giftingData.token?.toLowerCase() as TokenType,
      quantity: giftingData.quantity || "0",
      message: giftingData.message,
      network: giftingData.network?.toLocaleLowerCase() as NetworkType,
      status: (giftingData.status || "pending") as GiftingStatus,
      transactionHash: giftingData.transactionHash,
      errorMessage: giftingData.errorMessage,
      networkFee: giftingData.networkFee || "0",
      tokenValueUSD: giftingData.tokenValueUSD || "0",
      platformFeeUSD: giftingData.platformFeeUSD || "0",
      totalCostUSD: giftingData.totalCostUSD || "0",
      gramsAmount: giftingData.gramsAmount || "0",
      currentTokenPrice: giftingData.currentTokenPrice || "0",
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.giftings!.insertOne(gifting);

    // Return with userId as string for interface compatibility
    return {
      ...gifting,
      _id: result.insertedId.toString(),
      userId: giftingData.userId as string,
    };
  }

  async getGiftingsByUser(userId: string): Promise<Gifting[]> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const giftings = await this.giftings!.find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId userId back to string for interface compatibility
    return giftings.map((gifting) => ({
      ...gifting,
      userId: gifting.userId.toString(),
    }));
  }

  async getAllGiftingsByUser(userId: string): Promise<Gifting[]> {
    this.ensureConnected();

    const giftings = await this.giftings!.find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return giftings;
  }

  async getGiftingsByUserPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ giftings: Gifting[]; total: number }> {
    this.ensureConnected();

    // Check both ObjectId and string format for backward compatibility
    const userQuery = {
      $or: [
        { userId: userId },
        { userId: new ObjectId(userId) },
        { "userId.id": userId },
        { "userId.id": new ObjectId(userId) },
        { fromUserId: userId },
        { toUserId: userId },
        { fromUserId: new ObjectId(userId) },
        { toUserId: new ObjectId(userId) },
        { "fromUserId.id": userId },
        { "toUserId.id": userId },
        { "fromUserId.id": new ObjectId(userId) },
        { "toUserId.id": new ObjectId(userId) },
        { "fromUserInfo.id": userId },
        { "toUserInfo.id": userId },
        { "fromUserInfo.id": new ObjectId(userId) },
        { "toUserInfo.id": new ObjectId(userId) },
      ],
    };

    const [giftings, total] = await Promise.all([
      this.giftings!.find(userQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.giftings!.countDocuments(userQuery),
    ]);

    return { giftings, total };
  }

  async getGiftingByTransactionHash(
    transactionHash: string,
  ): Promise<Gifting | null> {
    this.ensureConnected();

    const gifting = await this.giftings!.findOne({ transactionHash });
    if (gifting) {
      // Convert ObjectId userId back to string for interface compatibility
      return {
        ...gifting,
        userId: gifting.userId.toString(),
      };
    }
    return null;
  }

  async updateGifting(
    giftingId: string,
    updates: Partial<Gifting>,
  ): Promise<Gifting | undefined> {
    this.ensureConnected();

    const result = await this.giftings!.findOneAndUpdate(
      { _id: new ObjectId(giftingId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (result) {
      // Convert ObjectId userId back to string for interface compatibility
      return {
        ...result,
        userId: result.userId.toString(),
      };
    }
    return undefined;
  }

  // Redemption methods
  async createRedemption(
    redemptionData: InsertRedemption,
  ): Promise<Redemption> {
    this.ensureConnected();

    const now = new Date();

    // Build redemption object WITHOUT any 'id' field to prevent index conflicts
    const redemption = {
      userId: new ObjectId(redemptionData.userId as string), // Store as ObjectId for proper references
      walletAddress: redemptionData.walletAddress, // Store wallet address
      token: (redemptionData.token || "gold") as TokenType,
      quantity: redemptionData.quantity || "0",
      gramsAmount: redemptionData.gramsAmount || "0",
      tokenValueUSD: redemptionData.tokenValueUSD || "0",
      network: (redemptionData.network || "public") as NetworkType,
      deliveryAddress: redemptionData.deliveryAddress || "",
      streetAddress: redemptionData.streetAddress || "",
      city: redemptionData.city || "",
      state: redemptionData.state || "",
      zipCode: redemptionData.zipCode || "",
      country: redemptionData.country || "",
      status: (redemptionData.status || "pending") as RedemptionStatus,
      transactionHash: redemptionData.transactionHash,
      requestId: redemptionData.requestId, // Blockchain request ID from RedemptionRequested event
      errorMessage: redemptionData.errorMessage,
      deliveryFee: redemptionData.deliveryFee || "0",
      totalCostUSD: redemptionData.totalCostUSD || "0",
      currentTokenPrice: redemptionData.currentTokenPrice || "0",
      createdAt: now,
      updatedAt: now,
    };

    // CRITICAL: Remove any 'id' field before insertion to prevent E11000 duplicate key error
    const cleanRedemption = { ...redemption };
    delete (cleanRedemption as any).id;

    const result = await this.redemptions!.insertOne(cleanRedemption);

    // Return with userId as string for interface compatibility, ensuring no 'id' field
    const returnRedemption = {
      ...cleanRedemption,
      _id: result.insertedId.toString(),
      userId: redemptionData.userId as string,
    };

    // CRITICAL: Remove any 'id' field from return object
    delete (returnRedemption as any).id;

    return returnRedemption;
  }

  async getRedemptionsByUser(userId: string): Promise<Redemption[]> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const redemptions = await this.redemptions!.find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId userId back to string for interface compatibility
    return redemptions.map((redemption) => ({
      ...redemption,
      userId: redemption.userId.toString(),
    }));
  }

  async getRedemptionsByUserPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ redemptions: Redemption[]; total: number }> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const [redemptions, total] = await Promise.all([
      this.redemptions!.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.redemptions!.countDocuments(query),
    ]);

    // Convert ObjectId userId back to string for interface compatibility
    const processedRedemptions = redemptions.map((redemption) => ({
      ...redemption,
      userId: redemption.userId.toString(),
    }));

    return { redemptions: processedRedemptions, total };
  }

  async getRedemptionByTransactionHash(
    transactionHash: string,
  ): Promise<Redemption | undefined> {
    this.ensureConnected();

    const redemption = await this.redemptions!.findOne({ transactionHash });
    if (redemption) {
      // Convert ObjectId userId back to string for interface compatibility
      return {
        ...redemption,
        userId: redemption.userId.toString(),
      };
    }
    return undefined;
  }

  async updateRedemptionByTransactionHash(
    transactionHash: string,
    updateData: Partial<Redemption>,
  ): Promise<Redemption | undefined> {
    this.ensureConnected();

    const result = await this.redemptions!.findOneAndUpdate(
      { transactionHash },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (result) {
      // Convert ObjectId userId back to string for interface compatibility
      return {
        ...result,
        userId: result.userId.toString(),
      };
    }
    return undefined;
  }

  async updateRedemption(
    id: string,
    updateData: Partial<Redemption>,
  ): Promise<Redemption | undefined> {
    this.ensureConnected();

    const result = await this.redemptions!.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (result) {
      // Convert ObjectId userId back to string for interface compatibility
      return {
        ...result,
        userId: result.userId.toString(),
      };
    }
    return undefined;
  }

  async getRedemptionByRequestId(
    requestId: string,
  ): Promise<Redemption | null> {
    this.ensureConnected();

    const redemption = await this.redemptions!.findOne({
      requestId: requestId,
    });

    if (redemption) {
      return {
        ...redemption,
        userId: redemption.userId.toString(),
      };
    }

    return null;
  }

  async getRedemptionById(id: string): Promise<Redemption | null> {
    this.ensureConnected();

    const redemption = await this.redemptions!.findOne({
      _id: new ObjectId(id),
    });
    if (redemption) {
      // Convert ObjectId userId back to string for interface compatibility
      return {
        ...redemption,
        userId: redemption.userId.toString(),
      };
    }
    return null;
  }

  // Purchase History operations
  async createPurchaseHistory(
    purchaseData: InsertPurchaseHistory,
  ): Promise<PurchaseHistory> {
    this.ensureConnected();

    const now = new Date();

    const purchase: PurchaseHistory = {
      userId: new ObjectId(purchaseData.userId as string), // Store as ObjectId for proper references
      metal: (purchaseData.metal?.toLowerCase() || 'gold') as any, // Default to 'gold' if not provided
      tokenAmount: purchaseData.tokenAmount,
      usdAmount: purchaseData.usdAmount,
      feeAmount: purchaseData.feeAmount,
      date: purchaseData.date,
      time: purchaseData.time,
      status: purchaseData.status,
      networkType: (purchaseData.networkType?.toLowerCase() || 'private') as any, // Default to 'private' if not provided
      paymentMethod: purchaseData.paymentMethod,
      transactionHash: purchaseData.transactionHash,
      walletAddress: purchaseData.walletAddress,
      errorMessage: purchaseData.errorMessage,
      currentTokenPrice: purchaseData.currentTokenPrice, // Include current token price
      notified: false, // Default to false - notification not sent yet
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.purchaseHistory!.insertOne(purchase);

    // Return with userId as string for interface compatibility
    return {
      ...purchase,
      _id: result.insertedId.toString(),
      userId: purchaseData.userId as string,
    };
  }

  async getPurchaseHistoryByUser(userId: string): Promise<PurchaseHistory[]> {
    this.ensureConnected();

    // Support both string and ObjectId userId queries
    const query = ObjectId.isValid(userId)
      ? { userId: new ObjectId(userId) }
      : { userId };

    const purchases = await this.purchaseHistory!.find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId userId back to string for interface compatibility
    return purchases.map((purchase) => ({
      ...purchase,
      userId: purchase.userId.toString(),
    }));
  }

  async getPurchaseHistoryByUserPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ purchases: PurchaseHistory[]; total: number }> {
    this.ensureConnected();

    // Check both ObjectId and string format for backward compatibility
    const userQuery = {
      $or: [
        { userId: userId },
        { userId: new ObjectId(userId) },
        { "userId.id": userId },
        { "userId.id": new ObjectId(userId) },
      ],
    };

    const [purchases, total] = await Promise.all([
      this.purchaseHistory!.find(userQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.purchaseHistory!.countDocuments(userQuery),
    ]);

    return { purchases, total };
  }

  async updatePurchaseHistory(
    id: string,
    updates: Partial<PurchaseHistory>,
  ): Promise<PurchaseHistory | null> {
    this.ensureConnected();

    // Convert string ID to ObjectId for MongoDB query
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`Invalid ObjectId format: ${id}`, error);
      return null;
    }

    const result = await this.purchaseHistory!.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (result) {
      return {
        ...result,
        _id: result._id.toString(),
        userId: result.userId.toString(),
      };
    }
    return null;
  }

  async getPurchaseHistoryByTransactionHash(
    transactionHash: string,
  ): Promise<PurchaseHistory | null> {
    this.ensureConnected();

    const purchase = await this.purchaseHistory!.findOne({ transactionHash });

    if (purchase) {
      return {
        ...purchase,
        _id: purchase._id.toString(),
        userId: purchase.userId.toString(),
      };
    }
    return null;
  }

  async getPurchaseHistoryByTransactionId(
    transactionId: string,
  ): Promise<PurchaseHistory | null> {
    this.ensureConnected();

    const purchase = await this.purchaseHistory!.findOne({
      transactionHash: transactionId,
    });

    if (purchase) {
      return {
        ...purchase,
        userId: purchase.userId.toString(),
      };
    }

    return null;
  }

  // async getPurchaseHistoryByTransactionHash(
  //   transactionHash: string,
  // ): Promise<PurchaseHistory | undefined> {
  //   this.ensureConnected();

  //   const purchase = await this.purchaseHistory!.findOne({ transactionHash });
  //   return purchase || undefined;
  // }

  async getPlatformPurchases(limit: number = 10): Promise<PurchaseHistory[]> {
    this.ensureConnected();

    const purchases = await this.purchaseHistory!.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return purchases;
  }

  // Notification operations
  async createNotification(notification: any): Promise<any> {
    this.ensureConnected();

    const result = await this.db!.collection("notifications").insertOne({
      ...notification,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      _id: result.insertedId.toString(),
      ...notification,
    };
  }

  // Aliases for IStorage interface compatibility
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.getUserByEmail(email);
    return result || null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const result = await this.getUser(userId);
    return result || null;
  }
}
