import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiService';

const DemoPaymentModal = ({ open, onClose, onPay, course }) => {
    const [form, setForm] = useState({ name: '', card: '', expiry: '', cvc: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    useEffect(() => { if (open) { setForm({ name: '', card: '', expiry: '', cvc: '' }); setErrors({}); setApiError(''); } }, [open]);
    if (!open) return null;
    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name required';
        if (!form.card.trim() || form.card.replace(/\s/g, '').length < 12) errs.card = 'Card number invalid';
        if (!form.expiry.trim() || !/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = 'Expiry MM/YY';
        if (!form.cvc.trim() || form.cvc.length < 3) errs.cvc = 'CVC invalid';
        return errs;
    };
    const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setErrors({ ...errors, [e.target.name]: '' }); };
    const handleSubmit = async e => {
        e.preventDefault(); setApiError('');
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setLoading(true);
        try { await onPay(); } catch (err) { setApiError(err.message || 'Payment failed'); }
        setLoading(false);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full relative animate-fade-in">
                <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={onClose} aria-label="Close">&times;</button>
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Pay for {course?.title}</h2>
                <p className="mb-4 text-gray-600 dark:text-gray-400">Course price: <span className="font-semibold text-indigo-600 dark:text-indigo-400">${course?.price}</span></p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name on Card</label>
                        <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 rounded border" />
                        {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Card Number</label>
                        <input name="card" value={form.card} onChange={handleChange} maxLength={19} placeholder="1234 5678 9012 3456" className="w-full px-3 py-2 rounded border" />
                        {errors.card && <div className="text-red-500 text-xs mt-1">{errors.card}</div>}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Expiry (MM/YY)</label>
                            <input name="expiry" value={form.expiry} onChange={handleChange} maxLength={5} placeholder="08/27" className="w-full px-3 py-2 rounded border" />
                            {errors.expiry && <div className="text-red-500 text-xs mt-1">{errors.expiry}</div>}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">CVC</label>
                            <input name="cvc" value={form.cvc} onChange={handleChange} maxLength={4} placeholder="123" className="w-full px-3 py-2 rounded border" />
                            {errors.cvc && <div className="text-red-500 text-xs mt-1">{errors.cvc}</div>}
                        </div>
                    </div>
                    {apiError && <div className="text-red-600 text-sm mt-2">{apiError}</div>}
                    <button type="submit" disabled={loading} className="w-full py-2 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50 mt-2">{loading ? 'Processing...' : `Pay $${course?.price}`}</button>
                </form>
            </div>
        </div>
    );
};

const EnrollPage = () => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { courseId } = useParams(); // Get courseId from URL parameter
    const [course, setCourse] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            // Not authenticated: redirect to login with next param
            navigate(`/login`, { 
                state: { 
                    from: `/enroll/${courseId}`,
                    enrollmentPending: true,
                    courseId: courseId
                } 
            });
            return;
        }
        if (!user) return;
        // Fetch course details
        setFetching(true);
        apiFetch(`/courses/${courseId}`)
            .then(courseData => {
                setCourse(courseData);
                setFetching(false);
            })
            .catch(e => { 
                console.error("Error fetching course:", e);
                setError('Failed to load course.'); 
                setFetching(false); 
            });
    }, [user, loading, courseId, navigate]);

    const handlePay = async () => {
        if (!course) return;
        setError('');
        try {
            await apiFetch(`/enrollments/course/${course.id}`, { method: 'POST' });
            // Redirect to course resources page
            navigate(`/dashboard/student/course/${course.id}`);
        } catch (e) {
            setError(e.message);
        }
    };

    if (fetching || loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!course) return <div className="p-8 text-center text-gray-500">Course not found.</div>;

    // Free course: enroll directly
    if (user && course && Number(course.price) === 0) {
        handlePay();
        return <div className="p-8 text-center">Enrolling...</div>;
    }

    return (
        <DemoPaymentModal open={true} onClose={() => navigate('/enrollments')} onPay={handlePay} course={course} />
    );
};

export default EnrollPage; 