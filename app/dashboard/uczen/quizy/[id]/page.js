'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    getQuizById, 
    getQuestionsByQuiz, 
    getAnswersByQuestion,
    getQuizResultsByStudent,
    createQuizResult 
} from '../../../../../lib/api/quiz.api';
import { useAuth } from '../../../../../context/AuthContext';

export default function SolveQuizPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const quizId = params.id;

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [savedResult, setSavedResult] = useState(null);
    const [alreadySolved, setAlreadySolved] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (quizId && user?.id) {
            checkIfAlreadySolved();
        }
    }, [quizId, user]);

    const checkIfAlreadySolved = async () => {
        try {
            setLoading(true);
            
            const studentResults = await getQuizResultsByStudent(user.id);
            const existingResult = studentResults.find(
                result => result.Quiz_id_quizu == quizId
            );

            if (existingResult) {
                setSavedResult(existingResult);
                setAlreadySolved(true);
                await loadQuizDataForReview(existingResult);
            } else {
                await loadQuizData();
            }
        } catch (err) {
            console.error('Błąd sprawdzania wyników:', err);
            await loadQuizData();
        }
    };

    const loadQuizDataForReview = async (result) => {
        try {
            const quizData = await getQuizById(quizId);
            setQuiz(quizData);

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

            setQuestions(questionsWithAnswers);
            setScore(result.wynik);
            setShowResults(true);
            setLoading(false);
        } catch (err) {
            console.error('Błąd ładowania quizu:', err);
            setError('Nie udało się załadować quizu');
            setLoading(false);
        }
    };

    const loadQuizData = async () => {
        try {
            setLoading(true);
            
            const quizData = await getQuizById(quizId);
            setQuiz(quizData);

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

            setQuestions(questionsWithAnswers);
            setLoading(false);
        } catch (err) {
            console.error('Błąd ładowania quizu:', err);
            setError('Nie udało się załadować quizu');
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId, answerId, isMultiple) => {
        if (isMultiple) {
            const currentAnswers = userAnswers[questionId] || [];
            const newAnswers = currentAnswers.includes(answerId)
                ? currentAnswers.filter(id => id !== answerId)
                : [...currentAnswers, answerId];
            
            setUserAnswers({
                ...userAnswers,
                [questionId]: newAnswers
            });
        } else {
            setUserAnswers({
                ...userAnswers,
                [questionId]: answerId
            });
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        let earnedPoints = 0;
        let maxPoints = 0;
        
        questions.forEach((question) => {
            const questionPoints = question.ilosc_punktow || 1;
            maxPoints += questionPoints;
            
            const correctAnswersList = question.odpowiedzi.filter(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true);
            const selectedAnswers = userAnswers[question.id_pytania];
            
            if (correctAnswersList.length > 1) {
                const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [];
                const correctIds = correctAnswersList.map(ans => ans.id_odpowiedzi).sort();
                const selectedIds = selectedArray.sort();
                
                if (JSON.stringify(correctIds) === JSON.stringify(selectedIds)) {
                    earnedPoints += questionPoints;
                }
            } else {
                const correctAnswer = correctAnswersList[0];
                if (correctAnswer && selectedAnswers === correctAnswer.id_odpowiedzi) {
                    earnedPoints += questionPoints;
                }
            }
        });

        setScore(earnedPoints);
        
        try {
            const resultData = {
                Uczen_id_ucznia: user.id,
                Quiz_id_quizu: parseInt(quizId),
                wynik: earnedPoints,
                data_uzyskania: new Date().toISOString().split('T')[0]
            };
            
            const savedResult = await createQuizResult(resultData);
            setSavedResult(savedResult);
            setAlreadySolved(true);
        } catch (err) {
            console.error('Błąd zapisywania wyniku:', err);
            console.warn('Wynik nie został zapisany - endpoint może nie być dostępny');
        }
        
        setShowResults(true);
    };

    const resetQuiz = () => {
        router.push('/dashboard/uczen/quizy');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie quizu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/uczen/quizy')}
                        className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        Powrót do listy quizów
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Brak pytań w quizie
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Ten quiz nie zawiera jeszcze żadnych pytań.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/uczen/quizy')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Powrót do listy quizów
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showResults) {
        const maxPoints = questions.reduce((sum, q) => sum + (q.ilosc_punktow || 1), 0);
        const percentage = maxPoints > 0 
            ? Math.round((score / maxPoints) * 100) 
            : 0;
        
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center">
                            <div className="text-6xl mb-4">
                                {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '📚'}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                                {alreadySolved ? 'Twój wynik' : 'Quiz zakończony!'}
                            </h1>
                            {alreadySolved && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 font-medium">
                                        Quiz został już rozwiązany {savedResult?.data_uzyskania && 
                                        `w dniu ${new Date(savedResult.data_uzyskania).toLocaleDateString('pl-PL')}`}
                                    </p>
                                </div>
                            )}
                            <div className="mb-6">
                                <div className="text-5xl font-bold text-blue-600 mb-2">
                                    {percentage}%
                                </div>
                                <p className="text-xl text-gray-600">
                                    Zdobyte punkty: {score} / {maxPoints}
                                </p>
                            </div>

                            {questions.length > 0 && Object.keys(userAnswers).length > 0 && (
                                <div className="mt-8 text-left">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Twoje odpowiedzi:</h2>
                                    {questions.map((question, index) => {
                                        const correctAnswersList = question.odpowiedzi.filter(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true);
                                        const selectedAnswers = userAnswers[question.id_pytania];
                                        const isMultiple = correctAnswersList.length > 1;
                                        
                                        let isCorrect = false;
                                        if (isMultiple) {
                                            const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [];
                                            const correctIds = correctAnswersList.map(ans => ans.id_odpowiedzi).sort();
                                            const selectedIds = selectedArray.sort();
                                            isCorrect = JSON.stringify(correctIds) === JSON.stringify(selectedIds);
                                        } else {
                                            const correctAnswer = correctAnswersList[0];
                                            isCorrect = selectedAnswers === correctAnswer?.id_odpowiedzi;
                                        }

                                        return (
                                            <div key={question.id_pytania} className="mb-6 p-4 border rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <span className={`text-2xl ${isCorrect ? '✅' : '❌'}`}>
                                                        {isCorrect ? '✅' : '❌'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800 mb-2">
                                                            {index + 1}. {question.tresc}
                                                            {isMultiple && <span className="text-sm text-blue-600 ml-2">(wielokrotny wybór)</span>}
                                                            <span className="text-sm text-purple-600 ml-2 font-bold">
                                                                [{question.ilosc_punktow || 1} pkt]
                                                            </span>
                                                        </h3>
                                                        
                                                        {isMultiple ? (
                                                            <>
                                                                <div className="text-sm text-gray-600 mb-2">
                                                                    <span className="font-medium">Twoje odpowiedzi:</span>
                                                                    <ul className={`list-disc ml-5 mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {Array.isArray(selectedAnswers) && selectedAnswers.length > 0 ? (
                                                                            selectedAnswers.map(answerId => {
                                                                                const answer = question.odpowiedzi.find(a => a.id_odpowiedzi === answerId);
                                                                                return <li key={answerId}>{answer?.tresc}</li>;
                                                                            })
                                                                        ) : (
                                                                            <li>Brak odpowiedzi</li>
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                                {!isCorrect && (
                                                                    <div className="text-sm text-green-600 mt-2">
                                                                        <span className="font-medium">Poprawne odpowiedzi:</span>
                                                                        <ul className="list-disc ml-5 mt-1">
                                                                            {correctAnswersList.map(ans => (
                                                                                <li key={ans.id_odpowiedzi}>{ans.tresc}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-medium">Twoja odpowiedź:</span>{' '}
                                                                    <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                                        {question.odpowiedzi.find(ans => ans.id_odpowiedzi === selectedAnswers)?.tresc || 'Brak odpowiedzi'}
                                                                    </span>
                                                                </p>
                                                                {!isCorrect && correctAnswersList[0] && (
                                                                    <p className="text-sm text-green-600 mt-1">
                                                                        <span className="font-medium">Poprawna odpowiedź:</span>{' '}
                                                                        {correctAnswersList[0].tresc}
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {alreadySolved && Object.keys(userAnswers).length === 0 && (
                                <div className="mt-8">
                                    {!showDetails ? (
                                        <button
                                            onClick={() => setShowDetails(true)}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition"
                                        >
                                            📋 Zobacz szczegóły pytań i poprawne odpowiedzi
                                        </button>
                                    ) : (
                                        <div className="text-left">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xl font-bold text-gray-800">Pytania i poprawne odpowiedzi:</h2>
                                                <button
                                                    onClick={() => setShowDetails(false)}
                                                    className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
                                                >
                                                    ✕ Ukryj
                                                </button>
                                            </div>
                                            {questions.map((question, index) => {
                                                const correctAnswersList = question.odpowiedzi.filter(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true);
                                                const isMultiple = correctAnswersList.length > 1;

                                                return (
                                                    <div key={question.id_pytania} className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-800 mb-2">
                                                                {index + 1}. {question.tresc}
                                                                {isMultiple && <span className="text-sm text-blue-600 ml-2">(wielokrotny wybór)</span>}
                                                                <span className="text-sm text-purple-600 ml-2 font-bold">
                                                                    [{question.ilosc_punktow || 1} pkt]
                                                                </span>
                                                            </h3>
                                                            
                                                            <div className="text-sm text-green-700 mt-2">
                                                                <span className="font-medium">✓ Poprawne odpowiedzi:</span>
                                                                {isMultiple ? (
                                                                    <ul className="list-disc ml-5 mt-1">
                                                                        {correctAnswersList.map(ans => (
                                                                            <li key={ans.id_odpowiedzi}>{ans.tresc}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="ml-2">{correctAnswersList[0]?.tresc}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-4 justify-center mt-8">
                                {!alreadySolved && (
                                    <button
                                        onClick={resetQuiz}
                                        className="bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                                        disabled
                                        title="Quiz można rozwiązać tylko raz"
                                    >
                                        Quiz rozwiązany
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push('/dashboard/uczen/quizy')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                                >
                                    Powrót do quizów
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    const allQuestionsAnswered = questions.every(q => {
        const answer = userAnswers[q.id_pytania];
        return answer !== undefined && answer !== null && (Array.isArray(answer) ? answer.length > 0 : true);
    });
    
    const correctAnswersCount = currentQuestion?.odpowiedzi.filter(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true).length || 0;
    const isMultipleChoice = correctAnswersCount > 1;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">{quiz?.nazwa}</h1>
                        <button
                            onClick={() => router.push('/dashboard/uczen/quizy')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ✕ Zamknij
                        </button>
                    </div>
                    
                    <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Pytanie {currentQuestionIndex + 1} z {questions.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-semibold text-gray-800 flex-1">
                                {currentQuestion.tresc}
                            </h2>
                            <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                                {currentQuestion.ilosc_punktow || 1} pkt
                            </span>
                        </div>
                        {isMultipleChoice && (
                            <p className="text-sm text-blue-600 font-medium">
                                ℹ️ To pytanie ma wiele poprawnych odpowiedzi - zaznacz wszystkie właściwe
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        {currentQuestion.odpowiedzi.map((answer) => {
                            const selectedAnswers = userAnswers[currentQuestion.id_pytania];
                            const isSelected = isMultipleChoice 
                                ? (Array.isArray(selectedAnswers) && selectedAnswers.includes(answer.id_odpowiedzi))
                                : selectedAnswers === answer.id_odpowiedzi;
                            
                            return (
                                <button
                                    key={answer.id_odpowiedzi}
                                    onClick={() => handleAnswerSelect(currentQuestion.id_pytania, answer.id_odpowiedzi, isMultipleChoice)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isMultipleChoice ? (
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                    </svg>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                        )}
                                        <span className="text-gray-800">{answer.tresc}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>


                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className={`px-6 py-3 rounded-lg font-medium ${
                            currentQuestionIndex === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                    >
                        ← Poprzednie
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!allQuestionsAnswered}
                            className={`px-6 py-3 rounded-lg font-medium ${
                                allQuestionsAnswered
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {allQuestionsAnswered ? 'Zakończ quiz' : 'Odpowiedz na wszystkie pytania'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                        >
                            Następne →
                        </button>
                    )}
                </div>

                <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Przegląd pytań:</h3>
                    <div className="flex flex-wrap gap-2">
                        {questions.map((question, index) => {
                            const isAnswered = userAnswers[question.id_pytania];
                            const isCurrent = index === currentQuestionIndex;
                            
                            return (
                                <button
                                    key={question.id_pytania}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                        isCurrent
                                            ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                            : isAnswered
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
