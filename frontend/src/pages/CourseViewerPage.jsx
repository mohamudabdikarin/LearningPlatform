import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Star, Clock, BarChart3, BookOpen, Video, FileText, Download, ChevronLeft, CheckCircle, Lock, Star as StarIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const CourseViewerPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { darkMode } = useDarkMode();

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
                    apiFetch(`/enrollments/check/${courseId}`).then(enrollmentData => {
                        setIsEnrolled(enrollmentData.enrolled);
                        if (!enrollmentData.enrolled) {
                            navigate(`/payment/${courseId}`);
                        } else {
                            // Fetch enrollment to check paid status
                            apiFetch('/enrollments/my-courses').then(enrollments => {
                                const found = enrollments.find(e => e.course.id === Number(courseId));
                                if (found && found.paid) {
                                    setPaid(true);
                                    // Optionally, load progress
                                    setLectureProgress({}); // TODO: fetch real progress if available
                                } else {
                                    navigate(`/payment/${courseId}`);
                                }
                            });
                        }
                    }).catch(() => {
                        navigate(`/login?next=/courses/${courseId}/resources`);
                    });
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
        apiFetch(`/courses/${courseId}/rating-summary`).then(setRatingSummary).catch(() => {});
        if (isStudent) {
          apiFetch(`/courses/${courseId}/ratings`).then(ratings => {
            const mine = ratings.find(r => r.user && user && r.user.id === user.id);
            if (mine) {
              setUserRating(mine);
              setRatingValue(mine.rating);
              setRatingComment(mine.comment || '');
            }
          }).catch(() => {});
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
      } catch {}
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

    if (loading) {
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

    if (error || !course) {
        return (
            <div className={darkMode ? 'dark' : ''}>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <Navbar />
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
                                                    className={i < Math.round(course.rating || 4.5)
                                                        ? "text-yellow-400 fill-current"
                                                        : "text-indigo-300"
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="ml-2 text-indigo-100">
                                            {course.rating || 4.5} ({course.reviewCount || 120} reviews)
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                        <BarChart3 size={16} className="mr-1" /> {course.level || "Beginner"}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-indigo-100">
                                        <Clock size={16} className="mr-1" /> {course.duration || "6 hours"}
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
                                    <p className="mb-6">{course.description}</p>

                                    <h3 className="text-xl font-bold mb-3">What You'll Learn</h3>
                                    <ul className="space-y-2 mb-6">
                                        <li className="flex items-start">
                                            <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Master the fundamentals and advanced concepts</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Build real-world projects to apply your knowledge</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Learn best practices and industry standards</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Gain practical skills that employers are looking for</span>
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-bold mb-3">Requirements</h3>
                                    <ul className="list-disc pl-5 mb-6">
                                        <li>Basic understanding of programming concepts</li>
                                        <li>A computer with internet access</li>
                                        <li>Willingness to learn and practice</li>
                                    </ul>

                                    <h3 className="text-xl font-bold mb-3">Who This Course is For</h3>
                                    <ul className="list-disc pl-5">
                                        <li>Beginners looking to learn new skills</li>
                                        <li>Intermediate learners wanting to deepen their knowledge</li>
                                        <li>Professionals seeking to update their skills</li>
                                    </ul>
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
                                                    {[1,2,3,4,5].map(i => (
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
                                            const isLocked = idx > 0 && !lectureProgress[resources[idx - 1].id];
                                            return (
                                                <div key={resource.id} className={`rounded-lg p-4 shadow bg-white dark:bg-gray-800 border ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <div className="flex items-center mb-2">
                                                        <Video className="mr-2 text-indigo-500" />
                                                        <span className="font-semibold text-lg">Lecture {idx + 1}: {resource.title || resource.fileName}</span>
                                                        {isLocked && <Lock className="ml-2 text-gray-400" />}
                                                    </div>
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
                                                            src={resource.contentUrl}
                                                        />
                                                    </div>
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
                                {course.imageUrl && (
                                    <div className="aspect-[16/9] w-full">
                                        <img
                                            src={course.imageUrl}
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
                                            <span>{resources.length} resources</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                            <span>Full lifetime access</span>
                                        </div>
                                        <div className="flex items-center">
                                            <BarChart3 size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                            <span>Certificate of completion</span>
                                        </div>
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
};

export default CourseViewerPage;