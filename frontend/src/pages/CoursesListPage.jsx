import React, { useEffect, useState } from 'react';
import { fetchCourses } from '../services/apiService';
import CourseCard from '../components/CourseCard';

const CoursesListPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCourses()
            .then(setCourses)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">All Courses</h1>
                {loading && <div className="text-center py-10">Loading...</div>}
                {error && <div className="text-center text-red-500 py-10">{error}</div>}

                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
                {!loading && courses.length === 0 && (
                    <div className="text-center text-gray-500 py-10">No courses found.</div>
                )}
            </div>
        </div>
    );
};

export default CoursesListPage; 