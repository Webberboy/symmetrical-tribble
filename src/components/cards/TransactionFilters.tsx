import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, DollarSign, Filter, Download, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  status: string;
}

interface TransactionFiltersProps {
  transactions: Transaction[];
  onFilteredTransactions: (filtered: Transaction[]) => void;
}

const TransactionFilters = ({ transactions, onFilteredTransactions }: TransactionFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Apply filters
  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.transaction_date) >= startDate);
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(maxAmount));
    }

    onFilteredTransactions(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setDateRange('all');
    setMinAmount('');
    setMaxAmount('');
    onFilteredTransactions(transactions);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterType !== 'all' || filterStatus !== 'all' || 
                          dateRange !== 'all' || minAmount || maxAmount;

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Merchant', 'Amount', 'Type', 'Status'].join(','),
      ...transactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.merchant_name,
        t.amount.toFixed(2),
        t.transaction_type,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Apply filters when any value changes
  useState(() => {
    applyFilters();
  });

  return (
    <Card className="p-4 bg-white border border-gray-200 shadow-card">
      <div className="space-y-4">
        {/* Top Row: Search and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search merchants..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  applyFilters();
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {[searchTerm, filterType !== 'all', filterStatus !== 'all', dateRange !== 'all', minAmount, maxAmount]
                      .filter(Boolean).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Filter Transactions</h4>

                {/* Type Filter */}
                <div>
                  <Label className="text-xs">Transaction Type</Label>
                  <Select value={filterType} onValueChange={(v) => { setFilterType(v); applyFilters(); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); applyFilters(); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-xs">Date Range</Label>
                  <Select value={dateRange} onValueChange={(v) => { setDateRange(v); applyFilters(); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Range */}
                <div>
                  <Label className="text-xs">Amount Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => { setMinAmount(e.target.value); applyFilters(); }}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => { setMaxAmount(e.target.value); applyFilters(); }}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                Search: {searchTerm}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setSearchTerm(''); applyFilters(); }} />
              </span>
            )}
            {filterType !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                Type: {filterType}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterType('all'); applyFilters(); }} />
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                Status: {filterStatus}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterStatus('all'); applyFilters(); }} />
              </span>
            )}
            {dateRange !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                Date: {dateRange}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setDateRange('all'); applyFilters(); }} />
              </span>
            )}
            {(minAmount || maxAmount) && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                Amount: ${minAmount || '0'} - ${maxAmount || '∞'}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setMinAmount(''); setMaxAmount(''); applyFilters(); }} />
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionFilters;
