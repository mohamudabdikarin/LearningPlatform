import React, { useState } from 'react';
import { FiSun, FiMoon, FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { IoSchoolOutline } from "react-icons/io5";
import DarkModeToggle from '../components/DarkModeToggle';
import { useDarkMode } from '../context/DarkModeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiService';

const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Trusted email providers (major, legitimate providers)
const trustedEmailProviders = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 
    'protonmail.com', 'zoho.com', 'mail.com', 'gmx.com', 'yandex.com', 'live.com',
    'msn.com', 'me.com', 'mac.com', 'fastmail.com', 'tutanota.com', 'hey.com'
];

// Disposable/temporary email providers to block
const disposableEmailProviders = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'sharklasers.com', 'guerrillamailblock.com',
    'pokemail.net', 'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com',
    'fakeinbox.com', 'fakeinbox.net', 'getairmail.com', 'getnada.com', 'inbox.si',
    'mailnesia.com', 'mintemail.com', 'mohmal.com', 'nwytg.net', 'sharklasers.com',
    'spamspot.com', 'spam.la', 'tempr.email', 'tmpeml.com', 'trashmail.com',
    'yopmail.com', 'yopmail.net', 'yopmail.org', 'cool.fr.nf', 'jetable.fr.nf',
    'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
    'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'test.com', 'example.com',
    'test.org', 'example.org', 'test.net', 'example.net', 'sss.com', 'aaa.com',
    'fake.com', 'fake.org', 'fake.net', 'temp.com', 'temp.org', 'temp.net'
];

const isValidEmailProvider = (email) => {
    const match = email.match(/^[^@]+@([^@]+)$/);
    if (!match) return false;
    const domain = match[1].toLowerCase();
    
    // Check if it's a disposable email
    if (disposableEmailProviders.some(provider => domain.includes(provider))) {
        return { valid: false, reason: 'disposable' };
    }
    
    // Check if it's a trusted provider
    if (trustedEmailProviders.some(provider => domain.endsWith(provider))) {
        return { valid: true, reason: 'trusted' };
    }
    
    // For other domains, we'll allow them but flag for manual review
    return { valid: true, reason: 'other' };
};
// Name validation: only letters (allow spaces and hyphens)
const isValidName = (name) => /^[A-Za-z\s'-]+$/.test(name);
// Password validation: min 8, upper, lower, number, special
const isStrongPassword = (pw) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
// Password validation helpers - only warn about truly problematic passwords
const isWeakPassword = (pw) => {
    if (!pw) return false;
    
    // Very short passwords (less than 6 characters)
    if (pw.length < 6) return true;
    
    // All same character (e.g., "aaaaaa")
    if (/^(.)\1+$/.test(pw)) return true;
    
    // All numbers (e.g., "123456")
    if (/^\d+$/.test(pw)) return true;
    
    // Common weak patterns
    const commonWeakPasswords = [
        'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
        'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'hello',
        'freedom', 'whatever', 'qwerty123', 'trustno1', 'jordan', 'harley',
        'ranger', 'iwantu', 'jennifer', 'hunter', 'buster', 'soccer',
        'baseball', 'tiger', 'charlie', 'andrew', 'michelle', 'love',
        'sunshine', 'jordan23', 'iloveyou', 'fuckyou', '123123', 'football',
        'basketball', 'superman', 'batman', 'spiderman', 'ironman', 'captain',
        'marvel', 'avengers', 'starwars', 'harrypotter', 'gameofthrones'
    ];
    
    if (commonWeakPasswords.includes(pw.toLowerCase())) return true;
    
    // Sequential patterns (e.g., "abcd", "1234")
    if (/^(.)\1{2,}$/.test(pw) || /^(.)(.)\1\2/.test(pw)) return true;
    
    return false;
};

// Password strength rating - more user-friendly
const getPasswordStrength = (pw) => {
    if (!pw || pw.length < 6) return { label: '', color: '' };
    
    // Very weak: common passwords, all same char
    const commonWeakPasswords = [
        'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
        'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'hello'
    ];
    
    if (commonWeakPasswords.includes(pw.toLowerCase()) || /^(.)\1+$/.test(pw)) {
        return { label: 'Very Weak', color: 'text-red-600 dark:text-red-400' };
    }
    
    // Weak: all numbers
    if (/^\d+$/.test(pw)) {
        return { label: 'Weak', color: 'text-orange-600 dark:text-orange-400' };
    }
    
    // Good: at least 6 chars with some variety
    if (pw.length >= 6) {
        return { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400' };
    }
    
    // Strong: at least 8 chars with good variety
    if (pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) {
        return { label: 'Strong', color: 'text-green-600 dark:text-green-400' };
    }
    
    // Very Strong: at least 8 chars with all character types
    if (pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) {
        return { label: 'Very Strong', color: 'text-emerald-600 dark:text-emerald-400' };
    }
    
    // Default to Good for reasonable passwords
    return { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400' };
};

const RegisterPage = () => {
    const { darkMode } = useDarkMode();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordWarning, setPasswordWarning] = useState('');
    const [ignorePasswordWarning, setIgnorePasswordWarning] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
        // Dynamic password warning
        if (name === 'password') {
            setIgnorePasswordWarning(false);
            if (value.length >= 6 && isWeakPassword(value)) {
                setPasswordWarning('This password is commonly used and may be easy to guess. Consider using a more unique password for better security.');
            } else {
                setPasswordWarning('');
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.firstName) newErrors.firstName = 'First name is required.';
        else if (!isValidName(form.firstName)) newErrors.firstName = 'First name must contain only letters.';
        if (!form.lastName) newErrors.lastName = 'Last name is required.';
        else if (!isValidName(form.lastName)) newErrors.lastName = 'Last name must contain only letters.';
        if (!form.email) newErrors.email = 'Email address is required.';
        else if (!validateEmail(form.email)) newErrors.email = 'Please enter a valid email address.';
        else {
            const emailValidation = isValidEmailProvider(form.email);
            if (!emailValidation.valid) {
                newErrors.email = 'Temporary or disposable email addresses are not allowed. Please use a real email address.';
            } else if (emailValidation.reason === 'other') {
                // Allow but show a warning
                console.log('Non-standard email domain detected:', form.email);
            }
        }
        if (!form.password) newErrors.password = 'Password is required.';
        else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
        if (!form.role) newErrors.role = 'Role is required.';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        // If warning is present and not ignored, stop here and show continue button
        if (passwordWarning && !ignorePasswordWarning) {
            setIgnorePasswordWarning(false); // force show button
            return;
        }
        setLoading(true);
        setApiError('');
        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(form),
                headers: { 'Content-Type': 'application/json' },
            });
            
            // Check if email verification is required
            if (data.requiresVerification) {
                setApiError('');
                setMessage(data.message || 'Registration successful! Please check your email to verify your account.');
                setTimeout(() => {
                    navigate('/verify-email', { state: { email: form.email, password: form.password } });
                }, 1000);
                return;
            } else {
                // If no verification required (fallback), proceed with login
                login(data);
            const params = new URLSearchParams(location.search);
            const next = params.get('next');
            if (next) {
                navigate(next, { replace: true });
            } else {
                navigate('/dashboard');
                }
            }
        } catch (err) {
            // Handle different error response formats
            if (err.response && err.response.error) {
                // Structured error response
                setApiError(err.response.error);
            } else if (err.message) {
                // Plain error message
            setApiError(err.message);
            } else {
                // Fallback error
                setApiError('Registration failed. Please try again.');
            }
        }
        setLoading(false);
    };

    const passwordStrength = getPasswordStrength(form.password);

    return (
        <div className={`${darkMode ? 'dark' : ''}`}>
            <Navbar />
            <div className="font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen w-full flex items-center justify-center p-4">

                <main className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-indigo-600 text-white text-center">
                        <IoSchoolOutline size={70} className="mb-6 opacity-80" />
                        <h1 className="text-2xl font-bold leading-tight mb-3">
                            Join MyCourse.io
                        </h1>
                        <p className="text-indigo-100 opacity-90 max-w-sm text-base">
                            Create your account to access all courses and features.
                        </p>
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                        <div className="w-full max-w-xs mx-auto">
                            <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white">Register</h2>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Fill in your details to create an account.</p>
                            {message && (
                                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                                    <span className="block sm:inline">{message}</span>
                                </div>
                            )}
                            {apiError && (
                                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                                    <span className="block sm:inline">{apiError}</span>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <FiUser className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        </span>
                                        <input
                                            id="firstName" name="firstName" type="text" autoComplete="given-name"
                                            value={form.firstName} onChange={handleChange} placeholder="First Name"
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${errors.firstName ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:shadow-lg`}
                                        />
                                    </div>
                                    {errors.firstName && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <FiUser className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        </span>
                                        <input
                                            id="lastName" name="lastName" type="text" autoComplete="family-name"
                                            value={form.lastName} onChange={handleChange} placeholder="Last Name"
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${errors.lastName ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:shadow-lg`}
                                        />
                                    </div>
                                    {errors.lastName && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>}
                                </div>
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email" name="email" type="email" autoComplete="email"
                                            value={form.email} onChange={handleChange} placeholder="you@example.com"
                                            className={`w-full pl-4 pr-4 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${errors.email ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:shadow-lg`}
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
                                        <input
                                            id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                                            value={form.password} onChange={handleChange} placeholder="Your password"
                                            className={`w-full pl-4 pr-10 py-2 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${errors.password ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:shadow-lg`}
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
                                {passwordWarning && (
                                    <div className="mt-1.5 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 px-3 py-2 rounded-lg flex items-center gap-2">
                                        <span>⚠️ {passwordWarning}</span>
                                    </div>
                                )}
                                {passwordStrength.label && (
                                    <div className={`mt-1.5 text-sm font-semibold ${passwordStrength.color}`}>{passwordStrength.label} password</div>
                                )}
                                {/* Role Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Register as
                                    </label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="role"
                                                value="STUDENT"
                                                checked={form.role === 'STUDENT'}
                                                onChange={handleChange}
                                                className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-600 border-gray-300 dark:border-gray-600 transition-all duration-200"
                                            />
                                            <span className="ml-2 text-gray-700 dark:text-gray-100 font-medium">Student</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="role"
                                                value="TEACHER"
                                                checked={form.role === 'TEACHER'}
                                                onChange={handleChange}
                                                className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-600 border-gray-300 dark:border-gray-600 transition-all duration-200"
                                            />
                                            <span className="ml-2 text-gray-700 dark:text-gray-100 font-medium">Teacher</span>
                                        </label>
                                    </div>
                                    {errors.role && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
                                </div>
                                <div className="pt-2">
                                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B2FAF] dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Registering...
                                            </>
                                        ) : 'Register'}
                                    </button>
                                </div>
                            </form>
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Already have an account?{' '}
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
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

export default RegisterPage; 