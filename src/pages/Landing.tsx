import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  DollarSign,
  PiggyBank,
  Building2,
  Globe,
  Lock,
  ArrowUpRight,
  Heart,
  Award
} from "lucide-react";

const Landing = () => {
  const { websiteName, logoUrl, primaryColor } = useSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{backgroundImage: "url('/hero-image.png')", backgroundSize: "cover", backgroundPosition: "center"}}>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {logoUrl ? (
                <img src={logoUrl} alt={websiteName} className="h-10 w-auto" />
              ) : (
                <Building2 className="h-8 w-8 text-white" />
              )}
              <span className="text-xl font-bold text-white">{websiteName}</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#services" className="text-gray-300 hover:text-white transition-colors">Services</a>
              <Link to="/about" className="text-gray-300 hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/sign-in">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
         <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
           <div className="mb-8">
             <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
               Your Money,
               <br />
               <span className="text-red-500">Your Control</span>
             </h1>
             
             <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
               Experience the future of banking with instant transfers, AI-powered insights, 
               and security that never sleeps. Join the financial revolution today.
             </p>
           </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Why Choose {websiteName}?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine cutting-edge technology with human-centered design to deliver 
              an unparalleled banking experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <CardContent className="p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <Zap className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-semibold text-white mb-4">Lightning Fast</h3>
                 <p className="text-gray-200 leading-relaxed">
                   Send and receive money in seconds, not days. Our advanced infrastructure 
                   ensures your transactions are processed instantly.
                 </p>
               </CardContent>
             </Card>
 
             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <CardContent className="p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <Shield className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-semibold text-white mb-4">Bank-Grade Security</h3>
                 <p className="text-gray-200 leading-relaxed">
                   Your security is our priority. Multi-layer encryption, biometric authentication, 
                   and real-time fraud monitoring keep your money safe.
                 </p>
               </CardContent>
             </Card>
 
             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <CardContent className="p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <TrendingUp className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-semibold text-white mb-4">Smart Insights</h3>
                 <p className="text-gray-200 leading-relaxed">
                   AI-powered spending analysis and personalized recommendations help you 
                   make smarter financial decisions every day.
                 </p>
               </CardContent>
             </Card>
 
             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <CardContent className="p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <Smartphone className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-semibold text-white mb-4">Mobile First</h3>
                 <p className="text-gray-200 leading-relaxed">
                   Beautiful, intuitive mobile app that puts the full power of modern 
                   banking right in your pocket.
                 </p>
               </CardContent>
             </Card>
 
             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <CardContent className="p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <DollarSign className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-semibold text-white mb-4">Zero Fees</h3>
                 <p className="text-gray-200 leading-relaxed">
                   No monthly fees, no minimum balance requirements, no hidden charges. 
                   Keep more of your money where it belongs - with you.
                 </p>
               </CardContent>
             </Card>
 
             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <CardContent className="p-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <Heart className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-semibold text-white mb-4">24/7 Support</h3>
                 <p className="text-gray-200 leading-relaxed">
                   Real humans, ready to help. Get instant support whenever you need it 
                   through chat, phone, or email.
                 </p>
               </CardContent>
             </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From everyday banking to advanced financial tools, we've got you covered 
              with a complete suite of financial services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mb-6">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Digital Banking</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-red-400 mr-3" />
                    Instant account opening
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-red-400 mr-3" />
                    Real-time notifications
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-red-400 mr-3" />
                    Mobile check deposit
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-red-400 mr-3" />
                    Bill pay automation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-6">
                  <PiggyBank className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Wealth Building</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                    Automated savings goals
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                    Investment portfolios
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                    Retirement planning
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                    Financial insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Business Solutions</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-3" />
                    Business accounts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-3" />
                    Payment processing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-3" />
                    Expense management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-3" />
                    Financial reporting
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-red-600 mb-2">50K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">$2B+</div>
              <div className="text-gray-600">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">4.8/5</div>
              <div className="text-gray-600">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of people who have already taken control of their finances. 
            Start your journey to financial freedom today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all">
                Get Started Now
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-6 text-lg font-semibold rounded-xl">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-t border-slate-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {websiteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
