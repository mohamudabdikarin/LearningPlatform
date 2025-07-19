import React, { useState } from 'react';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { IoSchoolOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiService';

// Email validation function
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const ForgotPasswordPage = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email) {
      setError('Email address is required.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });

      setMessage(response.message || 'Password reset email sent successfully!');
      setEmail(''); // Clear email for security
    } catch (err) {
      if (err.response && err.response.error) {
        setError(err.response.error);
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <Navbar />
      <div className="font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen w-full flex items-center justify-center p-4">
        <main className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Left Side: Decorative Panel */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-indigo-600 text-white text-center">
            <IoSchoolOutline size={70} className="mb-6 opacity-80" />
            <h1 className="text-2xl font-bold leading-tight mb-3">
              Reset Your Password
            </h1>
            <p className="text-indigo-100 opacity-90 max-w-sm text-base">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Right Side: Forgot Password Form */}
          <div className="p-8 flex flex-col justify-center">
            <div className="w-full max-w-xs mx-auto">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-[#2B2FAF] dark:hover:text-[#A5A8F5] mb-6 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Sign In
              </button>

              <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white">Forgot Password</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {message && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                  <span className="block sm:inline">{message}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <form noValidate className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiMail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 border-gray-300 dark:border-gray-600 focus:shadow-lg"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B2FAF] dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                </div>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="font-semibold text-[#2B2FAF] dark:text-[#A5A8F5] hover:text-[#23268a] dark:hover:text-[#2B2FAF] transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 