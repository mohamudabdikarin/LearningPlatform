import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { apiFetch } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Clock, Award, Plus, Search, Star } from 'lucide-react';
import EnrollmentModal from '../components/EnrollmentModal';

// Helper function to get proxy URL for files (replaces useSignedImageUrl hook)
const getProxyUrl = (fileId) => {
  if (!fileId) return null;
  return `http://localhost:8080/api/proxy/image/${fileId}`;
};

const StudentCoursesPage = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' or 'browse'
  const [courseRatings, setCourseRatings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch enrolled courses
        const enrolled = await apiFetch('/enrollments/my-courses');
        setEnrolledCourses(enrolled);
        
        // Fetch available courses
        const available = await apiFetch('/courses');
        setAvailableCourses(available);
        
        // Fetch ratings for all courses
        const ratingsPromises = available.map(course => 
          apiFetch(`/courses/${course.id}/rating-summary`)
            .then(rating => ({ courseId: course.id, rating }))
            .catch(() => ({ courseId: course.id, rating: { average: 0, count: 0 } }))
        );
        
        const ratings = await Promise.all(ratingsPromises);
        const ratingsMap = {};
        ratings.forEach(item => {
          ratingsMap[item.courseId] = item.rating;
        });
        
        setCourseRatings(ratingsMap);
      } catch (err) {
        setError('Failed to load courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleContinueCourse = (courseId) => {
    navigate(`/dashboard/student/course/${courseId}`);
  };

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
    setShowEnrollmentModal(true);
  };

  const handleEnrollmentSuccess = () => {
    // Refresh the enrolled courses list
    apiFetch('/enrollments/my-courses')
      .then(enrolled => setEnrolledCourses(enrolled))
      .catch(err => console.error('Failed to refresh courses:', err));
  };

  const filteredAvailableCourses = availableCourses.filter(course => {
    const isEnrolled = enrolledCourses.some(enrollment => enrollment.course.id === course.id);
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return !isEnrolled && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading your courses...</span>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">Continue your learning journey</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrolled'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Enrolled Courses ({enrolledCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Browse Courses ({filteredAvailableCourses.length})
            </button>
          </nav>
        </div>

        {/* Enrolled Courses Tab */}
        {activeTab === 'enrolled' && (
          <>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses enrolled</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start your learning journey by enrolling in courses</p>
                <button 
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((enrollment) => {
                  const proxyImageUrl = getProxyUrl(enrollment.course.imageFileId);
                  const rating = courseRatings[enrollment.course.id] || { average: 0, count: 0 };
                  
                  return (
                    <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                      {/* Course Image */}
                      <div className="relative">
                        <div className="aspect-[16/9] w-full bg-gray-100 dark:bg-gray-700">
                          {proxyImageUrl ? (
                            <img
                              src={proxyImageUrl}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleContinueCourse(enrollment.course.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Continue Learning
                          </button>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {enrollment.course.instructor?.firstName} {enrollment.course.instructor?.lastName}
                        </p>

                        {/* Course Rating */}
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < Math.round(rating.average || 0)
                                ? "text-yellow-400 fill-current" 
                                : "text-gray-300 dark:text-gray-600"
                              } 
                            />
                          ))}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({rating.count || 0})
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{enrollment.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{enrollment.course.duration || 'N/A'} hours</span>
                          </div>
                          {enrollment.progress === 100 && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Award className="w-4 h-4" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <button 
                          onClick={() => handleContinueCourse(enrollment.course.id)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          {enrollment.progress === 100 ? 'Review Course' : 'Continue Learning'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Browse Courses Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {filteredAvailableCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No courses found' : 'No available courses'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new courses'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableCourses.map((course) => {
                  const proxyImageUrl = getProxyUrl(course.imageFileId);
                  const rating = courseRatings[course.id] || { average: 0, count: 0 };
                  
                  return (
                    <div key={course.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                      {/* Course Image */}
                      <div className="aspect-[16/9] w-full bg-gray-100 dark:bg-gray-700">
                        {proxyImageUrl ? (
                          <img
                            src={proxyImageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Course Content */}
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {course.instructor?.firstName} {course.instructor?.lastName}
                        </p>

                        {/* Course Rating */}
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < Math.round(rating.average || 0)
                                ? "text-yellow-400 fill-current" 
                                : "text-gray-300 dark:text-gray-600"
                              } 
                            />
                          ))}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({rating.count || 0})
                          </span>
                        </div>

                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration || 'N/A'} hours</span>
                          </div>
                          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {course.price === 0 ? 'Free' : `$${course.price}`}
                          </div>
                        </div>

                        {/* Enroll Button */}
                        <button 
                          onClick={() => handleEnrollClick(course)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {course.price === 0 ? 'Enroll for Free' : `Enroll for $${course.price}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && selectedCourse && (
        <EnrollmentModal
          course={selectedCourse}
          isOpen={showEnrollmentModal}
          onClose={() => {
            setShowEnrollmentModal(false);
            setSelectedCourse(null);
          }}
          onSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
};

export default StudentCoursesPage;