import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Plus, Calendar, DollarSign, Clock, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VirtualCard {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
  spendingLimit: number;
  usedAmount: number;
  isActive: boolean;
  createdAt: string;
  merchant?: string;
  isOneTimeUse: boolean;
}

interface VirtualCardsProps {
  parentCardId: string;
  onCardCreated?: (card: VirtualCard) => void;
}

const VirtualCards = ({ parentCardId, onCardCreated }: VirtualCardsProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  
  // Form state
  const [spendingLimit, setSpendingLimit] = useState('500');
  const [expiryDuration, setExpiryDuration] = useState('30');
  const [merchant, setMerchant] = useState('');
  const [isOneTimeUse, setIsOneTimeUse] = useState(false);
  const [creating, setCreating] = useState(false);

  // Generate virtual card number
  const generateCardNumber = () => {
    const prefix = '4' + Math.floor(Math.random() * 900 + 100);
    let cardNumber = prefix;
    for (let i = 0; i < 12; i++) {
      cardNumber += Math.floor(Math.random() * 10);
    }
    return cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber;
  };

  // Generate CVV
  const generateCVV = () => {
    return String(Math.floor(Math.random() * 900 + 100));
  };

  // Create virtual card
  const handleCreateCard = async () => {
    setCreating(true);
    
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDuration));
      
      const newCard: VirtualCard = {
        id: `vcard-${Date.now()}`,
        cardNumber: generateCardNumber(),
        cvv: generateCVV(),
        expiryDate: expiryDate.toISOString(),
        spendingLimit: parseFloat(spendingLimit),
        usedAmount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        merchant: merchant || undefined,
        isOneTimeUse
      };

      setVirtualCards([newCard, ...virtualCards]);
      onCardCreated?.(newCard);
      
      toast.success('Virtual card created successfully!');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create virtual card');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSpendingLimit('500');
    setExpiryDuration('30');
    setMerchant('');
    setIsOneTimeUse(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const deleteCard = (cardId: string) => {
    setVirtualCards(virtualCards.filter(c => c.id !== cardId));
    toast.success('Virtual card deleted');
  };

  const toggleCardStatus = (cardId: string) => {
    setVirtualCards(virtualCards.map(c => 
      c.id === cardId ? { ...c, isActive: !c.isActive } : c
    ));
  };

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Virtual Cards
          </h3>
          <p className="text-sm text-gray-600 mt-1">Generate temporary cards for secure online shopping</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Virtual Card
        </Button>
      </div>

      {/* Virtual Cards List */}
      {virtualCards.length > 0 ? (
        <div className="space-y-4">
          {virtualCards.map(card => {
            const remaining = card.spendingLimit - card.usedAmount;
            const percentUsed = (card.usedAmount / card.spendingLimit) * 100;
            const expiryDate = new Date(card.expiryDate);
            const isExpired = expiryDate < new Date();

            return (
              <div 
                key={card.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  card.isActive && !isExpired 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-lg font-semibold text-gray-900">
                        {card.cardNumber}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(card.cardNumber.replace(/\s/g, ''), 'Card number')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        CVV: <span className="font-mono font-semibold">{card.cvv}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => copyToClipboard(card.cvv, 'CVV')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        Expires: {expiryDate.toLocaleDateString()}
                      </span>
                    </div>
                    {card.merchant && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {card.merchant}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-xl font-bold text-gray-900">${remaining.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">of ${card.spendingLimit.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCard(card.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        percentUsed > 80 ? 'bg-red-600' : 
                        percentUsed > 50 ? 'bg-orange-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 text-xs">
                  {card.isOneTimeUse && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      One-Time Use
                    </span>
                  )}
                  {isExpired ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                      Expired
                    </span>
                  ) : card.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      Inactive
                    </span>
                  )}
                  <span className="text-gray-500">
                    Created {new Date(card.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Virtual Cards Yet</h4>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Create temporary virtual cards for secure online shopping. Set custom limits and expiry dates.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Virtual Card
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Virtual Card</DialogTitle>
            <DialogDescription>
              Generate a temporary card number for secure online transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Spending Limit */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Spending Limit
              </Label>
              <Input
                type="number"
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)}
                placeholder="500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum amount this card can spend</p>
            </div>

            {/* Expiry Duration */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                Valid For (Days)
              </Label>
              <Select value={expiryDuration} onValueChange={setExpiryDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Merchant (Optional) */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                Merchant (Optional)
              </Label>
              <Input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g., Amazon, Netflix"
              />
              <p className="text-xs text-gray-500 mt-1">Restrict this card to a specific merchant</p>
            </div>

            {/* One-Time Use Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">One-Time Use</p>
                <p className="text-xs text-gray-600">Card expires after first transaction</p>
              </div>
              <input
                type="checkbox"
                checked={isOneTimeUse}
                onChange={(e) => setIsOneTimeUse(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)} 
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCard} 
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Card'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VirtualCards;
