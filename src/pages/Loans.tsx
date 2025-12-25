import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Calendar, Percent, FileText, Plus, CreditCard, Home, Car, GraduationCap, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { toast } from 'sonner';
import { 
  getUserLoans, 
  createLoanApplication, 
  getLoanTypesConfig,
  getLoanStatistics,
  getLoanApplications
} from '@/lib/loansUtils';
import { supabase } from '@/integrations/supabase/client';

interface Loan {
  id: string;
  type: 'personal' | 'home' | 'auto' | 'education';
  amount: number;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  status: 'active' | 'pending' | 'paid';
  term: number; // in months
}

interface LoanApplication {
  type: 'personal' | 'home' | 'auto' | 'education';
  amount: string;
  purpose: string;
  income: string;
  employment: string;
  termMonths: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  // Personal loan specific
  creditScore?: string;
  monthlyExpenses?: string;
  // Home loan specific
  propertyValue?: string;
  downPayment?: string;
  propertyType?: string;
  propertyAddress?: string;
  // Auto loan specific
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePrice?: string;
  tradeInValue?: string;
  // Education loan specific
  schoolName?: string;
  program?: string;
  graduationDate?: string;
  tuitionCost?: string;
}

const Loans = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'history'>('overview');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState<'personal' | 'home' | 'auto' | 'education'>('personal');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLoanPopup, setShowLoanPopup] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({
    totalLoanAmount: 0,
    totalBalance: 0,
    totalMonthlyPayment: 0
  });
  const [application, setApplication] = useState<LoanApplication>({
    type: 'personal',
    amount: '',
    purpose: '',
    income: '',
    employment: '',
    termMonths: '',
    termsAccepted: false,
    privacyPolicyAccepted: false,
    creditScore: '',
    monthlyExpenses: '',
    propertyValue: '',
    downPayment: '',
    propertyType: '',
    propertyAddress: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehiclePrice: '',
    tradeInValue: '',
    schoolName: '',
    program: '',
    graduationDate: '',
    tuitionCost: ''
  });
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchLoansData();
    fetchLoanApplications();
    fetchLoanTypesConfig();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: user.email
        });
      }
    } catch (error) {
    }
  };

  const fetchLoansData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [loansData, stats] = await Promise.all([
        getUserLoans(user.id),
        getLoanStatistics(user.id)
      ]);

      setLoans(loansData || []);
      setStatistics(stats || {
        totalLoanAmount: 0,
        totalBalance: 0,
        totalMonthlyPayment: 0
      });
    } catch (error) {
      toast.error('Failed to load loans data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const applications = await getLoanApplications(user.id);
      setLoanApplications(applications || []);
    } catch (error) {
    }
  };

  const fetchLoanTypesConfig = async () => {
    try {
      const configs = await getLoanTypesConfig();
      
      // Transform to match UI format
      const transformedTypes = configs.map((config: any) => ({
        id: config.loan_type,
        title: config.display_name,
        icon: getIconComponent(config.icon_name),
        description: config.description,
        rate: `${config.min_interest_rate}% - ${config.max_interest_rate}%`,
        maxAmount: `$${config.max_amount.toLocaleString()}`
      }));
      
      setLoanTypes(transformedTypes);
    } catch (error) {
      // Fallback to default if fetch fails
      setLoanTypes(getDefaultLoanTypes());
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'Car': return Car;
      case 'GraduationCap': return GraduationCap;
      case 'CreditCard': return CreditCard;
      default: return CreditCard;
    }
  };

  const getDefaultLoanTypes = () => [
    {
      id: 'personal',
      title: 'Personal Loan',
      icon: CreditCard,
      description: 'Flexible financing for personal needs',
      rate: '8.99% - 15.99%',
      maxAmount: '$50,000'
    },
    {
      id: 'home',
      title: 'Home Loan',
      icon: Home,
      description: 'Competitive rates for home purchases',
      rate: '3.25% - 4.75%',
      maxAmount: '$1,000,000'
    },
    {
      id: 'auto',
      title: 'Auto Loan',
      icon: Car,
      description: 'Finance your dream vehicle',
      rate: '3.99% - 6.99%',
      maxAmount: '$100,000'
    },
    {
      id: 'education',
      title: 'Education Loan',
      icon: GraduationCap,
      description: 'Invest in your future education',
      rate: '4.50% - 7.50%',
      maxAmount: '$200,000'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLoanIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'auto': return Car;
      case 'education': return GraduationCap;
      default: return CreditCard;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation for all loan types
    if (!application.amount || parseFloat(application.amount) <= 0) {
      newErrors.amount = 'Please enter a valid loan amount';
    }
    if (!application.purpose.trim()) {
      newErrors.purpose = 'Please specify the purpose of the loan';
    }
    if (!application.income || parseFloat(application.income) <= 0) {
      newErrors.income = 'Please enter a valid annual income';
    }
    if (!application.employment) {
      newErrors.employment = 'Please select your employment status';
    }
    if (!application.termMonths || parseInt(application.termMonths) <= 0) {
      newErrors.termMonths = 'Please enter a valid loan term in months';
    }
    if (!application.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    if (!application.privacyPolicyAccepted) {
      newErrors.privacyPolicyAccepted = 'You must accept the privacy policy';
    }

    // Loan type specific validation
    if (application.type === 'home') {
      if (!application.propertyValue || parseFloat(application.propertyValue) <= 0) {
        newErrors.propertyValue = 'Please enter a valid property value';
      }
      if (!application.downPayment || parseFloat(application.downPayment) <= 0) {
        newErrors.downPayment = 'Please enter a valid down payment amount';
      }
      if (!application.propertyType) {
        newErrors.propertyType = 'Please select a property type';
      }
      if (!application.propertyAddress?.trim()) {
        newErrors.propertyAddress = 'Please enter the property address';
      }
      // Validate down payment is not more than property value
      if (application.propertyValue && application.downPayment) {
        const propertyVal = parseFloat(application.propertyValue);
        const downPaymentVal = parseFloat(application.downPayment);
        if (downPaymentVal > propertyVal) {
          newErrors.downPayment = 'Down payment cannot exceed property value';
        }
      }
    }

    if (application.type === 'auto') {
      if (!application.vehicleYear || parseInt(application.vehicleYear) < 1900 || parseInt(application.vehicleYear) > new Date().getFullYear() + 1) {
        newErrors.vehicleYear = 'Please enter a valid vehicle year';
      }
      if (!application.vehicleMake?.trim()) {
        newErrors.vehicleMake = 'Please enter the vehicle make';
      }
      if (!application.vehicleModel?.trim()) {
        newErrors.vehicleModel = 'Please enter the vehicle model';
      }
      if (!application.vehiclePrice || parseFloat(application.vehiclePrice) <= 0) {
        newErrors.vehiclePrice = 'Please enter a valid vehicle price';
      }
    }

    if (application.type === 'education') {
      if (!application.schoolName?.trim()) {
        newErrors.schoolName = 'Please enter the school name';
      }
      if (!application.program?.trim()) {
        newErrors.program = 'Please enter the program or degree';
      }
      if (!application.graduationDate) {
        newErrors.graduationDate = 'Please select expected graduation date';
      }
      if (!application.tuitionCost || parseFloat(application.tuitionCost) <= 0) {
        newErrors.tuitionCost = 'Please enter a valid tuition cost';
      }
    }

    if (application.type === 'personal') {
      if (!application.monthlyExpenses || parseFloat(application.monthlyExpenses) <= 0) {
        newErrors.monthlyExpenses = 'Please enter your monthly expenses';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplicationSubmit = async () => {
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }


    try {
      setSubmitting(true);
      setErrors({});

      // Prepare application data for database
      const annualIncome = parseFloat(application.income);
      const applicationData: any = {
        loan_type: application.type,
        requested_amount: parseFloat(application.amount),
        requested_term_months: parseInt(application.termMonths),
        purpose: application.purpose,
        annual_income: annualIncome,
        monthly_income: annualIncome / 12, // Calculate monthly income from annual income
        employment_status: application.employment,
        terms_accepted: application.termsAccepted,
        privacy_policy_accepted: application.privacyPolicyAccepted
      };
      

      // Add type-specific fields
      if (application.type === 'personal') {
        if (application.creditScore) {
          const creditScore = parseInt(application.creditScore);
          // Validate credit score range (300-850)
          if (creditScore >= 300 && creditScore <= 850) {
            applicationData.credit_score = creditScore;
          } else {
            throw new Error('Credit score must be between 300 and 850');
          }
        }
        if (application.monthlyExpenses) applicationData.monthly_expenses = parseFloat(application.monthlyExpenses);
      }

      if (application.type === 'home') {
        if (application.propertyValue) applicationData.property_value = parseFloat(application.propertyValue);
        if (application.downPayment) applicationData.down_payment = parseFloat(application.downPayment);
        if (application.propertyType) applicationData.property_type = application.propertyType;
        if (application.propertyAddress) applicationData.property_address = application.propertyAddress;
      }

      if (application.type === 'auto') {
        if (application.vehicleYear) applicationData.vehicle_year = parseInt(application.vehicleYear);
        if (application.vehicleMake) applicationData.vehicle_make = application.vehicleMake;
        if (application.vehicleModel) applicationData.vehicle_model = application.vehicleModel;
        if (application.vehiclePrice) applicationData.vehicle_price = parseFloat(application.vehiclePrice);
        if (application.tradeInValue) applicationData.trade_in_value = parseFloat(application.tradeInValue);
      }

      if (application.type === 'education') {
        if (application.schoolName) applicationData.school_name = application.schoolName;
        if (application.program) applicationData.program = application.program;
        if (application.graduationDate) applicationData.graduation_date = application.graduationDate;
        if (application.tuitionCost) applicationData.tuition_cost = parseFloat(application.tuitionCost);
      }

      // Submit application
      await createLoanApplication(applicationData);

      toast.success(`${application.type.charAt(0).toUpperCase() + application.type.slice(1)} loan application submitted successfully! We'll review it and get back to you.`);
      
      // Reset form
      setApplication({
        type: 'personal',
        amount: '',
        purpose: '',
        income: '',
        employment: '',
        termMonths: '',
        termsAccepted: false,
        privacyPolicyAccepted: false,
        creditScore: '',
        monthlyExpenses: '',
        propertyValue: '',
        downPayment: '',
        propertyType: '',
        propertyAddress: '',
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
        vehiclePrice: '',
        tradeInValue: '',
        schoolName: '',
        program: '',
        graduationDate: '',
        tuitionCost: ''
      });
      setShowApplicationForm(false);
      
      // Optionally refresh loans data
      await fetchLoansData();
      await fetchLoanApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit loan application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderOverview = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Loan Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(statistics.totalLoanAmount || 0)}
            </p>
          </div>
        </Card>
        <Card className="p-4 border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(statistics.totalBalance || 0)}
            </p>
          </div>
        </Card>
        <Card className="p-4 border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(statistics.totalMonthlyPayment || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Active Loans and Approved Applications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Loans</h3>
        {loans.length === 0 && loanApplications.filter(app => app.application_status === 'approved').length === 0 ? (
          <Card className="p-8 text-center bg-white border-gray-200">
            <div className="text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No loans yet</p>
              <p className="text-sm text-gray-600">
                Apply for a loan to get started with your financial goals.
              </p>
              <Button 
                onClick={() => setShowLoanPopup(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Apply for a Loan
              </Button>
            </div>
          </Card>
        ) : (
        <div className="space-y-4">
          {/* Display active loans first */}
          {loans.map((loan) => {
            const IconComponent = getLoanIcon(loan.loan_type);
            return (
              <Card key={loan.id} className="p-4 border-gray-200 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">{loan.loan_type} Loan</h4>
                      <p className="text-sm text-gray-600">
                        {loan.interest_rate}% APR • {loan.term_months} months
                      </p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(loan.current_balance)}
                    </p>
                    <p className="text-sm text-gray-600">Balance</p>
                    {loan.status === 'active' && loan.next_payment_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        Next: {formatDate(loan.next_payment_date)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* Display approved loan applications that haven't been activated yet */}
          {loanApplications
            .filter(app => app.application_status === 'approved')
            .map((application) => {
              const IconComponent = getLoanIcon(application.loan_type);
              return (
                <Card key={`app-${application.id}`} className="p-4 border-green-200 bg-green-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{application.loan_type} Loan</h4>
                        <p className="text-sm text-gray-600">
                          Application Approved - Pending Activation
                        </p>
                        <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(application.requested_amount)}
                      </p>
                      <p className="text-sm text-gray-600">Requested Amount</p>
                      <p className="text-sm text-green-600 mt-1">
                        Finalizing your loan...
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
        )}
      </div>
        </>
      )}
    </div>
  );

  const renderLoanApplication = () => (
    <div className="max-w-2xl mx-auto">
      {!showApplicationForm ? (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for a Loan</h2>
            <p className="text-gray-600">Choose the loan type that best fits your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loanTypes.map((loanType) => {
              const IconComponent = loanType.icon;
              return (
                <Card 
                  key={loanType.id}
                  className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md bg-white ${
                    selectedLoanType === loanType.id 
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLoanType(loanType.id as any)}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{loanType.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{loanType.description}</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">Rate: {loanType.rate}</p>
                      <p className="text-sm text-gray-600">Up to {loanType.maxAmount}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button 
              onClick={() => {
                setApplication({ ...application, type: selectedLoanType });
                setShowApplicationForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              Continue Application
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loan Application</h2>
            <p className="text-gray-600 capitalize">{application.type} Loan Application</p>
          </div>

          <Card className="p-6 border-gray-200 bg-white">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter loan amount"
                    value={application.amount}
                    onChange={(e) => setApplication({ ...application, amount: e.target.value })}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose of Loan
                </label>
                <textarea
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                    errors.purpose ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Describe the purpose of your loan"
                  value={application.purpose}
                  onChange={(e) => setApplication({ ...application, purpose: e.target.value })}
                />
                {errors.purpose && (
                  <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Income
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                      errors.income ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your annual income"
                    value={application.income}
                    onChange={(e) => setApplication({ ...application, income: e.target.value })}
                  />
                </div>
                {errors.income && (
                  <p className="text-red-500 text-sm mt-1">{errors.income}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Status
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                    errors.employment ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={application.employment}
                  onChange={(e) => setApplication({ ...application, employment: e.target.value })}
                >
                  <option value="" className="bg-white text-gray-900">Select employment status</option>
                  <option value="full-time" className="bg-white text-gray-900">Full-time Employee</option>
                  <option value="part-time" className="bg-white text-gray-900">Part-time Employee</option>
                  <option value="self-employed" className="bg-white text-gray-900">Self-employed</option>
                  <option value="unemployed" className="bg-white text-gray-900">Unemployed</option>
                  <option value="retired" className="bg-white text-gray-900">Retired</option>
                  <option value="student" className="bg-white text-gray-900">Student</option>
                </select>
                {errors.employment && (
                  <p className="text-red-500 text-sm mt-1">{errors.employment}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term (Months) <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                    errors.termMonths ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={application.termMonths}
                  onChange={(e) => setApplication({ ...application, termMonths: e.target.value })}
                >
                  <option value="" className="bg-white text-gray-900">Select loan term</option>
                  <option value="12" className="bg-white text-gray-900">12 months (1 year)</option>
                  <option value="24" className="bg-white text-gray-900">24 months (2 years)</option>
                  <option value="36" className="bg-white text-gray-900">36 months (3 years)</option>
                  <option value="48" className="bg-white text-gray-900">48 months (4 years)</option>
                  <option value="60" className="bg-white text-gray-900">60 months (5 years)</option>
                  <option value="72" className="bg-white text-gray-900">72 months (6 years)</option>
                  <option value="84" className="bg-white text-gray-900">84 months (7 years)</option>
                  <option value="120" className="bg-white text-gray-900">120 months (10 years)</option>
                  <option value="180" className="bg-white text-gray-900">180 months (15 years)</option>
                  <option value="240" className="bg-white text-gray-900">240 months (20 years)</option>
                  <option value="360" className="bg-white text-gray-900">360 months (30 years)</option>
                </select>
                {errors.termMonths && (
                  <p className="text-red-500 text-sm mt-1">{errors.termMonths}</p>
                )}
              </div>

              {/* Personal Loan specific fields */}
              {application.type === 'personal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Score (optional)
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="850"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="Enter your credit score (300-850)"
                      value={application.creditScore}
                      onChange={(e) => setApplication({ ...application, creditScore: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Valid range: 300 - 850</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Expenses <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                          errors.monthlyExpenses ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your monthly expenses"
                        value={application.monthlyExpenses}
                        onChange={(e) => setApplication({ ...application, monthlyExpenses: e.target.value })}
                      />
                    </div>
                    {errors.monthlyExpenses && (
                      <p className="text-red-500 text-sm mt-1">{errors.monthlyExpenses}</p>
                    )}
                  </div>

                  {/* Terms and Privacy Policy Checkboxes */}
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                          errors.termsAccepted ? 'border-red-500' : ''
                        }`}
                        checked={application.termsAccepted}
                        onChange={(e) => setApplication({ ...application, termsAccepted: e.target.checked })}
                      />
                      <label htmlFor="termsAccepted" className="ml-3 text-sm text-gray-700">
                        I accept the <a href="#" className="text-blue-600 hover:text-blue-800 underline">terms and conditions</a> <span className="text-red-500">*</span>
                      </label>
                    </div>
                    {errors.termsAccepted && (
                      <p className="text-red-500 text-sm">{errors.termsAccepted}</p>
                    )}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="privacyPolicyAccepted"
                        className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                          errors.privacyPolicyAccepted ? 'border-red-500' : ''
                        }`}
                        checked={application.privacyPolicyAccepted}
                        onChange={(e) => setApplication({ ...application, privacyPolicyAccepted: e.target.checked })}
                      />
                      <label htmlFor="privacyPolicyAccepted" className="ml-3 text-sm text-gray-700">
                        I accept the <a href="#" className="text-blue-600 hover:text-blue-800 underline">privacy policy</a> <span className="text-red-500">*</span>
                      </label>
                    </div>
                    {errors.privacyPolicyAccepted && (
                      <p className="text-red-500 text-sm">{errors.privacyPolicyAccepted}</p>
                    )}
                  </div>
                </>
              )}

              {/* Home Loan specific fields */}
              {application.type === 'home' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Value <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                          errors.propertyValue ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter property value"
                        value={application.propertyValue}
                        onChange={(e) => setApplication({ ...application, propertyValue: e.target.value })}
                      />
                    </div>
                    {errors.propertyValue && (
                      <p className="text-red-500 text-sm mt-1">{errors.propertyValue}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Down Payment <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                          errors.downPayment ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter down payment amount"
                        value={application.downPayment}
                        onChange={(e) => setApplication({ ...application, downPayment: e.target.value })}
                      />
                    </div>
                    {errors.downPayment && (
                      <p className="text-red-500 text-sm mt-1">{errors.downPayment}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                        errors.propertyType ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={application.propertyType}
                      onChange={(e) => setApplication({ ...application, propertyType: e.target.value })}
                    >
                      <option value="" className="bg-white text-gray-900">Select property type</option>
                      <option value="single-family" className="bg-white text-gray-900">Single Family Home</option>
                      <option value="condo" className="bg-white text-gray-900">Condominium</option>
                      <option value="townhouse" className="bg-white text-gray-900">Townhouse</option>
                      <option value="multi-family" className="bg-white text-gray-900">Multi-family</option>
                    </select>
                    {errors.propertyType && (
                      <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.propertyAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter property address"
                      value={application.propertyAddress}
                      onChange={(e) => setApplication({ ...application, propertyAddress: e.target.value })}
                    />
                    {errors.propertyAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.propertyAddress}</p>
                    )}
                  </div>
                </>
              )}

              {/* Auto Loan specific fields */}
              {application.type === 'auto' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.vehicleYear ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. 2024"
                      value={application.vehicleYear}
                      onChange={(e) => setApplication({ ...application, vehicleYear: e.target.value })}
                    />
                    {errors.vehicleYear && (
                      <p className="text-red-500 text-sm mt-1">{errors.vehicleYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Make <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.vehicleMake ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. Toyota, Honda, Ford"
                      value={application.vehicleMake}
                      onChange={(e) => setApplication({ ...application, vehicleMake: e.target.value })}
                    />
                    {errors.vehicleMake && (
                      <p className="text-red-500 text-sm mt-1">{errors.vehicleMake}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.vehicleModel ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. Camry, Accord, F-150"
                      value={application.vehicleModel}
                      onChange={(e) => setApplication({ ...application, vehicleModel: e.target.value })}
                    />
                    {errors.vehicleModel && (
                      <p className="text-red-500 text-sm mt-1">{errors.vehicleModel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                          errors.vehiclePrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter vehicle price"
                        value={application.vehiclePrice}
                        onChange={(e) => setApplication({ ...application, vehiclePrice: e.target.value })}
                      />
                    </div>
                    {errors.vehiclePrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.vehiclePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trade-in Value (optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                        placeholder="Enter trade-in value if applicable"
                        value={application.tradeInValue}
                        onChange={(e) => setApplication({ ...application, tradeInValue: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Education Loan specific fields */}
              {application.type === 'education' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.schoolName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter school or university name"
                      value={application.schoolName}
                      onChange={(e) => setApplication({ ...application, schoolName: e.target.value })}
                    />
                    {errors.schoolName && (
                      <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program/Degree <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.program ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. Bachelor of Science in Computer Science"
                      value={application.program}
                      onChange={(e) => setApplication({ ...application, program: e.target.value })}
                    />
                    {errors.program && (
                      <p className="text-red-500 text-sm mt-1">{errors.program}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Graduation Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                        errors.graduationDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={application.graduationDate}
                      onChange={(e) => setApplication({ ...application, graduationDate: e.target.value })}
                    />
                    {errors.graduationDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.graduationDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tuition Cost <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                          errors.tuitionCost ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter total tuition cost"
                        value={application.tuitionCost}
                        onChange={(e) => setApplication({ ...application, tuitionCost: e.target.value })}
                      />
                    </div>
                    {errors.tuitionCost && (
                      <p className="text-red-500 text-sm mt-1">{errors.tuitionCost}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Terms and Privacy Policy Checkboxes */}
            <div className="space-y-4 mt-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    errors.termsAccepted ? 'border-red-500' : ''
                  }`}
                  checked={application.termsAccepted}
                  onChange={(e) => setApplication({ ...application, termsAccepted: e.target.checked })}
                />
                <label htmlFor="termsAccepted" className="ml-3 text-sm text-gray-700">
                  I accept the <a href="#" className="text-blue-600 hover:text-blue-800 underline">terms and conditions</a> <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="text-red-500 text-sm">{errors.termsAccepted}</p>
              )}

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacyPolicyAccepted"
                  className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    errors.privacyPolicyAccepted ? 'border-red-500' : ''
                  }`}
                  checked={application.privacyPolicyAccepted}
                  onChange={(e) => setApplication({ ...application, privacyPolicyAccepted: e.target.checked })}
                />
                <label htmlFor="privacyPolicyAccepted" className="ml-3 text-sm text-gray-700">
                  I accept the <a href="#" className="text-blue-600 hover:text-blue-800 underline">privacy policy</a> <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.privacyPolicyAccepted && (
                <p className="text-red-500 text-sm">{errors.privacyPolicyAccepted}</p>
              )}
            </div>

            <div className="flex space-x-4 mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowApplicationForm(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleApplicationSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderHistory = () => {
    const allItems = [
      ...loans.map(loan => ({ ...loan, itemType: 'loan' })),
      ...loanApplications.map(app => ({ ...app, itemType: 'application' }))
    ].sort((a, b) => {
      const dateA = new Date(a.created_at || a.submitted_date);
      const dateB = new Date(b.created_at || b.submitted_date);
      return dateB.getTime() - dateA.getTime();
    });

    return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loan History</h2>
        <p className="text-gray-600">View your loan applications and active loans</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : allItems.length === 0 ? (
        <Card className="p-8 text-center bg-white border-gray-200">
          <div className="text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium text-gray-700 mb-2">No loan history</p>
            <p className="text-sm text-gray-500">
              Your loan history will appear here once you submit applications.
            </p>
          </div>
        </Card>
      ) : (
      <div className="space-y-4">
        {allItems.map((item) => {
          const IconComponent = getLoanIcon(item.loan_type);
          
          // Render approved loan
          if (item.itemType === 'loan') {
            const progress = ((Number(item.original_amount) - Number(item.current_balance)) / Number(item.original_amount)) * 100;
            
            return (
              <Card key={`loan-${item.id}`} className="p-6 border-gray-200 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">{item.loan_type} Loan</h4>
                      <p className="text-sm text-gray-600">Loan ID: {item.id.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-500 mt-1">Approved Loan</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Original Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(Number(item.original_amount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(Number(item.current_balance))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold text-gray-900">{item.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(Number(item.monthly_payment))}</p>
                  </div>
                </div>

                {item.status !== 'paid' && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}% paid</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </Card>
            );
          }
          
          // Render loan application
          return (
            <Card key={`app-${item.id}`} className="p-6 border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">{item.loan_type} Loan Application</h4>
                    <p className="text-sm text-gray-600">Application ID: {item.id.substring(0, 8)}...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {formatDate(item.submitted_date)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getApplicationStatusColor(item.application_status)}`}>
                  {item.application_status.replace('_', ' ').charAt(0).toUpperCase() + item.application_status.replace('_', ' ').slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Requested Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(Number(item.requested_amount))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Annual Income</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(Number(item.annual_income))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employment</p>
                  <p className="font-semibold text-gray-900 capitalize">{item.employment_status.replace('-', ' ')}</p>
                </div>
              </div>

              {item.purpose && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Purpose</p>
                  <p className="text-sm text-gray-900">{item.purpose}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      )}
    </div>
    );
  };

  // Show loader until both data and user profile are loaded
  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={userData}
        showBackButton={true} 
        title="Loans"
        onBackClick={() => navigate('/dashboard')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'apply'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Apply
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'apply' && renderLoanApplication()}
        {activeTab === 'history' && renderHistory()}

        {/* Loan Application Popup */}
        {showLoanPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Loan Applications Temporarily Unavailable
                </h3>
                <p className="text-gray-600 mb-6">
                  You can apply for a loan yet. Please check back later or contact our support team for assistance.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLoanPopup(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
