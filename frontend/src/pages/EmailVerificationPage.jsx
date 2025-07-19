import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const EmailVerificationPage = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthUser } = useAuth();
  const email = location.state?.email || '';
  const password = location.state?.password || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiFetch('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
        headers: { 'Content-Type': 'application/json' },
      });
      // Auto-login after verification
      if (email && password) {
        try {
          const loginData = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' },
          });
          setAuthUser(loginData); // Set user in AuthContext
          setMessage('Email verified! Logging you in...');
          setTimeout(() => navigate('/dashboard'), 1500);
          return;
        } catch (loginErr) {
          setMessage('Email verified! Logging you in...');
          setTimeout(() => navigate('/dashboard'), 1500);
          return;
        }
      }
      setMessage('Email verified! Logging you in...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.error || err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });
      setMessage('Verification code resent!');
    } catch (err) {
      setError(err.response?.error || err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Verify Your Email</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Enter the 6-digit code sent to <span className="font-semibold text-[#2B2FAF] dark:text-[#A5A8F5]">{email}</span>.
          </p>
          {message && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 text-sm text-center">{message}</div>}
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              autoFocus
              className="w-full px-4 py-2 rounded-lg border border-[#2B2FAF] dark:border-[#A5A8F5] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#2B2FAF] focus:border-[#2B2FAF]"
              placeholder="------"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B2FAF] dark:focus:ring-offset-gray-800"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-semibold text-[#2B2FAF] dark:text-[#A5A8F5] hover:underline disabled:opacity-50"
            >
              {resending ? 'Resending...' : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage; 