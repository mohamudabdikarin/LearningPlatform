import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, Settings, User } from 'lucide-react';

function getInitials(user) {
    if (!user) return '';
    if (user.firstName && user.lastName) return user.firstName[0] + user.lastName[0];
    if (user.firstName) return user.firstName[0];
    if (user.email) return user.email[0];
    return '?';
}

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [edit, setEdit] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [stats, setStats] = useState({ courses: 0, certificates: 0 });
    const [activeTab, setActiveTab] = useState('profile');
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [coursesError, setCoursesError] = useState('');
    const [certificates, setCertificates] = useState([]);

    useEffect(() => {
        apiFetch('/users/me')
            .then(data => {
                setProfile(data);
                setForm({ firstName: data.firstName, lastName: data.lastName });
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
        // Fetch stats (placeholder, replace with real API if available)
        setCoursesLoading(true);
        apiFetch('/enrollments/me')
            .then(data => {
                setStats(s => ({ ...s, courses: data.length }));
                setCourses(data.map(e => e.course));
                setCoursesLoading(false);
                // Certificates: completed courses
                const certs = data.filter(e => e.progress === 100).map(e => ({
                    course: e.course,
                    date: e.lastActivityDate || null
                }));
                setCertificates(certs);
                setStats(s => ({ ...s, certificates: certs.length }));
            })
            .catch(() => { setCoursesError('Failed to load courses.'); setCoursesLoading(false); });
        // Certificates: placeholder
        // setStats(s => ({ ...s, certificates: 0 }));
    }, []);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async e => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            const updated = await apiFetch('/users/me', {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            setProfile(updated);
            setEdit(false);
            setSuccess('Profile updated!');
        } catch (e) {
            setError(e.message);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!profile) return null;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col md:flex-row">
            {/* Sidebar / Floating Menu */}
            <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 sticky top-0 z-10">
                <div className="flex flex-col gap-2 py-8 px-6">
                    <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-base transition ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><User className="w-5 h-5" /> Profile</button>
                    <button onClick={() => setActiveTab('courses')} className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-base transition ${activeTab === 'courses' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><BookOpen className="w-5 h-5" /> My Courses <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5">{stats.courses}</span></button>
                    <button onClick={() => setActiveTab('certificates')} className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-base transition ${activeTab === 'certificates' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Award className="w-5 h-5" /> Certificates <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full px-2 py-0.5">{stats.certificates}</span></button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-base transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Settings className="w-5 h-5" /> Settings</button>
                    <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg> Logout</button>
                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 max-w-3xl mx-auto w-full">
                {/* Profile Card */}
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-4xl font-bold mb-4">{getInitials(profile)}</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profile.firstName} {profile.lastName}</h2>
                        <div className="text-gray-500 dark:text-gray-300 mb-2">{profile.email}</div>
                        <div className="flex gap-4 mb-4">
                            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">{profile.roles && profile.roles.length > 0 ? profile.roles.join(', ') : 'Student'}</span>
                        </div>
                        <div className="flex gap-8 mb-4">
                            <div className="flex flex-col items-center"><BookOpen className="w-6 h-6 text-indigo-500 mb-1" /><span className="font-bold text-lg">{stats.courses}</span><span className="text-xs text-gray-500">Courses</span></div>
                            <div className="flex flex-col items-center"><Award className="w-6 h-6 text-green-500 mb-1" /><span className="font-bold text-lg">{stats.certificates}</span><span className="text-xs text-gray-500">Certificates</span></div>
                        </div>
            {success && <div className="mb-3 text-green-600">{success}</div>}
                        {error && <div className="mb-3 text-red-500">{error}</div>}
            {!edit ? (
                            <button className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition" onClick={() => setEdit(true)}>Edit Profile</button>
                        ) : (
                            <form onSubmit={handleUpdate} className="w-full max-w-md mx-auto mt-4 space-y-4">
                                <div>
                                    <label className="block mb-1 font-medium">First Name</label>
                                    <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
                                </div>
                    <div>
                                    <label className="block mb-1 font-medium">Last Name</label>
                                    <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                                    <button type="button" className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg" onClick={() => setEdit(false)}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
                {/* My Courses Tab */}
                {activeTab === 'courses' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><BookOpen className="w-5 h-5" /> My Courses</h3>
                        {coursesLoading ? (
                            <div className="text-gray-400">Loading courses...</div>
                        ) : coursesError ? (
                            <div className="text-red-500">{coursesError}</div>
                        ) : courses.length === 0 ? (
                            <div className="text-gray-500">You are not enrolled in any courses yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {courses.map(course => (
                                    <div key={course.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow p-5 flex flex-col gap-2 border border-gray-200 dark:border-gray-700">
                                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">{course.title}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-300 mb-1">{course.instructor?.firstName} {course.instructor?.lastName}</div>
                                        <div className="text-xs text-gray-400 mb-2">{course.description?.slice(0, 60)}...</div>
                                        {/* Progress bar placeholder */}
                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                                            <div className="h-2 rounded-full bg-indigo-500" style={{ width: '60%' }}></div>
                                        </div>
                                        <button className="mt-2 px-4 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm" onClick={() => navigate(`/dashboard/student/course/${course.id}`)}>Go to Course</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5" /> Certificates</h3>
                        {certificates.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-300">No certificates yet. Complete courses to earn certificates!</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {certificates.map((cert, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow p-5 flex flex-col gap-2 border border-gray-200 dark:border-gray-700">
                                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">{cert.course.title}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-300 mb-1">{cert.course.instructor?.firstName} {cert.course.instructor?.lastName}</div>
                                        <div className="text-xs text-gray-400 mb-2">Completed: {cert.date ? new Date(cert.date).toLocaleDateString() : 'N/A'}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Award className="w-5 h-5 text-green-500" />
                                            <span className="text-green-600 dark:text-green-400 font-semibold">Certificate Earned</span>
                                        </div>
                                        <button className="mt-2 px-4 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm" disabled>Download Certificate</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Settings</h3>
                        <div className="text-gray-500 dark:text-gray-300">(Coming soon: Change password, notification preferences, etc.)</div>
                    </div>
            )}
            </main>
        </div>
    );
};

export default ProfilePage; 