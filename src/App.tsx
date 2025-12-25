import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import ScrollToTop from "./components/ScrollToTop";
import Auth from "./pages/Auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordVerify from "./pages/ResetPasswordVerify";

import AdminLogin from "./pages/AdminLogin";
import FlexibleAdminLogin from "./pages/FlexibleAdminLogin";
import Dashboard from "./pages/Dashboard";
import WireAccountSelection from "./pages/WireAccountSelection";
import WireAmountEntry from "./pages/WireAmountEntry";
import WireRecipientForm from "./pages/WireRecipientForm";

import WireAccountInfo from "./pages/WireAccountInfo";
import WireConfirmation from './pages/WireConfirmation';
import WireReview from './pages/WireReview';
import WireAuthorization from './pages/WireAuthorization';
import WireSuccess from './pages/WireSuccess';
import InternalTransfer from './pages/InternalTransfer';
import Crypto from './pages/Crypto';
import CreateCryptoWallet from './pages/CreateCryptoWallet';
import BuyCrypto from './pages/BuyCrypto';
import SellCrypto from './pages/SellCrypto';
import DepositRequest from "./pages/DepositRequest";
import AddMoney from "./pages/AddMoney";
import Beneficiaries from "./pages/Beneficiaries";
import BillPayments from "./pages/BillPayments";
import Bills from "./pages/Bills";
import AutoPay from "./pages/AutoPay";
import AddBill from "./pages/AddBill";
import BillHistory from "./pages/BillHistory";
import Loans from "./pages/Loans";
import Investment from "./pages/Investment";
import BuyStocks from "./pages/BuyStocks";
import SellStocks from "./pages/SellStocks";
import Research from "./pages/Research";
import SetGoals from "./pages/SetGoals";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminTest from "./pages/AdminTest";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Dash from "./pages/Dash";
import Cards from "./pages/Cards";
import CreateCard from "./pages/CreateCard";
import Transactions from "./pages/Transactions";
import Home from "./pages/Home";
import Support from "./pages/Support";
import MyMessages from "./pages/MyMessages";
import Profile from "./pages/Profile";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Statements from "./pages/Statements";
import MobileDeposit from "./pages/MobileDeposit";
import Budgets from "./pages/Budgets";
import RequestMoney from "./pages/RequestMoney";
import EmailSending from "./pages/EmailSending";

const queryClient = new QueryClient();


const App = () => (
  <div className="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <Toaster />
          <Sonner />
          <Router>
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/sign-in" element={<Navigate to="/signin" replace />} />
            <Route path="/sign-up" element={<Navigate to="/signup" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-verify" element={<ResetPasswordVerify />} />

            <Route path="/xk9p2vnz7q" element={<FlexibleAdminLogin />} />
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dash" element={<Dash />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/create-card" element={<CreateCard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/tickets" element={<MyMessages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/transfer" element={<Navigate to="/wire-amount-entry" replace />} />
            <Route path="/wire-account-selection" element={<WireAccountSelection />} />
            <Route path="/wire-amount-entry" element={<WireAmountEntry />} />
          <Route path="/wire-recipient-form" element={<WireRecipientForm />} />

          <Route path="/wire-account-info" element={<WireAccountInfo />} />
          <Route path="/wire-confirmation" element={<WireConfirmation />} />
          <Route path="/wire-review" element={<WireReview />} />
          <Route path="/wire-authorization" element={<WireAuthorization />} />
            <Route path="/wire-success" element={<WireSuccess />} />
            <Route path="/internal-transfer" element={<InternalTransfer />} />
            <Route path="/crypto" element={<Crypto />} />
            <Route path="/create-crypto-wallet" element={<CreateCryptoWallet />} />
            <Route path="/buy-crypto" element={<BuyCrypto />} />
            <Route path="/sell-crypto" element={<SellCrypto />} />
            <Route path="/deposit" element={<DepositRequest />} />
            <Route path="/add-money" element={<AddMoney />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/bill-payments" element={<BillPayments />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/auto-pay" element={<AutoPay />} />
            <Route path="/add-bill" element={<AddBill />} />
            <Route path="/bill-history" element={<BillHistory />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/investment" element={<Investment />} />
            <Route path="/buy-stocks" element={<BuyStocks />} />
            <Route path="/sell-stocks" element={<SellStocks />} />
            <Route path="/research" element={<Research />} />
            <Route path="/set-goals" element={<SetGoals />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/mobile-deposit" element={<MobileDeposit />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/request-money" element={<RequestMoney />} />
            <Route path="/xk9p2vnz7q-dash" element={<AdminDashboard />} />
            <Route path="/xk9p2vnz7q-settings" element={<AdminSettings />} />
            <Route path="/admin-test" element={<AdminTest />} />
            <Route path="/emailsending" element={<EmailSending />} />
            <Route path="/index" element={<Index />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Router>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;
