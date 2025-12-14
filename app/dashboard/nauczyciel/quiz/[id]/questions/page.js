'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    getQuizById, 
    getQuestionsByQuiz, 
    createQuestion, 
    updateQuestion, 
    deleteQuestion,
    getAnswersByQuestion,
    createAnswer,
    updateAnswer,
    deleteAnswer
} from '../../../../../../lib/api/quiz.api';

export default function QuizQuestionsPage() {
    const router = useRouter();
    const params = useParams();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Stan dla formularzy
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [questionFormData, setQuestionFormData] = useState({
        tresc: '',
        ilosc_punktow: 1
    });
    
    const [showAnswerForm, setShowAnswerForm] = useState(null);
    const [editingAnswer, setEditingAnswer] = useState(null);
    const [answerFormData, setAnswerFormData] = useState({
        tresc: '',
        czy_poprawna: false
    });

    useEffect(() => {
        if (params.id) {
            loadData();
        }
    }, [params.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [quizData, questionsData] = await Promise.all([
                getQuizById(params.id),
                getQuestionsByQuiz(params.id)
            ]);
            
            setQuiz(quizData);
            setQuestions(questionsData);
            
        
            const answersData = {};
            for (const question of questionsData) {
                const questionAnswers = await getAnswersByQuestion(question.id_pytania);
                answersData[question.id_pytania] = questionAnswers;
            }
            setAnswers(answersData);
            
            setError(null);
        } catch (err) {
            setError('Nie udało się załadować danych');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

 
    
    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setQuestionFormData({ tresc: '', ilosc_punktow: 1 });
        setShowQuestionForm(true);
    };

    const handleEditQuestion = (question) => {
        setEditingQuestion(question);
        setQuestionFormData({
            tresc: question.tresc,
            ilosc_punktow: question.ilosc_punktow
        });
        setShowQuestionForm(true);
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        
        if (!questionFormData.tresc.trim()) {
            alert('Treść pytania jest wymagana');
            return;
        }

        try {
            const data = {
                ...questionFormData,
                id_quizu: parseInt(params.id),
                ilosc_punktow: parseInt(questionFormData.ilosc_punktow)
            };

            if (editingQuestion) {
                await updateQuestion(editingQuestion.id_pytania, data);
            } else {
                await createQuestion(data);
            }

            setShowQuestionForm(false);
            setEditingQuestion(null);
            loadData();
        } catch (err) {
            alert('Nie udało się zapisać pytania');
            console.error(err);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć to pytanie? Zostaną usunięte również wszystkie odpowiedzi.')) {
            return;
        }

        try {
            await deleteQuestion(id);
            loadData();
        } catch (err) {
            alert('Nie udało się usunąć pytania');
            console.error(err);
        }
    };

 
    
    const handleAddAnswer = (questionId) => {
        setShowAnswerForm(questionId);
        setEditingAnswer(null);
        setAnswerFormData({ tresc: '', czy_poprawna: false });
    };

    const handleEditAnswer = (answer, questionId) => {
        setShowAnswerForm(questionId);
        setEditingAnswer(answer);
        setAnswerFormData({
            tresc: answer.tresc,
            czy_poprawna: answer.czy_poprawna
        });
    };

    const handleSaveAnswer = async (e, questionId) => {
        e.preventDefault();
        
        if (!answerFormData.tresc.trim()) {
            alert('Treść odpowiedzi jest wymagana');
            return;
        }

        try {
            const data = {
                ...answerFormData,
                id_pytania: parseInt(questionId)
            };

            if (editingAnswer) {
                await updateAnswer(editingAnswer.id_odpowiedzi, data);
            } else {
                await createAnswer(data);
            }

            setShowAnswerForm(null);
            setEditingAnswer(null);
            loadData();
        } catch (err) {
            alert('Nie udało się zapisać odpowiedzi');
            console.error(err);
        }
    };

    const handleDeleteAnswer = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć tę odpowiedź?')) {
            return;
        }

        try {
            await deleteAnswer(id);
            loadData();
        } catch (err) {
            alert('Nie udało się usunąć odpowiedzi');
            console.error(err);
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">{quiz.nazwa}</h1>
                        <p className="text-gray-600">{quiz.opis}</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                    >
                        Powrót
                    </button>
                </div>

                <button
                    onClick={handleAddQuestion}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition"
                >
                    + Dodaj Pytanie
                </button>
            </div>

       
            {showQuestionForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">
                        {editingQuestion ? 'Edytuj Pytanie' : 'Nowe Pytanie'}
                    </h2>
                    <form onSubmit={handleSaveQuestion}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Treść Pytania *
                            </label>
                            <textarea
                                value={questionFormData.tresc}
                                onChange={(e) => setQuestionFormData({...questionFormData, tresc: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Liczba Punktów
                            </label>
                            <input
                                type="number"
                                value={questionFormData.ilosc_punktow}
                                onChange={(e) => setQuestionFormData({...questionFormData, ilosc_punktow: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition"
                            >
                                Zapisz
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowQuestionForm(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition"
                            >
                                Anuluj
                            </button>
                        </div>
                    </form>
                </div>
            )}

      
            {questions.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <p className="text-gray-600 text-lg">Brak pytań w tym quizie</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div key={question.id_pytania} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-2">
                                        Pytanie {index + 1} ({question.ilosc_punktow} pkt)
                                    </h3>
                                    <p className="text-gray-700">{question.tresc}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEditQuestion(question)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition"
                                    >
                                        Edytuj
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(question.id_pytania)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                                    >
                                        Usuń
                                    </button>
                                </div>
                            </div>

                       
                            <div className="mt-4 pl-4 border-l-4 border-blue-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold">Odpowiedzi:</h4>
                                    <button
                                        onClick={() => handleAddAnswer(question.id_pytania)}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition"
                                    >
                                        + Dodaj Odpowiedź
                                    </button>
                                </div>

                              
                                {showAnswerForm === question.id_pytania && (
                                    <div className="bg-gray-50 rounded p-4 mb-3">
                                        <form onSubmit={(e) => handleSaveAnswer(e, question.id_pytania)}>
                                            <div className="mb-3">
                                                <textarea
                                                    value={answerFormData.tresc}
                                                    onChange={(e) => setAnswerFormData({...answerFormData, tresc: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Treść odpowiedzi..."
                                                    rows="2"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={answerFormData.czy_poprawna}
                                                        onChange={(e) => setAnswerFormData({...answerFormData, czy_poprawna: e.target.checked})}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Poprawna odpowiedź</span>
                                                </label>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-sm transition"
                                                >
                                                    Zapisz
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAnswerForm(null)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm transition"
                                                >
                                                    Anuluj
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                        
                                {answers[question.id_pytania] && answers[question.id_pytania].length > 0 ? (
                                    <div className="space-y-2">
                                        {answers[question.id_pytania].map((answer) => (
                                            <div
                                                key={answer.id_odpowiedzi}
                                                className={`p-3 rounded ${answer.czy_poprawna ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-sm">{answer.tresc}</p>
                                                        {answer.czy_poprawna && (
                                                            <span className="inline-block mt-1 text-xs bg-green-500 text-white px-2 py-1 rounded">
                                                                ✓ Poprawna
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => handleEditAnswer(answer, question.id_pytania)}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition"
                                                        >
                                                            Edytuj
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAnswer(answer.id_odpowiedzi)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                                        >
                                                            Usuń
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">Brak odpowiedzi</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
