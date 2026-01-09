'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllQuizzes, deleteQuiz } from '../../../../lib/api/quiz.api';

export default function QuizPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getAllQuizzes();
            setQuizzes(data);
            setError(null);
        } catch (err) {
            setError('Nie udało się załadować quizów');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć ten quiz? Zostaną usunięte również wszystkie pytania i odpowiedzi.')) {
            return;
        }

        try {
            await deleteQuiz(id);
            setQuizzes(quizzes.filter(quiz => quiz.id_quizu !== id));
        } catch (err) {
            alert('Nie udało się usunąć quizu');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Ładowanie quizów...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Zarządzanie Quizami</h1>
                <Link
                    href="/dashboard/administrator/quiz/create"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
                >
                    + Dodaj Quiz
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {quizzes.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <p className="text-gray-600 text-lg mb-4">Nie masz jeszcze żadnych quizów</p>
                    <Link
                        href="/dashboard/administrator/quiz/create"
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
                    >
                        Utwórz pierwszy quiz
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id_quizu} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            <h2 className="text-xl font-semibold mb-2">{quiz.nazwa}</h2>
                            <p className="text-gray-600 mb-4">{quiz.opis}</p>
                            
                            <div className="flex gap-2 flex-wrap">
                                <Link
                                    href={`/dashboard/administrator/quiz/${quiz.id_quizu}`}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition text-sm"
                                >
                                    Szczegóły
                                </Link>
                                <Link
                                    href={`/dashboard/administrator/quiz/${quiz.id_quizu}/edit`}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition text-sm"
                                >
                                    Edytuj
                                </Link>
                                <Link
                                    href={`/dashboard/administrator/quiz/${quiz.id_quizu}/questions`}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition text-sm"
                                >
                                    Pytania
                                </Link>
                                <button
                                    onClick={() => handleDelete(quiz.id_quizu)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition text-sm"
                                >
                                    Usuń
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
