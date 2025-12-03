export interface MarketData {
  gold: {
    price: number;
    change: number;
  };
  silver: {
    price: number;
    change: number;
  };
}

export interface DashboardData {
  portfolio: {
    totalValue: number;
    gold: {
      amount: number;
      value: number;
    };
    silver: {
      amount: number;
      value: number;
    };
    usdcBalance: number;
  };
  recentTransactions: Array<{
    id: string;
    type: 'buy' | 'sell';
    metalType: 'gold' | 'silver';
    amount: number;
    value: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
