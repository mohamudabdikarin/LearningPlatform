import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Star, Clock, BarChart3, BookOpen, Video, FileText, Download, ChevronLeft, CheckCircle, Lock, Star as StarIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Helper function to get proxy URL for files
function getProxyUrl(fileId) {
    if (!fileId) return null;
    return `http://localhost:8080/api/proxy/file/${fileId}`;
}

const CourseViewerPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { darkMode } = useDarkMode();

    // Check if we're in the dashboard by looking at the URL path
    const isDashboard = location.pathname.includes('/dashboard/');

    const [course, setCourse] = useState(null);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [lectureProgress, setLectureProgress] = useState({}); // {lectureId: true}
    const [currentLecture, setCurrentLecture] = useState(0);
    const [paid, setPaid] = useState(false);
    const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0, enrolled: 0 });
    const [userRating, setUserRating] = useState(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingLoading, setRatingLoading] = useState(false);
    const isStudent = user && user.roles && user.roles.includes('STUDENT');

    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            try {
                console.log("Fetching course data for ID:", courseId);

                // Fetch course details
                const courseData = await apiFetch(`/courses/${courseId}`);
                console.log("Course data received:", courseData);
                setCourse(courseData);

                // Fetch course resources
                const resourcesData = await apiFetch(`/courses/${courseId}/resources`);
                console.log("Resources data received:", resourcesData);
                setResources(resourcesData);

                // Check if user is enrolled and paid
                if (user) {
                    try {
                        const enrollmentData = await apiFetch(`/enrollments/check/${courseId}`);
                        setIsEnrolled(enrollmentData.enrolled);

                        if (enrollmentData.enrolled) {
                            // Fetch enrollment to check paid status and progress
                            const enrollments = await apiFetch('/enrollments/my-courses');
                            // With the new DTO structure, course is a property of the enrollment DTO
                            const found = enrollments.find(e => e.course && e.course.id === Number(courseId));

                            if (found) {
                                setPaid(found.paid);

                                // Load progress
                                if (found.progress > 0) {
                                    // Calculate which lectures should be unlocked based on progress
                                    const progressPercent = found.progress;
                                    const totalLectures = resourcesData.length;
                                    const unlockedCount = Math.ceil((progressPercent / 100) * totalLectures);

                                    // Create progress object with unlocked lectures
                                    const progressObj = {};
                                    for (let i = 0; i < unlockedCount && i < totalLectures; i++) {
                                        progressObj[resourcesData[i].id] = true;
                                    }

                                    setLectureProgress(progressObj);
                                } else {
                                    // At minimum, unlock the first lecture
                                    if (resourcesData.length > 0) {
                                        setLectureProgress({ [resourcesData[0].id]: true });
                                    }
                                }

                                if (!found.paid) {
                                    navigate(`/payment/${courseId}`);
                                }
                            } else {
                                navigate(`/payment/${courseId}`);
                            }
                        } else {
                            navigate(`/payment/${courseId}`);
                        }
                    } catch (err) {
                        console.error("Error checking enrollment:", err);
                        navigate(`/login?next=/courses/${courseId}/resources`);
                    }
                }
            } catch (err) {
                console.error("Error fetching course data:", err);
                setError(err.message || "Failed to load course data");
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            console.log("CourseViewerPage: courseId is", courseId);
            fetchCourseData();
        } else {
            console.error("CourseViewerPage: courseId is undefined or null");
        }
    }, [courseId, user, navigate]);

    // Fetch rating summary and user's rating
    useEffect(() => {
        if (courseId) {
            apiFetch(`/courses/${courseId}/rating-summary`).then(setRatingSummary).catch(() => { });
            if (isStudent) {
                apiFetch(`/courses/${courseId}/ratings`).then(ratings => {
                    const mine = ratings.find(r => r.user && user && r.user.id === user.id);
                    if (mine) {
                        setUserRating(mine);
                        setRatingValue(mine.rating);
                        setRatingComment(mine.comment || '');
                    }
                }).catch(() => { });
            }
        }
    }, [courseId, user, isStudent]);

    const handleEnroll = () => {
        // Redirect to enrollment page
        navigate(`/enroll/${courseId}`);
    };

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        setRatingLoading(true);
        try {
            await apiFetch(`/courses/${courseId}/rate`, {
                method: 'POST',
                body: JSON.stringify({ rating: ratingValue, comment: ratingComment }),
                headers: { 'Content-Type': 'application/json' },
            });
            setUserRating({ rating: ratingValue, comment: ratingComment });
            setRatingSummary(s => ({ ...s, count: s.count + (userRating ? 0 : 1) }));

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
            successMessage.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Rating submitted successfully!</span>
          </div>
        `;
            document.body.appendChild(successMessage);

            // Remove the message after 3 seconds
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 3000);
        } catch (error) {
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
            errorMessage.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <span>Failed to submit rating. Please try again.</span>
          </div>
        `;
            document.body.appendChild(errorMessage);

            // Remove the message after 3 seconds
            setTimeout(() => {
                document.body.removeChild(errorMessage);
            }, 3000);
        }
        setRatingLoading(false);
    };

    const getFileIcon = (fileType) => {
        if (!fileType) return <FileText />;
        if (fileType.match(/pdf|doc|docx|txt/i)) return <FileText />;
        if (fileType.match(/mp4|mov|avi|webm|video/i)) return <Video />;
        return <FileText />;
    };

    // Video.js player ref
    const videoRefs = React.useRef([]);

    // Handle video end to unlock next lecture and save progress
    const handleVideoEnd = (idx, resource) => {
        // Unlock next lecture
        setLectureProgress(prev => {
            const updated = { ...prev, [resource.id]: true };

            // Unlock next lecture if available
            if (idx + 1 < resources.length) {
                updated[resources[idx + 1].id] = true;
            }

            // Save progress to backend (progress = percent of lectures completed)
            const unlockedCount = Object.keys(updated).length;
            const percent = Math.round((unlockedCount / resources.length) * 100);

            apiFetch(`/enrollments/course/${courseId}/progress`, {
                method: 'POST',
                body: JSON.stringify({ progress: percent }),
                headers: { 'Content-Type': 'application/json' },
            });

            return updated;
        });
    };

    // For course image - use proxy URL
    const proxyImageUrl = getProxyUrl(course?.imageFileId);
    // For each resource, use proxy URL for content (video, file, etc.)
    const resourceProxyUrls = resources.map(r => getProxyUrl(r.fileId));

    if (loading) {
        return (
            <div className={darkMode ? 'dark' : ''}>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    {!isDashboard && <Navbar />}
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className={darkMode ? 'dark' : ''}>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    {!isDashboard && <Navbar />}
                    <div className="max-w-4xl mx-auto px-4 py-12">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
                            {error || "Course not found"}
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            <ChevronLeft size={16} className="mr-1" /> Back to courses
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render different layouts based on whether we're in the dashboard or not
    if (isDashboard) {
        return (
            <div className={darkMode ? 'dark' : ''}>
                <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
                    {/* Course Header - Simplified for dashboard */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center mb-2">
                                    <button
                                        onClick={() => navigate('/dashboard/student/courses')}
                                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center mr-2"
                                    >
                                        <ChevronLeft size={16} className="mr-1" /> Courses
                                    </button>
                                    <span className="text-gray-500 dark:text-gray-400">/</span>
                                    <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium">{course.title}</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {course.title}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {course.instructor?.firstName && course.instructor?.lastName
                                        ? `By ${course.instructor.firstName} ${course.instructor.lastName}`
                                        : ""}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                    <CheckCircle size={16} className="mr-1" /> Enrolled
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            className={i < Math.round(ratingSummary.average || 0)
                                                ? "text-yellow-400 fill-current"
                                                : "text-gray-300 dark:text-gray-600"
                                            }
                                        />
                                    ))}
                                </div>
                                <span className="ml-2">
                                    {Number(ratingSummary.average || 0).toFixed(1)} ({ratingSummary.count || 0} reviews)
                                </span>
                            </div>
                            <span className="inline-flex items-center">
                                <BarChart3 size={16} className="mr-1" /> {course.level || "Beginner"}
                            </span>
                            <span className="inline-flex items-center">
                                <Clock size={16} className="mr-1" /> {course.duration || "N/A"} hours
                            </span>
                            <span className="inline-flex items-center">
                                <BookOpen size={16} className="mr-1" /> {resources.length} {resources.length === 1 ? 'lecture' : 'lectures'}
                            </span>
                        </div>
                    </div>
                    {/* Course Resources */}
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <h2 className="text-xl font-bold mb-4">Course Lectures</h2>
                        {resources.length === 0 && <p>No resources found for this course.</p>}
                        <div className="space-y-8">
                            {resources.map((resource, idx) => {
                                const proxyUrl = resourceProxyUrls[idx];
                                const isLocked = !lectureProgress[resource.id];
                                return (
                                    <div key={resource.id} className={`rounded-lg p-4 shadow bg-white dark:bg-gray-800 border ${isLocked ? 'opacity-70' : ''}`}>
                                        <div className="flex items-center mb-2">
                                            <Video className="mr-2 text-indigo-500" />
                                            <span className="font-semibold text-lg">Lecture {idx + 1}: {resource.title || resource.fileName}</span>
                                            {isLocked && <Lock className="ml-2 text-red-400" />}
                                        </div>
                                        {isLocked ? (
                                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                                                <Lock className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                                                <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                    Complete previous lectures to unlock
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <video
                                                    ref={el => videoRefs.current[idx] = el}
                                                    className="video-js vjs-big-play-centered rounded-lg"
                                                    controls
                                                    preload="auto"
                                                    width="100%"
                                                    height="360"
                                                    poster={resource.thumbnailUrl || ''}
                                                    onEnded={() => handleVideoEnd(idx, resource)}
                                                    src={proxyUrl}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        // Regular layout for non-dashboard view
        return (
            <div className={darkMode ? 'dark' : ''}>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <Navbar />

                    {/* Course Header */}
                    <div className="bg-indigo-600 dark:bg-indigo-800">
                        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                            <div className="lg:flex lg:items-center lg:justify-between">
                                <div className="flex-1 min-w-0">
                                    <nav className="flex mb-4" aria-label="Breadcrumb">
                                        <ol className="flex items-center space-x-2">
                                            <li>
                                                <button
                                                    onClick={() => navigate('/courses')}
                                                    className="text-indigo-200 hover:text-white"
                                                >
                                                    Courses
                                                </button>
                                            </li>
                                            <li className="text-indigo-200">/</li>
                                            <li className="text-white font-medium truncate">{course.title}</li>
                                        </ol>
                                    </nav>
                                    <h1 className="text-3xl font-bold text-white sm:text-4xl truncate">
                                        {course.title}
                                    </h1>
                                    <p className="mt-2 text-lg text-indigo-200">
                                        {course.instructor?.firstName && course.instructor?.lastName
                                            ? `By ${course.instructor.firstName} ${course.instructor.lastName}`
                                            : ""}
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-4">
                                        <div className="flex items-center">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={18}
                                                        className={i < Math.round(ratingSummary.average || 0)
                                                            ? "text-yellow-400 fill-current"
                                                            : "text-indigo-300"
                                                        }
                                                    />
                                                ))}
                                            </div>
                                            <span className="ml-2 text-indigo-100">
                                                {Number(ratingSummary.average || 0).toFixed(1)} ({ratingSummary.count || 0} reviews)
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                            <BarChart3 size={16} className="mr-1" /> {course.level || "Beginner"}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                            <Clock size={16} className="mr-1" /> {course.duration || "N/A"} hours
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                            <BookOpen size={16} className="mr-1" /> {resources.length} {resources.length === 1 ? 'lecture' : 'lectures'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-5 flex lg:mt-0 lg:ml-4">
                                    {!isEnrolled ? (
                                        <button
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-800 hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            {enrolling ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Enrolling...
                                                </>
                                            ) : (
                                                <>Enroll Now - {Number(course.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600">
                                            <CheckCircle size={18} className="mr-2" /> Enrolled
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs for Dashboard View */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`${activeTab === 'overview'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={`${activeTab === 'resources'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Resources
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );

    }
    // Regular layout for non-dashboard view
    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <Navbar />

                {/* Course Header */}
                <div className="bg-indigo-600 dark:bg-indigo-800">
                    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                        <div className="lg:flex lg:items-center lg:justify-between">
                            <div className="flex-1 min-w-0">
                                <nav className="flex mb-4" aria-label="Breadcrumb">
                                    <ol className="flex items-center space-x-2">
                                        <li>
                                            <button
                                                onClick={() => navigate('/courses')}
                                                className="text-indigo-200 hover:text-white"
                                            >
                                                Courses
                                            </button>
                                        </li>
                                        <li className="text-indigo-200">/</li>
                                        <li className="text-white font-medium truncate">{course.title}</li>
                                    </ol>
                                </nav>
                                <h1 className="text-3xl font-bold text-white sm:text-4xl truncate">
                                    {course.title}
                                </h1>
                                <p className="mt-2 text-lg text-indigo-200">
                                    {course.instructor?.firstName && course.instructor?.lastName
                                        ? `By ${course.instructor.firstName} ${course.instructor.lastName}`
                                        : ""}
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-4">
                                    <div className="flex items-center">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i < Math.round(ratingSummary.average || 0)
                                                        ? "text-yellow-400 fill-current"
                                                        : "text-indigo-300"
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="ml-2 text-indigo-100">
                                            {Number(ratingSummary.average || 0).toFixed(1)} ({ratingSummary.count || 0} reviews)
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                        <BarChart3 size={16} className="mr-1" /> {course.level || "Beginner"}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                        <Clock size={16} className="mr-1" /> {course.duration || "N/A"} hours
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                        <BookOpen size={16} className="mr-1" /> {resources.length} {resources.length === 1 ? 'lecture' : 'lectures'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-5 flex lg:mt-0 lg:ml-4">
                                {!isEnrolled ? (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-800 hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {enrolling ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Enrolling...
                                            </>
                                        ) : (
                                            <>Enroll Now - {Number(course.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</>
                                        )}
                                    </button>
                                ) : (
                                    <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600">
                                        <CheckCircle size={18} className="mr-2" /> Enrolled
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Content */}
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            {/* Tabs */}
                            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                                <nav className="flex space-x-8" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`${activeTab === 'overview'
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('resources')}
                                        className={`${activeTab === 'resources'
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        Resources
                                    </button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'overview' && (
                                <div className="prose prose-indigo max-w-none dark:prose-invert">
                                    <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                                    <div className="mb-6">
                                        {course.description ? (
                                            <p>{course.description}</p>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 italic">No description provided for this course.</p>
                                        )}
                                    </div>

                                    {course.learningObjectives ? (
                                        <>
                                            <h3 className="text-xl font-bold mb-3">What You'll Learn</h3>
                                            <ul className="space-y-2 mb-6">
                                                {course.learningObjectives.split('\n').filter(item => item.trim()).map((item, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                        <span>{item.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold mb-3">What You'll Learn</h3>
                                            <ul className="space-y-2 mb-6">
                                                <li className="flex items-start">
                                                    <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>Master the fundamentals of {course.title}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>Apply your knowledge through practical exercises</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>Learn industry best practices</span>
                                                </li>
                                            </ul>
                                        </>
                                    )}

                                    {course.requirements ? (
                                        <>
                                            <h3 className="text-xl font-bold mb-3">Requirements</h3>
                                            <ul className="list-disc pl-5 mb-6">
                                                {course.requirements.split('\n').filter(item => item.trim()).map((item, index) => (
                                                    <li key={index}>{item.trim()}</li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold mb-3">Requirements</h3>
                                            <ul className="list-disc pl-5 mb-6">
                                                <li>No specific prerequisites for this course</li>
                                                <li>A computer with internet access</li>
                                                <li>Willingness to learn and practice</li>
                                            </ul>
                                        </>
                                    )}

                                    {course.targetAudience ? (
                                        <>
                                            <h3 className="text-xl font-bold mb-3">Who This Course is For</h3>
                                            <ul className="list-disc pl-5">
                                                {course.targetAudience.split('\n').filter(item => item.trim()).map((item, index) => (
                                                    <li key={index}>{item.trim()}</li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold mb-3">Who This Course is For</h3>
                                            <ul className="list-disc pl-5">
                                                <li>Anyone interested in learning {course.title}</li>
                                                <li>Beginners and intermediate learners</li>
                                                <li>Professionals looking to expand their skills</li>
                                            </ul>
                                        </>
                                    )}
                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold mb-2">Course Rating</h3>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-lg text-[#2B2FAF]">{Number(ratingSummary.average).toFixed(1)}</span>
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} size={18} className={i < Math.round(ratingSummary.average) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({ratingSummary.count} ratings)</span>
                                            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{ratingSummary.enrolled} enrolled</span>
                                        </div>
                                        {isStudent && isEnrolled && paid && (
                                            <form onSubmit={handleRatingSubmit} className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => setRatingValue(i)}
                                                            className="focus:outline-none"
                                                        >
                                                            <StarIcon size={24} className={i <= ratingValue ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'} />
                                                        </button>
                                                    ))}
                                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{userRating ? 'Update your rating' : 'Rate this course'}</span>
                                                </div>
                                                <textarea
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 mb-2"
                                                    rows={2}
                                                    placeholder="Leave a comment (optional)"
                                                    value={ratingComment}
                                                    onChange={e => setRatingComment(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={ratingLoading || ratingValue === 0}
                                                    className="px-4 py-2 rounded-lg bg-[#2B2FAF] text-white font-bold hover:bg-[#23268a] transition-colors disabled:opacity-50"
                                                >
                                                    {userRating ? 'Update Rating' : 'Submit Rating'}
                                                </button>
                                            </form>
                                        )}
                                        {userRating && (
                                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                                Your rating: {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} size={16} className={i < userRating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'} />
                                                ))}
                                                {userRating.comment && <span className="ml-2 italic">"{userRating.comment}"</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'resources' && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Course Lectures</h2>
                                    {resources.length === 0 && <p>No resources found for this course.</p>}
                                    <div className="space-y-8">
                                        {resources.map((resource, idx) => {
                                            const proxyUrl = resourceProxyUrls[idx];
                                            const isLocked = !lectureProgress[resource.id];

                                            return (
                                                <div key={resource.id} className={`rounded-lg p-4 shadow bg-white dark:bg-gray-800 border ${isLocked ? 'opacity-70' : ''}`}>
                                                    <div className="flex items-center mb-2">
                                                        <Video className="mr-2 text-indigo-500" />
                                                        <span className="font-semibold text-lg">Lecture {idx + 1}: {resource.title || resource.fileName}</span>
                                                        {isLocked && <Lock className="ml-2 text-red-400" />}
                                                    </div>

                                                    {isLocked ? (
                                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                                                            <Lock className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                                                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                                Complete previous lectures to unlock
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <video
                                                                ref={el => videoRefs.current[idx] = el}
                                                                className="video-js vjs-big-play-centered rounded-lg"
                                                                controls
                                                                preload="auto"
                                                                width="100%"
                                                                height="360"
                                                                poster={resource.thumbnailUrl || ''}
                                                                onEnded={() => handleVideoEnd(idx, resource)}
                                                                src={proxyUrl}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="mt-8 lg:mt-0">
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                                {proxyImageUrl && (
                                    <div className="aspect-[16/9] w-full">
                                        <img
                                            src={proxyImageUrl}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {Number(course.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <BookOpen size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                            <span>{resources.length} {resources.length === 1 ? 'lecture' : 'lectures'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                            <span>{course.duration || 'N/A'} hours of content</span>
                                        </div>
                                        <div className="flex items-center">
                                            <BarChart3 size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                            <span>Certificate upon completion</span>
                                        </div>
                                        {course.level && (
                                            <div className="flex items-center">
                                                <Star size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                                <span>{course.level} level</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6">
                                        {!isEnrolled ? (
                                            <button
                                                onClick={handleEnroll}
                                                disabled={enrolling}
                                                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                            >
                                                {enrolling ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Enrolling...
                                                    </>
                                                ) : (
                                                    'Enroll Now'
                                                )}
                                            </button>
                                        ) : (
                                            <div className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600">
                                                <CheckCircle size={18} className="mr-2" /> Enrolled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}

export default CourseViewerPage;