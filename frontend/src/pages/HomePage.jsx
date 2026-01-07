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
        // Mock data for demo
        const mockCourses = [
            {
                id: 1,
                title: "Complete React Development Bootcamp",
                description: "Master React from basics to advanced concepts including hooks, context, and state management",
                price: 199.99,
                discountPrice: 149.99,
                discountActive: true,
                duration: 40,
                level: "Beginner",
                imageFileId: "1",
                instructor: { firstName: "Sarah", lastName: "Johnson" }
            },
            {
                id: 2,
                title: "Data Science with Python",
                description: "Comprehensive course covering data analysis, visualization, and machine learning with Python",
                price: 249.99,
                discountPrice: null,
                discountActive: false,
                duration: 50,
                level: "Intermediate",
                imageFileId: "2",
                instructor: { firstName: "Michael", lastName: "Chen" }
            },
            {
                id: 3,
                title: "UI/UX Design Fundamentals",
                description: "Learn the principles of user interface and user experience design with hands-on projects",
                price: 179.99,
                discountPrice: 129.99,
                discountActive: true,
                duration: 30,
                level: "Beginner",
                imageFileId: "3",
                instructor: { firstName: "Emily", lastName: "Rodriguez" }
            },
            {
                id: 4,
                title: "Mobile App Development with React Native",
                description: "Build cross-platform mobile apps using React Native and JavaScript",
                price: 229.99,
                discountPrice: 179.99,
                discountActive: true,
                duration: 45,
                level: "Intermediate",
                imageFileId: "4",
                instructor: { firstName: "David", lastName: "Thompson" }
            },
            {
                id: 5,
                title: "DevOps and Cloud Computing",
                description: "Master DevOps practices and cloud deployment with AWS, Docker, and Kubernetes",
                price: 299.99,
                discountPrice: null,
                discountActive: false,
                duration: 60,
                level: "Advanced",
                imageFileId: "5",
                instructor: { firstName: "Lisa", lastName: "Wang" }
            },
            {
                id: 6,
                title: "JavaScript Fundamentals",
                description: "Complete guide to JavaScript programming from basics to advanced concepts",
                price: 149.99,
                discountPrice: 99.99,
                discountActive: true,
                duration: 35,
                level: "Beginner",
                imageFileId: "6",
                instructor: { firstName: "Sarah", lastName: "Johnson" }
            }
        ];

        const mockStats = {
            courses: 12,
            students: 1247,
            teachers: 6,
            lessons: 156
        };

        // Simulate loading delay
        setTimeout(() => {
            setCourses(mockCourses);
            setLoading(false);
            setStats(mockStats);
            setStatsLoading(false);
        }, 800);
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
                            <div className="bg-[#E6E8FA] dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-[#2B2FAF] dark:text-[#A5A8F5]">1</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Sign Up as Student or Teacher</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-[#E6E8FA] dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-[#2B2FAF] dark:text-[#A5A8F5]">2</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Browse or Create Courses</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-[#E6E8FA] dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-[#2B2FAF] dark:text-[#A5A8F5]">3</div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Enroll, Learn, and Track Progress</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-[#E6E8FA] dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-2xl font-bold text-[#2B2FAF] dark:text-[#A5A8F5]">4</div>
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
