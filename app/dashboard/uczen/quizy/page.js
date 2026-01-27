'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../../../components/PageHeader';
import { 
    getQuizzesByGroup, 
    getQuizResultsByStudent, 
    getQuizById, 
    getQuestionsByQuiz, 
    getAnswersByQuestion,
    getQuizResultsByQuiz 
} from '../../../../lib/api/quiz.api';
import { getStudentById } from '../../../../lib/api/student.api';
import { getLessonsForGroup } from '../../../../lib/api/lesson.api';
import { useAuth } from '../../../../context/AuthContext';

export default function StudentQuizzesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupId, setGroupId] = useState(null);
    const [quizResults, setQuizResults] = useState({});
    const [modalQuizId, setModalQuizId] = useState(null);
    const [quizDetails, setQuizDetails] = useState({});
    const [groupAverages, setGroupAverages] = useState({});
    const [progressTrend, setProgressTrend] = useState(null);

    useEffect(() => {
        if (user?.id) {
            loadStudentData();
        }
    }, [user]);

    useEffect(() => {
        if (groupId) {
            loadQuizzes();
            loadQuizResults();
        }
    }, [groupId]);

    useEffect(() => {
        if (groupId && Object.keys(quizResults).length > 0) {
            loadGroupAverages();
            calculateProgressTrend();
        }
    }, [quizResults, groupId]);

    const loadStudentData = async () => {
        try {
            setLoading(true);
            const studentData = await getStudentById(user.id);
            
            if (studentData?.id_grupa) {
                setGroupId(studentData.id_grupa);
            } else {
                setError('Nie jestes przypisany do zadnej grupy');
                setLoading(false);
            }
        } catch (err) {
            console.error('Blad ladowania danych ucznia:', err);
            setError('Nie udalo sie zaladowac danych ucznia');
            setLoading(false);
        }
    };

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            const [quizzesData, lessonsData] = await Promise.all([
                getQuizzesByGroup(groupId),
                getLessonsForGroup(groupId)
            ]);
            
          
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            
            const filteredQuizzes = (quizzesData || []).filter(quiz => {
             
                if (!quiz.Zajecia_id_zajec) {
                    return false;
                }
                
            
                const lesson = lessonsData.find(l => l.id_zajec === quiz.Zajecia_id_zajec);
                if (!lesson || !lesson.data) {
                    return false;
                }
               
                const lessonDate = new Date(lesson.data);
                lessonDate.setHours(0, 0, 0, 0);
                
                return lessonDate <= today;
            });
            
            setQuizzes(filteredQuizzes);
            setError(null);
        } catch (err) {
            console.error('Blad ladowania quizow:', err);
            setError('Nie udalo sie zaladowac quizow');
        } finally {
            setLoading(false);
        }
    };

    const loadQuizResults = async () => {
        try {
            const results = await getQuizResultsByStudent(user.id);
            const resultsMap = {};
            results.forEach(result => {
                resultsMap[result.Quiz_id_quizu] = result;
            });
            setQuizResults(resultsMap);
        } catch (err) {
            console.error('Błąd ładowania wyników:', err);
            setQuizResults({});
        }
    };

    const loadGroupAverages = async () => {
        try {
            const averagesMap = {};
            
            await Promise.all(
                Object.keys(quizResults).map(async (quizId) => {
                    try {
                        const allResults = await getQuizResultsByQuiz(quizId);
                        
                        const otherResults = allResults.filter(result => result.id_ucznia !== user.id);
                        
                        if (otherResults.length > 0) {
                            const average = otherResults.reduce((sum, result) => sum + (result.wynik || 0), 0) / otherResults.length;
                            averagesMap[quizId] = {
                                average: Math.round(average * 10) / 10,
                                studentsCount: otherResults.length
                            };
                        }
                    } catch (err) {
                        console.error(`Błąd pobierania średniej dla quizu ${quizId}:`, err);
                    }
                })
            );
            
            setGroupAverages(averagesMap);
        } catch (err) {
            console.error('Błąd ładowania średnich grupy:', err);
        }
    };

    const calculateProgressTrend = () => {
        try {
            const solvedQuizzes = Object.values(quizResults)
                .filter(result => result.data_uzyskania)
                .sort((a, b) => new Date(a.data_uzyskania) - new Date(b.data_uzyskania));
            
            if (solvedQuizzes.length < 2) {
                setProgressTrend(null);
                return;
            }
            
            const recentQuizzes = solvedQuizzes.slice(-3);
            const earlierQuizzes = solvedQuizzes.slice(-6, -3);
            
            if (earlierQuizzes.length === 0) {
                setProgressTrend(null);
                return;
            }
            
            const recentAverage = recentQuizzes.reduce((sum, quiz) => sum + (quiz.wynik || 0), 0) / recentQuizzes.length;
            const earlierAverage = earlierQuizzes.reduce((sum, quiz) => sum + (quiz.wynik || 0), 0) / earlierQuizzes.length;
            
            const difference = recentAverage - earlierAverage;
            const percentageChange = earlierAverage > 0 ? (difference / earlierAverage) * 100 : 0;
            
            setProgressTrend({
                isImproving: difference > 0,
                difference: Math.round(difference * 10) / 10,
                percentageChange: Math.round(percentageChange * 10) / 10,
                recentAverage: Math.round(recentAverage * 10) / 10,
                earlierAverage: Math.round(earlierAverage * 10) / 10
            });
        } catch (err) {
            console.error('Błąd obliczania trendu:', err);
            setProgressTrend(null);
        }
    };

    const openQuizModal = async (quizId) => {
        setModalQuizId(quizId);
        
        if (!quizDetails[quizId]) {
            try {
                const questionsData = await getQuestionsByQuiz(quizId);
                
                const questionsWithAnswers = await Promise.all(
                    questionsData.map(async (question) => {
                        const answers = await getAnswersByQuestion(question.id_pytania);
                        return {
                            ...question,
                            odpowiedzi: answers || []
                        };
                    })
                );

                setQuizDetails(prev => ({
                    ...prev,
                    [quizId]: questionsWithAnswers
                }));
            } catch (err) {
                console.error('Błąd ładowania szczegółów quizu:', err);
                setModalQuizId(null);
            }
        }
    };

    const closeModal = () => {
        setModalQuizId(null);
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                <PageHeader 
                    title="🧠 Moje Quizy" 
                    description="Sprawdź swoją wiedzę i zdobywaj punkty"
                    actions={
                        <div className="hidden md:flex gap-4">
                            <div className="bg-white rounded-xl shadow-md px-6 py-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{quizzes.length}</div>
                                <div className="text-xs text-gray-600 uppercase tracking-wide">Dostępne</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md px-6 py-4 text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {Object.keys(quizResults).length}
                                </div>
                                <div className="text-xs text-gray-600 uppercase tracking-wide">Rozwiazane</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md px-6 py-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {quizzes.length - Object.keys(quizResults).length}
                                </div>
                                <div className="text-xs text-gray-600 uppercase tracking-wide">Do zrobienia</div>
                            </div>
                        </div>
                    </div>
                </div>

                {progressTrend && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-xl ${progressTrend.isImproving ? 'bg-green-100' : 'bg-orange-100'}`}>
                                {progressTrend.isImproving ? (
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">
                                📈 Twój postęp
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-xl ${progressTrend.isImproving ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <p className={`text-lg font-bold ${progressTrend.isImproving ? 'text-green-600' : 'text-orange-600'}`}>
                                    {progressTrend.isImproving ? '📈 Poprawiasz się!' : '📉 Spadek wyników'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {progressTrend.isImproving ? 'Świetna robota! Kontynuuj!' : 'Nie poddawaj się, następnym razem pójdzie lepiej!'}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                <p className="text-sm font-medium text-gray-600">Zmiana</p>
                                <p className="text-lg font-bold text-blue-600">
                                    {progressTrend.difference > 0 ? '+' : ''}{progressTrend.difference} pkt
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    ({progressTrend.percentageChange > 0 ? '+' : ''}{progressTrend.percentageChange}%)
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                                <p className="text-sm font-medium text-gray-600">Porównanie</p>
                                <p className="text-lg font-bold text-purple-600">
                                    {progressTrend.recentAverage} vs {progressTrend.earlierAverage}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Ostatnie vs wcześniejsze quizy
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">⚠️</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
                        <div className="text-8xl mb-6">📚</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            Brak dostępnych quizów
                        </h2>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Twój nauczyciel jeszcze nie przypisał żadnych quizów do Twojej grupy. 
                            Wróć później, aby sprawdzić nowe zadania!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map((quiz) => {
                            const result = quizResults[quiz.id_quizu];
                            const isSolved = !!result;
                            const groupAverage = groupAverages[quiz.id_quizu];
                            
                            return (
                                <div
                                    key={quiz.id_quizu}
                                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                                >
                                    <div className={`relative p-6 ${
                                        isSolved 
                                            ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600' 
                                            : 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600'
                                    }`}>
                                        <h3 className="text-xl font-bold text-white drop-shadow-md">
                                            {quiz.nazwa}
                                        </h3>
                                    </div>
                                    
                                    <div className="p-6">
                                        {quiz.opis && (
                                            <p className="text-gray-600 mb-4 line-clamp-2">
                                                {quiz.opis}
                                            </p>
                                        )}
                                        
                                        {isSolved && (
                                            <>
                                                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-semibold text-green-800">
                                                            🏆 Twój wynik
                                                        </span>
                                                        <span className="text-2xl font-bold text-green-600">
                                                            {result.wynik} pkt
                                                        </span>
                                                    </div>
                                                    {result.data_uzyskania && (
                                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                                            </svg>
                                                            Ukończono: {new Date(result.data_uzyskania).toLocaleDateString('pl-PL', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {groupAverage && (
                                                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-semibold text-blue-800">
                                                                👥 Średnia grupy
                                                            </span>
                                                            <span className="text-2xl font-bold text-blue-600">
                                                                {groupAverage.average} pkt
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs text-blue-600">
                                                                Na podstawie {groupAverage.studentsCount} {groupAverage.studentsCount === 1 ? 'ucznia' : 'uczniów'}
                                                            </p>
                                                            <div className={`text-xs px-2 py-1 rounded-full font-bold ${ 
                                                                result.wynik > groupAverage.average 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : result.wynik === groupAverage.average
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {result.wynik > groupAverage.average ? '🚀 Powyżej średniej!' : 
                                                                 result.wynik === groupAverage.average ? '➡️ Na poziomie średniej' : 
                                                                 '📚 Poniżej średniej'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        
                                        <button
                                            onClick={() => isSolved ? openQuizModal(quiz.id_quizu) : router.push(`/dashboard/uczen/quizy/${quiz.id_quizu}`)}
                                            className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl flex items-center justify-center gap-2 ${
                                                isSolved
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                            }`}
                                        >
                                            {isSolved ? (
                                                <>
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                                    </svg>
                                                    Pokaż szczegóły
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                                                    </svg>
                                                    Rozpocznij quiz
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

           
            {modalQuizId && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={closeModal}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                </svg>
                                Szczegóły quizu - Poprawne odpowiedzi
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {quizDetails[modalQuizId] ? (
                                <div className="space-y-4">
                                    {quizDetails[modalQuizId].map((question, index) => {
                                        const correctAnswersList = question.odpowiedzi.filter(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true);
                                        const isMultiple = correctAnswersList.length > 1;

                                        return (
                                            <div key={question.id_pytania} className="p-5 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-lg transition-shadow">
                                                <h5 className="font-bold text-gray-900 mb-3 text-lg">
                                                    <span className="inline-block bg-green-600 text-white rounded-full w-8 h-8 text-center leading-8 mr-2">
                                                        {index + 1}
                                                    </span>
                                                    {question.tresc}
                                                </h5>
                                                
                                                <div className="flex gap-2 mb-3">
                                                    {isMultiple && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                                                            </svg>
                                                            Wielokrotny wybór
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                        </svg>
                                                        {question.ilosc_punktow || 1} pkt
                                                    </span>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg border border-gray-300">
                                                    <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                        </svg>
                                                        Odpowiedzi:
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {question.odpowiedzi.map(ans => {
                                                            const isCorrect = ans.czy_poprawna === 1 || ans.czy_poprawna === true;
                                                            return (
                                                                <li 
                                                                    key={ans.id_odpowiedzi} 
                                                                    className={`flex items-start gap-2 p-3 rounded-lg ${
                                                                        isCorrect 
                                                                            ? 'bg-green-50 border-2 border-green-400' 
                                                                            : 'bg-gray-50 border border-gray-300'
                                                                    }`}
                                                                >
                                                                    <span className={`font-bold mt-0.5 ${
                                                                        isCorrect ? 'text-green-600' : 'text-red-500'
                                                                    }`}>
                                                                        {isCorrect ? '✓' : '✗'}
                                                                    </span>
                                                                    <span className={isCorrect ? 'text-green-800 font-medium' : 'text-gray-600'}>
                                                                        {ans.tresc}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
