import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { Logger } from "../utils/logger.js";
import mongoose from "mongoose";
import axios from "axios";
import { Redemption } from "../models/Redemption.js";
import { Gifting } from "../models/Gifting.js";
import { PurchaseHistory as Purchase } from "../models/PurchaseHistory.js";
import { Portfolio } from "../models/Portfolio.js";
import { goldApiService } from "server/services/goldapi.service.js";

interface MetalPrices {
  [date: string]: {
    metals: {
      gold: number;
      silver: number;
      platinum?: number;
      palladium?: number;
    };
  };
}

interface Transaction {
  type: "buy" | "sell" | "gift" | "receive"; // Added 'gift' and 'receive' types
  asset: "gold" | "silver";
  tokens: number;
  date: Date;
  status: string;
  source: "purchase" | "redemption" | "gifting";
}

interface PortfolioSnapshot {
  date: string;
  goldUnits: number;
  silverUnits: number;
  goldValue: number;
  silverValue: number;
  totalValue: number;
  change: number;
}

export class PortfolioController {
  /**
   * Helper: fetch prices from metals API
   */
  static async getMetalPrices(
    start: string,
    end: string,
  ): Promise<MetalPrices> {
    try {
      const resp = await axios.get("https://api.metals.dev/v1/timeseries", {
        params: {
          api_key:
            process.env.METALS_API_KEY || "9G47YZ8V6WFU4DC5PGUR102C5PGUR",
          start_date: start,
          end_date: end,
        },
        headers: { Accept: "application/json" },
      });

      if (resp.data.status === "success" && resp.data.rates) {
        Logger.info(`Successfully fetched metal prices from API`);
        return resp.data.rates;
      } else {
        Logger.warn(`API returned unexpected status: ${resp.data.status}`);
        throw new Error(`API returned status: ${resp.data.status}`);
      }
    } catch (error) {
      Logger.error("Failed to fetch metal prices:", error);

      // Return fallback prices for the date range
      const fallbackPrices: MetalPrices = {};
      const startDate = new Date(start);
      const endDate = new Date(end);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const bothPrices = await goldApiService.getBothPrices();

        const dateStr = d.toISOString().split("T")[0];
        fallbackPrices[dateStr] = {
          metals: {
            gold: (bothPrices?.gold?.price_gram_24k * 31.1035),
            silver: (bothPrices?.silver?.price_gram_24k * 31.1035),
            platinum: 950,
            palladium: 900,
          },
        };
      }
      return fallbackPrices;
    }
  }

  /**
   * Helper: Get the closest available price date (prefer earlier dates for historical accuracy)
   */
  static getClosestPriceDate(
    targetDate: Date,
    availableDates: string[],
  ): string {
    const target = targetDate.getTime();

    // Sort dates and find the best match (prefer dates <= target date)
    const sortedDates = availableDates.sort();
    let bestDate = sortedDates[0];

    for (const date of sortedDates) {
      const dateTime = new Date(date).getTime();
      if (dateTime <= target) {
        bestDate = date;
      } else {
        break; // Stop when we find a date after target
      }
    }

    return bestDate;
  }

  /**
   * Helper: Build monthly portfolio snapshots
   */
  static buildMonthlyPortfolio(
    transactions: Transaction[],
    prices: MetalPrices,
  ): PortfolioSnapshot[] {
    if (transactions.length === 0) return [];

    const snapshots: PortfolioSnapshot[] = [];
    const priceDates = Object.keys(prices).sort();

    if (priceDates.length === 0) {
      Logger.warn("No price data available for portfolio calculation");
      return [];
    }

    // Get month boundaries from first transaction to now
    const firstTxnDate = transactions[0].date;
    const today = new Date();
    let currentDate = new Date(
      firstTxnDate.getFullYear(),
      firstTxnDate.getMonth(),
      1,
    );

    while (currentDate <= today) {
      const monthEndDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      const snapshotDate = monthEndDate > today ? today : monthEndDate;

      // Calculate holdings up to this date (only completed/successful transactions)
      let goldUnits = 0;
      let silverUnits = 0;

      for (const txn of transactions) {
        if (txn.date <= snapshotDate) {
          const multiplier = PortfolioController.getTransactionMultiplier(txn);

          if (txn.asset === "gold") {
            goldUnits += txn.tokens * multiplier;
          } else if (txn.asset === "silver") {
            silverUnits += txn.tokens * multiplier;
          }
        }
      }

      // Ensure we don't have negative holdings (data validation)
      goldUnits = Math.max(0, goldUnits);
      silverUnits = Math.max(0, silverUnits);

      // Get closest price data for this snapshot date
      const closestPriceDate = PortfolioController.getClosestPriceDate(
        snapshotDate,
        priceDates,
      );
      const priceData = prices[closestPriceDate];
      console.log("priceData", priceData);
      if (priceData?.metals) {
        const goldPrice = priceData.metals.gold; // Already in grams
        const silverPrice = priceData.metals.silver; // Already in grams
        // metals: {
        //   gold: 3648.58673645,
        //   silver: 41.093944199999996,
        //   platinum: 950,
        //   palladium: 900
        // }
        // }
        // goldUnits 85.300214 7925.63534
        // goldValue---> 100061.160132058 104713.49411207999 3648.58673645

        const goldValue = goldUnits * (((goldPrice / 31.1035) * 10)/1000);
        const silverValue = silverUnits * (((silverPrice / 31.1035) * 10)/1000);
        console.log("goldUnits",goldUnits,silverUnits)
        console.log("goldValue--->", goldValue, silverValue, goldPrice);
        const totalValue = goldValue + silverValue;

        // Calculate change from previous month
        let change = 0;
        if (snapshots.length > 0) {
          const prevValue = snapshots[snapshots.length - 1].totalValue;
          change =
            prevValue > 0 ? ((totalValue - prevValue) / prevValue) * 100 : 0;
        }

        snapshots.push({
          date: snapshotDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          }),
          goldUnits,
          silverUnits,
          goldValue,
          silverValue,
          totalValue,
          change: Math.round(change * 100) / 100,
        });
      }

      // Move to next month
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      );
    }

    return snapshots;
  }

  /**
   * Helper: Build daily portfolio snapshots
   */
  static buildDailyPortfolio(
    transactions: Transaction[],
    prices: MetalPrices,
  ): PortfolioSnapshot[] {
    if (transactions.length === 0) return [];

    const snapshots: PortfolioSnapshot[] = [];
    const priceDates = Object.keys(prices).sort();

    if (priceDates.length === 0) {
      Logger.warn("No price data available for daily portfolio calculation");
      return [];
    }

    // Get daily boundaries from first transaction to now
    const firstTxnDate = transactions[0].date;
    const today = new Date();
    let currentDate = new Date(firstTxnDate);
    
    // Set to start of day
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= today) {
      const snapshotDate = new Date(currentDate);
      // Set to end of day
      snapshotDate.setHours(23, 59, 59, 999);
      
      // Use today if we're at today's date
      const finalSnapshotDate = snapshotDate > today ? today : snapshotDate;

      // Calculate holdings up to this date (only completed/successful transactions)
      let goldUnits = 0;
      let silverUnits = 0;

      for (const txn of transactions) {
        if (txn.date <= finalSnapshotDate) {
          const multiplier = PortfolioController.getTransactionMultiplier(txn);

          if (txn.asset === "gold") {
            goldUnits += txn.tokens * multiplier;
          } else if (txn.asset === "silver") {
            silverUnits += txn.tokens * multiplier;
          }
        }
      }

      // Ensure we don't have negative holdings (data validation)
      goldUnits = Math.max(0, goldUnits);
      silverUnits = Math.max(0, silverUnits);

      // Get closest price data for this snapshot date
      const closestPriceDate = PortfolioController.getClosestPriceDate(
        finalSnapshotDate,
        priceDates,
      );
      const priceData = prices[closestPriceDate];
      
      if (priceData?.metals) {
        const goldPrice = priceData.metals.gold; // Already in grams
        const silverPrice = priceData.metals.silver; // Already in grams

        const goldValue = goldUnits * (((goldPrice / 31.1035) * 10)/1000);
        const silverValue = silverUnits * (((silverPrice / 31.1035) * 10)/1000);
        const totalValue = goldValue + silverValue;

        // Calculate change from previous day
        let change = 0;
        if (snapshots.length > 0) {
          const prevValue = snapshots[snapshots.length - 1].totalValue;
          change =
            prevValue > 0 ? ((totalValue - prevValue) / prevValue) * 100 : 0;
        }

        snapshots.push({
          date: finalSnapshotDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          goldUnits,
          silverUnits,
          goldValue,
          silverValue,
          totalValue,
          change: Math.round(change * 100) / 100,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return snapshots;
  }

  /**
   * Helper: Get transaction multiplier based on type
   * +1 for buying/receiving (adds to portfolio)
   * -1 for selling/gifting (removes from portfolio)
   */
  static getTransactionMultiplier(txn: Transaction): number {
    switch (txn.type) {
      case "buy":
        return 1; // Purchase adds tokens
      case "receive":
        return 1; // Receiving gift adds tokens
      case "sell":
        return -1; // Redemption removes tokens
      case "gift":
        return -1; // Sending gift removes tokens from your portfolio
      default:
        Logger.warn(`Unknown transaction type: ${txn.type}`);
        return 0;
    }
  }

  /**
   * Helper: Check if transaction should be included based on status
   */
  static isTransactionComplete(txn: Transaction): boolean {
    const { status, source } = txn;

    switch (source) {
      case "purchase":
        return status === "completed";
      case "redemption":
        return ["completed", "approved"].includes(status);
      case "gifting":
        return status === "success";
      default:
        return false;
    }
  }

  /**
   * Get user's portfolio with calculated values from transaction history
   */
  static async getPortfolio(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({
          message: "Authentication required",
        });
        return;
      }

      Logger.info(`Fetching portfolio data for user: ${userId}`);

      // Convert userId string to ObjectId for database queries
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Fetch all user transactions
      // For purchases and redemptions: userId is the actor
      const purchases = await Purchase.find({
        userId: userObjectId,
        status: "completed",
      });
      const redemptions = await Redemption.find({
        userId: userObjectId,
        status: { $in: ["completed", "approved"] },
      });
      const gifts = await Gifting.find({
        userId: userObjectId,
        status: "success",
      });

      // const purchases = await Purchase.find({ userId: userObjectId });
      // const redemptions = await Redemption.find({ userId: userObjectId });

      // For gifts: we need both sent and received gifts
      // Sent gifts: where userId matches (user is sender)
      // const sentGifts = await Gifting.find({ userId: userObjectId });

      Logger.info(
        `Found ${purchases.length} purchases, ${redemptions.length} redemptions, ${gifts.length} sent gifts`,
      );

      // Merge all into transaction events
      let transactions: Transaction[] = [];

      // Process Purchases: Adds tokens to portfolio
      purchases.forEach((p: any) => {
        const asset = p.metal?.toLowerCase();
        if (asset === "gold" || asset === "silver") {
          Logger.info(
            `Purchase: ${p.metal}, ${p.tokenAmount} tokens, status: ${p.status}, currentTokenPrice: ${p.currentTokenPrice}, USD: ${p.usdAmount}`,
          );
          transactions.push({
            type: "buy",
            asset: asset as "gold" | "silver",
            tokens: parseFloat(p.tokenAmount) || 0,
            date: new Date(p.createdAt),
            status: p.status,
            source: "purchase",
          });
        }
      });

      // Process Redemptions: Removes tokens from portfolio
      redemptions.forEach((r: any) => {
        const asset = r.token?.toLowerCase();
        if (asset === "gold" || asset === "silver") {
          Logger.info(
            `Redemption: ${r.token}, ${r.quantity} tokens, status: ${r.status}`,
          );
          transactions.push({
            type: "sell",
            asset: asset as "gold" | "silver",
            tokens: parseFloat(r.quantity) || 0,
            date: new Date(r.createdAt),
            status: r.status,
            source: "redemption",
          });
        }
      });

      // Process Gifts: These are gifts SENT by the user (removes from portfolio)
      gifts.forEach((g: any) => {
        const asset = g.token?.toLowerCase();
        if (asset === "gold" || asset === "silver") {
          Logger.info(
            `Sent Gift: ${g.token}, ${g.quantity} tokens, status: ${g.status}`,
          );
          Logger.info(`Gift recipient: ${g.recipientWallet}`);

          transactions.push({
            type: "gift", // User is sending, so this removes tokens
            asset: asset as "gold" | "silver",
            tokens: parseFloat(g.quantity) || 0,
            date: new Date(g.createdAt),
            status: g.status,
            source: "gifting",
          });
        }
      });

      Logger.info(
        `Total transactions before filtering: ${transactions.length}`,
      );

      // Debug: Log all transactions
      transactions.forEach((txn) => {
        Logger.info(
          `Transaction: ${txn.type} ${txn.tokens} ${txn.asset} on ${txn.date.toISOString()} status: ${txn.status}`,
        );
      });

      // Filter only completed transactions
      const completedTransactions = transactions.filter((txn) =>
        PortfolioController.isTransactionComplete(txn),
      );

      Logger.info(
        `Total transactions: ${transactions.length}, Completed: ${completedTransactions.length}`,
      );

      if (completedTransactions.length === 0) {
        Logger.info(
          "No completed transactions found, returning empty portfolio",
        );
        res.status(200).json({
          message: "Portfolio retrieved successfully",
          portfolio: {
            _id: new mongoose.Types.ObjectId(),
            userId,
            totalPortfolioValue: { amount: 0 },
            goldHoldings: { valueUSD: 0, tokens: 0 },
            silverHoldings: { valueUSD: 0, tokens: 0 },
            assetAllocation: { goldPercent: 0, silverPercent: 0 },
            portfolio: [],
            lastUpdated: new Date(),
          },
        });
        return;
      }

      // Sort transactions chronologically (oldest first)
      completedTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Get date range for price history
      const startDate = completedTransactions[0].date
        .toISOString()
        .split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      Logger.info(`Fetching metal prices from ${startDate} to ${endDate}`);

      // Fetch real metal prices
      const prices = await PortfolioController.getMetalPrices(
        startDate,
        endDate,
      );
      Logger.info(`Retrieved ${prices} price data points`, prices);

      // Build monthly portfolio history
      const monthlyPortfolio = PortfolioController.buildMonthlyPortfolio(
        completedTransactions,
        prices,
      );
      Logger.info(`Retrieved monthlyPortfolio ${monthlyPortfolio} `);

      // Build daily portfolio history
      const dailyPortfolio = PortfolioController.buildDailyPortfolio(
        completedTransactions,
        prices,
      );
      Logger.info(`Retrieved dailyPortfolio ${dailyPortfolio.length} snapshots`);

      // Calculate current holdings
      let goldUnits = 0;
      let silverUnits = 0;

      completedTransactions.forEach((t) => {
        const multiplier = PortfolioController.getTransactionMultiplier(t);
        console.log("multiplier", multiplier, t.tokens, t.asset);
        if (t.asset === "gold") {
          goldUnits += t.tokens * multiplier;
        } else if (t.asset === "silver") {
          silverUnits += t.tokens * multiplier;
        }
      });
      console.log("hhhhhh", goldUnits, silverUnits);
      // Ensure non-negative holdings
      goldUnits = Math.max(0, goldUnits);
      silverUnits = Math.max(0, silverUnits);

      // Get latest prices
      const priceDates = Object.keys(prices).sort();
      if (priceDates.length === 0) {
        throw new Error("No price data available");
      }

      const latestPriceDate = priceDates[priceDates.length - 1];
      const latestPrices = prices[latestPriceDate];

      if (!latestPrices?.metals) {
        throw new Error("No current price data available");
      }
      console.log("latestPrices", latestPrices.metals);
      // const { gold: goldPrice, silver: silverPrice } = latestPrices.metals;
      const bothPrices = await goldApiService.getBothPrices();

      Logger.info(`bothPrices`, bothPrices);

      // Current holdings values
      const goldValue =
        goldUnits * (bothPrices?.gold?.price_gram_24k / 100 || 1.7);
      const silverValue =
        silverUnits * (bothPrices?.silver?.price_gram_24k / 100 || 0.01);
      const totalValue = goldValue + silverValue;

      Logger.info(
        `Calculated values: Gold: $${goldValue.toFixed(2)}, Silver: $${silverValue.toFixed(2)}, Total: $${totalValue.toFixed(2)}`,
      );

      // Format monthly portfolio for response (matching your required format)
      const portfolioHistory = monthlyPortfolio.map((snapshot) => ({
        date: snapshot.date,
        value: Math.round(snapshot.totalValue * 100) / 100, // Round to 2 decimal places
        change: snapshot.change,
      }));

      // Format daily portfolio for response (matching your required format)
      const dailyPortfolioHistory = dailyPortfolio.map((snapshot) => ({
        date: snapshot.date,
        value: Math.round(snapshot.totalValue * 100) / 100, // Round to 2 decimal places
        change: snapshot.change,
      }));

      // Prepare portfolio data
      const portfolioData = {
        _id: new mongoose.Types.ObjectId(),
        userId: userObjectId, // Store as ObjectId
        totalPortfolioValue: { amount: +totalValue.toFixed(2) },
        goldHoldings: {
          valueUSD: +goldValue.toFixed(2),
          tokens: +goldUnits.toFixed(2),
        },
        silverHoldings: {
          valueUSD: +silverValue.toFixed(2),
          tokens: +silverUnits.toFixed(2),
        },
        assetAllocation: {
          goldPercent:
            totalValue > 0
              ? Math.round((goldValue / totalValue) * 10000) / 100
              : 0,
          silverPercent:
            totalValue > 0
              ? Math.round((silverValue / totalValue) * 10000) / 100
              : 0,
        },
        portfolio: portfolioHistory,
        dailyPortfolio: dailyPortfolioHistory,
        lastUpdated: new Date(),
      };

      // Save/Update portfolio in database
      try {
        await Portfolio.findOneAndUpdate(
          { userId: userObjectId },
          portfolioData,
          {
            upsert: true, // Insert if not exists, update if exists
            new: true, // Return the updated document
            setDefaultsOnInsert: true,
          },
        );
        Logger.info(`Portfolio data saved/updated for user: ${userId}`);
      } catch (dbError) {
        Logger.error("Failed to save portfolio to database:", dbError);
        // Don't fail the request if DB save fails, just log the error
      }

      // Response format
      res.status(200).json({
        message: "Portfolio retrieved successfully",
        portfolio: portfolioData,
      });
    } catch (error) {
      Logger.error("Get portfolio error:", error);
      res.status(500).json({
        message: "Failed to calculate portfolio",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
