import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Navbar from './components/Navbar.jsx'
import { Toast } from './components/UI.jsx'
import Landing from './pages/Landing.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Login from './pages/Login.jsx'
import FarmerDashboard from './pages/FarmerDashboard.jsx'
import LogEntry from './pages/LogEntry.jsx'
import CreditScore from './pages/CreditScore.jsx'
import LoanRequest from './pages/LoanRequest.jsx'
import LenderPortal from './pages/LenderPortal.jsx'
import FarmerProfile from './pages/FarmerProfile.jsx'
import TransactionHistory from './pages/TransactionHistory.jsx'
import TrustVerification from './pages/TrustVerification.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <AppProvider>
      <Navbar />
      <Toast />
      <Routes>
        <Route path="/"                    element={<Landing />} />
        <Route path="/onboard"             element={<Onboarding />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/dashboard"           element={<FarmerDashboard />} />
        <Route path="/log"                 element={<LogEntry />} />
        <Route path="/credit-score"        element={<CreditScore />} />
        <Route path="/loan"                element={<LoanRequest />} />
        <Route path="/lender"              element={<LenderPortal />} />
        <Route path="/lender/farmer/:farmerId" element={<FarmerProfile />} />
        <Route path="/transactions"        element={<TransactionHistory />} />
        <Route path="/trust"  element={<TrustVerification />} />
        <Route path="/404"                 element={<NotFound />} />
        <Route path="*"                    element={<Navigate to="/404" replace />} />
      </Routes>
    </AppProvider>
  )
}
