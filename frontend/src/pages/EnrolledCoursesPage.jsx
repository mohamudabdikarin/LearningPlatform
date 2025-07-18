import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DemoPaymentModal = ({ open, onClose, onPay, course }) => {
    const [form, setForm] = useState({
        name: '',
        card: '',
        expiry: '',
        cvc: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        if (open) {
            setForm({ name: '', card: '', expiry: '', cvc: '' });
            setErrors({});
            setApiError('');
        }
    }, [open]);

    if (!open) return null;

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
            await onPay();
        } catch (err) {
            setApiError(err.message || 'Payment failed');
        }
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

const EnrolledCoursesPage = () => {
    const { user } = useAuth();
    const [enrolled, setEnrolled] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        Promise.all([
            apiFetch('/enrollments/me'),
            apiFetch('/courses'),
        ])
            .then(([enrollments, allCourses]) => {
                setEnrolled(enrollments.map(e => e.course.id));
                setCourses(allCourses);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [user]);

    const handleEnroll = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        if (!user) {
            // Not authenticated: redirect to login with next param
            navigate(`/login?next=/enroll?courseId=${courseId}`);
            return;
        }
        // Authenticated: redirect to enroll/payment page
        navigate(`/enroll?courseId=${courseId}`);
    };

    const handleUnenroll = async (courseId) => {
        setError(''); setActionMsg('');
        try {
            await apiFetch(`/enrollments/course/${courseId}`, { method: 'DELETE' });
            setEnrolled(enrolled.filter(id => id !== courseId));
            setActionMsg('Unenrolled.');
        } catch (e) {
            setError(e.message);
        }
    };

    if (!user) return <div className="p-8 text-center">Login required.</div>;
    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow mt-8">
            <h2 className="text-2xl font-bold mb-4">My Enrolled Courses</h2>
            {actionMsg && <div className="mb-3 text-green-600">{actionMsg}</div>}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-2">Enrolled</h3>
                <div className="space-y-4">
                    {courses.filter(c => enrolled.includes(c.id)).length === 0 && <div>Not enrolled in any courses.</div>}
                    {courses.filter(c => enrolled.includes(c.id)).map(course => (
                        <div key={course.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="font-bold">{course.title}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{course.description}</div>
                                <div className="text-sm text-gray-500">${course.price}</div>
                            </div>
                            <button className="px-3 py-1 bg-red-500 text-white rounded mt-2 md:mt-0" onClick={() => handleUnenroll(course.id)}>Unenroll</button>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-2">Available Courses</h3>
                <div className="space-y-4">
                    {courses.filter(c => !enrolled.includes(c.id)).length === 0 && <div>All courses enrolled.</div>}
                    {courses.filter(c => !enrolled.includes(c.id)).map(course => (
                        <div key={course.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="font-bold">{course.title}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{course.description}</div>
                                <div className="text-sm text-gray-500">${course.price}</div>
                            </div>
                            <button className="px-3 py-1 bg-sky-600 text-white rounded mt-2 md:mt-0" onClick={() => handleEnroll(course.id)}>Enroll</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EnrolledCoursesPage; 