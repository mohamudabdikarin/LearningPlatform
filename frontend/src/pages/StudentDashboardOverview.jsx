import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { apiFetch } from '../services/apiService';
import { BookOpen, Clock, Award, TrendingUp, Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from '../components/AnimatedCounter';

// Helper function to get proxy URL for files (replaces useSignedImageUrl hook)
const getProxyUrl = (fileId) => {
  if (!fileId) return null;
  return `http://localhost:8080/api/proxy/image/${fileId}`;
};

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
        // Mock data for demo - replace with real API calls when needed
        const mockEnrollments = [
          {
            id: 1,
            course: {
              id: 1,
              title: "Complete React Development Bootcamp",
              description: "Master React from basics to advanced concepts",
              imageUrl: "https://picsum.photos/400/300?random=1",
              duration: 40,
              instructor: { firstName: "Sarah", lastName: "Johnson" }
            },
            progress: 75,
            enrolledAt: new Date().toISOString()
          },
          {
            id: 2,
            course: {
              id: 2,
              title: "Data Science with Python",
              description: "Comprehensive course covering data analysis and ML",
              imageUrl: "https://picsum.photos/400/300?random=2",
              duration: 50,
              instructor: { firstName: "Michael", lastName: "Chen" }
            },
            progress: 45,
            enrolledAt: new Date().toISOString()
          },
          {
            id: 3,
            course: {
              id: 3,
              title: "UI/UX Design Fundamentals",
              description: "Learn design principles with hands-on projects",
              imageUrl: "https://picsum.photos/400/300?random=3",
              duration: 30,
              instructor: { firstName: "Emily", lastName: "Rodriguez" }
            },
            progress: 100,
            enrolledAt: new Date().toISOString()
          }
        ];

        const mockProgress = [
          { completionPercentage: 100, progress: 100 },
          { completionPercentage: 75, progress: 75 },
          { completionPercentage: 45, progress: 45 }
        ];
        
        setStats({
          enrolledCourses: mockEnrollments.length,
          completedCourses: mockProgress.filter(p => p.completionPercentage === 100 || p.progress === 100).length,
          totalHours: Math.round(mockEnrollments.reduce((acc, e) => acc + (e.course?.duration || 0), 0)),
          certificates: mockProgress.filter(p => p.completionPercentage === 100 || p.progress === 100).length
        });
        
        setRecentCourses(mockEnrollments.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback to demo data
        setStats({
          enrolledCourses: 3,
          completedCourses: 1,
          totalHours: 120,
          certificates: 1
        });
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter end={stats.enrolledCourses} duration={1500} />
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter end={stats.completedCourses} duration={1800} />
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Learning Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter end={stats.totalHours} duration={2000} />
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Certificates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter end={stats.certificates} duration={2200} />
                </p>
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
                <div key={enrollment.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                     onClick={() => navigate(`/dashboard/student/course/${enrollment.course.id}`)}>
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={enrollment.course?.imageUrl || `https://picsum.photos/400/300?random=${enrollment.course.id}`}
                      alt={enrollment.course?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{enrollment.course?.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.course?.instructor?.firstName} {enrollment.course?.instructor?.lastName}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">{enrollment.progress}%</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No courses enrolled yet.</p>
              <button 
                onClick={() => navigate('/dashboard/student/courses')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Courses
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardOverview;