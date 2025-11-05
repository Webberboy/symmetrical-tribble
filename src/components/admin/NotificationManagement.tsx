import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  display_as: 'banner' | 'card' | 'modal';
  is_active: boolean;
  is_read: boolean;
  is_dismissed: boolean;
  dismissible: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface NotificationManagementProps {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function NotificationManagement({ user }: NotificationManagementProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'alert' | 'success',
    display_as: 'banner' as 'banner' | 'card' | 'modal',
    dismissible: true,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        user_id: user.id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        display_as: formData.display_as,
        dismissible: formData.dismissible,
        is_active: true,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('user_notifications')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Notification updated successfully');
      } else {
        const { error } = await supabase
          .from('user_notifications')
          .insert([payload]);

        if (error) throw error;
        toast.success('Notification sent successfully');
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        display_as: 'banner',
        dismissible: true,
        start_date: '',
        end_date: ''
      });
      setShowForm(false);
      setEditingId(null);
      loadNotifications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save notification');
    }
  };

  const handleEdit = (notification: Notification) => {
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      display_as: notification.display_as,
      dismissible: notification.dismissible,
      start_date: notification.start_date?.split('T')[0] || '',
      end_date: notification.end_date?.split('T')[0] || ''
    });
    setEditingId(notification.id);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Notification disabled' : 'Notification enabled');
      loadNotifications();
    } catch (error: any) {
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted');
      loadNotifications();
    } catch (error: any) {
      toast.error('Failed to delete notification');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'alert': return <AlertCircle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayBadge = (displayAs: string) => {
    switch (displayAs) {
      case 'banner': return 'Top Banner';
      case 'card': return 'Dashboard Card';
      case 'modal': return 'Popup Modal';
      default: return displayAs;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">User Notifications</h2>
          <p className="text-sm text-gray-400">Send notifications to {user.full_name}</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              title: '',
              message: '',
              type: 'info',
              display_as: 'banner',
              dismissible: true,
              start_date: '',
              end_date: ''
            });
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-gray-800 border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Notification' : 'New Notification'}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                placeholder="e.g., System Maintenance Notice"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                placeholder="Enter your announcement message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="alert">Alert (Red)</option>
                  <option value="success">Success (Green)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display As
                </label>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.display_as}
                  onChange={(e) => setFormData({ ...formData, display_as: e.target.value as any })}
                >
                  <option value="banner">Top Banner</option>
                  <option value="card">Dashboard Card</option>
                  <option value="modal">Popup Modal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="dismissible"
                className="w-4 h-4 text-purple-600 border-gray-600 bg-gray-700 rounded focus:ring-purple-500"
                checked={formData.dismissible}
                onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
              />
              <label htmlFor="dismissible" className="ml-2 text-sm text-gray-300">
                Allow users to dismiss this notification
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingId ? 'Update' : 'Send'} Notification
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8 text-center bg-gray-800 border-gray-700">
            <p className="text-gray-400">Loading notifications...</p>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center bg-gray-800 border-gray-700">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-white font-medium mb-2">No notifications yet</p>
            <p className="text-sm text-gray-400">
              Send your first notification to {user.full_name}.
            </p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={`p-4 bg-gray-800 border-gray-700 ${!notification.is_active && 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-white">{notification.title}</h3>
                      {!notification.is_active && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                          Disabled
                        </span>
                      )}
                      {notification.is_dismissed && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                          Dismissed
                        </span>
                      )}
                      {notification.is_read && !notification.is_dismissed && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-900 text-green-300">
                          Read
                        </span>
                      )}
                      {!notification.is_read && !notification.is_dismissed && notification.is_active && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-300">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                        {notification.type.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        {getDisplayBadge(notification.display_as)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        {notification.dismissible ? 'Dismissible' : 'Persistent'}
                      </span>
                      {notification.start_date && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-300">
                          From: {new Date(notification.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {notification.end_date && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-300">
                          Until: {new Date(notification.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(notification.id, notification.is_active)}
                    title={notification.is_active ? 'Disable' : 'Enable'}
                  >
                    {notification.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(notification)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
