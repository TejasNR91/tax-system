import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import News from './pages/News';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import TaxCalculator from './pages/TaxCalculator';
import CompareRegimes from './pages/CompareRegimes';
import CapitalGains from './pages/CapitalGains';
import PlanningSimulator from './pages/PlanningSimulator';
import Sources from './pages/Sources';
import History from './pages/History';
import Evaluation from './pages/Evaluation';

export default function App() {
  const [selectedFY, setSelectedFY] = useState('2024-25');

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app-wrapper">
          <Navbar selectedFY={selectedFY} setSelectedFY={setSelectedFY} />

          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home selectedFY={selectedFY} />} />
              <Route path="/news" element={<News />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes (Require Authentication) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard selectedFY={selectedFY} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calculator"
                element={
                  <ProtectedRoute>
                    <TaxCalculator selectedFY={selectedFY} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compare"
                element={
                  <ProtectedRoute>
                    <CompareRegimes selectedFY={selectedFY} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <Assistant selectedFY={selectedFY} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/capital-gains"
                element={
                  <ProtectedRoute>
                    <CapitalGains selectedFY={selectedFY} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planning"
                element={
                  <ProtectedRoute>
                    <PlanningSimulator selectedFY={selectedFY} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sources"
                element={
                  <ProtectedRoute>
                    <Sources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluation"
                element={
                  <ProtectedRoute>
                    <Evaluation />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '24px 0', marginTop: '40px' }}>
            <div className="page-container" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '6px' }}>
                🇮🇳 <strong>TaxSaathi AI</strong> — Deterministic Tax Reasoning System for Indian Taxpayers.
              </p>
              <p style={{ fontSize: '0.78rem' }}>
                Informational tax guidance system. Not a substitute for professional tax advice from a registered Chartered Accountant (CA).
              </p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
