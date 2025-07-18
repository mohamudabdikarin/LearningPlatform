import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { CheckCircle, Clock, Award, BookOpen, AlertCircle } from 'lucide-react';

const StudentProgressPage = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressStats, setProgressStats] = useState({
    completed: 0,
    inProgress: 0,
    totalHours: 0,
    averageScore: 0
  });

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const data = await apiFetch('/enrollments/student');
        setEnrollments(data);
        
        // Calculate progress statistics
        const completed = data.filter(e => e.progress === 100).length;
        const inProgress = data.filter(e => e.progress > 0 && e.progress < 100).length;
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
        
        setProgressStats({
          completed,
          inProgress,
          totalHours,
          averageScore: quizCount > 0 ? Math.round(totalScore / quizCount) : 0
        });
      } catch (err) {
        setError(err.message || 'Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  // Generate progress data
  const getChartData = () => {
    return enrollments.map(enrollment => ({
      name: enrollment.course?.title?.substring(0, 20) + (enrollment.course?.title?.length > 20 ? '...' : '') || 'Unknown Course',
      progress: enrollment.progress || 0,
      quizScore: enrollment.averageQuizScore || 0
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
          <h1 className="text-3xl font-bold mb-8">My Learning Progress</h1>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Courses</p>
                  <h3 className="text-2xl font-bold">{enrollments.length}</h3>
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
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Learning Hours</p>
                  <h3 className="text-2xl font-bold">{progressStats.totalHours}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Quiz Score</p>
                  <h3 className="text-2xl font-bold">{progressStats.averageScore}%</h3>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Course Progress Overview</h2>
            {enrollments.length > 0 ? (
              <div className="space-y-6">
                {getChartData().map((course, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{course.name}</h3>
                      <span className="text-sm font-semibold">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(course.progress)}`} 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    {course.quizScore > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Quiz Score: <span className="font-medium">{course.quizScore}%</span>
                      </div>
                    )}
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
          
          {/* Course Progress List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Course Progress Details</h2>
            {enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {enrollment.course?.imageUrl ? (
                              <img 
                                src={enrollment.course.imageUrl} 
                                alt={enrollment.course.title} 
                                className="w-10 h-10 rounded-md object-cover mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center">
                                <BookOpen size={16} className="text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            <div className="text-sm font-medium">{enrollment.course?.title || 'Unknown Course'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
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
                          {enrollment.lastActivityDate ? new Date(enrollment.lastActivityDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.progress === 100 ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                              Completed
                            </span>
                          ) : enrollment.progress > 0 ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                              In Progress
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400">
                              Not Started
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">You haven't enrolled in any courses yet.</p>
                <a 
                  href="/courses"
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                >
                  Browse Courses
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressPage;