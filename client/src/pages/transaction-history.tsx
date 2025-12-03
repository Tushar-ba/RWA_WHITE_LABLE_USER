import { HistoryTab } from '@/components/dashboard/HistoryTab';

export default function TransactionHistory() {
  // Mock user data
  const user = {
    name: 'John Doe',
    userType: 'retail' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transaction History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Complete record of your trading activity
          </p>
        </div>

        {/* Transaction History Content */}
        <div className="space-y-6">
          <HistoryTab />
        </div>
      </div>
    </div>
  );
}