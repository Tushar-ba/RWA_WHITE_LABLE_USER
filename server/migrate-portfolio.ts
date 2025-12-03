import { MongoClient } from 'mongodb';

interface Portfolio {
  userId: string;
  totalPortfolioValue: {
    amount: number;
    changePercent: number;
    comparisonPeriod: string;
  };
  goldHoldings: {
    valueUSD: number;
    tokens: number;
    amountSpentUSD: number;
  };
  silverHoldings: {
    valueUSD: number;
    tokens: number;
    amountSpentUSD: number;
  };
  portfolioPerformance: {
    currentValue: number;
    monthlyChangeUSD: number;
    ytdChangePercent: number;
    monthlyChangePercent: number;
    bestMonth: {
      month: string;
      changePercent: number;
    };
  };
  assetAllocation: {
    goldPercent: number;
    silverPercent: number;
  };
  priceTrends: {
    period: string;
    goldPrices: Array<{ date: Date; price: number }>;
    silverPrices: Array<{ date: Date; price: number }>;
  };
  performanceTrendLabel: string;
  lastUpdated: Date;
}

const DATABASE_URL = process.env.MONGODB_URI!;

async function migratePortfolios() {
  const client = new MongoClient(DATABASE_URL);
  await client.connect();
  
  const db = client.db('vaulted_assets');
  const portfolioCollection = db.collection('portfolios');
  
  console.log('🔄 Starting portfolio schema migration...');
  
  // Find all portfolios with old schema
  const oldPortfolios = await portfolioCollection.find({
    goldAmount: { $exists: true } // Old schema indicator
  }).toArray();
  
  console.log(`📊 Found ${oldPortfolios.length} portfolios to migrate`);
  
  for (const oldPortfolio of oldPortfolios) {
    console.log(`🔄 Migrating portfolio for user ${oldPortfolio.userId}`);
    
    // Convert old schema to new schema
    const goldTokens = parseFloat(oldPortfolio.goldAmount || '0');
    const silverTokens = parseFloat(oldPortfolio.silverAmount || '0');
    const goldUsdSpent = parseFloat(oldPortfolio.goldUsdSpent || '0');
    const silverUsdSpent = parseFloat(oldPortfolio.silverUsdSpent || '0');
    const totalUsdSpent = parseFloat(oldPortfolio.totalUsdSpent || '0');
    
    // Calculate current values using default prices
    const goldPrice = 2757.54;
    const silverPrice = 30.89;
    const goldValueUsd = goldTokens * goldPrice;
    const silverValueUsd = silverTokens * silverPrice;
    const totalCurrentValue = goldValueUsd + silverValueUsd;
    
    // Calculate performance metrics
    const changeUsd = totalCurrentValue - totalUsdSpent;
    const changePercent = totalUsdSpent > 0 ? (changeUsd / totalUsdSpent) * 100 : 0;
    
    // Create new portfolio structure
    const newPortfolio: Portfolio = {
      userId: oldPortfolio.userId,
      totalPortfolioValue: {
        amount: totalCurrentValue,
        changePercent: changePercent,
        comparisonPeriod: 'last month'
      },
      goldHoldings: {
        valueUSD: goldValueUsd,
        tokens: goldTokens,
        amountSpentUSD: goldUsdSpent
      },
      silverHoldings: {
        valueUSD: silverValueUsd,
        tokens: silverTokens,
        amountSpentUSD: silverUsdSpent
      },
      portfolioPerformance: {
        currentValue: totalCurrentValue,
        monthlyChangeUSD: changeUsd,
        ytdChangePercent: changePercent,
        monthlyChangePercent: changePercent,
        bestMonth: {
          month: changePercent > 0 ? 'Current' : '',
          changePercent: Math.max(0, changePercent)
        }
      },
      assetAllocation: {
        goldPercent: totalCurrentValue > 0 ? (goldValueUsd / totalCurrentValue) * 100 : 0,
        silverPercent: totalCurrentValue > 0 ? (silverValueUsd / totalCurrentValue) * 100 : 0
      },
      priceTrends: {
        period: '1M',
        goldPrices: [],
        silverPrices: []
      },
      performanceTrendLabel: changePercent > 10 ? 'Strong Performance Trend' : 
                            changePercent > 0 ? 'Positive Performance Trend' : 
                            'Building Portfolio',
      lastUpdated: new Date()
    };
    
    // Replace old portfolio with new structure
    await portfolioCollection.replaceOne(
      { _id: oldPortfolio._id },
      newPortfolio
    );
    
    console.log(`✅ Migrated portfolio for user ${oldPortfolio.userId}`);
  }
  
  console.log('🎉 Portfolio migration completed!');
  await client.close();
}

migratePortfolios().catch(console.error);