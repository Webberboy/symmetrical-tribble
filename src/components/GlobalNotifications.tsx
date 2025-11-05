import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  X, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  CheckCircle 
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  display_as: 'banner' | 'card' | 'modal';
  dismissible: boolean;
}

interface GlobalNotificationsProps {
  userId: string;
  displayType: 'banner' | 'card' | 'modal';
}

export default function GlobalNotifications({ userId, displayType }: GlobalNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadDismissals();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_dismissed', false)
        .eq('display_as', displayType)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      
      // Show modal if there are modal-type notifications
      if (displayType === 'modal' && data && data.length > 0) {
        setShowModal(true);
      }
    } catch (error) {
    }
  };

  const loadDismissals = async () => {
    // Not needed anymore since dismissal is tracked in the same table
    setDismissedIds(new Set());
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      setDismissedIds(new Set([...dismissedIds, notificationId]));
    } catch (error) {
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'alert': return <AlertCircle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'info': return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        iconBg: 'bg-blue-100',
        icon: 'text-blue-600'
      };
      case 'warning': return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        iconBg: 'bg-yellow-100',
        icon: 'text-yellow-600'
      };
      case 'alert': return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        iconBg: 'bg-red-100',
        icon: 'text-red-600'
      };
      case 'success': return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        iconBg: 'bg-green-100',
        icon: 'text-green-600'
      };
      default: return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        iconBg: 'bg-gray-100',
        icon: 'text-gray-600'
      };
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (visibleNotifications.length === 0) return null;

  // Banner Display
  if (displayType === 'banner') {
    return (
      <div className="space-y-2">
        {visibleNotifications.map((notification) => {
          const colors = getColors(notification.type);
          return (
            <div
              key={notification.id}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
            >
              <div className="flex items-start space-x-3">
                <div className={`${colors.iconBg} ${colors.icon} p-2 rounded-lg flex-shrink-0`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${colors.text} mb-1`}>
                    {notification.title}
                  </h3>
                  <p className={`text-sm ${colors.text} opacity-90`}>
                    {notification.message}
                  </p>
                </div>
                {notification.dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(notification.id)}
                    className={`${colors.icon} hover:${colors.iconBg} flex-shrink-0`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Card Display
  if (displayType === 'card') {
    return (
      <div className="space-y-4">
        {visibleNotifications.map((notification) => {
          const colors = getColors(notification.type);
          return (
            <Card
              key={notification.id}
              className={`${colors.bg} ${colors.border} border p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`${colors.iconBg} ${colors.icon} p-3 rounded-lg`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${colors.text} mb-2`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm ${colors.text} opacity-90`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
                {notification.dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(notification.id)}
                    className={`${colors.icon} hover:${colors.iconBg} ml-4`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Modal Display
  if (displayType === 'modal' && showModal) {
    const notification = visibleNotifications[0]; // Show first notification
    const colors = getColors(notification.type);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className={`${colors.bg} ${colors.border} border max-w-md w-full p-6`}>
          <div className="flex items-start space-x-4 mb-4">
            <div className={`${colors.iconBg} ${colors.icon} p-3 rounded-lg`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
                {notification.title}
              </h3>
              <p className={`text-sm ${colors.text} opacity-90`}>
                {notification.message}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button
              onClick={() => {
                if (notification.dismissible) {
                  handleDismiss(notification.id);
                }
                setShowModal(false);
              }}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            >
              {notification.dismissible ? 'Got it' : 'Close'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
