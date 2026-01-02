'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getQuizById, getQuestionsByQuiz, getAnswersByQuestion } from '../../../../../lib/api/quiz.api';
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

    useEffect(() => {
        if (quizId) {
            loadQuizData();
        }
    }, [quizId]);

    const loadQuizData = async () => {
        try {
            setLoading(true);
            
            // Pobierz dane quizu
            const quizData = await getQuizById(quizId);
            setQuiz(quizData);

            // Pobierz pytania
            const questionsData = await getQuestionsByQuiz(quizId);
            
            // Dla każdego pytania pobierz odpowiedzi
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

    const handleAnswerSelect = (questionId, answerId) => {
        setUserAnswers({
            ...userAnswers,
            [questionId]: answerId
        });
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

    const handleSubmit = () => {
        // Oblicz wynik
        let correctAnswers = 0;
        questions.forEach((question) => {
            const selectedAnswerId = userAnswers[question.id_pytania];
            const correctAnswer = question.odpowiedzi.find(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true);
            
            if (correctAnswer && selectedAnswerId === correctAnswer.id_odpowiedzi) {
                correctAnswers++;
            }
        });

        setScore(correctAnswers);
        setShowResults(true);
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setScore(0);
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
        const percentage = Math.round((score / questions.length) * 100);
        
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center">
                            <div className="text-6xl mb-4">
                                {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '📚'}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                                Quiz zakończony!
                            </h1>
                            <div className="mb-6">
                                <div className="text-5xl font-bold text-blue-600 mb-2">
                                    {percentage}%
                                </div>
                                <p className="text-xl text-gray-600">
                                    Poprawnych odpowiedzi: {score} / {questions.length}
                                </p>
                            </div>

                            {/* Podsumowanie odpowiedzi */}
                            <div className="mt-8 text-left">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Twoje odpowiedzi:</h2>
                                {questions.map((question, index) => {
                                    const selectedAnswerId = userAnswers[question.id_pytania];
                                    const selectedAnswer = question.odpowiedzi.find(ans => ans.id_odpowiedzi === selectedAnswerId);
                                    const correctAnswer = question.odpowiedzi.find(ans => ans.czy_poprawna === 1 || ans.czy_poprawna === true);
                                    const isCorrect = selectedAnswerId === correctAnswer?.id_odpowiedzi;

                                    return (
                                        <div key={question.id_pytania} className="mb-6 p-4 border rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <span className={`text-2xl ${isCorrect ? '✅' : '❌'}`}>
                                                    {isCorrect ? '✅' : '❌'}
                                                </span>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 mb-2">
                                                        {index + 1}. {question.tresc}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Twoja odpowiedź:</span>{' '}
                                                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                            {selectedAnswer?.tresc || 'Brak odpowiedzi'}
                                                        </span>
                                                    </p>
                                                    {!isCorrect && correctAnswer && (
                                                        <p className="text-sm text-green-600 mt-1">
                                                            <span className="font-medium">Poprawna odpowiedź:</span>{' '}
                                                            {correctAnswer.tresc}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-4 justify-center mt-8">
                                <button
                                    onClick={resetQuiz}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                                >
                                    Rozwiąż ponownie
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/uczen/quizy')}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
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
    const allQuestionsAnswered = questions.every(q => userAnswers[q.id_pytania]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
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
                    
                    {/* Progress bar */}
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

                {/* Question */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        {currentQuestion.tresc}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.odpowiedzi.map((answer) => {
                            const isSelected = userAnswers[currentQuestion.id_pytania] === answer.id_odpowiedzi;
                            
                            return (
                                <button
                                    key={answer.id_odpowiedzi}
                                    onClick={() => handleAnswerSelect(currentQuestion.id_pytania, answer.id_odpowiedzi)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                        }`}>
                                            {isSelected && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            )}
                                        </div>
                                        <span className="text-gray-800">{answer.tresc}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
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

                {/* Questions overview */}
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
