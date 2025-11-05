import { supabase } from "@/integrations/supabase/client";

/**
 * Get all loans for the current user
 */
export const getUserLoans = async (userId?: string) => {
  try {
    let query = supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get loans by status
 */
export const getLoansByStatus = async (status: 'active' | 'pending' | 'paid' | 'defaulted', userId?: string) => {
  try {
    let query = supabase
      .from('loans')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new loan (typically done by admin after approving application)
 */
export const createLoan = async (loanData: {
  loan_type: 'personal' | 'home' | 'auto' | 'education';
  original_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  start_date?: string;
  status?: 'active' | 'pending';
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: user.id,
        loan_type: loanData.loan_type,
        original_amount: loanData.original_amount,
        current_balance: loanData.original_amount,
        interest_rate: loanData.interest_rate,
        term_months: loanData.term_months,
        monthly_payment: loanData.monthly_payment,
        start_date: loanData.start_date || new Date().toISOString().split('T')[0],
        status: loanData.status || 'active',
        next_payment_date: getNextPaymentDate(loanData.start_date),
        end_date: calculateEndDate(loanData.start_date, loanData.term_months)
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all loan applications for the current user
 */
export const getLoanApplications = async (userId?: string) => {
  try {
    let query = supabase
      .from('loan_applications')
      .select('*')
      .order('submitted_date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new loan application
 */
export const createLoanApplication = async (applicationData: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('loan_applications')
      .insert({
        user_id: user.id,
        ...applicationData,
        application_status: 'pending',
        submitted_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a loan application
 */
export const updateLoanApplication = async (applicationId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('loan_applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get loan payments for a specific loan or all user loans
 */
export const getLoanPayments = async (loanId?: string, userId?: string) => {
  try {
    let query = supabase
      .from('loan_payments')
      .select('*')
      .order('due_date', { ascending: false });

    if (loanId) {
      query = query.eq('loan_id', loanId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Create a loan payment
 */
export const createLoanPayment = async (paymentData: {
  loan_id: string;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  due_date: string;
  payment_date?: string;
  payment_status?: 'paid' | 'pending' | 'scheduled';
  payment_method?: string;
  payment_account?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('loan_payments')
      .insert({
        user_id: user.id,
        loan_id: paymentData.loan_id,
        payment_amount: paymentData.payment_amount,
        principal_amount: paymentData.principal_amount,
        interest_amount: paymentData.interest_amount,
        due_date: paymentData.due_date,
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        payment_status: paymentData.payment_status || 'paid',
        payment_method: paymentData.payment_method,
        payment_account: paymentData.payment_account
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get loan type configurations
 */
export const getLoanTypesConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('loan_types_config')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get loan statistics for the current user
 */
export const getLoanStatistics = async (userId?: string) => {
  try {
    const loans = await getUserLoans(userId);

    const totalLoanAmount = loans.reduce((sum, loan) => sum + Number(loan.original_amount), 0);
    const totalBalance = loans.reduce((sum, loan) => sum + Number(loan.current_balance), 0);
    const totalMonthlyPayment = loans
      .filter(loan => loan.status === 'active')
      .reduce((sum, loan) => sum + Number(loan.monthly_payment), 0);
    
    const activeLoans = loans.filter(loan => loan.status === 'active').length;
    const paidLoans = loans.filter(loan => loan.status === 'paid').length;
    const pendingLoans = loans.filter(loan => loan.status === 'pending').length;

    return {
      totalLoanAmount,
      totalBalance,
      totalMonthlyPayment,
      activeLoans,
      paidLoans,
      pendingLoans,
      totalLoans: loans.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate loan payment breakdown (principal vs interest)
 */
export const calculatePaymentBreakdown = (
  loanBalance: number,
  monthlyPayment: number,
  annualInterestRate: number
) => {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const interestAmount = loanBalance * monthlyInterestRate;
  const principalAmount = Math.min(monthlyPayment - interestAmount, loanBalance);

  return {
    principal: Math.max(principalAmount, 0),
    interest: interestAmount,
    total: monthlyPayment
  };
};

/**
 * Calculate monthly payment for a loan
 */
export const calculateMonthlyPayment = (
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number => {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  
  if (monthlyInterestRate === 0) {
    return principal / termMonths;
  }

  const monthlyPayment = principal * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) /
    (Math.pow(1 + monthlyInterestRate, termMonths) - 1);

  return Math.round(monthlyPayment * 100) / 100;
};

/**
 * Helper function to calculate next payment date
 */
const getNextPaymentDate = (startDate?: string): string => {
  const start = startDate ? new Date(startDate) : new Date();
  const nextMonth = new Date(start);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString().split('T')[0];
};

/**
 * Helper function to calculate loan end date
 */
const calculateEndDate = (startDate: string | undefined, termMonths: number): string => {
  const start = startDate ? new Date(startDate) : new Date();
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + termMonths);
  return endDate.toISOString().split('T')[0];
};

/**
 * Get loan by ID
 */
export const getLoanById = async (loanId: string) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update loan
 */
export const updateLoan = async (loanId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', loanId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};
