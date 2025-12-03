import "dotenv/config"
import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic } from "./vite";
import { storagePromise } from "./storage/index.js";
import { errorHandler } from "./middleware/error.middleware";
import { Logger } from "./utils/logger";
import { ENV } from "@shared/constants";
import mongoose from 'mongoose';
import authRoutes from "./routes/auth.routes";
import walletRoutes from "./routes/wallet.routes";
import walletCheckRoutes from "./routes/wallets";
import userRoutes from "./routes/user.routes";
import { blockchainRoutes } from "./routes/blockchain.routes";
import { mintRoutes } from "./routes/mint.routes";
import { transactionRoutes } from "./routes/transaction.routes";
import giftingRoutes from "./routes/gifting";
import redemptionRoutes from "./routes/redemptions";
import { purchaseHistoryRoutes } from "./routes/purchase-history.routes";
import coinGeckoRoutes from "./routes/coingecko.routes";
import goldApiRoutes from "./routes/goldapi.routes";
import { portfolioRoutes } from "./routes/portfolio.routes";
import blockchainDebugRoutes from "./routes/blockchain-debug.routes";
import solanaDebugRoutes from "./routes/solana-debug.routes";
import balanceRoutes from "./routes/balance.routes";
import { blockchainListener } from "./services/blockchain-listener";
import { SolanaBlockchainListener } from "./services/solana-listener";
import contactRoutes from "./routes/contact.routes";
import { tokenRoutes } from "./routes/token.routes";
import kycRoutes from "./routes/kyc.routes";
import damlTransferRoutes from "./routes/daml-transfer.routes";
import cantonQueryRoutes from "./routes/canton-query.routes";
import { connectMongoDB } from "./models/index.js";
// Removed transakRoutes - using MoonPay instead


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      Logger.api(req.method, path, res.statusCode, duration, capturedJsonResponse);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize MongoDB connection for Mongoose models
    await connectMongoDB();
    
    // Initialize storage connection (MongoDB)
    const storage = await storagePromise;
    
    // MongoDB storage initialized successfully
    Logger.info('✅ Using MongoDB storage adapter');
    
    // Initialize and start blockchain listeners
    Logger.info('🔗 Starting blockchain listeners...');
    
    // Start Ethereum blockchain listener
    try {
      await blockchainListener.startListening();
      Logger.info('✅ Ethereum blockchain listener started');
    } catch (error) {
      Logger.error('❌ Failed to start Ethereum blockchain listener:', error);
    }
    
    // // Start Solana blockchain listener with reduced initial sync
    try {
      const solanaListener = new SolanaBlockchainListener();
      await solanaListener.initializePrograms();
      // Start listening without aggressive historic processing to avoid rate limits
      await solanaListener.startListening(false);
      Logger.info('✅ Solana blockchain listener started (real-time mode)');
    } catch (error) {
      Logger.error('❌ Failed to start Solana blockchain listener:', error);
    }
    
    // Register API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/wallets', walletRoutes);
    app.use('/api/wallet-check', walletCheckRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/blockchain', blockchainRoutes);
    app.use('/api/mint', mintRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/transaction-history', (await import('./routes/transaction-history.routes.js')).transactionHistoryRoutes);
    app.use('/api/gifting', giftingRoutes);
    app.use('/api/redemptions', redemptionRoutes);
    app.use('/api/purchase-history', purchaseHistoryRoutes);
    app.use('/api/prices', coinGeckoRoutes);
    app.use('/api/metals', goldApiRoutes);
    app.use('/api/portfolio', portfolioRoutes);
    app.use('/api/blockchain-debug', blockchainDebugRoutes);
    app.use('/api/solana-debug', solanaDebugRoutes);
    app.use('/api/notifications', (await import('./routes/notifications.js')).default);
    app.use('/api/contact', contactRoutes);
    app.use('/api/tokens', tokenRoutes);
    app.use('/api/kyc', kycRoutes);
    app.use('/api/daml', damlTransferRoutes);
    app.use('/api/canton', cantonQueryRoutes);
    app.use('/api/system', (await import('./routes/system.routes.js')).default);
    app.use('/api/moonpay', (await import('./routes/moonpay.routes.js')).default);
    app.use('/api', balanceRoutes);
    

    
    // Global error handling middleware (must be last)
    app.use(errorHandler);

    // Create HTTP server
    const { createServer } = await import("http");
    const server = createServer(app);

    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT.toString() || '3002', 10);
    const serverOptions: any = {
      port,
      host: "0.0.0.0",
    };
     Logger.info(`Express server running on port ${port}`);

    // Only use reusePort on Linux systems
    if (process.platform === 'linux') {
      serverOptions.reusePort = true;
    }

    server.listen(serverOptions, () => {
      Logger.info(`Express server running on port ${port}`);
    });
    
    // Graceful shutdown handlers
    const shutdown = async () => {
      Logger.info('Shutting down gracefully...');
      await storage.disconnect();
      server.close(() => {
        Logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();
