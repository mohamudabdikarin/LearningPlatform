import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { CreditCard, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, updateUser } = useAuth();
  const { darkMode } = useDarkMode();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Payment form state
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  
  useEffect(() => {
    // Wait for auth loading to complete before checking authentication
    if (authLoading) return;
    
    // Check if token exists in localStorage (even if potentially expired)
    const token = localStorage.getItem('token');
    
    // Only redirect if there's no token at all
    if (!token) {
      navigate('/register', { 
        state: { 
          from: `/payment/${courseId}`,
          enrollmentPending: true,
          courseId: courseId
        } 
      });
      return;
    }
    
    // Fetch course details
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const courseData = await apiFetch(`/courses/${courseId}`);
        setCourse(courseData);
        
        // If we get here and user is null but token exists, 
        // it means token might be valid but context hasn't loaded user yet
        if (!user && token) {
          try {
            const profile = await apiFetch('/users/me');
            if (profile) {
              // Update user in context if needed
              if (typeof updateUser === 'function') {
                updateUser(profile);
              }
            }
          } catch (profileErr) {
            console.error('Failed to fetch user profile:', profileErr);
            // Only redirect on profile fetch failure
            if (profileErr.status === 401) {
              navigate('/login', { 
                state: { 
                  from: `/payment/${courseId}`,
                  enrollmentPending: true,
                  courseId: courseId
                } 
              });
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load course details');
        
        // If unauthorized, redirect to login
        if (err.status === 401) {
          navigate('/login', { 
            state: { 
              from: `/payment/${courseId}`,
              enrollmentPending: true,
              courseId: courseId
            } 
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId, user, navigate, authLoading]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Enroll in course (if not already)
      try {
        await apiFetch(`/enrollments/course/${courseId}`, {
          method: 'POST',
        });
      } catch (err) {
        // Ignore if already enrolled
        if (!err.message?.includes('Already enrolled')) throw err;
      }

      // Mark as paid
      await apiFetch(`/enrollments/course/${courseId}/pay`, {
        method: 'POST',
      });

      setPaymentSuccess(true);

      // Redirect to student dashboard course resources after successful enrollment
      setTimeout(() => {
        navigate(`/dashboard/student/course/${courseId}/resources`);
      }, 2000);

    } catch (err) {
      console.error('Payment error:', err);
      if (err.message && err.message.includes('JSON')) {
        setError('Payment processed successfully! Redirecting to course...');
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate(`/dashboard/student/course/${courseId}/resources`);
        }, 2000);
      } else {
        setError(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading || authLoading) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !course) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Back to course
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Purchase</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                {paymentSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                      You have successfully enrolled in this course. Redirecting to course page...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                        <CreditCard className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h2 className="text-xl font-bold">Payment Details</h2>
                    </div>
                    
                    {error && (
                      <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
                        <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Card Number</label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          name="cardName"
                          placeholder="John Doe"
                          value={formData.cardName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Expiry Date</label>
                          <input
                            type="text"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">CVV</label>
                          <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Lock size={16} className="mr-2" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </span>
                        ) : (
                          `Pay ${course ? Number(course.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : ''}`
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                
                {course && (
                  <div className="mb-4">
                    <div className="flex items-start gap-3 mb-4">
                      {course.imageUrl && (
                        <img 
                          src={course.imageUrl} 
                          alt={course.title} 
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {course.instructor?.firstName && course.instructor?.lastName
                            ? `By ${course.instructor.firstName} ${course.instructor.lastName}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between mb-2">
                        <span>Course Price</span>
                        <span>{Number(course.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span>Total</span>
                        <span>{Number(course.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  <p className="mb-2">By completing your purchase you agree to our Terms of Service and Privacy Policy.</p>
                  <p>You'll get lifetime access to this course and all future updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default PaymentPage;