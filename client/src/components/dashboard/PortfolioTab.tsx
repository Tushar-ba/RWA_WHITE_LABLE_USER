import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { usePortfolioQuery } from "@/queries/portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from 'react-i18next';
import { TransactionTable } from '@/components/TransactionTable';

// Animated number component for dramatic value display
type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
};

function AnimatedNumber({
  value,
  prefix = "$",
  duration = 1200,
  className = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else setDisplay(value);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);
  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
}

export function PortfolioTab() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  
  // Use portfolio query with proper error handling
  const portfolioQuery = usePortfolioQuery();
  const portfolioResponse = portfolioQuery.data;
  const isLoading = portfolioQuery.isLoading;
  const error = portfolioQuery.error;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="border-0">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-4" />
                <Skeleton className="h-10 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Failed to load portfolio data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the new API response directly
  const portfolio = portfolioResponse?.portfolio;
  
  if (!portfolio) {
    return (
      <div className="space-y-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <p className="text-gray-600">No portfolio data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate performance metrics from portfolio history
  const portfolioHistory = portfolio.portfolio || [];
  const dailyPortfolioHistory = portfolio.dailyPortfolio || [];
  const currentValue = portfolio.totalPortfolioValue.amount;
  const previousValue = portfolioHistory.length > 1 ? portfolioHistory[portfolioHistory.length - 2].value : currentValue;
  
  // Choose data based on view mode
  const chartData = viewMode === 'monthly' ? portfolioHistory : dailyPortfolioHistory;

  return (
    <div className="space-y-8">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Portfolio Value */}
        <Card 
          className="bg-gradient-to-br from-brand-gold/20 via-background to-brand-brown/10 dark:from-brand-gold/10 dark:via-black dark:to-brand-brown/20 shadow-xl border-0 relative overflow-hidden"
          data-testid="card-total-portfolio"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-brand-brown dark:text-brand-gold tracking-wide uppercase">
                Total Value
              </h3>
              {/* Portfolio History Sparkline */}
            
            </div>
            <div 
              className="text-2xl sm:text-4xl font-extrabold text-brand-brown dark:text-brand-gold mb-2 drop-shadow-gold"
              data-testid="text-total-value"
            >
              <AnimatedNumber value={Math.round(currentValue)} />
            </div>
           
          </CardContent>
        </Card>

        {/* Gold Holdings */}
        <Card 
          className="cursor-pointer hover:shadow-2xl transition-shadow border-0 bg-gradient-to-br from-brand-gold/20 to-brand-brown/10 dark:from-brand-gold/10 dark:to-brand-brown/20 relative overflow-hidden"
          data-testid="card-gold-holdings"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-brand-gold dark:text-brand-gold uppercase tracking-wide">
                Gold Holdings
              </h3>             
          
            </div>
            <div 
              className="text-xl sm:text-3xl font-bold text-brand-gold dark:text-brand-gold mb-2"
              data-testid="text-gold-value"
            >
              <AnimatedNumber value={Math.round(portfolio.goldHoldings.valueUSD)} />
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span 
                className="text-brand-brown dark:text-brand-gold/80"
                data-testid="text-gold-tokens"
              >
                {portfolio.goldHoldings.tokens.toFixed(2)} tokens
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Silver Holdings */}
        <Card 
          className="cursor-pointer hover:shadow-2xl transition-shadow border-0 bg-gradient-to-br from-gray-200/60 to-gray-400/30 dark:from-gray-700/40 dark:to-gray-500/20 relative overflow-hidden"
          data-testid="card-silver-holdings"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Silver Holdings
              </h3>
              {/* Silver Sparkline */}
          
            </div>
            <div 
              className="text-xl sm:text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2"
              data-testid="text-silver-value"
            >
              <AnimatedNumber value={Math.round(portfolio.silverHoldings.valueUSD)} />
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span 
                className="text-gray-600 dark:text-gray-300"
                data-testid="text-silver-tokens"
              >
                {portfolio.silverHoldings.tokens.toFixed(2)} tokens
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Portfolio Performance Chart */}
      <Card className="relative bg-gradient-to-br from-white via-brand-gold/5 to-brand-brown/10 dark:from-black dark:via-brand-gold/10 dark:to-brand-brown/20 border border-brand-gold/40 shadow-2xl overflow-hidden">
        <CardHeader className="relative z-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-6 sm:h-8 bg-gradient-to-b from-brand-gold to-brand-brown rounded-full"></div>
              <CardTitle className="text-lg sm:text-xl font-bold text-brand-brown dark:text-brand-gold tracking-wide">
                Portfolio Performance
              </CardTitle>
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('monthly')}
                className={`text-xs px-3 py-1 h-7 ${
                  viewMode === 'monthly' 
                    ? 'bg-brand-gold text-white hover:bg-brand-gold/90' 
                    : 'text-brand-brown dark:text-brand-gold hover:bg-brand-gold/20'
                }`}
              >
                Monthly
              </Button>
              <Button
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('daily')}
                className={`text-xs px-3 py-1 h-7 ${
                  viewMode === 'daily' 
                    ? 'bg-brand-gold text-white hover:bg-brand-gold/90' 
                    : 'text-brand-brown dark:text-brand-gold hover:bg-brand-gold/20'
                }`}
              >
                Daily
              </Button>
            </div>
          </div>

          {/* Chart summary stats */}
          <div className="flex items-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-brand-brown/70 dark:text-brand-gold/70">
                Current Value:
              </span>
              <span className="font-bold text-brand-brown dark:text-brand-gold">
                ${Math.round(portfolio.totalPortfolioValue.amount).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-0 p-4 sm:p-6">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3c47d" opacity={0.3} />
                <XAxis dataKey="date" stroke="#8F541D" fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis stroke="#8F541D" fontSize={10} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#e3c47d"
                  strokeWidth={2}
                  dot={{ fill: "#e3c47d", strokeWidth: 2, r: 4 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      <div className="max-w-sm sm:max-w-md mx-auto">
        {/* Asset Allocation Chart */}
        <Card className="border border-brand-gold/20 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-bold text-brand-brown dark:text-brand-gold text-center">
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Gold", value: portfolio.assetAllocation.goldPercent, color: "#e3c47d" },
                      { name: "Silver", value: portfolio.assetAllocation.silverPercent, color: "#C0C0C0" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    <Cell fill="#e3c47d" />
                    <Cell fill="#C0C0C0" />
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <TransactionTable />
    </div>
  );
}
