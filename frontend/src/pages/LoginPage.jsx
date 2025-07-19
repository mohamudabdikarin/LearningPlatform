import React, { useState } from 'react';
// To use react-icons, you would typically run: npm install react-icons
// We are importing icons from Feather and Ionicons 5 for a clean, modern look.
import { FiSun, FiMoon, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { IoSchoolOutline } from "react-icons/io5";
import DarkModeToggle from '../components/DarkModeToggle';
import { useDarkMode } from '../context/DarkModeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiService';

// A simple email validation function
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Email validation: must be from a major provider
const validEmailProviders = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'mail.com', 'gmx.com'
];
const isValidProviderEmail = (email) => {
  const match = email.match(/^[^@]+@([^@]+)$/);
  if (!match) return false;
  const domain = match[1].toLowerCase();
  return validEmailProviders.some(provider => domain.endsWith(provider));
};
// Password validation: only check if password is provided (login should not enforce length)
const isValidLoginPassword = (pw) => pw && pw.length > 0;

const LoginPage = () => {
  const { darkMode } = useDarkMode();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email address is required.';
    else if (!validateEmail(form.email)) newErrors.email = 'Please enter a valid email address.';
    if (!form.password) newErrors.password = 'Password is required.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      const formErrors = validateForm();
      
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        // Focus on the first error field
        const firstErrorField = Object.keys(formErrors)[0];
        const errorElement = document.getElementById(firstErrorField);
        if (errorElement) {
          errorElement.focus();
        }
        return;
      }
      
      setLoading(true);
      setApiError('');
      setErrors({}); // Clear previous field errors
      
      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify(form),
          headers: { 'Content-Type': 'application/json' },
        });
        
        // Store the login data first
        login(data);
        
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          // Redirect to next param if present
          const params = new URLSearchParams(location.search);
          const next = params.get('next');
          if (next) {
            navigate(next, { replace: true });
          } else {
            navigate('/dashboard');
          }
        }, 100);
        
      } catch (err) {
        // Handle specific error responses from backend
        if (err.response && err.response.error && err.response.field) {
          if (err.response.field === 'general') {
            setApiError(err.response.error);
          } else {
            // Set field-specific error and focus on the field
            setErrors(prev => ({
              ...prev,
              [err.response.field]: err.response.error
            }));
            // Focus on the error field
            const errorElement = document.getElementById(err.response.field);
            if (errorElement) {
              errorElement.focus();
            }
          }
        } else {
          setApiError(err.message);
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      // If there's any error in the form submission, prevent default behavior
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <Navbar />
      {/* This container now enforces a fixed screen height and prevents scrolling */}
      <div className="font-sans bg-gray-100 mt-[-30px] dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen w-full flex items-center justify-center">



      

        {/* Reduced max-width to prevent the form from looking oversized */}
        <main className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* Left Side: Decorative Panel */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-indigo-600 text-white text-center">
            <IoSchoolOutline size={70} className="mb-6 opacity-80" />
            <h1 className="text-2xl font-bold leading-tight mb-3">
              Your Learning Journey
            </h1>
            <p className="text-indigo-100 opacity-90 max-w-sm text-base">
              Sign in to access courses, track progress, and join our community.
            </p>
          </div>

          {/* Right Side: Login Form */}
          <div className="p-8 flex flex-col justify-center">
            <div className="w-full max-w-xs mx-auto">
              <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white">Sign In</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Enter your credentials to continue.</p>

              {apiError && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                  <span className="block sm:inline">{apiError}</span>
                </div>
              )}

              <form 
                noValidate 
                className="space-y-4" 
                onSubmit={handleSubmit}
                method="POST"
                autoComplete="on"
              >
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
                      id="email" name="email" type="email" autoComplete="username"
                      value={form.email} onChange={handleChange} placeholder="Your email"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${errors.email ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:shadow-lg`}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                {/* Password Input with Eye Toggle */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input
                      id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                      value={form.password} onChange={handleChange} placeholder="Your password"
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${errors.password ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:shadow-lg`}
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
                  {errors.password && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Signing In...
                      </>
                    ) : 'Sign In'}
                  </button>
                </div>
              </form>

              {/* Registration Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Not registered yet?{' '}
                  <button 
                    onClick={() => navigate('/register')}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Register now
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

export default LoginPage;             