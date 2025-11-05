import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Gift, 
  TrendingUp, 
  DollarSign, 
  Award, 
  ArrowRight, 
  Sparkles,
  Utensils,
  Fuel,
  Plane,
  ShoppingCart,
  CreditCard,
  Lightbulb
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RewardsProps {
  cardId: string;
  monthlySpending?: number;
}

interface Reward {
  category: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

const RewardsTracker = ({ cardId, monthlySpending = 0 }: RewardsProps) => {
  // Sample rewards data (in production, fetch from API)
  const cashbackRate = 2; // 2% cashback
  const pointsRate = 1; // 1 point per dollar
  
  const totalCashback = (monthlySpending * cashbackRate) / 100;
  const totalPoints = monthlySpending * pointsRate;
  const lifetimeCashback = totalCashback * 6; // Mock 6 months
  const lifetimePoints = totalPoints * 6;

  // Rewards categories
  const rewardCategories: Reward[] = [
    {
      category: 'Dining',
      percentage: 3,
      icon: <Utensils className="h-5 w-5" />,
      color: 'bg-red-100 text-red-700'
    },
    {
      category: 'Gas',
      percentage: 3,
      icon: <Fuel className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-700'
    },
    {
      category: 'Travel',
      percentage: 2,
      icon: <Plane className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      category: 'Groceries',
      percentage: 2,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-green-100 text-green-700'
    },
    {
      category: 'Everything Else',
      percentage: 1,
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-700'
    }
  ];

  // Next tier calculation
  const nextTierThreshold = 5000;
  const progressToNextTier = (monthlySpending / nextTierThreshold) * 100;

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Rewards & Cashback
        </h3>
        <p className="text-sm text-gray-600 mt-1">Track your earnings and redeem rewards</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* This Month Cashback */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-medium">This Month</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">${totalCashback.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-1">Cashback earned</p>
        </div>

        {/* Rewards Points */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-700 font-medium">Points Balance</p>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">{lifetimePoints.toLocaleString()}</p>
          <p className="text-xs text-purple-600 mt-1">Available to redeem</p>
        </div>

        {/* Lifetime Earnings */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Lifetime Earned</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">${lifetimeCashback.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">Total cashback</p>
        </div>
      </div>

      {/* Rewards Categories */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Cashback Categories</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {rewardCategories.map((reward, idx) => (
            <div 
              key={idx}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-center"
            >
              <div className="mb-2">{reward.icon}</div>
              <p className="text-xs font-medium text-gray-900 mb-1">{reward.category}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded ${reward.color}`}>
                {reward.percentage}% back
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress to Next Tier */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <p className="font-semibold text-gray-900 text-sm">Progress to Gold Status</p>
          </div>
          <span className="text-sm font-bold text-amber-700">
            ${monthlySpending.toFixed(0)} / ${nextTierThreshold.toLocaleString()}
          </span>
        </div>
        <Progress value={Math.min(progressToNextTier, 100)} className="h-2 mb-2" />
        <p className="text-xs text-gray-600">
          Spend ${(nextTierThreshold - monthlySpending).toFixed(0)} more to unlock 3% cashback on everything!
        </p>
      </div>

      {/* Redemption Options */}
      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Redeem Your Rewards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Statement Credit */}
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">Statement Credit</p>
                <p className="text-xs text-gray-600 mt-1">Apply to your balance</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-primary">${totalCashback.toFixed(2)} available</p>
          </div>

          {/* Direct Deposit */}
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">Direct Deposit</p>
                <p className="text-xs text-gray-600 mt-1">Transfer to bank account</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-primary">${totalCashback.toFixed(2)} available</p>
          </div>

          {/* Gift Cards */}
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">Gift Cards</p>
                <p className="text-xs text-gray-600 mt-1">100+ retailers available</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-primary">{lifetimePoints.toLocaleString()} points</p>
          </div>

          {/* Charity Donation */}
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">Donate to Charity</p>
                <p className="text-xs text-gray-600 mt-1">Support a good cause</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-primary">${totalCashback.toFixed(2)} available</p>
          </div>
        </div>
      </div>

      {/* Redeem Button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
          <Gift className="w-5 h-5 mr-2" />
          Redeem ${totalCashback.toFixed(2)} Cashback Now
        </Button>
      </div>

      {/* Info Banner */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-700 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span><strong>Pro Tip:</strong> Earn bonus points during promotional periods! Check your email for special offers.</span>
        </p>
      </div>
    </Card>
  );
};

export default RewardsTracker;
