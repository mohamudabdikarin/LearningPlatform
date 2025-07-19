import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useDarkMode } from '../context/DarkModeContext';

const DarkModeToggle = ({ className = '' }) => {
    const { darkMode, setDarkMode } = useDarkMode();
    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            className={`fixed right-5 z-20 p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-600 ${className}`}
            aria-label="Toggle Dark Mode"
        >
            {darkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
        </button>
    );
};

export default DarkModeToggle; 