import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'react-hot-toast';

// Public Pages (Placeholders)
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';

import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import PublicOrderSummary from './pages/PublicOrderSummary';
import CompactAuth from './pages/CompactAuth';

// Protected Pages (Placeholders)
import Home from './pages/Home';
import TopUp from './pages/TopUp';
import NewDeal from './pages/NewDeal';
import Orders from './pages/Orders';
import DealTimeline from './pages/DealTimeline';
import TransactionHistory from './pages/TransactionHistory';
import Notifications from './pages/Notifications';
import ShareDeal from './pages/ShareDeal';
import LockFunds from './pages/LockFunds';
import LockFundsParser from './pages/LockFundsParser';
import BuyerConfirmation from './pages/BuyerConfirmation';
import RaiseDispute from './pages/RaiseDispute';
import Messages from './pages/Messages';
import DealChat from './pages/DealChat';
import Profile from './pages/Profile';
import PaymentSettings from './pages/PaymentSettings';
import PinSetup from './pages/PinSetup';
import BankSetup from './pages/BankSetup';
import WithdrawAmount from './pages/WithdrawAmount';
import WithdrawSummary from './pages/WithdrawSummary';
import WithdrawPin from './pages/WithdrawPin';
import WithdrawSuccess from './pages/WithdrawSuccess';
import EscrowReceipt from './pages/EscrowReceipt';
import SimpleReceipt from './pages/SimpleReceipt';
import AdminDisputes from './pages/AdminDisputes';



// Auth Guard Placeholder
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // const isAuthenticated = false; // TODO: Hook up to auth state
  // TODO: Add redirect logic preserving intended route
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1d2022',
            color: '#e0e3e5',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }} 
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/o/:slug" element={<PublicOrderSummary />} />
        <Route path="/orders/:slug/auth" element={<CompactAuth />} />

        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/wallet/top-up" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/lock" element={<ProtectedRoute><LockFundsParser /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/orders/new" element={<ProtectedRoute><NewDeal /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><DealTimeline /></ProtectedRoute>} />
        <Route path="/orders/:id/share" element={<ProtectedRoute><ShareDeal /></ProtectedRoute>} />
        <Route path="/orders/:id/lock" element={<ProtectedRoute><LockFunds /></ProtectedRoute>} />
        <Route path="/orders/:id/chat" element={<ProtectedRoute><DealChat /></ProtectedRoute>} />
        <Route path="/orders/:id/confirm" element={<ProtectedRoute><BuyerConfirmation /></ProtectedRoute>} />
        <Route path="/orders/:id/dispute" element={<ProtectedRoute><RaiseDispute /></ProtectedRoute>} />
        <Route path="/orders/:id/receipt" element={<ProtectedRoute><EscrowReceipt /></ProtectedRoute>} />
        <Route path="/transactions/:id/receipt" element={<ProtectedRoute><SimpleReceipt /></ProtectedRoute>} />
        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/payment-settings" element={<ProtectedRoute><PaymentSettings /></ProtectedRoute>} />
        <Route path="/settings/pin-setup" element={<ProtectedRoute><PinSetup /></ProtectedRoute>} />
        <Route path="/bank-setup" element={<ProtectedRoute><BankSetup /></ProtectedRoute>} />
        <Route path="/withdraw/amount" element={<ProtectedRoute><WithdrawAmount /></ProtectedRoute>} />
        <Route path="/withdraw/summary" element={<ProtectedRoute><WithdrawSummary /></ProtectedRoute>} />
        <Route path="/withdraw/pin" element={<ProtectedRoute><WithdrawPin /></ProtectedRoute>} />
        <Route path="/withdraw/success" element={<ProtectedRoute><WithdrawSuccess /></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute><AdminDisputes /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
