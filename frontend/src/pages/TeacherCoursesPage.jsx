import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Star, Clock, BarChart3 } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import CourseCard from '../components/CourseCard';
const emptyCourse = { title: '', description: '', price: '', imageUrl: '', videoUrl: '', discountPrice: '', discountActive: false };

const extractDriveFileId = (urlOrId) => {
    if (!urlOrId) return '';
    // If it's just an ID, return as is
    if (/^[a-zA-Z0-9_-]{10,}$/.test(urlOrId)) return urlOrId;
    // Try to extract from a Google Drive link
    const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    return match ? match[1] : '';
};

function formatPrice(price) {
    return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const TeacherCoursesPage = () => {
    const { user } = useAuth();
    const { darkMode } = useDarkMode();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyCourse);
    const [success, setSuccess] = useState('');
    const [imgUploading, setImgUploading] = useState(false);
    const [imgError, setImgError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');
    const modalRef = useRef(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);


    useEffect(() => {
        if (!user) return;
        setLoading(true);
        apiFetch(`/courses/instructor/${user.id}`)
            .then(setCourses)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [user]);

    // Focus trap for modal
    useEffect(() => {
        if (showForm && modalRef.current) {
            modalRef.current.focus();
        }
    }, [showForm]);

    const handleChange = e => {
        const { name, value } = e.target;
        if (name === 'videoFileId') {
            setForm({ ...form, [name]: extractDriveFileId(value) });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleEdit = course => {
        setEditId(course.id);
        setForm({
            ...course,
            price: course.price || '',
            imageUrl: course.imageUrl || '',
            instructor: course.instructor, // ensure instructor is included
            id: course.id // ensure id is included
        });
        setSuccess('');
        setError('');
        setImgError('');
        setShowForm(true);
    };

    const handleDelete = id => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };
    const confirmDelete = async () => {
        // Remove window.confirm; modal is sufficient
        setError("");
        setSuccess("");
        try {
            await apiFetch(`/courses/${deleteId}`, { method: 'DELETE' });
            setCourses(courses.filter(c => c.id !== deleteId));
            setSuccess('Course deleted.');
        } catch (e) {
            setError(e.message || 'Failed to delete course.');
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    const handleImageUpload = async e => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFileName(file.name);
        setImgUploading(true);
        setImgError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            let res;
            try {
                res = await apiFetch('/upload', {
                    method: 'POST',
                    body: formData,
                    headers: {},
                });
            } catch (err) {
                // If backend returns non-JSON error, show generic error
                setImgError(err.message || 'Image upload failed.');
                setImgUploading(false);
                return;
            }
            if (res && res.url) {
                setForm(f => ({ ...f, imageUrl: res.url }));
            } else {
                setImgError('Image upload failed. Please try again.');
            }
        } catch (e) {
            setImgError(e.message || 'Image upload failed.');
        } finally {
            setImgUploading(false);
        }
    };

    const handleVideoUpload = async e => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedVideoName(file.name);
        setVideoUploading(true);
        setVideoError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await apiFetch('/upload', {
                method: 'POST',
                body: formData,
                headers: {}, // Let browser set Content-Type
            });
            const url = await res;
            setForm(f => ({ ...f, videoUrl: url }));
        } catch (e) {
            setVideoError('Video upload failed.');
        } finally {
            setVideoUploading(false);
        }
    };

    const handleRemoveVideo = async () => {
        if (!form.videoUrl) return;
        const filename = form.videoUrl.split('/').pop();
        try {
            await apiFetch(`/upload/${filename}`, { method: 'DELETE' });
        } catch (e) {
            // Optionally show error, but allow removal from form
        }
        setForm(f => ({ ...f, videoUrl: '' }));
        setSelectedVideoName('');
    };

    const validateForm = () => {
        const errors = [];

        if (!form.title.trim()) {
            errors.push('Title is required');
        }

        if (!form.description.trim()) {
            errors.push('Description is required');
        }

        if (!form.price) {
            errors.push('Price is required');
        } else if (isNaN(form.price) || Number(form.price) < 0) {
            errors.push('Price must be a valid positive number');
        }

        if (form.discountActive) {
            if (!form.discountPrice) {
                errors.push('Discount price is required when discount is enabled');
            } else if (isNaN(form.discountPrice) || Number(form.discountPrice) < 0) {
                errors.push('Discount price must be a valid positive number');
            } else if (Number(form.discountPrice) >= Number(form.price)) {
                errors.push('Discount price must be less than the regular price');
            }
        }

        return errors;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError(''); setSuccess('');

        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(
                <ul className="list-disc pl-5">
                    {validationErrors.map((err, index) => (
                        <li key={index}>{err}</li>
                    ))}
                </ul>
            );
            return;
        }
        try {
            let createdOrUpdated;
            if (editId) {
                createdOrUpdated = await apiFetch(`/courses/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...form, id: editId, instructor: form.instructor }),
                });
                setCourses(courses.map(c => (c.id === editId ? createdOrUpdated : c)));
                setSuccess('Course updated!');
            } else {
                createdOrUpdated = await apiFetch('/courses', {
                    method: 'POST',
                    body: JSON.stringify(form),
                });
                setCourses([...courses, createdOrUpdated]);
                setSuccess('Course created!');
            }
            setEditId(null);
            setForm(emptyCourse);
            setShowForm(false);

            if (form.discountActive && form.discountPrice) {
                await apiFetch(`/courses/${createdOrUpdated.id}/discount`, {
                    method: 'PUT',
                    body: JSON.stringify({ discountPrice: form.discountPrice, discountActive: true }),
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                await apiFetch(`/courses/${createdOrUpdated.id}/discount`, {
                    method: 'DELETE',
                });
            }

        } catch (e) {
            setError(e.message || 'Failed to save course.');
        }
    };

    const handleCreateClick = () => {
        setEditId(null);
        setForm(emptyCourse);
        setError('');
        setSuccess('');
        setImgError('');
        setShowForm(true);
    };

    if (!user) return <div className="p-8 text-center">Login required.</div>;
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h2>
                    <button
                        className="px-5 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition"
                        onClick={handleCreateClick}
                    >
                        + Create Course
                    </button>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        <span className="ml-3 text-blue-600 font-medium">Loading courses...</span>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : (
                    <div className="w-full">
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10"
                            role="list"
                            aria-label="My Courses List"
                        >
                            {courses.map(course => (
                                <CourseCard key={course.id} course={course} onEdit={() => handleEdit(course)} onDelete={() => handleDelete(course.id)} />
                            ))}
                        </div>
                        {courses.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-10">No courses found.</div>
                        )}
                    </div>
                )}
                {/* Modal for Create/Edit Course */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div
                            ref={modalRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-y-auto w-full max-w-2xl mx-auto p-4 sm:p-6 focus:outline-none "
                        >
                            <button
                                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                                onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCourse); setError(''); setSuccess(''); setImgError(''); }}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                                {editId ? 'Edit Course' : 'Create a New Course'}
                            </h2>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                                Enter course details below.
                            </p>

                            {success && (
                                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-700 dark:text-green-300">{success}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Please correct the following errors:</h3>
                                            <div className="mt-1">
                                                {error}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Mobile-first vertical layout, desktop horizontal */}
                                <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
                                    {/* Left Column - Basic Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Course Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="title"
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-sm"
                                                required
                                                placeholder="e.g., Complete Web Development Bootcamp"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                rows="4"
                                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-sm resize-none"
                                                required
                                                placeholder="Describe what students will learn in this course..."
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Price (USD) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                                                <input
                                                    id="price"
                                                    name="price"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.price}
                                                    onChange={handleChange}
                                                    className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-sm"
                                                    required
                                                    placeholder="99.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Media & Pricing */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Course Image
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        id="course-image-input"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        disabled={imgUploading}
                                                    />
                                                    <label
                                                        htmlFor="course-image-input"
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 text-sm font-medium"
                                                    >
                                                        {imgUploading ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 text-indigo-600" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                                </svg>
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                Choose Image
                                                            </>
                                                        )}
                                                    </label>
                                                    {selectedFileName && !imgUploading && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px] md:max-w-[150px]">
                                                            {selectedFileName}
                                                        </span>
                                                    )}
                                                </div>
                                                {imgError && <p className="text-red-500 text-xs">{imgError}</p>}
                                                {form.imageUrl && (
                                                    <div className="relative">
                                                        <img
                                                            src={form.imageUrl}
                                                            alt="Course preview"
                                                            className="w-full h-32 sm:h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Discount Pricing
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="discount-active"
                                                        checked={form.discountActive}
                                                        onChange={(e) => setForm((f) => ({ ...f, discountActive: e.target.checked }))}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                                                    />
                                                    <label htmlFor="discount-active" className="text-sm text-gray-700 dark:text-gray-300">
                                                        Enable discount pricing
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                                                    <input
                                                        name="discountPrice"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={form.discountPrice}
                                                        onChange={handleChange}
                                                        className={`w-full pl-8 pr-3 py-2.5 rounded-lg border transition-colors text-sm
                                                        ${!form.discountActive
                                                                ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600'} 
                                                        placeholder-gray-400 dark:placeholder-gray-500`}
                                                        placeholder="49.00"
                                                        disabled={!form.discountActive}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:space-x-4">
                                    <button
                                        type="submit"
                                        disabled={imgUploading}
                                        className="w-full sm:w-auto py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        {editId ? 'Update Course' : 'Create Course'}
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full sm:w-auto py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-indigo-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-gray-800 transition-all duration-300"
                                        onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCourse); setError(''); setSuccess(''); setImgError(''); }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Course</h2>
                            <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to delete this course? This action cannot be undone.</p>
                            <div className="flex gap-4 justify-end">
                                <button className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}>Cancel</button>
                                <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700" onClick={confirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



function CoursesListUserView({ courses, handleViewDetails }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
                <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-md flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                    {/* Course Image & Badge */}
                    <div className="relative">
                        <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover" />
                        {course.isBestseller && (
                            <span className="absolute top-3 right-3 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">Bestseller</span>
                        )}
                    </div>

                    {/* Course Content */}
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1">
                            {/* Tags */}
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full"><BarChart3 size={14} /> {course.level}</span>
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full"><Clock size={14} /> {course.duration}</span>
                            </div>

                            {/* Title & Description */}
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{course.description}</p>
                        </div>

                        {/* Footer: Rating, Price & CTA */}
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${course.price}</span>
                                <div className="flex items-center mt-1">
                                    <Star size={16} className="text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{course.rating} ({course.reviewCount} reviews)</span>
                                </div>
                            </div>
                            <button
                                className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                                onClick={() => handleViewDetails(course)}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TeacherCoursesPage; 