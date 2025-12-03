import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactionHistoryQuery } from '@/queries/transaction-history';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TransactionTableProps {
  userId?: string;
}

export function TransactionTable({ userId }: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch transaction history
  const { data, isLoading, error } = useTransactionHistoryQuery({
    page,
    limit: 10,
    search,
    type: typeFilter,
    status: statusFilter,
    dateFrom,
    dateTo
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">Completed</Badge>;
      case 'pending':
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs">Purchase</Badge>;
      case 'redemption':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs">Redemption</Badge>;
      case 'gifting':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs">Gift</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>;
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch ALL transaction data with current filters (use limit 100 which is max allowed)
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '100'); // Use max allowed limit
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (search) params.append('search', search);

      const response = await apiRequest('GET', `/api/transaction-history?${params.toString()}`);
      const jsonData = await response.json();
      
      if (jsonData && jsonData.success && jsonData.data) {
        let allTransactions = [...jsonData.data];
        const totalPages = jsonData.pagination?.totalPages || 1;
        
        // If there are more pages, fetch them all
        if (totalPages > 1) {
          const fetchPromises = [];
          for (let page = 2; page <= totalPages; page++) {
            const pageParams = new URLSearchParams();
            pageParams.append('page', page.toString());
            pageParams.append('limit', '100');
            if (typeFilter) pageParams.append('type', typeFilter);
            if (statusFilter) pageParams.append('status', statusFilter);
            if (dateFrom) pageParams.append('dateFrom', dateFrom);
            if (dateTo) pageParams.append('dateTo', dateTo);
            if (search) pageParams.append('search', search);
            
            fetchPromises.push(
              apiRequest('GET', `/api/transaction-history?${pageParams.toString()}`)
                .then(res => res.json())
                .then(data => data.data || [])
            );
          }
          
          const additionalPages = await Promise.all(fetchPromises);
          additionalPages.forEach(pageData => {
            allTransactions = [...allTransactions, ...pageData];
          });
        }

        // Prepare CSV data format from ALL transactions
        const csvRows = allTransactions.map((transaction: any) => ({
          Date: format(new Date(transaction.date), 'yyyy-MM-dd HH:mm:ss'),
          Type: transaction.type,
          Metal: transaction.metal || '',
          Amount: parseFloat(transaction.amount || '0').toFixed(2),
          'Value (USD)': parseFloat(transaction.value || '0').toFixed(2),
          Status: transaction.status || '',
          Network: transaction.network || '',
          'Fee (USD)': transaction.fee ? parseFloat(transaction.fee).toFixed(2) : '',
          'Transaction Hash': transaction.transactionHash || '',
          'Wallet Address': transaction.walletAddress || ''
        }));

        setCsvData(csvRows);
        
        // Small delay to ensure state is updated before download
        setTimeout(() => {
          const csvLink = document.getElementById('csv-download-link') as HTMLAnchorElement;
          if (csvLink) {
            csvLink.click();
          }
        }, 100);
        
        toast({
          title: "Export Ready",
          description: `${csvRows.length} transactions exported to CSV`,
        });
      } else {
        throw new Error('Failed to fetch transaction data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load transaction history. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg sm:text-xl font-bold">Transaction History</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              data-testid="button-export-csv"
              className="text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">
                {isExporting ? 'Preparing...' : 'Export '}
              </span>
              CSV
            </Button>
            
            {/* Hidden CSV download link */}
            <CSVLink
              id="csv-download-link"
              data={csvData}
              filename={`transaction-history-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              style={{ display: 'none' }}
              target="_blank"
            />
            {/* JSON Export button - commented out as requested */}
            {/* <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('json')}
              data-testid="button-export-json"
              className="text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export </span>JSON
            </Button> */}
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-transactions"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}>
            <SelectTrigger data-testid="select-type-filter">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="redemption">Redemption</SelectItem>
              <SelectItem value="gifting">Gifting</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            data-testid="input-date-from"
          />
          
          <Input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            data-testid="input-date-to"
          />
        </div>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Date</th>
                    <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Type</th>
                    <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Metal</th>
                    <th className="text-right py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Amount</th>
                    <th className="text-right py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Value</th>
                    <th className="text-center py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Status</th>
                    <th className="text-left py-2 sm:py-3 px-1 sm:px-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden sm:table-cell">Network</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr 
                      key={transaction._id || index}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                      data-testid={`row-transaction-${index}`}
                    >
                      <td className="py-3 sm:py-4 px-1 sm:px-2">
                        <div className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(transaction.date), 'HH:mm')}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-1 sm:px-2">
                        {getTypeBadge(transaction.type)}
                      </td>
                      <td className="py-3 sm:py-4 px-1 sm:px-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {getMetalIcon(transaction.metal)}
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {transaction.metal}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-1 sm:px-2 text-right">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-1 sm:px-2 text-right">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          ${parseFloat(transaction.value).toFixed(2)}
                        </span>
                        {transaction.fee && parseFloat(transaction.fee) > 0 && (
                          <div className="text-xs text-gray-500">
                            Fee: ${parseFloat(transaction.fee).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-1 sm:px-2 text-center">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-3 sm:py-4 px-1 sm:px-2 hidden sm:table-cell">
                        <div className="text-sm text-gray-900 dark:text-white capitalize">
                          {transaction.network}
                        </div>
                        {transaction.transactionHash && (
                          <div className="text-xs text-gray-500 font-mono truncate max-w-32">
                            {transaction.transactionHash}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left order-2 sm:order-1">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, data?.total || 0)} of {data?.total || 0} transactions
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage}
                    data-testid="button-previous-page"
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 px-2">
                    {pagination.page}/{pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                    data-testid="button-next-page"
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}