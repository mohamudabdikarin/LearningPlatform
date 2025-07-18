import React from 'react';

const Footer = ({ stats }) => (
    <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 py-6 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand/Logo */}
            <div className="flex items-center gap-2 mb-2 md:mb-0">
                <svg className="h-8 w-auto text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
                </svg>
                <span className="text-2xl font-bold text-white">Learnify</span>
            </div>
            {/* Stats */}
            {stats && (
                <div className="flex flex-wrap gap-6 text-sm text-gray-200">
                    <span>Courses: <span className="font-semibold text-indigo-400">{stats.courses}</span></span>
                    <span>Students: <span className="font-semibold text-green-400">{stats.students}</span></span>
                    <span>Teachers: <span className="font-semibold text-yellow-400">{stats.teachers}</span></span>
                    <span>Lessons: <span className="font-semibold text-pink-400">{stats.lessons}</span></span>
                </div>
            )}
            {/* Horizontal Links */}
            <nav className="flex flex-wrap gap-6">
                <a href="#" className="text-base text-gray-400 hover:text-white transition">Courses</a>
                <a href="#" className="text-base text-gray-400 hover:text-white transition">Pricing</a>
                <a href="#" className="text-base text-gray-400 hover:text-white transition">About</a>
            </nav>
        </div>
        <div className="mt-4 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">&copy; {new Date().getFullYear()} Learnify, Inc. All rights reserved.</div>
    </footer>
);

export default Footer; 