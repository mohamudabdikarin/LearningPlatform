import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiService';
import { BookOpen, Users, Layers, AlertCircle, Bug } from 'lucide-react';

const statCards = [
  { key: 'courses', label: 'Courses', icon: BookOpen, color: 'indigo' },
  { key: 'students', label: 'Enrolled Students', icon: Users, color: 'green' },
  { key: 'lessons', label: 'Lessons', icon: Layers, color: 'amber' },
];

const TeacherDashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, lessons: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    // Use a more reliable approach with fallback data
    const fetchDashboardData = async () => {
      try {
        // First try the teacher dashboard endpoint (now with user.id)
        const data = await apiFetch(`/users/teacher-dashboard/${user.id}`, { 
          retry: true,
          retryAttempts: 2
        });
        console.log('Teacher dashboard data:', data);
        setStats(data);
      } catch (e) {
        console.error('Teacher dashboard error:', e);
        
        // If that fails, try to get course stats directly
        try {
          // Fallback: Get courses taught by this teacher
          const courses = await apiFetch('/courses/teacher');
          
          // Calculate stats from courses
          let studentCount = 0;
          let lessonCount = 0;
          
          // Process course data to extract stats
          courses.forEach(course => {
            studentCount += course.enrollmentCount || 0;
            lessonCount += course.resourceCount || 0;
          });
          
          setStats({
            courses: courses.length,
            students: studentCount,
            lessons: lessonCount
          });
        } catch (fallbackError) {
          // If all fails, show error and use default stats
          setError(e.message || 'Failed to load dashboard data');
          setStats({ courses: 0, students: 0, lessons: 0 });
          
          // Try to get debug info
          try {
            const debug = await apiFetch('/users/me');
            setDebugInfo(debug);
          } catch (debugError) {
            console.error('Debug error:', debugError);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-2">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please log in to view your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
        Welcome, {user?.firstName || 'Teacher'}!
      </h1>
      <p className="text-gray-700 dark:text-gray-200 mb-6">
        Here's a quick overview of your teaching activity.
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <div>
              <p className="font-medium">Dashboard Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {statCards.map(card => {
              const Icon = card.icon;
              const color = card.color;
              const colorMap = {
                indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
                green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
              };
              return (
                <div key={card.key} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center">
                  <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-3 ${colorMap[color]}`}>
                    <Icon size={32} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats[card.key] || 0}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{card.label}</div>
                </div>
              );
            })}
          </div>
          
        </>
      )}
      
      <div className="text-gray-500 dark:text-gray-400 text-sm mt-6">
        Use the navigation to manage your courses, upload resources, and track student progress.
      </div>
    </div>
  );
};

export default TeacherDashboardOverview; 