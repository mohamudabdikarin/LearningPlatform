import React, { useState, useEffect } from 'react';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { IoSchoolOutline } from "react-icons/io5";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiService';

const ResetPasswordPage = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validateForm = () => {
    const errors = {};
    
    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear errors when user starts typing
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setError(Object.values(formErrors)[0]); // Show first error
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          token: token,
          password: form.password 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      setMessage(response.message || 'Password reset successfully!');
      setForm({ password: '', confirmPassword: '' });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.response && err.response.error) {
        setError(err.response.error);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={`${darkMode ? 'dark' : ''}`}>
        <Navbar />
        <div className="font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen w-full flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <IoSchoolOutline size={50} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Reset Link</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <Navbar />
      <div className="font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen w-full flex items-center justify-center p-4">
        <main className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Left Side: Decorative Panel */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-indigo-600 text-white text-center">
            <IoSchoolOutline size={70} className="mb-6 opacity-80" />
            <h1 className="text-2xl font-bold leading-tight mb-3">
                Set New Password
            </h1>
            <p className="text-indigo-100 opacity-90 max-w-sm text-base">
                Enter your new password below to complete the reset process.
            </p>
          </div>

          {/* Right Side: Reset Password Form */}
          <div className="p-8 flex flex-col justify-center">
            <div className="w-full max-w-xs mx-auto">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-[#2B2FAF] dark:hover:text-[#A5A8F5] mb-6 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Sign In
              </button>

              <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white">Reset Password</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Enter your new password below.
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
                {/* New Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B2FAF] focus:border-[#2B2FAF] border-gray-300 dark:border-gray-600 focus:shadow-lg"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B2FAF] focus:border-[#2B2FAF] border-gray-300 dark:border-gray-600 focus:shadow-lg"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : 'Reset Password'}
                  </button>
                </div>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="font-semibold text-indigo-600 dark:text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
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

export default ResetPasswordPage; 