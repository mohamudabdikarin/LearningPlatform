import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Pencil, Trash2 } from 'lucide-react';

function formatPrice(price) {
    return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const CourseCard = ({ course, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const BACKEND_URL = "http://localhost:8080"; // or from .env
    // Placeholder/mock data for instructor, rating, reviewCount, oldPrice, bestseller
    const instructor = course.instructor?.firstName && course.instructor?.lastName 
        ? `${course.instructor.firstName} ${course.instructor.lastName}` 
        : course.instructorName || "Instructor";
    const rating = course.rating || 4.8;
    const reviewCount = course.reviewCount || Math.floor(Math.random() * 2000) + 100;
    const oldPrice = course.oldPrice || (course.price ? (Number(course.price) * 1.5).toFixed(2) : "");
    const isBestseller = course.isBestseller || Math.random() > 0.7;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col w-full overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Image */}
            <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-t-2xl overflow-hidden">
                <div className="aspect-[16/9] w-full">
                    {course.imageUrl ? (
                        <img
                            src={course.imageUrl.startsWith('/uploads/') ? BACKEND_URL + course.imageUrl : course.imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700" style={{ display: course.imageUrl ? 'none' : 'flex' }}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-sm">No Image</span>
                        </div>
                    </div>
                </div>
                {isBestseller && (
                    <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase shadow-lg">
                        Bestseller
                    </span>
                )}
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col p-5">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                        {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">
                        {instructor}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {course.description}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {rating.toFixed(1)}
                        </span>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={14} 
                                    className={i < Math.round(rating) 
                                        ? "text-yellow-400 fill-current" 
                                        : "text-gray-300 dark:text-gray-600"
                                    } 
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({reviewCount.toLocaleString()})
                        </span>
                    </div>
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(course.price)}
                    </span>
                    {oldPrice && Number(oldPrice) > Number(course.price) && (
                        <span className="text-sm text-gray-400 line-through">
                            {formatPrice(oldPrice)}
                        </span>
                    )}
                </div>
                
                {/* Actions */}
                {onEdit && onDelete ? (
                    <div className="flex gap-2">
                        <button 
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm" 
                            onClick={onEdit} 
                            aria-label="Edit Course"
                        >
                            <Pencil size={14} /> Edit
                        </button>
                        <button 
                            className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 bg-transparent border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm" 
                            onClick={onDelete} 
                            aria-label="Delete Course"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => {
                            // Check if we're on a public page or student dashboard
                            const path = window.location.pathname;
                            if (path.includes('/dashboard/student')) {
                                navigate(`/dashboard/student/course/${course.id}`);
                            } else if (path.includes('/dashboard')) {
                                navigate(`/dashboard/course/${course.id}`);
                            } else {
                                navigate(`/courses/${course.id}`);
                            }
                        }}
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseCard; 