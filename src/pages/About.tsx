import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Globe, 
  Award, 
  Heart,
  ArrowRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';

const About = () => {
  const { websiteName, logoUrl } = useSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Navigation */}
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
            <Link to="/" className="text-white hover:text-gray-200 transition-colors">Home</Link>
            <a href="#features" className="text-white hover:text-gray-200 transition-colors">Features</a>
            <a href="#services" className="text-white hover:text-gray-200 transition-colors">Services</a>
            <Link to="/about" className="text-white font-medium">About</Link>
            <Link to="/contact" className="text-white hover:text-gray-200 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/sign-in">
              <Button variant="ghost" className="text-white hover:text-gray-200 hover:bg-white/10">
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About Our Mission
          </h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            We're redefining banking by putting people first. Our innovative platform combines 
            cutting-edge technology with personalized service to deliver exceptional financial experiences.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Built for Your Financial Journey
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded with a vision to democratize financial services, we believe everyone deserves 
                  access to sophisticated banking tools and personalized financial guidance.
                </p>
                <p>
                  Our platform represents a new era of banking where technology serves people, 
                  not the other way around. We combine the reliability of traditional banking with 
                  the innovation of modern fintech.
                </p>
                <p>
                  Every feature we build is designed with one goal in mind: empowering you to achieve 
                  your financial objectives with confidence and ease.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white">
                <Building2 className="h-12 w-12 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
                <p className="text-red-100">
                  Transparency, security, and innovation drive everything we do. We're not just 
                  building a bank – we're building a financial partner you can trust.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              These principles guide every decision we make and every feature we build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Security First</h3>
                <p className="text-gray-300 leading-relaxed">
                  Bank-grade security with multi-layer encryption, biometric authentication, 
                  and real-time fraud monitoring to keep your money safe.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Innovation</h3>
                <p className="text-gray-300 leading-relaxed">
                  Constantly evolving our platform with cutting-edge technology to deliver 
                  faster, smarter, and more intuitive financial solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Customer Focus</h3>
                <p className="text-gray-300 leading-relaxed">
                  Every feature is designed with our customers in mind. Real humans providing 
                  real support whenever you need it.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Globe className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Accessibility</h3>
                <p className="text-gray-300 leading-relaxed">
                  Making sophisticated financial tools available to everyone, regardless 
                  of their background or financial knowledge.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Award className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Excellence</h3>
                <p className="text-gray-300 leading-relaxed">
                  Striving for perfection in every interaction, every transaction, 
                  and every customer experience we deliver.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Heart className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Transparency</h3>
                <p className="text-gray-300 leading-relaxed">
                  Clear, honest communication about our services, fees, and policies. 
                  No hidden charges, no surprises.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              We're here to help you with any questions or concerns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Phone Support</h3>
              <p className="text-gray-300 mb-2">Speak with our experts</p>
              <p className="text-white font-semibold">1-800-BANK-NOW</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Email Us</h3>
              <p className="text-gray-300 mb-2">Get detailed assistance</p>
              <p className="text-white font-semibold">support@unitycapital.com</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Visit Us</h3>
              <p className="text-gray-300 mb-2">Find your nearest branch</p>
              <Link to="#" className="text-red-400 hover:text-red-300 font-semibold">
                Branch Locator
              </Link>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Hours</h3>
              <p className="text-gray-300 mb-2">When we're available</p>
              <p className="text-white font-semibold">24/7 Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-red-100 mb-8 leading-relaxed">
            Join thousands of satisfied customers who have already made the switch to smarter banking.
          </p>
          <Link to="/sign-up">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
