import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createBill } from '@/lib/billsUtils';
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  Calendar, 
  DollarSign,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
  Hash,
  Lightbulb,
  Car,
  Smartphone,
  Wifi,
  Home,
  Droplets
} from 'lucide-react';
import Header from '../components/Header';

const AddBill = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    billName: '',
    provider: '',
    category: '',
    accountNumber: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    paymentMethod: '',
    notes: '',
    providerAddress: '',
    providerPhone: '',
    providerEmail: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const categories = [
    { id: 'utilities', name: 'Utilities', icon: Lightbulb },
    { id: 'insurance', name: 'Insurance', icon: Car },
    { id: 'subscription', name: 'Subscription', icon: Smartphone },
    { id: 'mortgage', name: 'Mortgage/Rent', icon: Home },
    { id: 'credit', name: 'Credit Card', icon: CreditCard },
    { id: 'other', name: 'Other', icon: Building }
  ];

  const frequencies = [
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'annually', name: 'Annually' }
  ];

  const paymentMethods = [
    { id: 'checking', name: 'Checking Account ****1234' },
    { id: 'savings', name: 'Savings Account ****5678' },
    { id: 'credit', name: 'Credit Card ****9012' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.billName || !formData.provider || !formData.category || !formData.amount || !formData.dueDate || !formData.frequency || !formData.paymentMethod) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Calculate next due date based on due date input
      const dueDate = new Date(formData.dueDate);
      const dueDay = dueDate.getDate();

      // Create bill in database
      await createBill({
        bill_name: formData.billName,
        provider: formData.provider,
        category: formData.category as any,
        account_number: formData.accountNumber || undefined,
        typical_amount: parseFloat(formData.amount),
        payment_method: formData.paymentMethod as any,
        frequency: formData.frequency as any,
        due_day: dueDay,
        next_due_date: formData.dueDate,
        provider_address: formData.providerAddress || undefined,
        provider_phone: formData.providerPhone || undefined,
        provider_email: formData.providerEmail || undefined,
        notes: formData.notes || undefined,
        is_active: true
      });

      toast.success('Bill added successfully!');
      navigate('/bills');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add bill');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card className="p-6 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-white mb-4">Bill Information</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bill Name</label>
          <input
            type="text"
            value={formData.billName}
            onChange={(e) => handleInputChange('billName', e.target.value)}
            placeholder="e.g., Electric Bill, Internet Service"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Provider/Company</label>
          <input
            type="text"
            value={formData.provider}
            onChange={(e) => handleInputChange('provider', e.target.value)}
            placeholder="e.g., City Power & Light, FastNet Communications"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleInputChange('category', category.id)}
                  className={`p-3 border rounded-md flex items-center space-x-2 transition-all ${
                    formData.category === category.id
                      ? 'border-blue-500 bg-blue-900/50 text-blue-300'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Account Number</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            placeholder="Your account number with the provider"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="p-6 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Typical Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
          <div className="grid grid-cols-2 gap-3">
            {frequencies.map((frequency) => (
              <button
                key={frequency.id}
                onClick={() => handleInputChange('frequency', frequency.id)}
                className={`p-3 border rounded-md text-sm font-medium transition-all ${
                  formData.frequency === frequency.id
                    ? 'border-blue-500 bg-blue-900/50 text-blue-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                }`}
              >
                {frequency.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleInputChange('paymentMethod', method.id)}
                className={`w-full p-3 border rounded-md text-left transition-all ${
                  formData.paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-900/50 text-blue-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">{method.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="p-6 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold text-white mb-4">Provider Contact (Optional)</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.providerAddress}
              onChange={(e) => handleInputChange('providerAddress', e.target.value)}
              placeholder="Provider's mailing address"
              rows={3}
              className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={formData.providerPhone}
              onChange={(e) => handleInputChange('providerPhone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={formData.providerEmail}
              onChange={(e) => handleInputChange('providerEmail', e.target.value)}
              placeholder="billing@provider.com"
              className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this bill"
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        showBackButton={true} 
        title="Add Bill" 
        onBackClick={() => navigate('/bills')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Plus className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Bill</h2>
          <p className="text-gray-600">Set up a new bill for tracking and payments</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Steps */}
        <div className="mb-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-white hover:bg-gray-900 text-white"
            >
              Next
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bill
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBill;
