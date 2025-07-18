import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiService';
import { BookOpen, Users, Layers } from 'lucide-react';

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

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    apiFetch(`/users/teacher-dashboard/${user.id}`)
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome, {user?.firstName || 'Teacher'}!</h1>
      <p className="text-gray-700 dark:text-gray-200 mb-6">Here's a quick overview of your teaching activity.</p>
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">Loading dashboard...</div>
      ) : error ? (
        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 rounded p-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {statCards.map(card => {
            const Icon = card.icon;
            const color = card.color;
            const colorMap = {
              indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
              green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
              amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
            };
            return (
              <div key={card.key} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
                <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-3 text-3xl ${colorMap[color]}`}>
                  <Icon size={32} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats[card.key]}</div>
                <div className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{card.label}</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-gray-500 dark:text-gray-400 text-sm">Use the navigation to manage your courses, upload resources, and track student progress.</div>
    </div>
  );
};

export default TeacherDashboardOverview; 