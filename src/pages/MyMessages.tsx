import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send
} from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
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

const MyMessages = () => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, MessageReply[]>>({});
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          await Promise.all([
            fetchUserData(),
            loadMessages(parsedUser.id)
          ]);
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error initializing page:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
          console.error('Error loading replies:', repliesError);
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
      console.error('Error loading messages:', error);
      toast.error('Failed to load your messages');
    }
  };

  const handleReply = async (messageId: string) => {
    const reply = replyText[messageId]?.trim();
    if (!reply) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setIsSubmitting({ ...isSubmitting, [messageId]: true });

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Insert user reply into message_replies table
      const { error: replyError } = await supabase
        .from('message_replies')
        .insert({
          message_id: messageId,
          user_id: user.id,
          sender_type: 'user',
          content: reply
        });

      if (replyError) throw replyError;

      // Update message status to pending when user replies
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) throw updateError;

      toast.success('Reply sent successfully!');
      setReplyText({ ...replyText, [messageId]: '' });
      
      // Reload messages
      if (user?.id) {
        loadMessages(user.id);
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSubmitting({ ...isSubmitting, [messageId]: false });
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

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={userData} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="text-left mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <MessageCircle className="h-8 w-8 mr-3 text-gray-600" />
            My Support Tickets
          </h2>
          <p className="text-gray-600">View your support tickets and responses from our team.</p>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't sent any support messages. If you need help, visit our Support page.
              </p>
              <button
                onClick={() => navigate('/support')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                Go to Support
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <Card key={msg.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{msg.subject}</h3>
                        {getStatusBadge(msg.status)}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(msg.category)}`}>
                        {msg.category}
                      </span>
                    </div>

                    {/* Message Content - Collapsible */}
                    <div>
                      <button
                        onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {expandedMessage === msg.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {expandedMessage === msg.id ? 'Hide Details' : 'Show Details'}
                        </span>
                      </button>
                      
                      {expandedMessage === msg.id && (
                        <div className="mt-4 space-y-4">
                          {/* Conversation Thread */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                            <p className="text-xs font-semibold text-gray-500 mb-3">Conversation:</p>
                            <div className="space-y-3">
                              {messageReplies[msg.id]?.length > 0 ? (
                                messageReplies[msg.id].map((reply) => (
                                  <div
                                    key={reply.id}
                                    className={`p-3 rounded-lg ${
                                      reply.sender_type === 'user'
                                        ? 'bg-blue-50 border border-blue-200 ml-0 mr-8'
                                        : 'bg-green-50 border border-green-200 ml-8 mr-0'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-semibold ${
                                        reply.sender_type === 'user' ? 'text-blue-700' : 'text-green-700'
                                      }`}>
                                        {reply.sender_type === 'user' ? '👤 You' : '👨‍💼 Support Team'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(reply.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-gray-900 text-sm whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-400 text-sm text-center py-4">
                                  No conversation history yet
                                </div>
                              )}
                            </div>
                            
                            {/* Timestamps */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                              <span>Sent: {new Date(msg.created_at).toLocaleString()}</span>
                              <span>Updated: {new Date(msg.updated_at).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Waiting for Response */}
                          {msg.status !== 'closed' &&
                           msg.status !== 'resolved' &&
                           messageReplies[msg.id]?.length > 0 && 
                           messageReplies[msg.id][messageReplies[msg.id].length - 1].sender_type === 'user' && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <p className="text-sm text-yellow-800">
                                  Waiting for response from our support team...
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Reply Section - Only show if not closed and last message is from admin */}
                          {msg.status !== 'closed' && 
                           messageReplies[msg.id]?.length > 0 && 
                           messageReplies[msg.id][messageReplies[msg.id].length - 1].sender_type === 'admin' && (
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Send a reply:
                              </p>
                              <Textarea
                                value={replyText[msg.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                                placeholder="Type your reply here..."
                                rows={3}
                                className="w-full mb-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                              />
                              <Button
                                onClick={() => handleReply(msg.id)}
                                disabled={isSubmitting[msg.id] || !replyText[msg.id]?.trim()}
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                {isSubmitting[msg.id] ? 'Sending...' : 'Send Reply'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>Created: {new Date(msg.created_at).toLocaleDateString()}</span>
                      {msg.admin_response && (
                        <span>• Updated: {new Date(msg.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-16"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MyMessages;
