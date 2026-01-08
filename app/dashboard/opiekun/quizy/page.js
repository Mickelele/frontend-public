'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { getQuizResultsByStudent, getQuizById, getQuestionsByQuiz } from '/lib/api/quiz.api';
import { getGroupById } from '/lib/api/group.api';
import { getUserIdFromToken } from '/lib/auth';

export default function GuardianQuizzes() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [quizResults, setQuizResults] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const opiekunId = getUserIdFromToken();
        if (opiekunId) {
            fetchStudents(opiekunId);
        }
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentQuizResults(selectedStudent);
        }
    }, [selectedStudent]);

    const fetchStudents = async (opiekunId) => {
        try {
            setLoading(true);
            const studentsData = await getOpiekunStudents(opiekunId);
            
            const studentsWithGroups = await Promise.all(
                (studentsData || []).map(async (student) => {
                    if (student.id_grupa) {
                        try {
                            const groupData = await getGroupById(student.id_grupa);
                            return { ...student, grupa: groupData };
                        } catch (err) {
                            console.error(`Błąd pobierania grupy ${student.id_grupa}:`, err);
                            return student;
                        }
                    }
                    return student;
                })
            );
            
            setStudents(studentsWithGroups);
            
            if (studentsWithGroups && studentsWithGroups.length > 0) {
                setSelectedStudent(studentsWithGroups[0]);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Błąd podczas pobierania uczniów:', err);
            setError('Nie udało się pobrać listy uczniów');
            setLoading(false);
        }
    };

    const fetchStudentQuizResults = async (student) => {
        try {
            setLoading(true);
            const resultsData = await getQuizResultsByStudent(student.id_ucznia);
            
            const resultsWithQuizDetails = await Promise.all(
                (resultsData || []).map(async (result) => {
                    if (!result.Quiz_id_quizu) {
                        console.warn('Wynik quizu bez Quiz_id_quizu:', result);
                        return result;
                    }
                    try {
                        const quizData = await getQuizById(result.Quiz_id_quizu);
                        
                        // Pobierz pytania dla quizu i oblicz maksymalną liczbę punktów
                        let calculatedMaxPoints = 10; // domyślnie 10
                        try {
                            const questions = await getQuestionsByQuiz(result.Quiz_id_quizu);
                            if (questions && Array.isArray(questions) && questions.length > 0) {
                                calculatedMaxPoints = questions.reduce((sum, pytanie) => {
                                    return sum + (pytanie.ilosc_punktow || pytanie.punkty || pytanie.liczba_punktow || 1);
                                }, 0);
                            }
                        } catch (err) {
                            console.error(`Błąd pobierania pytań dla quizu ${result.Quiz_id_quizu}:`, err);
                        }
                        
                        return { 
                            ...result, 
                            quiz: { 
                                ...quizData, 
                                max_punktow: calculatedMaxPoints 
                            } 
                        };
                    } catch (err) {
                        console.error(`Błąd pobierania quizu ${result.Quiz_id_quizu}:`, err);
                        return result;
                    }
                })
            );
            
            setQuizResults(resultsWithQuizDetails);
            setLoading(false);
        } catch (err) {
            console.error('Błąd podczas pobierania wyników quizów:', err);
            setError('Nie udało się pobrać wyników quizów');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Ładowanie wyników quizów...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">🧩 Wyniki quizów</h1>
                        <p className="text-gray-600 mt-2">Wszystkie wyniki quizów Twoich podopiecznych</p>
                    </header>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Brak przypisanych uczniów
                        </h3>
                        <p className="text-gray-600">
                            Nie masz jeszcze przypisanych uczniów do opieki.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">🧩 Wyniki quizów</h1>
                        <p className="text-gray-600 mt-2">Wszystkie wyniki quizów Twoich podopiecznych</p>
                    </header>
                    <div className="bg-red-50 rounded-lg shadow-md p-8 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold text-red-800 mb-2">Wystąpił błąd</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">🧩 Wyniki quizów</h1>
                    <p className="text-gray-600 mt-2">Wszystkie wyniki quizów Twoich podopiecznych</p>
                </header>

                {students.length > 1 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Wybierz ucznia:
                        </label>
                        <select
                            value={selectedStudent?.id_ucznia || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.id_ucznia === parseInt(e.target.value));
                                setSelectedStudent(student);
                            }}
                            className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium"
                        >
                            {students.map((student) => (
                                <option key={student.id_ucznia} value={student.id_ucznia}>
                                    {student.user?.imie} {student.user?.nazwisko}
                                    {student.pseudonim && ` (${student.pseudonim})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedStudent && (
                    <>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-md p-6 mb-6 text-white">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        {selectedStudent.user?.imie} {selectedStudent.user?.nazwisko}
                                    </h2>
                                    {selectedStudent.pseudonim && (
                                        <p className="text-purple-100">Pseudonim: {selectedStudent.pseudonim}</p>
                                    )}
                                    {selectedStudent.grupa?.nazwa_grupy && (
                                        <p className="text-purple-100 text-sm mt-1">
                                            Grupa: {selectedStudent.grupa.nazwa_grupy}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {quizResults.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-lg font-medium text-gray-800">Brak rozwiązanych quizów</p>
                                <p className="text-sm text-gray-600 mt-2">Uczeń nie rozwiązał jeszcze żadnego quizu</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div key="total-quizzes" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-md">
                                        <div className="text-3xl font-bold mb-2">
                                            {quizResults.length}
                                        </div>
                                        <div className="text-sm text-blue-100">Rozwiązane quizy</div>
                                    </div>
                                    <div key="avg-points" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-md">
                                        <div className="text-3xl font-bold mb-2">
                                            {quizResults.length > 0 
                                                ? (quizResults.reduce((sum, r) => sum + (r.wynik || 0), 0) / quizResults.length).toFixed(1)
                                                : 0}
                                        </div>
                                        <div className="text-sm text-purple-100">Średnia punktów</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {quizResults.map((result) => (
                                        <div
                                            key={result.id_wyniku_quizu}
                                            className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all bg-white"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                                                        🧩 {result.quiz?.tytul || 'Quiz'}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                        {result.data_uzyskania && (
                                                            <span className="flex items-center gap-1">
                                                                📅 {formatDate(result.data_uzyskania)}
                                                            </span>
                                                        )}
                                                        {result.quiz?.opis && (
                                                            <span className="flex items-center gap-1">
                                                                📝 {result.quiz.opis}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-3xl font-bold ${
                                                        result.wynik >= ((result.quiz?.max_punktow || 10) * 0.8) 
                                                            ? 'text-green-600' 
                                                            : result.wynik >= ((result.quiz?.max_punktow || 10) * 0.5)
                                                            ? 'text-yellow-600'
                                                            : 'text-red-600'
                                                    }`}>
                                                        {result.wynik || 0}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        / {result.quiz?.max_punktow || 10} pkt
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Wynik procentowy:
                                                    </span>
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {((result.wynik / (result.quiz?.max_punktow || 10)) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className={`h-4 rounded-full transition-all ${
                                                            (result.wynik / (result.quiz?.max_punktow || 10)) >= 0.8
                                                                ? 'bg-green-500' 
                                                                : (result.wynik / (result.quiz?.max_punktow || 10)) >= 0.5
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                        style={{
                                                            width: `${Math.max(2, (result.wynik / (result.quiz?.max_punktow || 10)) * 100)}%`,
                                                            minWidth: result.wynik > 0 ? '2%' : '0%'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
