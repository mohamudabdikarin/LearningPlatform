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
    
    // Use the simpler endpoint without user ID
    apiFetch('/users/teacher-dashboard')
      .then(data => {
        console.log('Teacher dashboard data:', data);
        setStats(data);
      })
      .catch(e => {
        console.error('Teacher dashboard error:', e);
        setError(e.message || 'Failed to load dashboard data');
        
        // If there's an error, try to get debug info
        apiFetch('/users/debug/roles')
          .then(debug => {
            console.log('Debug info:', debug);
            setDebugInfo(debug);
          })
          .catch(debugError => {
            console.error('Debug error:', debugError);
          });
      })
      .finally(() => setLoading(false));
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
          
          {/* Debug Section */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                <span className="font-medium">Debug Information</span>
              </div>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-sm underline"
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </button>
            </div>
            
            {showDebug && debugInfo && (
              <div className="mt-3 text-sm space-y-2">
                <div><strong>User ID:</strong> {debugInfo.userId}</div>
                <div><strong>Email:</strong> {debugInfo.email}</div>
                <div><strong>Name:</strong> {debugInfo.firstName} {debugInfo.lastName}</div>
                <div><strong>Database Roles:</strong> {debugInfo.databaseRoles?.join(', ') || 'None'}</div>
                <div><strong>JWT Authorities:</strong> {debugInfo.jwtAuthorities?.join(', ') || 'None'}</div>
                <div><strong>Has TEACHER Role:</strong> {debugInfo.hasTeacherRole ? 'Yes' : 'No'}</div>
                <div><strong>Frontend User Roles:</strong> {user.roles?.join(', ') || 'None'}</div>
              </div>
            )}
            
            {!debugInfo && (
              <div className="mt-2 text-sm">
                <p>Unable to load debug information. This might help identify the issue.</p>
                <button
                  onClick={() => {
                    apiFetch('/users/debug/roles')
                      .then(debug => {
                        console.log('Debug info:', debug);
                        setDebugInfo(debug);
                      })
                      .catch(debugError => {
                        console.error('Debug error:', debugError);
                      });
                  }}
                  className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                >
                  Try Debug Again
                </button>
              </div>
            )}
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
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                <h3 className="font-medium text-gray-900 dark:text-white">Create Course</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start building a new course</p>
              </button>
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                <h3 className="font-medium text-gray-900 dark:text-white">View Students</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check student progress</p>
              </button>
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                <h3 className="font-medium text-gray-900 dark:text-white">Upload Resources</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add course materials</p>
              </button>
            </div>
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