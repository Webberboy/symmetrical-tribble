import { Card } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { TrendingUp, Shield, PiggyBank, CreditCard, ArrowRight } from 'lucide-react';

interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
}

interface FinancialHealthScoreProps {
  overallScore: number;
  factors: HealthFactor[];
}

const FinancialHealthScore = ({ overallScore, factors }: FinancialHealthScoreProps) => {
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669'; // green
    if (score >= 60) return '#D97706'; // orange
    if (score >= 40) return '#DC2626'; // red
    return '#DC2626'; // red
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 60) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { text: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const scoreLabel = getScoreLabel(overallScore);

  // Get factor status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      excellent: { text: 'Excellent', color: 'text-green-700', bg: 'bg-green-100' },
      good: { text: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' },
      fair: { text: 'Fair', color: 'text-orange-700', bg: 'bg-orange-100' },
      poor: { text: 'Poor', color: 'text-red-700', bg: 'bg-red-100' },
    };
    return badges[status as keyof typeof badges];
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Financial Health Score</h3>
        <p className="text-sm text-gray-600 mt-1">Your overall financial wellness</p>
      </div>

      {/* Score Circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-48 h-48 mb-4">
          <CircularProgressbar
            value={overallScore}
            text={`${overallScore}`}
            styles={buildStyles({
              textSize: '24px',
              pathColor: getScoreColor(overallScore),
              textColor: '#111827',
              trailColor: '#E5E7EB',
              pathTransitionDuration: 1,
            })}
          />
        </div>
        <div className={`px-4 py-2 rounded-full ${scoreLabel.bg}`}>
          <span className={`font-semibold ${scoreLabel.color}`}>{scoreLabel.text}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center max-w-sm">
          {overallScore >= 80 
            ? "You're doing great! Keep up the excellent financial habits."
            : overallScore >= 60
            ? "Good progress! A few improvements can boost your score."
            : "There's room for improvement. Focus on the key factors below."}
        </p>
      </div>

      {/* Health Factors */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Score Breakdown</h4>
        
        {factors.map((factor, index) => {
          const badge = getStatusBadge(factor.status);
          const factorPercentage = (factor.score / 100) * 100;
          
          return (
            <div key={index} className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">{factor.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{factor.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{factor.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-2 py-1 rounded-md ${badge.bg} ${badge.color} font-medium`}>
                    {badge.text}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Contributes {factor.weight}% to overall score</span>
                  <span className="font-semibold text-gray-900">{factor.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${factorPercentage}%`,
                      backgroundColor: getScoreColor(factor.score)
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Improvement Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Ways to Improve Your Score
        </h4>
        <div className="space-y-2">
          {factors
            .filter(f => f.score < 80)
            .slice(0, 3)
            .map((factor, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">
                  Improve your <span className="font-semibold">{factor.name.toLowerCase()}</span> to boost your overall score
                </p>
              </div>
            ))}
          {factors.every(f => f.score >= 80) && (
            <p className="text-sm text-gray-600 italic">
              You're doing excellent across all factors! Maintain these healthy financial habits.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FinancialHealthScore;
