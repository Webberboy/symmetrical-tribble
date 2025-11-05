import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckIcon, XMarkIcon, EyeIcon, CalendarIcon, CurrencyDollarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

interface LoanManagementProps {
  user: any;
  onUpdate: () => void;
}

interface LoanApplication {
  id: string;
  user_id: string;
  loan_type: string;
  requested_amount: number;
  purpose: string;
  annual_income: number;
  employment_status: string;
  application_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_date: string;
  reviewed_date?: string;
  reviewed_by?: string;
  admin_notes?: string;
  credit_score?: number;
  monthly_expenses?: number;
  property_value?: number;
  down_payment?: number;
  property_type?: string;
  property_address?: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_price?: number;
  trade_in_value?: number;
  school_name?: string;
  program?: string;
  graduation_date?: string;
  tuition_cost?: number;
}

const LoanManagement: React.FC<LoanManagementProps> = ({ user, onUpdate }) => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_date', { ascending: false });

      if (error) {
        throw error;
      }

      
      if (data && data.length > 0) {
      }
      
      setApplications(data || []);
    } catch (error) {
      toast.error('Failed to load loan applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (application: LoanApplication) => {
    setSelectedApplication(application);
    setAdminNotes(application.admin_notes || '');
    setShowDetailsDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      setIsProcessing(true);

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('loan_applications')
        .update({
          application_status: 'approved',
          reviewed_date: new Date().toISOString(),
          reviewed_by: adminUser?.id,
          admin_notes: adminNotes
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast.success('Loan application approved successfully! ✅');
      setShowDetailsDialog(false);
      await loadApplications();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to approve application: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection in the admin notes');
      return;
    }

    try {
      setIsProcessing(true);

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('loan_applications')
        .update({
          application_status: 'rejected',
          reviewed_date: new Date().toISOString(),
          reviewed_by: adminUser?.id,
          admin_notes: adminNotes
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast.success('Loan application rejected');
      setShowDetailsDialog(false);
      await loadApplications();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to reject application: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnderReview = async () => {
    if (!selectedApplication) return;

    try {
      setIsProcessing(true);

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      const updateData = {
        application_status: 'under_review',
        reviewed_date: new Date().toISOString(),
        reviewed_by: adminUser?.id,
        admin_notes: adminNotes
      };

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', selectedApplication.id)
        .select();

      if (error) {
        throw error;
      }

      toast.success('Loan application marked as under review');
      setShowDetailsDialog(false);
      await loadApplications();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to update application: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

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

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'} border`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getLoanTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      personal: 'Personal Loan',
      home: 'Home Loan',
      auto: 'Auto Loan',
      education: 'Education Loan'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading loan applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">No loan applications found for this user</p>
          </CardContent>
        </Card>
      ) : (
        applications.map((app) => (
          <Card key={app.id} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {getLoanTypeDisplay(app.loan_type)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Applied: {formatDate(app.submitted_date)}
                  </p>
                </div>
                {getStatusBadge(app.application_status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Requested Amount</p>
                  <p className="text-base font-semibold text-white">
                    {formatCurrency(app.requested_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Annual Income</p>
                  <p className="text-base font-semibold text-white">
                    {formatCurrency(app.annual_income)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Employment</p>
                  <p className="text-base font-semibold text-white capitalize">
                    {app.employment_status.replace('-', ' ')}
                  </p>
                </div>
                {app.credit_score && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                    <p className="text-base font-semibold text-white">
                      {app.credit_score}
                    </p>
                  </div>
                )}
              </div>

              {app.purpose && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Purpose</p>
                  <p className="text-sm text-gray-300">{app.purpose}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(app)}
                className="w-full sm:w-auto"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View Details & Manage
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Loan Application Details
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {getLoanTypeDisplay(selectedApplication.loan_type)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Application ID: {selectedApplication.id.substring(0, 13)}...
                  </p>
                </div>
                {getStatusBadge(selectedApplication.application_status)}
              </div>

              {/* Basic Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Requested Amount</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(selectedApplication.requested_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Annual Income</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(selectedApplication.annual_income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Employment Status</p>
                    <p className="text-base text-white capitalize">
                      {selectedApplication.employment_status.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Submitted Date</p>
                    <p className="text-base text-white">
                      {formatDate(selectedApplication.submitted_date)}
                    </p>
                  </div>
                  {selectedApplication.credit_score && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                      <p className="text-base text-white">{selectedApplication.credit_score}</p>
                    </div>
                  )}
                  {selectedApplication.monthly_expenses && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Monthly Expenses</p>
                      <p className="text-base text-white">
                        {formatCurrency(selectedApplication.monthly_expenses)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purpose */}
              {selectedApplication.purpose && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Purpose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{selectedApplication.purpose}</p>
                  </CardContent>
                </Card>
              )}

              {/* Type-specific details */}
              {selectedApplication.loan_type === 'home' && (selectedApplication.property_value || selectedApplication.property_address) && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Property Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedApplication.property_value && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Property Value</p>
                        <p className="text-base text-white">{formatCurrency(selectedApplication.property_value)}</p>
                      </div>
                    )}
                    {selectedApplication.down_payment && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Down Payment</p>
                        <p className="text-base text-white">{formatCurrency(selectedApplication.down_payment)}</p>
                      </div>
                    )}
                    {selectedApplication.property_type && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Property Type</p>
                        <p className="text-base text-white capitalize">{selectedApplication.property_type}</p>
                      </div>
                    )}
                    {selectedApplication.property_address && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Property Address</p>
                        <p className="text-base text-white">{selectedApplication.property_address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedApplication.loan_type === 'auto' && (selectedApplication.vehicle_make || selectedApplication.vehicle_model) && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Vehicle Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedApplication.vehicle_year && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Year</p>
                        <p className="text-base text-white">{selectedApplication.vehicle_year}</p>
                      </div>
                    )}
                    {selectedApplication.vehicle_make && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Make</p>
                        <p className="text-base text-white">{selectedApplication.vehicle_make}</p>
                      </div>
                    )}
                    {selectedApplication.vehicle_model && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Model</p>
                        <p className="text-base text-white">{selectedApplication.vehicle_model}</p>
                      </div>
                    )}
                    {selectedApplication.vehicle_price && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle Price</p>
                        <p className="text-base text-white">{formatCurrency(selectedApplication.vehicle_price)}</p>
                      </div>
                    )}
                    {selectedApplication.trade_in_value && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Trade-in Value</p>
                        <p className="text-base text-white">{formatCurrency(selectedApplication.trade_in_value)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedApplication.loan_type === 'education' && (selectedApplication.school_name || selectedApplication.program) && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Education Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedApplication.school_name && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">School Name</p>
                        <p className="text-base text-white">{selectedApplication.school_name}</p>
                      </div>
                    )}
                    {selectedApplication.program && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Program</p>
                        <p className="text-base text-white">{selectedApplication.program}</p>
                      </div>
                    )}
                    {selectedApplication.graduation_date && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Graduation</p>
                        <p className="text-base text-white">{formatDate(selectedApplication.graduation_date)}</p>
                      </div>
                    )}
                    {selectedApplication.tuition_cost && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tuition Cost</p>
                        <p className="text-base text-white">{formatCurrency(selectedApplication.tuition_cost)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application (required for rejection)..."
                    className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {selectedApplication.application_status === 'pending' || selectedApplication.application_status === 'under_review' ? (
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={handleUnderReview}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isProcessing ? 'Processing...' : 'Mark Under Review'}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isProcessing}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Rejection requires admin notes. Approval and review are optional.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 text-center">
                    This application has already been {selectedApplication.application_status}
                    {selectedApplication.reviewed_date && (
                      <span> on {formatDate(selectedApplication.reviewed_date)}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanManagement;
