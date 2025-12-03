import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function HistoryTab() {
  // Mock transaction data
  const transactions = [
    {
      id: '1',
      date: 'Dec 15, 2023',
      type: 'buy' as const,
      metalType: 'gold' as const,
      amount: 0.05,
      value: 97.50,
      status: 'completed' as const,
    },
    {
      id: '2',
      date: 'Dec 10, 2023',
      type: 'buy' as const,
      metalType: 'silver' as const,
      amount: 2.0,
      value: 49.00,
      status: 'completed' as const,
    },
    {
      id: '3',
      date: 'Dec 5, 2023',
      type: 'sell' as const,
      metalType: 'gold' as const,
      amount: 0.02,
      value: 39.00,
      status: 'pending' as const,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'buy':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Buy</Badge>;
      case 'sell':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">Sell</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getMetalIcon = (metalType: string) => {
    if (metalType === 'gold') {
      return (
        <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
          <span className="text-yellow-600 text-xs font-bold">Au</span>
        </div>
      );
    } else {
      return (
        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">Ag</span>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle>Transaction History</CardTitle>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input type="date" className="text-sm" />
              <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
              <Input type="date" className="text-sm" />
            </div>
            <Button variant="outline" size="sm">
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(tx.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getMetalIcon(tx.metalType)}
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {tx.metalType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tx.amount} oz
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${tx.value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tx.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
