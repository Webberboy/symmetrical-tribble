import { Card } from '@/components/ui/card';
import { Calendar, DollarSign, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  status: string;
}

interface RecurringChargesProps {
  transactions: Transaction[];
}

interface RecurringCharge {
  merchant: string;
  amount: number;
  frequency: string;
  nextDate: string;
  count: number;
  total: number;
}

const RecurringCharges = ({ transactions }: RecurringChargesProps) => {
  // Detect recurring charges
  const detectRecurring = (): RecurringCharge[] => {
    const merchantTransactions: Record<string, Transaction[]> = {};
    
    // Group by merchant
    transactions.forEach(t => {
      if (t.transaction_type === 'purchase' && t.status === 'completed') {
        if (!merchantTransactions[t.merchant_name]) {
          merchantTransactions[t.merchant_name] = [];
        }
        merchantTransactions[t.merchant_name].push(t);
      }
    });

    const recurring: RecurringCharge[] = [];

    // Detect patterns
    Object.entries(merchantTransactions).forEach(([merchant, txns]) => {
      if (txns.length >= 2) {
        // Sort by date
        const sorted = txns.sort((a, b) => 
          new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        );

        // Check if amounts are similar (within 10% variance)
        const avgAmount = sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0) / sorted.length;
        const isSimilarAmount = sorted.every(t => 
          Math.abs(Math.abs(t.amount) - avgAmount) / avgAmount < 0.1
        );

        if (isSimilarAmount && sorted.length >= 2) {
          // Calculate average days between transactions
          let totalDays = 0;
          for (let i = 1; i < sorted.length; i++) {
            const days = Math.abs(
              (new Date(sorted[i].transaction_date).getTime() - 
               new Date(sorted[i-1].transaction_date).getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            totalDays += days;
          }
          const avgDays = totalDays / (sorted.length - 1);

          // Determine frequency
          let frequency = 'Unknown';
          if (avgDays < 10) frequency = 'Weekly';
          else if (avgDays < 35) frequency = 'Monthly';
          else if (avgDays < 100) frequency = 'Quarterly';
          else frequency = 'Yearly';

          // Calculate next date
          const lastDate = new Date(sorted[sorted.length - 1].transaction_date);
          const nextDate = new Date(lastDate.getTime() + avgDays * 24 * 60 * 60 * 1000);

          recurring.push({
            merchant,
            amount: avgAmount,
            frequency,
            nextDate: nextDate.toISOString(),
            count: sorted.length,
            total: sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0)
          });
        }
      }
    });

    return recurring.sort((a, b) => b.amount - a.amount);
  };

  const recurringCharges = detectRecurring();
  const totalMonthlyRecurring = recurringCharges
    .filter(r => r.frequency === 'Monthly')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Recurring Charges
          </h3>
          <p className="text-sm text-gray-600 mt-1">Detected subscription and recurring payments</p>
        </div>
        {totalMonthlyRecurring > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-600">Monthly Total</p>
            <p className="text-2xl font-bold text-gray-900">${totalMonthlyRecurring.toFixed(2)}</p>
          </div>
        )}
      </div>

      {recurringCharges.length > 0 ? (
        <div className="space-y-3">
          {recurringCharges.map((charge, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{charge.merchant}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {charge.frequency}
                    </span>
                    <span>•</span>
                    <span>{charge.count} payments</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">${charge.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">per {charge.frequency.toLowerCase()}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-600">
                    Next charge: {new Date(charge.nextDate).toLocaleDateString()}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    Total paid: ${charge.total.toFixed(2)}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  charge.frequency === 'Monthly' ? 'bg-blue-100 text-blue-700' :
                  charge.frequency === 'Weekly' ? 'bg-green-100 text-green-700' :
                  charge.frequency === 'Quarterly' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {charge.frequency}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Recurring Charges Detected</h4>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            We haven't detected any recurring payments yet. Recurring charges will appear here after multiple similar transactions are made.
          </p>
        </div>
      )}
    </Card>
  );
};

export default RecurringCharges;
