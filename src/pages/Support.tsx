import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  HelpCircle, 
  CreditCard,
  DollarSign,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Support = () => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    category: "Account Issues",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          await fetchUserData();
        } else {
          navigate("/auth");
        }
      } catch (error) {
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
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to send a message");
        return;
      }


      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          subject: formData.subject.trim(),
          category: formData.category,
          message: formData.message.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        
        // Check if table doesn't exist
        if (error.code === '42P01') {
          toast.error('Messages table not found. Please contact support.');
        } else {
          throw error;
        }
        return;
      }


      // Insert the initial message into message_replies table
      if (data) {
        const { error: replyError } = await supabase
          .from('message_replies')
          .insert({
            message_id: data.id,
            user_id: user.id,
            sender_type: 'user',
            content: formData.message.trim()
          });

        if (replyError) {
          // Don't fail the whole operation if this fails
        }
      }

      toast.success("Message sent successfully! We'll get back to you soon.");
      
      // Reset form
      setFormData({
        subject: "",
        category: "Account Issues",
        message: ""
      });

    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
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
      <Header 
        user={userData} 
        showBackButton={true} 
        title="Support" 
        onBackClick={() => navigate('/dashboard')} 
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="text-left mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Support Center
          </h2>
          <p className="text-gray-600">We're here to help you with any questions or concerns.</p>
        </div>

        {/* FAQ Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <HelpCircle className="h-6 w-6 mr-2 text-gray-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Find quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* FAQ Item 1 */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleFAQ(0)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-semibold text-gray-900">How do I report a lost or stolen card?</span>
                </div>
                {openFAQ === 0 ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openFAQ === 0 && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <p className="text-gray-600 pt-3">
                    Call our 24/7 hotline immediately at 1-800-UCB-HELP to report and block your card. 
                    You can also use our mobile app to temporarily freeze your card.
                  </p>
                </div>
              )}
            </div>
            
            {/* FAQ Item 2 */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleFAQ(1)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-semibold text-gray-900">How do I transfer money to another account?</span>
                </div>
                {openFAQ === 1 ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openFAQ === 1 && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <p className="text-gray-600 pt-3">
                    Use our mobile app or online banking to transfer funds instantly to other UCB accounts 
                    or external banks. Go to Transfer section and follow the simple steps.
                  </p>
                </div>
              )}
            </div>
            
            {/* FAQ Item 3 */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleFAQ(2)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-semibold text-gray-900">How secure is online banking?</span>
                </div>
                {openFAQ === 2 ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openFAQ === 2 && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <p className="text-gray-600 pt-3">
                    We use enterprise-grade encryption and multi-factor authentication to protect your account 
                    and personal information. Your data is secured with industry-leading security measures.
                  </p>
                </div>
              )}
            </div>
            
            {/* FAQ Item 4 */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleFAQ(3)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-semibold text-gray-900">What are your customer service hours?</span>
                </div>
                {openFAQ === 3 ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openFAQ === 3 && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <p className="text-gray-600 pt-3">
                    Phone support is available 24/7. Live chat is available 9 AM - 9 PM EST. 
                    Email support responses are typically within 24 hours.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Send us a Message</CardTitle>
            <CardDescription className="text-gray-600">
              Fill out the form below and we'll get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject" className="text-gray-700">Subject</Label>
                  <Input 
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="What can we help you with?" 
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-gray-700">Category</Label>
                  <select 
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-md focus:border-gray-500 focus:ring-gray-500 focus:outline-none"
                  >
                    <option>Account Issues</option>
                    <option>Card Problems</option>
                    <option>Transfer Issues</option>
                    <option>Technical Support</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="message" className="text-gray-700">Message</Label>
                <Textarea 
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your issue in detail..."
                  rows={5}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
                <Button 
                  type="button"
                  onClick={() => navigate('/tickets')}
                  variant="outline"
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  View My Tickets
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-16"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Support;