import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { CheckCircle, Clock, Award, BookOpen, AlertCircle, TrendingUp, Calendar, Target, Star } from 'lucide-react';

// Helper function to get proxy URL for files (replaces useSignedImageUrl hook)
const getProxyUrl = (fileId) => {
  if (!fileId) return null;
  return `http://localhost:8080/api/proxy/image/${fileId}`;
};

const StudentProgressPage = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressStats, setProgressStats] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    totalHours: 0,
    averageScore: 0,
    totalCourses: 0,
    learningStreak: 0,
    certificatesEarned: 0
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('all'); // 'week', 'month', 'all'

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const data = await apiFetch('/enrollments/student');
        setEnrollments(data);
        
        // Calculate comprehensive progress statistics
        const completed = data.filter(e => e.progress === 100).length;
        const inProgress = data.filter(e => e.progress > 0 && e.progress < 100).length;
        const notStarted = data.filter(e => e.progress === 0).length;
        const totalHours = data.reduce((sum, e) => sum + (e.course?.duration || 0), 0);
        
        // Calculate average quiz score
        let totalScore = 0;
        let quizCount = 0;
        data.forEach(enrollment => {
          if (enrollment.quizzes && enrollment.quizzes.length > 0) {
            enrollment.quizzes.forEach(quiz => {
              if (quiz.score !== null) {
                totalScore += quiz.score;
                quizCount++;
              }
            });
          }
        });
        
        // Calculate learning streak (simplified - you can enhance this with actual activity data)
        const learningStreak = Math.floor(Math.random() * 7) + 1; // Placeholder
        
        // Calculate certificates earned
        const certificatesEarned = completed;
        
        setProgressStats({
          completed,
          inProgress,
          notStarted,
          totalHours,
          averageScore: quizCount > 0 ? Math.round(totalScore / quizCount) : 0,
          totalCourses: data.length,
          learningStreak,
          certificatesEarned
        });
      } catch (err) {
        setError(err.message || 'Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  // Generate progress data for charts
  const getChartData = () => {
    return enrollments.map(enrollment => ({
      name: enrollment.course?.title?.substring(0, 20) + (enrollment.course?.title?.length > 20 ? '...' : '') || 'Unknown Course',
      progress: enrollment.progress || 0,
      quizScore: enrollment.averageQuizScore || 0,
      duration: enrollment.course?.duration || 0,
      lastActivity: enrollment.lastActivityDate
    }));
  };

  // Helper function to format progress percentage
  const formatProgress = (progress) => {
    return `${Math.round(progress)}%`;
  };

  // Helper function to get progress color
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // Helper function to get status badge
  const getStatusBadge = (progress) => {
    if (progress === 100) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    } else if (progress > 0) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          In Progress
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Not Started
        </span>
      );
    }
  };

  // Calculate completion rate
  const completionRate = progressStats.totalCourses > 0 
    ? Math.round((progressStats.completed / progressStats.totalCourses) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Learning Progress</h1>
            <div className="flex gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>
          
          {/* Enhanced Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
                  <h3 className="text-2xl font-bold">{progressStats.totalCourses}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <h3 className="text-2xl font-bold">{progressStats.completed}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{completionRate}% completion rate</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Learning Hours</p>
                  <h3 className="text-2xl font-bold">{progressStats.totalHours}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{progressStats.learningStreak} day streak</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
                  <Star size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Quiz Score</p>
                  <h3 className="text-2xl font-bold">{progressStats.averageScore}%</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{progressStats.certificatesEarned} certificates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Course Status Distribution</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-semibold">{progressStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <span className="font-semibold">{progressStats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm">Not Started</span>
                  </div>
                  <span className="font-semibold">{progressStats.notStarted}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Learning Streak</h2>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {progressStats.learningStreak}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Days in a row</p>
                <div className="mt-4 flex justify-center gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < progressStats.learningStreak 
                          ? 'bg-green-500' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Achievements</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Course Completion</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {progressStats.completed} courses completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Learning Hours</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {progressStats.totalHours} hours invested
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Quiz Master</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {progressStats.averageScore}% average score
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Course Progress Overview</h2>
            {enrollments.length > 0 ? (
              <div className="space-y-6">
                {getChartData().map((course, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{course.duration} hours</span>
                          {course.quizScore > 0 && (
                            <span>Quiz: {course.quizScore}%</span>
                          )}
                          {course.lastActivity && (
                            <span>Last: {new Date(course.lastActivity).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{course.progress}%</span>
                        {getStatusBadge(course.progress)}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(course.progress)}`} 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No course data available yet.</p>
                <p className="text-gray-500 dark:text-gray-400">Enroll in courses to track your progress.</p>
              </div>
            )}
          </div>
          
          {/* Enhanced Course Progress Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Detailed Progress Report</h2>
            {enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {enrollments.map((enrollment) => {
                      const proxyImageUrl = getProxyUrl(enrollment.course?.imageFileId);
                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {proxyImageUrl ? (
                                <img
                                  src={proxyImageUrl}
                                  alt={enrollment.course?.title}
                                  className="w-10 h-10 rounded-md object-cover mr-3"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center">
                                  <BookOpen size={16} className="text-gray-500 dark:text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {enrollment.course?.title || 'Unknown Course'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {enrollment.course?.instructor?.firstName} {enrollment.course?.instructor?.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                              <div 
                                className={`h-2.5 rounded-full ${getProgressColor(enrollment.progress)}`} 
                                style={{ width: `${enrollment.progress || 0}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatProgress(enrollment.progress || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {enrollment.course?.duration || 'N/A'} hours
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {enrollment.lastActivityDate ? new Date(enrollment.lastActivityDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(enrollment.progress || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No enrollments found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressPage;