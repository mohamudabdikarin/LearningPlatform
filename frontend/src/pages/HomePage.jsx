import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import { apiFetch } from '../services/apiService';
import CountUp from 'react-countup';
import StatsSection from '../components/Stats';
const HomePage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0, lessons: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        apiFetch('/courses')
            .then((coursesData) => {
                setCourses(coursesData);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message || 'An unknown error occurred while loading courses.');
                setLoading(false);
            });
        setStatsLoading(true);
        setStatsError('');
        apiFetch('/users/stats')
            .then(data => {
                setStats(data);
                setStatsLoading(false);
            })
            .catch((e) => {
                setStatsLoading(false);
                setStatsError(e.message || 'An unknown error occurred while loading stats.');
                setStats({ courses: 0, students: 0, teachers: 0, lessons: 0 });
            });
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    if (error) return <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 min-h-screen">{error}</div>;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <Hero />
                {/* Courses Section */}
                <section id="courses" className="py-16 sm:py-20">
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Courses</h2>
                        <p className="text-md text-gray-500 dark:text-gray-400 mb-8">Browse all available courses.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                            {courses.map(course => <CourseCard key={course.id} course={course} />)}
                        </div>
                        {courses.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-10">No courses found.</div>
                        )}
                    </div>
                </section>
                {/* About Section (What We Are) */}
                <section id="about" className="bg-white dark:bg-gray-800 py-12 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">What We Are</h1>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                            We are a modern e-learning platform designed to make education accessible, engaging, and effective for everyone.
                        </p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-left mx-auto max-w-lg space-y-2">
                            <li>Connects students and teachers from anywhere in the world</li>
                            <li>Offers interactive courses, resources, and assessments</li>
                            <li>Supports self-paced and instructor-led learning</li>
                            <li>Tracks your progress and achievements</li>
                        </ul>
                    </div>
                </section>
                {/* How It Works Section */}
                <section className="bg-gray-50 dark:bg-gray-900 py-12 px-4">
                    <h2 className="text-3xl font-semibold text-center mb-8 text-gray-900 dark:text-white">How It Works</h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-4xl mx-auto">
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-indigo-600 dark:text-indigo-300">1</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Sign Up as Student or Teacher</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-indigo-600 dark:text-indigo-300">2</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Browse or Create Courses</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-indigo-600 dark:text-indigo-300">3</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Enroll, Learn, and Track Progress</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-indigo-600 dark:text-indigo-300">4</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Share Resources & Assessments</p>
                        </div>
                    </div>
                </section>
                {/* Platform Stats Section (Animated Cards) */}
                <StatsSection
                    stats={stats}
                    statsLoading={statsLoading}
                    statsError={statsError}
                />
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;
