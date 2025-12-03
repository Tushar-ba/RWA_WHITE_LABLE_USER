import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { storage } from '../storage/index.js';
import { Logger } from '../utils/logger';

export class TransactionController {
  /**
   * Get user's transaction history
   */
  static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const statusFilter = req.query.status as string;
      const typeFilter = req.query.type as string;
      
      const page = pageParam ? parseInt(pageParam) : 1;
      const limit = limitParam ? parseInt(limitParam) : 20;

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        res.status(400).json({ 
          message: "Page number must be greater than 0" 
        });
        return;
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({ 
          message: "Limit must be between 1 and 100" 
        });
        return;
      }

      // OPTIMIZED: Single query with user population
      let allTransactions = await (storage as any).getTransactionsWithUserData(userId);

      // Apply filters if provided
      if (statusFilter && ['pending', 'completed', 'failed'].includes(statusFilter)) {
        allTransactions = allTransactions.filter((tx: any) => tx.status === statusFilter);
      }

      if (typeFilter && ['buy', 'sell'].includes(typeFilter)) {
        allTransactions = allTransactions.filter((tx: any) => tx.type === typeFilter);
      }

      const total = allTransactions.length;
      const skip = (page - 1) * limit;
      
      // Apply pagination
      const paginatedTransactions = allTransactions.slice(skip, skip + limit);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      Logger.info(`Transactions fetched successfully for user ${userId} - Page: ${page}, Limit: ${limit}, Total: ${total}`);

      res.status(200).json({
        transactions: paginatedTransactions,
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
      Logger.error("Get transactions error:", error);
      res.status(500).json({ 
        message: "Internal server error while retrieving transactions" 
      });
    }
  }

  /**
   * Get single transaction by ID
   */
  static async getTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const transactionId = req.params.id;

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }

      if (!transactionId) {
        res.status(400).json({ 
          message: "Transaction ID is required" 
        });
        return;
      }

      // Get all user transactions and find the specific one
      const transactions = await storage.getTransactions(userId);
      const transaction = transactions.find(tx => tx._id === transactionId);

      if (!transaction) {
        res.status(404).json({ 
          message: "Transaction not found" 
        });
        return;
      }

      Logger.info(`Transaction ${transactionId} fetched successfully for user ${userId}`);

      res.status(200).json({
        message: "Transaction retrieved successfully",
        transaction
      });

    } catch (error) {
      Logger.error("Get transaction error:", error);
      res.status(500).json({ 
        message: "Internal server error while retrieving transaction" 
      });
    }
  }
}