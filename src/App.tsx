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

// Protected Pages (Placeholders)
import Home from './pages/Home';
import TopUp from './pages/TopUp';
const Wallet = () => <div className="p-8">Wallet</div>;
import NewDeal from './pages/NewDeal';
import Orders from './pages/Orders';
const DealTimeline = () => <div className="p-8">Deal Timeline</div>;
const ShareDeal = () => <div className="p-8">Share Deal</div>;
import LockFunds from './pages/LockFunds';
import LockFundsParser from './pages/LockFundsParser';
const DealChat = () => <div className="p-8">Deal Chat</div>;
const RaiseDispute = () => <div className="p-8">Raise Dispute</div>;
import Profile from './pages/Profile';
const TransactionReceipt = () => <div className="p-8">Receipt</div>;
const BankSetup = () => <div className="p-8">Bank Setup</div>;
const Withdraw = () => <div className="p-8">Withdraw</div>;

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

        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/wallet/top-up" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/lock" element={<ProtectedRoute><LockFundsParser /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/new" element={<ProtectedRoute><NewDeal /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><DealTimeline /></ProtectedRoute>} />
        <Route path="/orders/:id/share" element={<ProtectedRoute><ShareDeal /></ProtectedRoute>} />
        <Route path="/orders/:id/lock" element={<ProtectedRoute><LockFunds /></ProtectedRoute>} />
        <Route path="/orders/:id/chat" element={<ProtectedRoute><DealChat /></ProtectedRoute>} />
        <Route path="/orders/:id/dispute" element={<ProtectedRoute><RaiseDispute /></ProtectedRoute>} />
        <Route path="/orders/:id/receipt" element={<ProtectedRoute><TransactionReceipt /></ProtectedRoute>} />
        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/bank" element={<ProtectedRoute><BankSetup /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
