'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getQuizzesByGroup } from '../../../../lib/api/quiz.api';
import { getStudentById } from '../../../../lib/api/student.api';
import { useAuth } from '../../../../context/AuthContext';

export default function StudentQuizzesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupId, setGroupId] = useState(null);

    useEffect(() => {
        if (user?.id) {
            loadStudentData();
        }
    }, [user]);

    useEffect(() => {
        if (groupId) {
            loadQuizzes();
        }
    }, [groupId]);

    const loadStudentData = async () => {
        try {
            setLoading(true);
            const studentData = await getStudentById(user.id);
            
            if (studentData?.id_grupa) {
                setGroupId(studentData.id_grupa);
            } else {
                setError('Nie jesteś przypisany do żadnej grupy');
                setLoading(false);
            }
        } catch (err) {
            console.error('Błąd ładowania danych ucznia:', err);
            setError('Nie udało się załadować danych ucznia');
            setLoading(false);
        }
    };

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getQuizzesByGroup(groupId);
            setQuizzes(data || []);
            setError(null);
        } catch (err) {
            console.error('Błąd ładowania quizów:', err);
            setError('Nie udało się załadować quizów');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie quizów...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Moje Quizy</h1>
                    <p className="text-gray-600 mt-2">Quizy dostępne dla Twojej grupy</p>
                </header>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Brak dostępnych quizów
                        </h2>
                        <p className="text-gray-600">
                            Twój nauczyciel jeszcze nie przypisał żadnych quizów do Twojej grupy.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map((quiz) => (
                            <div
                                key={quiz.id_quizu}
                                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                                    <h3 className="text-xl font-bold text-white">{quiz.nazwa}</h3>
                                </div>
                                
                                <div className="p-6">
                                    {quiz.opis && (
                                        <p className="text-gray-600 mb-4">{quiz.opis}</p>
                                    )}
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => router.push(`/dashboard/uczen/quizy/${quiz.id_quizu}`)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition"
                                        >
                                            Rozwiąż quiz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
