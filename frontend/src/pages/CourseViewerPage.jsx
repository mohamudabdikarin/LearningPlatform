import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Star, Clock, BarChart3, BookOpen, Video, FileText, Download, ChevronLeft, CheckCircle, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

                // Check if user is enrolled
                if (user) {
                    try {
                        const enrollmentData = await apiFetch(`/enrollments/check/${courseId}`);
                        console.log("Enrollment data:", enrollmentData);
                        setIsEnrolled(enrollmentData.enrolled);
                    } catch (err) {
                        console.error("Error checking enrollment:", err);
                        setIsEnrolled(false);
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
    }, [courseId, user]);

    const handleEnroll = () => {
        // Redirect to enrollment page
        navigate(`/enroll/${courseId}`);
    };

    const getFileIcon = (fileType) => {
        if (!fileType) return <FileText />;
        if (fileType.match(/pdf|doc|docx|txt/i)) return <FileText />;
        if (fileType.match(/mp4|mov|avi|webm|video/i)) return <Video />;
        return <FileText />;
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
                                </div>
                            )}

                            {activeTab === 'resources' && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-4">Course Resources</h2>
                                    {resources.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400">No resources available for this course yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {resources.map((resource) => (
                                                <div
                                                    key={resource.id}
                                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                                >
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4">
                                                            {getFileIcon(resource.fileType)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium">{resource.fileName}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{resource.fileType}</p>
                                                        </div>
                                                    </div>
                                                    {isEnrolled ? (
                                                        <a
                                                            href={resource.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                                        >
                                                            <Download size={18} className="mr-1" /> Download
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center text-gray-400">
                                                            <Lock size={18} className="mr-1" /> Enroll to access
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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