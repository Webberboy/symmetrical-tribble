import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Globe, CreditCard, Smartphone, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CardControlsProps {
  cardId: string;
  onSave?: (controls: CardControlSettings) => void;
}

export interface CardControlSettings {
  dailyLimit: number;
  transactionLimit: number;
  atmEnabled: boolean;
  onlineEnabled: boolean;
  internationalEnabled: boolean;
  contactlessEnabled: boolean;
  geographicRestriction: string;
}

const CardControls = ({ cardId, onSave }: CardControlsProps) => {
  const [controls, setControls] = useState<CardControlSettings>({
    dailyLimit: 1000,
    transactionLimit: 500,
    atmEnabled: true,
    onlineEnabled: true,
    internationalEnabled: false,
    contactlessEnabled: true,
    geographicRestriction: 'none',
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = () => {
    onSave?.(controls);
    toast.success('Card controls updated successfully');
    setShowSaveDialog(false);
  };

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Card Controls & Security
          </h3>
          <p className="text-sm text-gray-600 mt-1">Manage spending limits and usage restrictions</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Spending Limits */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 text-sm">Spending Limits</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Limit */}
            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Daily Spending Limit
              </Label>
              <Input
                type="number"
                value={controls.dailyLimit}
                onChange={(e) => setControls({ ...controls, dailyLimit: parseInt(e.target.value) || 0 })}
                placeholder="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum spending allowed per day</p>
            </div>

            {/* Transaction Limit */}
            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                Per-Transaction Limit
              </Label>
              <Input
                type="number"
                value={controls.transactionLimit}
                onChange={(e) => setControls({ ...controls, transactionLimit: parseInt(e.target.value) || 0 })}
                placeholder="500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum amount per single transaction</p>
            </div>
          </div>
        </div>

        {/* Usage Controls */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 text-sm">Usage Controls</h4>

          {/* ATM Withdrawals */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">ATM Withdrawals</p>
                <p className="text-xs text-gray-600 mt-0.5">Allow cash withdrawals from ATMs</p>
              </div>
            </div>
            <Switch
              checked={controls.atmEnabled}
              onCheckedChange={(checked) => setControls({ ...controls, atmEnabled: checked })}
            />
          </div>

          {/* Online Purchases */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Online Purchases</p>
                <p className="text-xs text-gray-600 mt-0.5">Enable e-commerce transactions</p>
              </div>
            </div>
            <Switch
              checked={controls.onlineEnabled}
              onCheckedChange={(checked) => setControls({ ...controls, onlineEnabled: checked })}
            />
          </div>

          {/* International Transactions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">International Transactions</p>
                <p className="text-xs text-gray-600 mt-0.5">Allow purchases outside your country</p>
              </div>
            </div>
            <Switch
              checked={controls.internationalEnabled}
              onCheckedChange={(checked) => setControls({ ...controls, internationalEnabled: checked })}
            />
          </div>

          {/* Contactless Payments */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Contactless Payments</p>
                <p className="text-xs text-gray-600 mt-0.5">Enable tap-to-pay transactions</p>
              </div>
            </div>
            <Switch
              checked={controls.contactlessEnabled}
              onCheckedChange={(checked) => setControls({ ...controls, contactlessEnabled: checked })}
            />
          </div>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Enhanced Security</p>
              <p className="text-xs text-blue-700 mt-1">
                Changes take effect immediately. You'll receive notifications for any blocked transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button 
            onClick={() => setShowSaveDialog(true)} 
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Card Controls
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Card Controls</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the card controls? Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Daily Limit:</span>
              <span className="font-semibold">${controls.dailyLimit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transaction Limit:</span>
              <span className="font-semibold">${controls.transactionLimit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ATM Withdrawals:</span>
              <span className={controls.atmEnabled ? 'text-green-600' : 'text-red-600'}>
                {controls.atmEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Online Purchases:</span>
              <span className={controls.onlineEnabled ? 'text-green-600' : 'text-red-600'}>
                {controls.onlineEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">International:</span>
              <span className={controls.internationalEnabled ? 'text-green-600' : 'text-red-600'}>
                {controls.internationalEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              Confirm & Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CardControls;
