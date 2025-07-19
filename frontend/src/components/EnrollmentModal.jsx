import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

const EnrollmentModal = ({ course, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', card: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name required';
    if (!form.card.trim() || form.card.replace(/\s/g, '').length < 12) errs.card = 'Card number invalid';
    if (!form.expiry.trim() || !/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = 'Expiry MM/YY';
    if (!form.cvc.trim() || form.cvc.length < 3) errs.cvc = 'CVC invalid';
    return errs;
  };

  const handleChange = e => { 
    setForm({ ...form, [e.target.name]: e.target.value }); 
    setErrors({ ...errors, [e.target.name]: '' }); 
  };

  const handleSubmit = async e => {
    e.preventDefault(); 
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { 
      setErrors(errs); 
      return; 
    }
    setLoading(true);
    try { 
      await handleEnrollment(); 
    } catch (err) { 
      setApiError(err.message || 'Enrollment failed'); 
    }
    setLoading(false);
  };

  const handleEnrollment = async () => {
    if (!course) return;
    
    try {
      await apiFetch(`/enrollments/course/${course.id}`, { method: 'POST' });
      onSuccess && onSuccess();
      onClose();
      // Navigate to the course within the student dashboard
      navigate(`/dashboard/student/course/${course.id}`);
    } catch (e) {
      throw new Error(e.message || 'Enrollment failed');
    }
  };

  const handleFreeEnrollment = async () => {
    setLoading(true);
    try {
      await handleEnrollment();
    } catch (err) {
      setApiError(err.message || 'Enrollment failed');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in mx-4">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" 
          onClick={onClose} 
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enroll in Course
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {course?.title}
          </p>
        </div>

        {course && Number(course.price) === 0 ? (
          // Free course enrollment
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Free Course
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This course is completely free. Click below to enroll immediately.
              </p>
            </div>
            
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {apiError}
              </div>
            )}
            
            <button 
              onClick={handleFreeEnrollment}
              disabled={loading}
              className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enrolling...' : 'Enroll for Free'}
            </button>
          </div>
        ) : (
          // Paid course enrollment
          <>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Course Price:</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  ${course?.price}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name on Card
                </label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Card Number
                </label>
                <input 
                  name="card" 
                  value={form.card} 
                  onChange={handleChange} 
                  maxLength={19} 
                  placeholder="1234 5678 9012 3456" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.card && <div className="text-red-500 text-xs mt-1">{errors.card}</div>}
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input 
                    name="expiry" 
                    value={form.expiry} 
                    onChange={handleChange} 
                    maxLength={5} 
                    placeholder="08/27" 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.expiry && <div className="text-red-500 text-xs mt-1">{errors.expiry}</div>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVC
                  </label>
                  <input 
                    name="cvc" 
                    value={form.cvc} 
                    onChange={handleChange} 
                    maxLength={4} 
                    placeholder="123" 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.cvc && <div className="text-red-500 text-xs mt-1">{errors.cvc}</div>}
                </div>
              </div>
              
              {apiError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  {apiError}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay ${course?.price}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EnrollmentModal; 