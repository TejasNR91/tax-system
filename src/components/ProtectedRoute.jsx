import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid var(--border)',
          borderTopColor: 'var(--saffron)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          Verifying security session...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login while preserving the attempted URL for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
