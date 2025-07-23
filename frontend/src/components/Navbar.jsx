import React, { useState, useEffect, useRef } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import DarkModeToggle from './DarkModeToggle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MenuIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);
const SearchIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

function getInitials(user) {
    if (!user) return '';
    if (user.firstName && user.lastName) return user.firstName[0] + user.lastName[0];
    if (user.firstName) return user.firstName[0];
    if (user.email) return user.email[0];
    return '?';
}

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { darkMode } = useDarkMode();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef();

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Close profile menu on outside click
    useEffect(() => {
        function handleClick(e) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setProfileMenuOpen(false);
            }
        }
        if (profileMenuOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [profileMenuOpen]);

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                {/* Mobile Menu Button (left) */}
                <div className="md:hidden flex items-center gap-2 mr-2">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </div>
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center gap-2">
                    <a href="#" className="flex items-center gap-2">
                        <svg className="h-8 w-auto text-indigo-600 dark:text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
                        </svg>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">Learnify</span>
                    </a>
                </div>
                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-4 mr-12 ">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-64 pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    
                    <a href="/#about" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
                    <a href="/#courses" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Courses</a>
                    {user ? (
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700"
                                onClick={() => setProfileMenuOpen(v => !v)}
                                aria-label="Open profile menu"
                            >
                                {/* Avatar (use initials if no image) */}
                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
                                    {getInitials(user)}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">{user.firstName || user.email}</span>
                                <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {profileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">Signed in as<br /><span className="font-semibold">{user.email}</span></div>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setProfileMenuOpen(false); navigate('/dashboard/student/profile'); }}>Profile</button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setProfileMenuOpen(false); navigate('/dashboard'); }}>Dashboard</button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-gray-700" onClick={() => { setProfileMenuOpen(false); logout(); navigate('/'); }}>Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">Log In</button>
                            <button onClick={() => navigate('/register')} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition shadow-sm">Sign Up</button>
                        </>
                    )}
                    <DarkModeToggle />
                </nav>
                {/* Mobile DarkMode Toggle (right) */}
                <div className="md:hidden flex items-center gap-2 ml-auto">
                    <DarkModeToggle />
                </div>
            </div>
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <a href="/#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">About</a>
                        <a href="/#courses" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Courses</a>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        {user ? (
                            <>
                                {/* Profile button removed - use dashboard profile instead */}
                                <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}>Dashboard</button>
                                <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setIsMenuOpen(false); logout(); navigate('/'); }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <a onClick={() => { setIsMenuOpen(false); navigate('/login'); }} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">Log In</a>
                                <a onClick={() => { setIsMenuOpen(false); navigate('/register'); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">Sign Up</a>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
