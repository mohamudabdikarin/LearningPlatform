import React from 'react';
import CountUp from 'react-countup';
import { BookOpen, Users, GraduationCap, PlaySquare, AlertTriangle } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

// A single, reusable card component for displaying a statistic.
const StatCard = ({ icon, title, value, color, description, animate }) => {
    const IconComponent = icon;
    const colorVariants = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    };
    const colorClasses = colorVariants[color] || colorVariants.blue;

    return (
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${colorClasses.bg} dark:bg-gray-700`}>
                        <IconComponent className={colorClasses.text} size={28} />
                    </div>
                    <p className="mt-4 text-xs text-slate-500 dark:text-gray-400">{description}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-4xl font-bold text-slate-800 dark:text-white">
                        <CountUp end={value} duration={2} separator="," start={animate ? undefined : value} />
                    </h3>
                    <p className="mt-1 text-base font-medium text-slate-600 dark:text-gray-300">{title}</p>
                </div>
            </div>
        </div>
    );
};

// A skeleton loader component to show while data is fetching.
const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse flex items-start justify-between">
            <div>
                <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="mt-4 h-2 w-24 bg-slate-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="text-right flex flex-col items-end">
                <div className="h-10 w-20 bg-slate-200 dark:bg-gray-700 rounded"></div>
                <div className="mt-1 h-4 w-16 bg-slate-200 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    </div>
);

// The main component for the stats section.
// It accepts props for stats data, loading, and error states from a parent component.
const StatsSection = ({ stats, statsLoading, statsError }) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
    const statsData = [
        {
            icon: BookOpen,
            title: "Courses",
            value: stats?.courses || 0,
            color: "blue",
            description: "Diverse topics"
        },
        {
            icon: Users,
            title: "Students",
            value: stats?.students || 0,
            color: "green",
            description: "Globally enrolled"
        },
        {
            icon: GraduationCap,
            title: "Teachers",
            value: stats?.teachers || 0,
            color: "amber",
            description: "Expert instructors"
        }
    ];

    return (
        <section ref={ref} className="bg-slate-50 dark:bg-gray-900 antialiased">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Growing with Our Community
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-gray-300">
                        Our platform is constantly expanding. Here's a real-time look at our key metrics and milestones.
                    </p>
                </div>

                {/* Content Area: Handles Loading, Error, and Success States from props */}
                <div>
                    {statsLoading ? (
                        // Skeleton Loading State
                        <div className="flex flex-wrap justify-center gap-6">
                            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : statsError ? (
                        // Error State
                        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 p-6 rounded-lg flex items-center max-w-3xl mx-auto">
                            <AlertTriangle className="h-6 w-6 text-red-500 mr-4" />
                            <div>
                                <h3 className="font-bold">Error Loading Stats</h3>
                                <p>{statsError}</p>
                            </div>
                        </div>
                    ) : (
                        // Success State: Display Stats
                        <div className="flex flex-wrap justify-center gap-6">
                            {statsData.map((stat) => (
                                <StatCard
                                    key={stat.title}
                                    icon={stat.icon}
                                    title={stat.title}
                                    value={stat.value}
                                    color={stat.color}
                                    description={stat.description}
                                    animate={inView}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;