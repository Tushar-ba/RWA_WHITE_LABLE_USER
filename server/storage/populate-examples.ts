/**
 * Examples of using findOne() and populate() functions instead of manual queries
 * These methods demonstrate how to use Mongoose populate to fetch related data
 * in a single query instead of making multiple separate database calls.
 */

import mongoose from 'mongoose';

// Example 1: Get user with wallets using populate
export async function getUserWithWalletsExample(userId: string) {
  // Instead of:
  // const user = await User.findById(userId);
  // const wallets = await Wallet.find({ userId });
  
  // Use populate:
  const userWithWallets = await mongoose.models.User
    .findById(userId)
    .populate({
      path: 'wallets', // This would require a virtual field in schema
      select: 'address type label createdAt'
    });
  
  // Or using separate query with populate:
  const user = await mongoose.models.User.findById(userId);
  const wallets = await mongoose.models.Wallet
    .find({ userId })
    .populate('userId', 'email first_name last_name');
    
  return { user, wallets };
}

// Example 2: Get gifting records with user information
export async function getGiftingsWithUserInfo(userId: string) {
  // Instead of:
  // const giftings = await Gifting.find({ userId });
  // const user = await User.findById(userId);
  
  // Use populate:
  const giftings = await mongoose.models.Gifting
    .find({ userId })
    .populate('userId', 'email first_name last_name country state')
    .sort({ createdAt: -1 });
    
  return giftings;
}

// Example 3: Get purchase history with user and wallet details
export async function getPurchaseHistoryWithDetails(userId: string) {
  // Instead of manual queries, use populate:
  const purchases = await mongoose.models.PurchaseHistory
    .find({ userId })
    .populate('userId', 'email first_name last_name')
    .populate('walletAddress') // If this was a reference
    .sort({ createdAt: -1 });
    
  return purchases;
}

// Example 4: Get redemptions with user details
export async function getRedemptionsWithUserDetails(userId: string) {
  const redemptions = await mongoose.models.Redemption
    .find({ userId })
    .populate('userId', 'email first_name last_name country state')
    .sort({ createdAt: -1 });
    
  return redemptions;
}

// Example 5: Get transactions with user information
export async function getTransactionsWithUserInfo(userId: string) {
  const transactions = await mongoose.models.Transaction
    .find({ userId })
    .populate('userId', 'email first_name last_name')
    .sort({ createdAt: -1 });
    
  return transactions;
}