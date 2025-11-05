import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Calendar, DollarSign, CreditCard, Trash2, Edit, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { toast } from 'sonner';
import { 
  getAutoPaySetups, 
  createAutoPaySetup, 
  updateAutoPaySetup, 
  deleteAutoPaySetup,
  toggleAutoPayStatus,
  getUserBills
} from '@/lib/billsUtils';
import { supabase } from '@/integrations/supabase/client';

const AutoPay = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'paused' | 'all'>('active');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoPaySetups, setAutoPaySetups] = useState<any[]>([]);
  const [userBills, setUserBills] = useState<any[]>([]);
  const [editingSetup, setEditingSetup] = useState<any>(null);

  const [newSetup, setNewSetup] = useState({
    bill_id: '',
    amount: '',
    payment_type: 'full',
    frequency: 'monthly',
    next_payment_date: '',
    payment_account: 'Checking Account',
    payment_method: 'Bank Account'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const [setups, bills] = await Promise.all([
        getAutoPaySetups(user.id),
        getUserBills(user.id)
      ]);

      setAutoPaySetups(setups || []);
      setUserBills(bills || []);
    } catch (error) {
      toast.error('Failed to load auto pay setups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSetup = async () => {
    try {
      if (!newSetup.bill_id) {
        toast.error('Please select a bill');
        return;
      }

      const selectedBill = userBills.find(b => b.id === newSetup.bill_id);
      if (!selectedBill) {
        toast.error('Bill not found');
        return;
      }

      const setupData = {
        bill_id: newSetup.bill_id,
        bill_name: selectedBill.bill_name,
        provider: selectedBill.provider,
        amount: parseFloat(newSetup.amount) || selectedBill.typical_amount,
        payment_type: newSetup.payment_type as 'full' | 'minimum' | 'custom',
        frequency: newSetup.frequency as 'weekly' | 'monthly' | 'quarterly',
        next_payment_date: newSetup.next_payment_date || selectedBill.next_due_date,
        payment_account: newSetup.payment_account,
        payment_method: newSetup.payment_method,
        status: 'active' as const
      };

      await createAutoPaySetup(setupData);
      toast.success('Auto pay setup created successfully');
      
      // Reset and refresh
      setNewSetup({
        bill_id: '',
        amount: '',
        payment_type: 'full',
        frequency: 'monthly',
        next_payment_date: '',
        payment_account: 'Checking Account',
        payment_method: 'Bank Account'
      });
      setShowAddDialog(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create auto pay setup');
    }
  };

  const handleEditSetup = async () => {
    try {
      if (!editingSetup) return;

      const updates = {
        amount: parseFloat(editingSetup.amount),
        payment_type: editingSetup.payment_type,
        frequency: editingSetup.frequency,
        next_payment_date: editingSetup.next_payment_date,
        payment_account: editingSetup.payment_account,
        payment_method: editingSetup.payment_method
      };

      await updateAutoPaySetup(editingSetup.id, updates);
      toast.success('Auto pay setup updated successfully');
      
      setShowEditDialog(false);
      setEditingSetup(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update auto pay setup');
    }
  };

  const handleToggleStatus = async (setupId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await toggleAutoPayStatus(setupId, newStatus);
      toast.success(`Auto pay ${newStatus === 'active' ? 'activated' : 'paused'}`);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle auto pay status');
    }
  };

  const handleDeleteSetup = async (setupId: string) => {
    if (!confirm('Are you sure you want to delete this auto pay setup?')) return;

    try {
      await deleteAutoPaySetup(setupId);
      toast.success('Auto pay setup deleted successfully');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete auto pay setup');
    }
  };

  const getFilteredSetups = () => {
    switch (activeTab) {
      case 'active':
        return autoPaySetups.filter(setup => setup.status === 'active');
      case 'paused':
        return autoPaySetups.filter(setup => setup.status === 'paused');
      case 'all':
      default:
        return autoPaySetups;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredSetups = getFilteredSetups();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        showBackButton={true} 
        title="Auto Pay" 
        onBackClick={() => navigate('/bills')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Auto Pay Management</h2>
          <p className="text-gray-600">Set up automatic bill payments to never miss a due date</p>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Auto Pay Setup
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-gray-900 border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-white">Create Auto Pay Setup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Select Bill</Label>
                  <Select value={newSetup.bill_id} onValueChange={(value) => setNewSetup({ ...newSetup, bill_id: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Choose a bill" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {userBills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id} className="text-white">
                          {bill.bill_name} - {bill.provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Payment Type</Label>
                  <Select value={newSetup.payment_type} onValueChange={(value) => setNewSetup({ ...newSetup, payment_type: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="full" className="text-white">Full Amount</SelectItem>
                      <SelectItem value="minimum" className="text-white">Minimum Payment</SelectItem>
                      <SelectItem value="custom" className="text-white">Custom Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newSetup.payment_type === 'custom' && (
                  <div>
                    <Label className="text-white">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newSetup.amount}
                      onChange={(e) => setNewSetup({ ...newSetup, amount: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-white">Frequency</Label>
                  <Select value={newSetup.frequency} onValueChange={(value) => setNewSetup({ ...newSetup, frequency: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                      <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                      <SelectItem value="quarterly" className="text-white">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Next Payment Date</Label>
                  <Input
                    type="date"
                    value={newSetup.next_payment_date}
                    onChange={(e) => setNewSetup({ ...newSetup, next_payment_date: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1 border-gray-600 text-white hover:bg-gray-700">
                    Cancel
                  </Button>
                  <Button onClick={handleAddSetup} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Create Auto Pay
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({autoPaySetups.filter(s => s.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('paused')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'paused'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Paused ({autoPaySetups.filter(s => s.status === 'paused').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({autoPaySetups.length})
          </button>
        </div>

        {/* Auto Pay List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredSetups.length === 0 ? (
          <Card className="p-8 text-center bg-white border-gray-200">
            <div className="text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No auto pay setups</p>
              <p className="text-sm text-gray-600">
                {activeTab === 'active' && 'You don\'t have any active auto pay setups.'}
                {activeTab === 'paused' && 'You don\'t have any paused auto pay setups.'}
                {activeTab === 'all' && 'Create your first auto pay setup to automate your bill payments.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSetups.map((setup) => (
              <Card key={setup.id} className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      setup.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`w-6 h-6 ${
                        setup.status === 'active' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{setup.bill_name}</h4>
                      <p className="text-sm text-gray-600">{setup.provider}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(setup.amount)} • {setup.frequency} • Next: {formatDate(setup.next_payment_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={setup.status === 'active'}
                      onCheckedChange={() => handleToggleStatus(setup.id, setup.status)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSetup(setup);
                        setShowEditDialog(true);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSetup(setup.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {editingSetup && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-white text-gray-900 border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Auto Pay Setup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Payment Type</Label>
                  <Select 
                    value={editingSetup.payment_type} 
                    onValueChange={(value) => setEditingSetup({ ...editingSetup, payment_type: value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="full" className="text-white">Full Amount</SelectItem>
                      <SelectItem value="minimum" className="text-white">Minimum Payment</SelectItem>
                      <SelectItem value="custom" className="text-white">Custom Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingSetup.payment_type === 'custom' && (
                  <div>
                    <Label className="text-white">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingSetup.amount}
                      onChange={(e) => setEditingSetup({ ...editingSetup, amount: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-white">Frequency</Label>
                  <Select 
                    value={editingSetup.frequency} 
                    onValueChange={(value) => setEditingSetup({ ...editingSetup, frequency: value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                      <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                      <SelectItem value="quarterly" className="text-white">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Next Payment Date</Label>
                  <Input
                    type="date"
                    value={editingSetup.next_payment_date}
                    onChange={(e) => setEditingSetup({ ...editingSetup, next_payment_date: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditingSetup(null);
                    }}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditSetup} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AutoPay;
