'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getQuizById } from '../../../../../lib/api/quiz.api';

export default function QuizDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (params.id) {
            loadQuiz();
        }
    }, [params.id]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const data = await getQuizById(params.id);
            setQuiz(data);
            setError(null);
        } catch (err) {
            setError('Nie udało się załadować quizu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Ładowanie...</div>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error || 'Quiz nie został znaleziony'}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{quiz.nazwa}</h1>
                        <p className="text-gray-600">{quiz.opis}</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                    >
                        Powrót
                    </button>
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Informacje o quizie</h2>
                    <div className="space-y-2">
                        <p><strong>ID Quizu:</strong> {quiz.id_quizu}</p>
                        {quiz.created_at && (
                            <p><strong>Data utworzenia:</strong> {new Date(quiz.created_at).toLocaleString('pl-PL')}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/administrator/quiz/${params.id}/edit`)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded transition"
                    >
                        Edytuj Quiz
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/administrator/quiz/${params.id}/questions`)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded transition"
                    >
                        Zarządzaj Pytaniami
                    </button>
                </div>
            </div>
        </div>
    );
}
