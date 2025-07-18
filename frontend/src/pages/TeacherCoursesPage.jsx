import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Star, Clock, BarChart3 } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import CourseCard from '../components/CourseCard';
const emptyCourse = { title: '', description: '', price: '', imageUrl: '', videoUrl: '' };

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
        if (!form.title.trim() || !form.description.trim() || !form.price || isNaN(form.price)) return false;
        return true;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!validateForm()) {
            setError('Please fill in all required fields correctly.');
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
    if (loading) return <div className="p-8 text-center">Loading...</div>;
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
                        <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 relative animate-fade-in max-h-[90vh] overflow-y-auto focus:outline-none">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCourse); setError(''); setSuccess(''); setImgError(''); }} aria-label="Close">&times;</button>
                            <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">{editId ? 'Edit Course' : 'Create a New Course'}</h2>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-base">Enter course details below.</p>
                            {success && <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">{success}</div>}
                            {error && <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">{error}</div>}
                            <form onSubmit={handleSubmit} className="space-y-2">
                                <div>
                                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                                    <input name="title" value={form.title} onChange={handleChange} className="w-full pl-3 pr-3 py-1.5 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 border-gray-300 dark:border-gray-600 text-base" required />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-red-500">*</span></label>
                                    <textarea name="description" value={form.description} onChange={handleChange} className="w-full pl-3 pr-3 py-1.5 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 border-gray-300 dark:border-gray-600 text-base" required />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Price (USD) <span className="text-red-500">*</span></label>
                                    <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="w-full pl-3 pr-3 py-1.5 rounded-lg border transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 border-gray-300 dark:border-gray-600 text-base" required />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Course Image</label>
                                    <div className="flex items-center gap-4">
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
                                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition border border-gray-300 dark:border-gray-600 shadow-sm text-base"
                                        >
                                            {imgUploading ? (
                                                <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Uploading...</span>
                                            ) : 'Choose Image'}
                                        </label>
                                        {selectedFileName && !imgUploading && (
                                            <span className="text-base text-gray-600 dark:text-gray-300">{selectedFileName}</span>
                                        )}
                                        {form.imageUrl && <img src={form.imageUrl} alt="Course" className="w-16 h-16 object-cover rounded-lg" />}
                                    </div>
                                    {imgError && <div className="text-red-500 text-sm mt-1">{imgError}</div>}
                                </div>
                                <div className="flex pt-2 space-x-4">
                                    <button type="submit" disabled={imgUploading} className="w-full py-2 px-2 border border-transparent  rounded-lg shadow-sm text-base font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                        {editId ? 'Update Course' : 'Create Course'}
                                    </button>
                                    <button type="button" className="w-full py-2 px-3 border border-transparent rounded-lg shadow-sm  text-base font-bold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800 transition-all duration-300" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCourse); setError(''); setSuccess(''); setImgError(''); }}>Cancel</button>
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