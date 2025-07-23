import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Star, Clock, BarChart3 } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import CourseCard from '../components/CourseCard';
const emptyCourse = { title: '', description: '', price: '', imageUrl: '', discountPrice: '', discountActive: false };
const PLACEHOLDER_IMAGE_URL = '/uploads/placeholder.png'; // Fallback image when uploads fail
const BACKEND_URL = "http://localhost:8080"; // Backend URL for proxy

// Helper function to convert Nhost URLs to proxy URLs for display
const getDisplayUrl = (url, isVideo = false) => {
    if (!url) return null;
    if (url.startsWith('blob:')) return url; // Local preview URLs
    if (url.includes('nhost.run')) {
        // Extract file ID from Nhost URL and use proxy
        const match = url.match(/\/v1\/files\/([^/?]+)/);
        if (match && match[1]) {
            return `${BACKEND_URL}/api/proxy/${isVideo ? 'file' : 'image'}/${match[1]}`;
        }
    }
    return url; // Return as-is for other URLs
};

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
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const modalRef = useRef(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [localImagePreview, setLocalImagePreview] = useState(null);


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

    const handleImageSelect = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        setImgError('');
        
        // Check file size before storing
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            setImgError(`File size exceeds 5MB limit. Please choose a smaller image.`);
            return;
        }

        setSelectedFileName(file.name);
        setSelectedImageFile(file);
        setLocalImagePreview(URL.createObjectURL(file)); // Show instant preview
    };

    const uploadImageFile = async () => {
        if (!selectedImageFile) return null;

        setImgUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedImageFile);

            // If we're editing a course and it has an existing image, extract the file ID
            // to tell the backend to delete it before uploading the new one
            let existingFileId = null;
            if (form.imageUrl && form.imageUrl.includes('nhost.run')) {
                // Extract file ID from Nhost URL
                const match = form.imageUrl.match(/\/v1\/files\/([^/?]+)/);
                if (match && match[1]) {
                    existingFileId = match[1];
                    formData.append('existingFileId', existingFileId);
                    console.log('Replacing existing file:', existingFileId);
                }
            }

            // Implement retry logic for uploads
            const maxRetries = 3;
            let retryCount = 0;
            let res = null;

            while (retryCount < maxRetries) {
                try {
                    res = await apiFetch('/upload', {
                        method: 'POST',
                        body: formData,
                        headers: {},
                        timeout: 60000, // Increase timeout for uploads to 60 seconds
                    });

                    if (res && res.url) {
                        break; // Success, exit retry loop
                    } else {
                        throw new Error('Upload response missing URL');
                    }
                } catch (err) {
                    retryCount++;
                    console.log(`Upload attempt ${retryCount} failed:`, err.message);

                    if (retryCount >= maxRetries) {
                        // All retries failed
                        throw err;
                    }

                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                }
            }

            if (res && res.url) {
                return res.url;
            } else {
                throw new Error('Upload failed - no URL returned');
            }
        } catch (e) {
            console.error('Image upload error:', e);
            setImgError(`Upload failed: ${e.message || 'Connection error'}. Please try again later.`);
            throw e;
        } finally {
            setImgUploading(false);
        }
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
            // Upload image first if there's a selected file
            let formToSubmit = { ...form };
            if (selectedImageFile) {
                const imageUrl = await uploadImageFile();
                formToSubmit.imageUrl = imageUrl;
            }

            let createdOrUpdated;
            if (editId) {
                createdOrUpdated = await apiFetch(`/courses/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...formToSubmit, id: editId, instructor: formToSubmit.instructor }),
                });
                setCourses(courses.map(c => (c.id === editId ? createdOrUpdated : c)));
                setSuccess('Course updated!');
            } else {
                createdOrUpdated = await apiFetch('/courses', {
                    method: 'POST',
                    body: JSON.stringify(formToSubmit),
                });
                setCourses([...courses, createdOrUpdated]);
                setSuccess('Course created!');
            }
            
            // Reset form and states
            setEditId(null);
            setForm(emptyCourse);
            setSelectedImageFile(null);
            setLocalImagePreview(null);
            setSelectedFileName('');
            setShowForm(false);

            if (formToSubmit.discountActive && formToSubmit.discountPrice) {
                await apiFetch(`/courses/${createdOrUpdated.id}/discount`, {
                    method: 'PUT',
                    body: JSON.stringify({ discountPrice: formToSubmit.discountPrice, discountActive: true }),
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
        setSelectedImageFile(null);
        setLocalImagePreview(null);
        setSelectedFileName('');
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div
                            ref={modalRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            className="relative bg-white dark:bg-gray-800 max-h-[500px] rounded-2xl shadow-xl overflow-y-auto  max-w-2xl mx-auto p-4 sm:p-6 md:p-8 focus:outline-none"

                        >
                            <button
                                className="absolute top-3 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl z-10 w-8 h-8 flex items-center justify-center rounded-full dark:hover:bg-gray-700 transition-colors"
                                onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCourse); setSelectedImageFile(null); setLocalImagePreview(null); setSelectedFileName(''); setError(''); setSuccess(''); setImgError(''); }}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                            <div className="mb-6 sm:mb-8">
                                <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                                    {editId ? 'Edit Course' : 'Create a New Course'}
                                </h2>
                                <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                    Enter course details below.
                                </p>
                            </div>

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

                            <form onSubmit={handleSubmit}>
                                {/* Mobile-first vertical layout, desktop horizontal */}
                                {/* Responsive form layout - stacks on mobile, grid on larger screens */}
                                <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
                                    {/* Left Column - Basic Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Course Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="title"
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                className="w-full px-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Price (USD) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base">$</span>
                                                <input
                                                    id="price"
                                                    name="price"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.price}
                                                    onChange={handleChange}
                                                    className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-sm sm:text-base"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right Column - Image & Discount */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Course Image
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <input
                                                        id="course-image-input"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageSelect}
                                                        className="hidden"
                                                        disabled={imgUploading}
                                                    />
                                                    <label
                                                        htmlFor="course-image-input"
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 text-sm font-medium"
                                                    >
                                                        {imgUploading ? (
                                                            <>
                                                                <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                                                <span>Uploading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                <span>Choose Image</span>
                                                            </>
                                                        )}
                                                    </label>
                                                    {selectedFileName && !imgUploading && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-full sm:max-w-[200px]">{selectedFileName}</span>
                                                    )}
                                                    {imgError && selectedFileName && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const fileInput = document.getElementById('course-image-input');
                                                                if (fileInput && fileInput.files && fileInput.files[0]) {
                                                                    handleImageSelect({ target: { files: fileInput.files } });
                                                                }
                                                            }}
                                                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-colors text-xs font-medium"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                            Retry Upload
                                                        </button>
                                                    )}
                                                </div>
                                                {imgError && <p className="text-red-500 text-xs">{imgError}</p>}
                                                {(localImagePreview || form.imageUrl) && (
                                                    <div className="relative mt-2">
                                                        <img
                                                            src={localImagePreview || getDisplayUrl(form.imageUrl)}
                                                            alt="Course preview"
                                                            className="w-full h-24 sm:h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Discount Pricing
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="discount-active"
                                                        checked={form.discountActive}
                                                        onChange={(e) => setForm((f) => ({ ...f, discountActive: e.target.checked }))}
                                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                                                    />
                                                    <label htmlFor="discount-active" className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                                        Enable discount pricing
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base">$</span>
                                                    <input
                                                        name="discountPrice"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={form.discountPrice}
                                                        onChange={handleChange}
                                                        className={`w-full pl-9 pr-4 py-3 rounded-lg border transition-colors text-sm sm:text-base
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
                                <div className="mt-6 flex sm:flex-row gap-3 sm:gap-4 border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCourse); setSelectedImageFile(null); setLocalImagePreview(null); setSelectedFileName(''); setError(''); setSuccess(''); setImgError(''); }}
                                        className="w-auto min-w-[100px] text-sm py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={imgUploading}
                                        className="w-auto min-w-[100px] text-sm py-2 px-4 border border-transparent rounded-lg shadow-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        {editId ? 'Update Course' : 'Create Course'}
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