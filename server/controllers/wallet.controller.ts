import { Response } from 'express';
import { ValidatedRequest } from '../middleware/validate.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AddWalletData } from '../schemas/wallet.schema';
import { storage } from '../storage/index.js';
import { Logger } from '../utils/logger';

export class WalletController {
  /**
   * Add wallet to separate wallets collection
   */
  static async addWallet(req: ValidatedRequest<AddWalletData> & AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { provider, address, label } = req.validated;
      const userId = req.user?.user_id;

      Logger.info(`Add wallet attempt - User: ${userId}, Address: ${address}, Provider: ${provider}`);

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }

      // REQUIRED: Use findOne instead of separate getUser query  
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      // First check if this user already has this wallet address
      const walletExistsForUser = await storage.checkWalletExists(userId, address);
      Logger.info(`Wallet exists for user ${userId}: ${walletExistsForUser}`);
      
      if (walletExistsForUser) {
        Logger.warn(`Wallet ${address} already exists for user ${userId}`);
        res.status(400).json({ 
          message: "This wallet address is already registered in your account" 
        });
        return;
      }

      // Then check if wallet address already exists globally (across all users)
      const walletExistsGlobally = await storage.checkWalletExistsGlobally(address);
      Logger.info(`Wallet exists globally: ${walletExistsGlobally}`);
      
      if (walletExistsGlobally) {
        // Check if it's actually owned by this user (edge case)
        const walletOwnerId = await storage.getUserIdByWalletAddress(address);
        Logger.info(`Wallet owner ID: ${walletOwnerId}, Current user ID: ${userId}`);
        
        if (walletOwnerId && walletOwnerId !== userId) {
          Logger.warn(`Wallet ${address} is owned by different user ${walletOwnerId}`);
          res.status(400).json({ 
            message: "This wallet address is already registered by another user" 
          });
          return;
        }
      }

      // Create new wallet in separate collection
      const newWallet = await storage.createWallet(userId, address, provider, label);

      Logger.info(`Wallet added successfully for user ${userId}: ${address}`);

      res.status(201).json({
        message: "Wallet added successfully",
        wallet: newWallet
      });

    } catch (error: any) {
      Logger.error("Add wallet error:", error);

      // Handle MongoDB duplicate key error (wallet address already exists)
      if (error.code === 11000 || error.message?.includes('duplicate key')) {
        res.status(400).json({ 
          message: "This wallet address is already registered by another user" 
        });
        return;
      }

      res.status(500).json({ 
        message: "Internal server error while adding wallet" 
      });
    }
  }

  /**
   * Get user's wallets from wallets collection with pagination
   */
  static async getWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }

      // Parse pagination parameters
      const pageParam = req.query.page as string;
      const limitParam = req.query.limit as string;
      
      const page = pageParam ? parseInt(pageParam) : 1;
      const limit = limitParam ? parseInt(limitParam) : 10;

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        res.status(400).json({ 
          message: "Page number must be greater than 0" 
        });
        return;
      }

      const skip = (page - 1) * limit;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({ 
          message: "Limit must be between 1 and 100" 
        });
        return;
      }

      // Get wallets from separate collection
      const allWallets = await storage.getWallets(userId);
      const total = allWallets.length;
      
      // Apply pagination
      const paginatedWallets = allWallets.slice(skip, skip + limit);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      Logger.info(`Wallets fetched successfully for user ${userId} - Page: ${page}, Limit: ${limit}, Total: ${total}`);

      res.status(200).json({
        wallets: paginatedWallets,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      });

    } catch (error) {
      Logger.error("Get wallets error:", error);
      res.status(500).json({ 
        message: "Internal server error while retrieving wallets" 
      });
    }
  }

  /**
   * Update wallet label (primary/secondary logic)
   */
  static async updateWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletId = req.params.id;
      const userId = req.user?.user_id;
      const { label } = req.body;

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }

      if (!walletId) {
        res.status(400).json({ 
          message: "Wallet ID is required" 
        });
        return;
      }

      // Handle primary wallet logic - if setting to primary, update all other wallets to secondary
      if (label === 'primary') {
        const userWallets = await storage.getWallets(userId);
        
        // Update all existing wallets to secondary
        for (const wallet of userWallets) {
          if (wallet._id !== walletId && wallet.label === 'primary') {
            await storage.updateWallet(userId, wallet._id!.toString(), { label: 'secondary' });
          }
        }
      }

      // Update the target wallet
      const updatedWallet = await storage.updateWallet(userId, walletId, { label });

      if (!updatedWallet) {
        res.status(404).json({ 
          message: "Wallet not found" 
        });
        return;
      }

      Logger.info(`Wallet ${walletId} updated successfully for user ${userId} - New label: ${label}`);

      res.status(200).json({
        message: "Wallet updated successfully",
        wallet: updatedWallet
      });

    } catch (error) {
      Logger.error("Update wallet error:", error);
      res.status(500).json({ 
        message: "Internal server error while updating wallet" 
      });
    }
  }

  /**
   * Delete wallet from wallets collection
   */
  static async deleteWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletId = req.params.id;
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }

      if (!walletId) {
        res.status(400).json({ 
          message: "Wallet ID is required" 
        });
        return;
      }

      // Get wallet before deletion to check if it was primary
      const userWallets = await storage.getWallets(userId);
      const walletToDelete = userWallets.find(w => w._id?.toString() === walletId);

      if (!walletToDelete) {
        res.status(404).json({ 
          message: "Wallet not found" 
        });
        return;
      }

      // Delete the wallet
      const deleted = await storage.deleteWallet(userId, walletId);

      if (!deleted) {
        res.status(404).json({ 
          message: "Wallet not found" 
        });
        return;
      }

      // If deleted wallet was primary and there are remaining wallets, make the first one primary
      if (walletToDelete.label === 'primary') {
        const remainingWallets = await storage.getWallets(userId);
        if (remainingWallets.length > 0) {
          await storage.updateWallet(userId, remainingWallets[0]._id!.toString(), { label: 'primary' });
        }
      }

      Logger.info(`Wallet ${walletId} deleted successfully for user ${userId}`);

      res.status(200).json({
        message: "Wallet deleted successfully"
      });

    } catch (error) {
      Logger.error("Delete wallet error:", error);
      res.status(500).json({ 
        message: "Internal server error while deleting wallet" 
      });
    }
  }
}