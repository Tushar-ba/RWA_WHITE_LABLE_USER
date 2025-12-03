import { Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { Logger } from '../utils/logger.js';

export class TransactionHistoryController {
  /**
   * Get combined transaction history from all sources (purchases, redemptions, gifting)
   */
  static async getCombinedTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({ 
          success: false,
          message: "Authentication required" 
        });
        return;
      }

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({ 
          success: false,
          message: "Page number must be greater than 0" 
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({ 
          success: false,
          message: "Limit must be between 1 and 100" 
        });
        return;
      }

      const result = await (storage as any).getCombinedTransactionHistory(userId, {
        page,
        limit,
        search,
        type,
        dateFrom,
        dateTo,
        status
      });

      Logger.info(`Combined transaction history fetched for user ${userId} - Page: ${page}, Limit: ${limit}, Total: ${result.total}`);

      res.status(200).json({
        success: true,
        message: "Transaction history retrieved successfully",
        data: result.transactions,
        pagination: result.pagination,
        total: result.total
      });

    } catch (error) {
      Logger.error("Get combined transaction history error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error while retrieving transaction history" 
      });
    }
  }

  /**
   * Export transaction history data
   */
  static async exportTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({ 
          success: false,
          message: "Authentication required" 
        });
        return;
      }

      // Parse query parameters for export
      const format = req.query.format as string || 'csv';
      const type = req.query.type as string;
      const status = req.query.status as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      // Get all data (no pagination for export)
      const result = await (storage as any).getCombinedTransactionHistory(userId, {
        page: 1,
        limit: 10000, // Large limit for export
        type,
        dateFrom,
        dateTo,
        status
      });

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Date', 'Type', 'Metal', 'Amount', 'Value (USD)', 'Status', 
          'Network', 'Fee (USD)', 'Transaction Hash', 'Wallet Address'
        ];
        
        let csv = headers.join(',') + '\n';
        
        result.transactions.forEach(tx => {
          const row = [
            new Date(tx.date).toISOString(),
            tx.type,
            tx.metal || '',
            tx.amount || '',
            tx.value || '',
            tx.status || '',
            tx.network || '',
            tx.fee || '',
            tx.transactionHash || '',
            tx.walletAddress || ''
          ];
          csv += row.map(field => `"${field}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="transaction-history-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        // Return JSON format
        res.json({
          success: true,
          message: "Transaction history exported successfully",
          data: result.transactions,
          exportedAt: new Date().toISOString(),
          total: result.total
        });
      }

      Logger.info(`Transaction history exported for user ${userId} - Format: ${format}, Total: ${result.total}`);

    } catch (error) {
      Logger.error("Export transaction history error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error while exporting transaction history" 
      });
    }
  }
}