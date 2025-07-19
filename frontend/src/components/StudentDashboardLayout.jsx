import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import DarkModeToggle from './DarkModeToggle';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { to: '/dashboard/student', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/progress', label: 'Progress', icon: BarChart3 },
  { to: '/dashboard/student/profile', label: 'Profile', icon: User },
];

const StudentDashboardLayout = () => {
  const { logout, user } = useAuth();
  const { darkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Dark mode toggle */}
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed z-40 top-0 left-0 h-screen w-72 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center hidden md:flex">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Hub</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm group
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`
                  }
                  end={item.to === '/dashboard/student'}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
            {user && (
              <div className="mb-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-sm"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto transition-all duration-300 md:ml-72">
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboardLayout;