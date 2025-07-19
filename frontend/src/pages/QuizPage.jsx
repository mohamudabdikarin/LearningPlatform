import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const emptyQuiz = { title: '', description: '', totalPoints: 10 };

const QuizPage = ({ courseId }) => {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(emptyQuiz);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        apiFetch(`/quizzes/course/${courseId}`)
            .then(setQuizzes)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [courseId]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async e => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            const created = await apiFetch(`/quizzes?courseId=${courseId}`, {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setQuizzes([...quizzes, created]);
            setForm(emptyQuiz);
            setSuccess('Quiz created!');
        } catch (e) {
            setError(e.message);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow mt-8">
            <h2 className="text-2xl font-bold mb-4">Quizzes for Course #{courseId}</h2>
            {success && <div className="mb-3 text-green-600">{success}</div>}
            {user && user.roles && user.roles.includes('TEACHER') && (
                <form onSubmit={handleCreate} className="space-y-4 mb-8">
                    <div>
                        <label className="block mb-1">Title</label>
                        <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" required />
                    </div>
                    <div>
                        <label className="block mb-1">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" required />
                    </div>
                    <div>
                        <label className="block mb-1">Total Points</label>
                        <input name="totalPoints" type="number" value={form.totalPoints} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" required />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Quiz</button>
                </form>
            )}
            <h3 className="text-lg font-bold mb-2">Quizzes</h3>
            <div className="space-y-4">
                {quizzes.length === 0 && <div>No quizzes for this course.</div>}
                {quizzes.map(quiz => (
                    <div key={quiz.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="font-bold">{quiz.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{quiz.description}</div>
                            <div className="text-sm text-gray-500">Total Points: {quiz.totalPoints}</div>
                        </div>
                        {user && user.roles && user.roles.includes('STUDENT') && (
                            <button className="px-3 py-1 bg-indigo-600 text-white rounded mt-2 md:mt-0">Take Quiz</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuizPage; 