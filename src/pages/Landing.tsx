import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  Shield, 
  Zap, 
  Lock, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  Globe, 
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  DollarSign,
  PiggyBank,
  Building2,
  ChevronRight
} from "lucide-react";

const Landing = () => {
  const { websiteName, logoUrl, primaryColor } = useSettings();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Background Image (extends to header) */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Full Screen Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-image.png"
            alt="Financial Dashboard"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-gray-900/70 to-black/80"></div>
        </div>

        {/* Transparent Header */}
        <header className="relative z-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 md:py-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {logoUrl ? (
                  <>
                    <img 
                      src={logoUrl} 
                      alt={websiteName} 
                      className="h-10 sm:h-12 md:h-14 w-auto object-contain"
                    />
                    <div className="flex flex-col">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{websiteName}</h1>
                    </div>
                  </>
                ) : (
                  <>
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{websiteName}</h1>
                  </>
                )}
              </div>
              <nav className="hidden lg:flex items-center space-x-8">
                <a href="#features" className="text-gray-200 hover:text-white font-medium transition-colors">Features</a>
                <a href="#services" className="text-gray-200 hover:text-white font-medium transition-colors">Services</a>
                <Link to="/about" className="text-gray-200 hover:text-white font-medium transition-colors">About</Link>
                <Link to="/contact" className="text-gray-200 hover:text-white font-medium transition-colors">Contact</Link>
              </nav>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link to="/sign-in">
                  <Button variant="outline" size="sm" className="border-2 border-white/70 text-white hover:bg-white hover:text-gray-900 transition-all backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-4">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button 
                    size="sm" 
                    style={{ backgroundColor: primaryColor }}
                    className="hover:opacity-90 text-white shadow-lg text-xs sm:text-sm px-3 sm:px-4"
                  >
                    Open Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 text-center">
          <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg px-2">
            Financial Management Made{" "}
            <span className="text-blue-400">Simple</span> &{" "}
            <span className="text-blue-400">Secure</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md px-4">
            Experience modern financial management with instant transfers, real-time insights, 
            and enterprise-grade security. Take control of your financial future.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 sm:mb-12 md:mb-16 px-4">
            <Link to="/sign-up" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                style={{ backgroundColor: primaryColor }}
                className="w-full sm:w-auto hover:opacity-90 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                OPEN FREE ACCOUNT
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link to="/sign-in" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl transition-all backdrop-blur-sm">
                SIGN IN
              </Button>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 md:gap-8 text-sm sm:text-base text-gray-200 px-4">
            <div className="flex items-center backdrop-blur-sm bg-white/10 px-3 sm:px-4 py-2 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
              No hidden fees
            </div>
            <div className="flex items-center backdrop-blur-sm bg-white/10 px-3 sm:px-4 py-2 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
              Secure Platform
            </div>
            <div className="flex items-center backdrop-blur-sm bg-white/10 px-3 sm:px-4 py-2 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
              24/7 Access
            </div>
          </div>

          {/* Floating Stats Cards */}
          <div className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 animate-float">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-gray-300">Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">Real-Time</p>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 animate-float-delayed">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-gray-300">Protection</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">Enterprise-Level</p>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 animate-float sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-gray-300">Service</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">Round-the-Clock</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <a 
          href="#features"
          className="hidden sm:block absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Scroll to features"
        >
          <div className="w-5 h-8 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/70 rounded-full mt-1.5"></div>
          </div>
        </a>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose {websiteName}?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the modern world with cutting-edge technology and uncompromising security.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Enterprise Security</h3>
                <p className="text-gray-600">Your data is protected with advanced encryption and multi-factor authentication.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Instant Transfers</h3>
                <p className="text-gray-600">Send and receive money instantly with our real-time transfer system, 24/7.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Mobile First</h3>
                <p className="text-gray-600">Manage your finances on-the-go with our award-winning mobile app.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Smart Insights</h3>
                <p className="text-gray-600">Get personalized insights and track your spending with detailed analytics.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Complete Financial Platform
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your finances, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Finance</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Account Management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Digital Wallets
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Transaction History
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Balance Tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <PiggyBank className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Savings & Growth</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Savings Tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Financial Goals
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Portfolio Overview
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Financial Planning
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:bg-gray-50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Tools</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Business Dashboard
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Payment Processing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Expense Tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                    Financial Reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">2M+</div>
              <div className="text-sm sm:text-base text-gray-600">Trusted Customers</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">$50B+</div>
              <div className="text-sm sm:text-base text-gray-600">Assets Under Management</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-sm sm:text-base text-gray-600">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Ready to Transform Your Financial Management?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join our community and take control of your finances today. 
            Get started now and experience modern financial management.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/sign-up" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold"
              >
                Open Account Now
              </Button>
            </Link>
            <Link to="/sign-in" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold">{websiteName}</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 {websiteName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
