import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { apiFetch } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Clock, Award } from 'lucide-react';

const StudentCoursesPage = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const courses = await apiFetch('/enrollments/my-courses');
        setEnrolledCourses(courses);
      } catch (err) {
        setError('Failed to load your courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const handleContinueCourse = (courseId) => {
    navigate(`/dashboard/student/course/${courseId}`);
  };

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

        {enrolledCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses enrolled</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start your learning journey by enrolling in courses</p>
            <button 
              onClick={() => navigate('/courses')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((enrollment) => (
              <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Course Image */}
                <div className="relative">
                  <div className="aspect-[16/9] w-full bg-gray-100 dark:bg-gray-700">
                    {enrollment.course.imageUrl ? (
                      <img
                        src={enrollment.course.imageUrl}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCoursesPage;