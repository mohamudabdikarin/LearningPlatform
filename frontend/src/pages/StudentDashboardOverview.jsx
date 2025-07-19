import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { apiFetch } from '../services/apiService';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboardOverview = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    certificates: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [enrollments, progress] = await Promise.all([
          apiFetch('/enrollments/my-courses'),
          apiFetch('/progress/my-progress')
        ]);
        
        setStats({
          enrolledCourses: enrollments.length,
          completedCourses: progress.filter(p => p.completionPercentage === 100 || p.progress === 100).length,
          totalHours: Math.round(enrollments.reduce((acc, e) => acc + (e.course?.duration || 0), 0)),
          certificates: progress.filter(p => p.completionPercentage === 100 || p.progress === 100).length
        });
        
        setRecentCourses(enrollments.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Continue your learning journey and track your progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enrolledCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Learning Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Certificates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.certificates}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Continue Learning</h2>
          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0">
                    {enrollment.course.imageUrl ? (
                      <img 
                        src={enrollment.course.imageUrl} 
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{enrollment.course.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.course.instructor?.firstName} {enrollment.course.instructor?.lastName}
                    </p>
                    <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <button 
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    onClick={() => navigate(`/courses/${enrollment.course.id}/resources`)}
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No courses enrolled yet. Start learning today!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardOverview;