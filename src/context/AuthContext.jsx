import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('taxsaathi_token') || null);
  const [loading, setLoading] = useState(true);

  // Set up token header and fetch profile on initial load or token change
  useEffect(() => {
    let isMounted = true;

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then((res) => {
          if (isMounted) {
            setUser(res.data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            // Token is invalid or expired
            localStorage.removeItem('taxsaathi_token');
            delete axios.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
            setLoading(false);
          }
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('taxsaathi_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password, confirmPassword, fullName, panNumber) => {
    const res = await axios.post('/api/auth/register', {
      username,
      email,
      password,
      confirm_password: confirmPassword,
      full_name: fullName,
      pan_number: panNumber
    });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('taxsaathi_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/api/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('taxsaathi_token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    const res = await axios.post('/api/auth/forgot-password', { email });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await axios.post('/api/auth/verify-otp', { email, otp });
    return res.data;
  };

  const resetPassword = async (email, resetToken, newPassword, confirmPassword) => {
    const res = await axios.post('/api/auth/reset-password', {
      email,
      reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      verifyOtp,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
