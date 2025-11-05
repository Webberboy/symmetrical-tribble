import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Statement {
  id: string;
  statement_month: number;
  statement_year: number;
  statement_date: string;
  account_id: string;
  account_name?: string;
  account_number?: string;
  opening_balance: number;
  closing_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  transaction_count: number;
  file_size_kb?: number;
}

const Statements = () => {
  const navigate = useNavigate();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      
      // Fetch statements with account info
      const { data: statementsData, error } = await supabase
        .from('account_statements')
        .select(`
          *,
          accounts!inner (
            account_name,
            account_number
          )
        `)
        .eq('user_id', user.id)
        .order('statement_year', { ascending: false })
        .order('statement_month', { ascending: false });

      if (error) {
        throw error;
      }


      // Format the data
      const formattedStatements = statementsData?.map((stmt: any) => ({
        ...stmt,
        account_name: stmt.accounts?.account_name || 'Account',
        account_number: stmt.accounts?.account_number || '****0000',
      })) || [];

      setStatements(formattedStatements);

      // If no statements exist, show info message
      if (formattedStatements.length === 0) {
      }
    } catch (error: any) {
      toast.error('Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const generateInitialStatements = async () => {
    try {
      setGenerating(true);
      toast.info('Generating your account statements...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's accounts with creation date
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, created_at')
        .eq('user_id', user.id);

      if (accountsError) throw accountsError;

      if (!accounts || accounts.length === 0) {
        toast.info('No accounts found. Create an account first.');
        return;
      }

      // Get the oldest account creation date
      const oldestAccount = accounts.reduce((oldest, account) => {
        const accountDate = new Date(account.created_at);
        const oldestDate = new Date(oldest.created_at);
        return accountDate < oldestDate ? account : oldest;
      });

      const accountCreatedDate = new Date(oldestAccount.created_at);
      const today = new Date();
      
      // Only generate statement for the current month if account was created this month
      // Otherwise, generate from account creation month to current month
      const promises = [];
      
      // Start from the month the account was created
      let currentDate = new Date(accountCreatedDate.getFullYear(), accountCreatedDate.getMonth(), 1);
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Generate statements from account creation to current month only
      while (currentDate <= todayMonth) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        promises.push(
          supabase.rpc('generate_monthly_statement', {
            p_user_id: user.id,
            p_year: year,
            p_month: month,
          })
        );

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      await Promise.all(promises);
      
      toast.success('Statements generated successfully!');
      await loadStatements();
    } catch (error: any) {
      toast.error('Failed to generate statements');
    } finally {
      setGenerating(false);
    }
  };

  const handleView = (statement: Statement) => {
    toast.info(`Opening ${getMonthName(statement.statement_month)} ${statement.statement_year} statement`);
    // TODO: Open PDF viewer modal
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
        <Header 
          user={{ firstName: '', lastName: '', email: '' }}
          showBackButton={true}
          title="Account Statements"
          onBackClick={() => navigate('/dashboard')}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statements...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
      <Header 
        user={currentUser ? { 
          firstName: currentUser.user_metadata?.first_name || 'User', 
          lastName: currentUser.user_metadata?.last_name || '', 
          email: currentUser.email || '' 
        } : { firstName: '', lastName: '', email: '' }}
        showBackButton={true}
        title="Account Statements"
        onBackClick={() => navigate('/dashboard')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gray-600 mt-1">View and download your monthly account statements</p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white"
              onClick={generateInitialStatements}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Statements'}
            </Button>
          </div>
        </div>

        {/* Statements List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Available Statements</h2>
          
          {statements.length === 0 ? (
            <Card className="bg-white border-gray-200 p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No statements available yet</p>
              <Button onClick={generateInitialStatements} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Statements'}
              </Button>
            </Card>
          ) : (
            statements.map((statement) => (
              <Card key={statement.id} className="bg-white border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getMonthName(statement.statement_month)} {statement.statement_year} Statement
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-600">{statement.account_name}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-gray-600">{statement.account_number}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-gray-600">{statement.transaction_count} transactions</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-gray-600">
                            {new Date(statement.statement_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-500">
                            Opening: <span className="font-semibold text-gray-700">${statement.opening_balance.toFixed(2)}</span>
                          </span>
                          <span className="text-gray-500">
                            Closing: <span className="font-semibold text-gray-700">${statement.closing_balance.toFixed(2)}</span>
                          </span>
                          <span className="text-green-600">
                            +${statement.total_deposits.toFixed(2)}
                          </span>
                          <span className="text-red-600">
                            -${statement.total_withdrawals.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(statement)}
                        className="bg-white text-gray-900 hover:bg-gray-50 border-gray-300"
                      >
                        <EyeIcon className="h-4 w-4 mr-2 text-gray-700" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Statements;
