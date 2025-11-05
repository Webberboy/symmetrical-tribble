import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

interface MessageReply {
  id: string;
  message_id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: string;
}

interface MessagesManagementProps {
  userId: string;
}

const MessagesManagement: React.FC<MessagesManagementProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, MessageReply[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Query messages directly
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      
      setMessages(data || []);

      // Load all replies for these messages
      if (data && data.length > 0) {
        const messageIds = data.map(m => m.id);
        const { data: repliesData, error: repliesError } = await supabase
          .from('message_replies')
          .select('*')
          .in('message_id', messageIds)
          .order('created_at', { ascending: true });

        if (repliesError) {
        } else {
          // Group replies by message_id
          const repliesByMessage: Record<string, MessageReply[]> = {};
          repliesData?.forEach(reply => {
            if (!repliesByMessage[reply.message_id]) {
              repliesByMessage[reply.message_id] = [];
            }
            repliesByMessage[reply.message_id].push(reply);
          });
          setMessageReplies(repliesByMessage);
        }
      }
    } catch (error: any) {
      
      if (error.code === '42P01') {
        toast.error('Messages table not found. Please run CREATE_MESSAGES_TABLE.sql in Supabase first.');
      } else if (error.message) {
        toast.error(`Failed to load messages: ${error.message}`);
      } else {
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessage = async () => {
    if (!selectedMessage) return;

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (selectedStatus) {
        updates.status = selectedStatus;
      }

      // Update message status
      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', selectedMessage.id);

      if (error) throw error;

      // If admin responded, add the reply to message_replies table
      if (adminResponse.trim()) {
        const { error: replyError } = await supabase
          .from('message_replies')
          .insert({
            message_id: selectedMessage.id,
            user_id: selectedMessage.user_id,
            sender_type: 'admin',
            content: adminResponse.trim()
          });

        if (replyError) {
          throw replyError;
        }

        // Send notification to user
        const { error: notifError } = await supabase
          .from('user_notifications')
          .insert({
            user_id: selectedMessage.user_id,
            type: 'support_response',
            title: 'Support Response Received',
            message: `Your support ticket "${selectedMessage.subject}" has received a response from our team.`,
            action_url: '/tickets',
            read: false
          });

        if (notifError) {
        } else {
        }
      }

      toast.success('Message updated successfully');
      setAdminResponse('');
      setSelectedStatus('');
      setSelectedMessage(null);
      loadMessages();
    } catch (error: any) {
      toast.error('Failed to update message');
    }
  };

  const handleQuickStatusUpdate = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus}`);
      loadMessages();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500 hover:bg-gray-600"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Account Issues': 'bg-red-100 text-red-800 border-red-300',
      'Card Problems': 'bg-orange-100 text-orange-800 border-orange-300',
      'Transfer Issues': 'bg-blue-100 text-blue-800 border-blue-300',
      'Technical Support': 'bg-purple-100 text-purple-800 border-purple-300',
      'Other': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Support Messages ({messages.length})
            </div>
            <Button
              onClick={loadMessages}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-2">No messages from this user</p>
            <p className="text-gray-500 text-sm">User ID: {userId}</p>
            <Button
              onClick={loadMessages}
              size="sm"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="bg-gray-700 border-gray-600">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-base">{message.subject}</h3>
                      {getStatusBadge(message.status)}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(message.category)}`}>
                      {message.category}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <Label className="text-gray-300 text-sm mb-3 block">Conversation:</Label>
                    <div className="space-y-3">
                      {messageReplies[message.id]?.length > 0 ? (
                        messageReplies[message.id].map((reply, idx) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg ${
                              reply.sender_type === 'user'
                                ? 'bg-blue-900/30 border border-blue-700 ml-0 mr-8'
                                : 'bg-green-900/30 border border-green-700 ml-8 mr-0'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${
                                reply.sender_type === 'user' ? 'text-blue-300' : 'text-green-300'
                              }`}>
                                {reply.sender_type === 'user' ? '👤 User' : '👨‍💼 Admin'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-white text-sm whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm text-center py-4">
                          No conversation history yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400">
                    <span>Sent: {new Date(message.created_at).toLocaleString()}</span>
                    <span>Updated: {new Date(message.updated_at).toLocaleString()}</span>
                  </div>

                  {/* Quick Status Update Buttons */}
                  {selectedMessage?.id !== message.id && (
                    <div className="flex flex-wrap gap-2 border-t border-gray-600 pt-3">
                      <span className="text-gray-400 text-sm mr-2">Quick Status:</span>
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(message.id, 'pending')}
                        disabled={message.status === 'pending'}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(message.id, 'in-progress')}
                        disabled={message.status === 'in-progress'}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(message.id, 'resolved')}
                        disabled={message.status === 'resolved'}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(message.id, 'closed')}
                        disabled={message.status === 'closed'}
                        className="bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Closed
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedMessage?.id === message.id ? (
                    <div className="space-y-4 border-t border-gray-600 pt-4">
                      <div>
                        <Label className="text-white mb-2">Admin Response</Label>
                        <Textarea
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          placeholder="Write your response to the user..."
                          rows={4}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2">Update Status</Label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded-md"
                        >
                          <option value="">Keep current status ({message.status})</option>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateMessage}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Save Response
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedMessage(null);
                            setAdminResponse('');
                            setSelectedStatus('');
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white border border-gray-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedMessage(message);
                        setAdminResponse('');
                        setSelectedStatus('');
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white"
                    >
                      Respond
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesManagement;
