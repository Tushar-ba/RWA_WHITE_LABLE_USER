/**
 * Enhanced MongoDB storage with populate-like functionality
 * All methods use findOne() and optimized queries instead of manual lookups
 */

import { MongoStorage } from './mongo.storage.js';
import { User, Wallet, Gifting, Redemption, PurchaseHistory, SystemSettings } from "@shared/schema";
import { ObjectId } from 'mongodb';
import TransferNotification, { ITransferNotification } from '../models/TransferNotification.js';

export class EnhancedMongoStorage extends MongoStorage {
  
  // OPTIMIZED: Single aggregation query instead of 2 separate queries
  async getUserWithWallets(userId: string): Promise<{ user: User, wallets: Wallet[] } | null> {
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!userObjectId) return null;

    // Single aggregation to get user with wallets
    const result = await this.users!.aggregate([
      { $match: { _id: userObjectId } },
      { $lookup: {
          from: 'wallets',
          localField: '_id', 
          foreignField: 'userId',
          as: 'wallets'
        }
      },
      { $limit: 1 }
    ]).toArray();

    if (result.length === 0) return null;

    const userData = result[0];
    
    // Convert ObjectId fields back to strings for interface compatibility
    const user: User = {
      ...userData,
      _id: userData._id.toString()
    };

    const wallets: Wallet[] = userData.wallets.map((wallet: any) => ({
      ...wallet,
      _id: wallet._id.toString(),
      userId: wallet.userId.toString()
    }));

    return { user, wallets };
  }

  // Find user by partyId for private network transfers
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
      console.error(`[Storage] Error finding user by partyId ${partyId}:`, error);
      return null;
    }
  }

  // OPTIMIZED: Single query with populate instead of dual queries + manual merge
  async getTransactionsWithUserData(userId: string) {
    const query = ObjectId.isValid(userId) ? 
      { userId: new ObjectId(userId) } : 
      { userId };

    const transactions = await this.transactions!.aggregate([
      { $match: query },
      { $lookup: { 
          from: 'users', 
          localField: 'userId', 
          foreignField: '_id', 
          as: 'user_info',
          pipeline: [
            { $project: { email: 1, first_name: 1, last_name: 1 } }
          ]
        }
      },
      { $addFields: { user_info: { $arrayElemAt: ['$user_info', 0] } } },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    // Convert ObjectId userId back to string for interface compatibility
    return transactions.map(transaction => ({
      ...transaction,
      userId: transaction.userId.toString()
    }));
  }



  // OPTIMIZED: Single query with populate instead of dual queries + manual merge
  async getGiftingsWithUserInfoPaginated(userId: string, skip: number, limit: number): Promise<{ giftings: any[], total: number }> {
    // Use MongoDB aggregation for optimal performance
    const query = ObjectId.isValid(userId) ? 
      { userId: new ObjectId(userId) } : 
      { userId };

    const [giftings, total] = await Promise.all([
      this.giftings!.aggregate([
        { $match: query },
        { $lookup: { 
            from: 'users', 
            localField: 'userId', 
            foreignField: '_id', 
            as: 'user_info',
            pipeline: [
              { $project: { email: 1, first_name: 1, last_name: 1, country: 1, state: 1 } }
            ]
          }
        },
        { $addFields: { user_info: { $arrayElemAt: ['$user_info', 0] } } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]).toArray(),
      this.giftings!.countDocuments(query)
    ]);

    // Convert ObjectId userId back to string for interface compatibility
    const processedGiftings = giftings.map(gifting => ({
      ...gifting,
      userId: gifting.userId.toString()
    }));

    return { giftings: processedGiftings, total };
  }

  // OPTIMIZED: Single query with populate instead of dual queries + manual merge
  async getRedemptionsWithUserInfoPaginated(userId: string, skip: number, limit: number): Promise<{ redemptions: any[], total: number }> {
    // Use MongoDB aggregation for optimal performance
    const query = ObjectId.isValid(userId) ? 
      { userId: new ObjectId(userId) } : 
      { userId };

    const [redemptions, total] = await Promise.all([
      this.redemptions!.aggregate([
        { $match: query },
        { $lookup: { 
            from: 'users', 
            localField: 'userId', 
            foreignField: '_id', 
            as: 'user_info',
            pipeline: [
              { $project: { email: 1, first_name: 1, last_name: 1, country: 1, state: 1 } }
            ]
          }
        },
        { $addFields: { user_info: { $arrayElemAt: ['$user_info', 0] } } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]).toArray(),
      this.redemptions!.countDocuments(query)
    ]);

    // Convert ObjectId userId back to string for interface compatibility
    const processedRedemptions = redemptions.map(redemption => ({
      ...redemption,
      userId: redemption.userId.toString()
    }));

    return { redemptions: processedRedemptions, total };
  }

  // OPTIMIZED: Single query with lookups instead of 3 separate queries + manual merge
  async getPurchaseHistoryWithDetailsePaginated(userId: string, skip: number, limit: number): Promise<{ purchases: any[], total: number }> {
    // Use MongoDB aggregation for optimal performance with multiple lookups
    const query = ObjectId.isValid(userId) ? 
      { userId: new ObjectId(userId) } : 
      { userId };

    const [purchases, total] = await Promise.all([
      this.purchaseHistory!.aggregate([
        { $match: query },
        { $lookup: { 
            from: 'users', 
            localField: 'userId', 
            foreignField: '_id', 
            as: 'user_info',
            pipeline: [
              { $project: { email: 1, first_name: 1, last_name: 1 } }
            ]
          }
        },
        { $lookup: { 
            from: 'wallets', 
            let: { walletAddr: '$walletAddress', userIdVar: '$userId' },
            pipeline: [
              { $match: { 
                  $expr: { 
                    $and: [
                      { $eq: ['$address', '$$walletAddr'] },
                      { $eq: ['$userId', '$$userIdVar'] }
                    ]
                  }
                }
              },
              { $project: { address: 1, label: 1 } }
            ],
            as: 'wallet_info'
          }
        },
        { $addFields: { 
            user_info: { $arrayElemAt: ['$user_info', 0] },
            wallet_info: { $arrayElemAt: ['$wallet_info', 0] }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]).toArray(),
      this.purchaseHistory!.countDocuments(query)
    ]);

    // Convert ObjectId userId back to string for interface compatibility
    const processedPurchases = purchases.map(purchase => ({
      ...purchase,
      userId: purchase.userId.toString()
    }));

    return { purchases: processedPurchases, total };
  }

  // OPTIMIZED: Single query with populate for blockchain listener
  async getGiftingByTransactionHashWithUserData(transactionHash: string) {
    const giftings = await this.giftings!.aggregate([
      { $match: { transactionHash } },
      { $lookup: { 
          from: 'users', 
          localField: 'userId', 
          foreignField: '_id', 
          as: 'user_info',
          pipeline: [
            { $project: { email: 1, first_name: 1, last_name: 1 } }
          ]
        }
      },
      { $addFields: { user_info: { $arrayElemAt: ['$user_info', 0] } } },
      { $limit: 1 }
    ]).toArray();

    if (giftings.length === 0) return undefined;
    
    const gifting = giftings[0];
    return {
      ...gifting,
      userId: gifting.userId.toString()
    };
  }

  // OPTIMIZED: Single query with populate for blockchain listener
  async getRedemptionByTransactionHashWithUserData(transactionHash: string) {
    const redemptions = await this.redemptions!.aggregate([
      { $match: { transactionHash } },
      { $lookup: { 
          from: 'users', 
          localField: 'userId', 
          foreignField: '_id', 
          as: 'user_info',
          pipeline: [
            { $project: { email: 1, first_name: 1, last_name: 1 } }
          ]
        }
      },
      { $addFields: { user_info: { $arrayElemAt: ['$user_info', 0] } } },
      { $limit: 1 }
    ]).toArray();

    if (redemptions.length === 0) return undefined;
    
    const redemption = redemptions[0];
    return {
      ...redemption,
      userId: redemption.userId.toString()
    };
  }

  // OPTIMIZED: Single aggregation query to get userId and user info by wallet address
  async getUserIdByWalletAddressWithUserData(walletAddress: string) {
    const result = await this.wallets!.aggregate([
      { $match: { address: walletAddress } },
      { $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id', 
          as: 'user_info',
          pipeline: [
            { $project: { email: 1, first_name: 1, last_name: 1 } }
          ]
        }
      },
      { $addFields: { user_info: { $arrayElemAt: ['$user_info', 0] } } },
      { $project: { userId: 1, user_info: 1 } },
      { $limit: 1 }
    ]).toArray();

    if (result.length === 0) return null;

    const walletData = result[0];
    return {
      userId: walletData.userId.toString(),
      user_info: walletData.user_info
    };
  }

  // Add createNotification method
  async createNotification(notification: any): Promise<any> {
    const result = await this.db!.collection('notifications').insertOne({
      ...notification,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      _id: result.insertedId.toString(),
      ...notification
    };
  }

  // Add SystemSettings methods  
  async getSystemSettingByKey(key: string): Promise<SystemSettings | null> {
    const setting = await this.db!.collection('systemsettings').findOne({ key });
    
    if (!setting) return null;
    
    return {
      _id: setting._id.toString(),
      key: setting.key,
      value: setting.value,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy
    } as SystemSettings;
  }

  async getSystemSettingById(id: string): Promise<SystemSettings | null> {
    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!objectId) return null;
    
    const setting = await this.db!.collection('systemsettings').findOne({ _id: objectId });
    
    if (!setting) return null;
    
    return {
      _id: setting._id.toString(),
      key: setting.key,
      value: setting.value,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy
    } as SystemSettings;
  }

  // Transfer Notification methods
  async createTransferNotification(data: {
    transactionHash: string;
    tokenType: 'GOLD' | 'SILVER';
    network: 'Ethereum' | 'Solana';
    fromAddress: string;
    toAddress: string;
    amount: string;
    blockNumber?: number;
    slot?: number;
  }): Promise<ITransferNotification> {
    const notification = new TransferNotification({
      ...data,
      fromAddress: data.fromAddress.toLowerCase(),
      toAddress: data.toAddress.toLowerCase(),
      senderNotified: false,
      recipientNotified: false
    });
    return await notification.save();
  }

  async getTransferNotificationByHash(transactionHash: string): Promise<ITransferNotification | null> {
    return await TransferNotification.findOne({ transactionHash });
  }

  async updateTransferNotification(
    transactionHash: string, 
    updates: { senderNotified?: boolean; recipientNotified?: boolean }
  ): Promise<ITransferNotification | null> {
    return await TransferNotification.findOneAndUpdate(
      { transactionHash },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
  }

  async markSenderNotified(transactionHash: string): Promise<boolean> {
    const result = await TransferNotification.findOneAndUpdate(
      { transactionHash },
      { senderNotified: true, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }

  async markRecipientNotified(transactionHash: string): Promise<boolean> {
    const result = await TransferNotification.findOneAndUpdate(
      { transactionHash },
      { recipientNotified: true, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }

  // Combined transaction history from all sources
  async getCombinedTransactionHistory(userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
  } = {}): Promise<{
    transactions: any[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    this.ensureConnected();
    
    const { page = 1, limit = 20, search, type, dateFrom, dateTo, status } = options;
    const skip = (page - 1) * limit;

    // Support both string and ObjectId userId queries
    const userQuery = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    // Get all transaction data in parallel
    const [purchases, redemptions, giftings] = await Promise.all([
      this.getPurchaseHistoryByUser(userId),
      this.getRedemptionsByUser(userId), 
      this.getGiftingsByUser(userId)
    ]);

    // Transform and combine all transaction data
    let combinedTransactions: any[] = [
      // Purchase history
      ...purchases.map(purchase => ({
        _id: purchase._id,
        type: 'purchase',
        subtype: purchase.paymentMethod,
        metal: purchase.metal,
        amount: purchase.tokenAmount,
        value: purchase.usdAmount,
        status: purchase.status,
        date: purchase.createdAt,
        transactionHash: purchase.transactionHash,
        network: purchase.networkType,
        fee: purchase.feeAmount,
        walletAddress: purchase.walletAddress,
        details: {
          paymentMethod: purchase.paymentMethod,
          currentTokenPrice: purchase.currentTokenPrice
        }
      })),
      // Redemptions
      ...redemptions.map(redemption => ({
        _id: redemption._id,
        type: 'redemption',
        subtype: redemption.network,
        metal: redemption.token?.toLowerCase(),
        amount: redemption.quantity,
        value: redemption.tokenValueUSD,
        status: redemption.status,
        date: redemption.createdAt,
        transactionHash: redemption.transactionHash,
        network: redemption.network?.toLowerCase(),
        fee: redemption.deliveryFee,
        walletAddress: redemption.walletAddress,
        details: {
          deliveryAddress: redemption.deliveryAddress,
          requestId: redemption.requestId,
          completedAt: redemption.completedAt
        }
      })),
      // Gifting
      ...giftings.map(gifting => ({
        _id: gifting._id,
        type: 'gifting',
        subtype: gifting.network,
        metal: gifting.token?.toLowerCase(),
        amount: gifting.quantity,
        value: gifting.tokenValueUSD,
        status: gifting.status,
        date: gifting.createdAt,
        transactionHash: gifting.transactionHash,
        network: gifting.network?.toLowerCase(),
        fee: gifting.networkFee,
        walletAddress: gifting.recipientWallet,
        details: {
          recipientWallet: gifting.recipientWallet,
          message: gifting.message,
          platformFee: gifting.platformFeeUSD
        }
      }))
    ];

    // Apply filters
    if (type && ['purchase', 'redemption', 'gifting'].includes(type)) {
      combinedTransactions = combinedTransactions.filter(tx => tx.type === type);
    }

    if (status) {
      combinedTransactions = combinedTransactions.filter(tx => 
        tx.status === status || 
        (status === 'completed' && (tx.status === 'success' || tx.status === 'completed')) ||
        (status === 'failed' && tx.status === 'failed') ||
        (status === 'pending' && (tx.status === 'pending' || tx.status === 'processing'))
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      combinedTransactions = combinedTransactions.filter(tx => 
        (tx.transactionHash && tx.transactionHash.toLowerCase().includes(searchLower)) ||
        (tx.walletAddress && tx.walletAddress.toLowerCase().includes(searchLower)) ||
        (tx.metal && tx.metal.toLowerCase().includes(searchLower)) ||
        (tx.type && tx.type.toLowerCase().includes(searchLower))
      );
    }

    if (dateFrom || dateTo) {
      combinedTransactions = combinedTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return (!dateFrom || txDate >= dateFrom) && (!dateTo || txDate <= dateTo);
      });
    }

    // Sort by date (newest first)
    combinedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = combinedTransactions.length;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    const paginatedTransactions = combinedTransactions.slice(skip, skip + limit);
    
    return {
      transactions: paginatedTransactions,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}