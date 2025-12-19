'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getHomeworksForGroupWithAnswers, submitHomeworkAnswer } from '/lib/api/homework.api';
import { getStudentById } from '/lib/api/student.api';
import { getUserIdFromToken } from '/lib/auth';

export default function GradesPage() {
    const { user } = useAuth();
    const [homeworks, setHomeworks] = useState([]);
    const [allAnswersMap, setAllAnswersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [submitModal, setSubmitModal] = useState({
        visible: false,
        homework: null,
        answer: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const userId = getUserIdFromToken();
        if (userId && user) {
            loadData(userId);
        }
    }, [user]);

    const loadData = async (userId) => {
        try {
            setLoading(true);
            setError(null);

            console.log('ID użytkownika (ucznia):', userId);

        
            const studentData = await getStudentById(userId);
            console.log('Dane ucznia z user-service:', studentData);
            
            const groupId = studentData?.id_grupa;
            
            if (!groupId) {
                setError('Nie znaleziono grupy ucznia. Skontaktuj się z administratorem.');
                console.error('Brak id_grupa w danych ucznia:', studentData);
                return;
            }

            console.log('ID grupy ucznia:', groupId);

     
            const zadaniaDlaGrupy = await getHomeworksForGroupWithAnswers(groupId);
            console.log('Zadania dla grupy (z odpowiedziami):', zadaniaDlaGrupy);
            
          
            const zadaniaArray = Array.isArray(zadaniaDlaGrupy) ? zadaniaDlaGrupy : [];
            
            console.log('Liczba zadań:', zadaniaArray.length);
            setHomeworks(zadaniaArray);

            const answersMap = {};
            
            zadaniaArray.forEach((zadanie) => {
              
                if (zadanie.id_odpowiedzi) {
                    answersMap[zadanie.id_zadania] = {
                        id_odpowiedzi: zadanie.id_odpowiedzi,
                        id_zadania: zadanie.id_zadania,
                        id_ucznia: userId,
                        ocena: zadanie.ocena,
                        tresc: ''
                    };
                }
            });

            console.log('Mapa odpowiedzi ucznia:', answersMap);
            setAllAnswersMap(answersMap);

        } catch (err) {
            console.error('Błąd ładowania danych:', err);
            setError('Nie udało się załadować danych. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };


    const getAnswerForHomework = (homeworkId) => {
        return allAnswersMap[homeworkId];
    };


    const getFilteredHomeworks = () => {

        if (!Array.isArray(homeworks)) {
            console.error('homeworks nie jest tablicą:', homeworks);
            return [];
        }
        
        return homeworks.map(homework => {
            const answer = getAnswerForHomework(homework.id_zadania);
            return { ...homework, answer };
        }).filter(homework => {
            if (activeTab === 'pending') {
                return !homework.answer || homework.answer.ocena === null;
            }
            if (activeTab === 'graded') {
                return homework.answer && homework.answer.ocena !== null;
            }
            return true; // 'all'
        });
    };

    const filteredHomeworks = getFilteredHomeworks();


    const openSubmitModal = (homework) => {
        setSubmitModal({
            visible: true,
            homework: homework,
            answer: ''
        });
    };


    const closeSubmitModal = () => {
        setSubmitModal({
            visible: false,
            homework: null,
            answer: ''
        });
    };


    const handleSubmitAnswer = async () => {
        if (!submitModal.answer.trim()) {
            alert('Proszę wpisać odpowiedź!');
            return;
        }

        try {
            setSubmitting(true);
            const userId = getUserIdFromToken();
            
            await submitHomeworkAnswer({
                id_ucznia: userId,
                id_zadania: submitModal.homework.id_zadania,
                tresc: submitModal.answer
            });

            alert('Odpowiedź została wysłana! 🎉');
            closeSubmitModal();
            
      
            setActiveTab('all');
            
     
            await loadData(userId);
        } catch (err) {
            console.error('Błąd wysyłania odpowiedzi:', err);
            alert('Nie udało się wysłać odpowiedzi. Spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    };


    const totalHomeworks = homeworks.length;
    const allMyAnswers = Object.values(allAnswersMap);
    const submittedHomeworks = allMyAnswers.length;
    const gradedHomeworks = allMyAnswers.filter(a => a.ocena !== null && a.ocena !== undefined).length;
    const averageGrade = gradedHomeworks > 0
        ? (allMyAnswers.filter(a => a.ocena !== null && a.ocena !== undefined).reduce((sum, a) => sum + (Number(a.ocena) || 0), 0) / gradedHomeworks).toFixed(1)
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Ładowanie zadań domowych...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold mb-2">📚 Moje oceny i zadania</h1>
                    <p className="text-purple-100">Przeglądaj swoje prace domowe i oceny</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

       
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Wszystkie zadania</p>
                                <p className="text-2xl font-bold text-blue-600">{totalHomeworks}</p>
                            </div>
                            <div className="text-3xl">📋</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Wysłane</p>
                                <p className="text-2xl font-bold text-green-600">{submittedHomeworks}</p>
                            </div>
                            <div className="text-3xl">✅</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ocenione</p>
                                <p className="text-2xl font-bold text-purple-600">{gradedHomeworks}</p>
                            </div>
                            <div className="text-3xl">⭐</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Średnia ocen</p>
                                <p className="text-2xl font-bold text-orange-600">{averageGrade}</p>
                            </div>
                            <div className="text-3xl">🎯</div>
                        </div>
                    </div>
                </div>

  
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'all'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        📚 Wszystkie ({totalHomeworks})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'pending'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        ⏳ Oczekujące ({totalHomeworks - submittedHomeworks})
                    </button>
                    <button
                        onClick={() => setActiveTab('graded')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'graded'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        ✅ Ocenione ({gradedHomeworks})
                    </button>
                </div>

       
                {filteredHomeworks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-gray-600 text-lg">
                            {activeTab === 'all' && 'Brak zadań domowych'}
                            {activeTab === 'pending' && 'Nie masz oczekujących zadań'}
                            {activeTab === 'graded' && 'Nie masz jeszcze ocenionych zadań'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredHomeworks.map((homework) => {
                            const answer = homework.answer;
                            const isSubmitted = !!answer;
                            const isGraded = answer?.ocena !== null && answer?.ocena !== undefined;
                            const isOverdue = homework.termin && new Date(homework.termin) < new Date() && !isSubmitted;

                            return (
                                <div
                                    key={homework.id_zadania}
                                    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${
                                        isOverdue ? 'border-l-4 border-red-500' : 
                                        isGraded ? 'border-l-4 border-green-500' : 
                                        isSubmitted ? 'border-l-4 border-yellow-500' : 
                                        'border-l-4 border-blue-500'
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-800">
                                                        {homework.tytul}
                                                    </h3>
                                                    {isGraded && (
                                                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                                                            Ocena: {answer.ocena}/100
                                                        </span>
                                                    )}
                                                    {isSubmitted && !isGraded && (
                                                        <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
                                                            Oczekuje na ocenę
                                                        </span>
                                                    )}
                                                    {!isSubmitted && !isOverdue && (
                                                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                                                            Do wykonania
                                                        </span>
                                                    )}
                                                    {isOverdue && (
                                                        <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                                                            Termin minął
                                                        </span>
                                                    )}
                                                </div>
                                                {homework.opis && (
                                                    <p className="text-gray-600 mb-3">{homework.opis}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    {homework.termin && (
                                                        <span className="flex items-center gap-1">
                                                            📅 Termin: {new Date(homework.termin).toLocaleDateString('pl-PL')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                
                                        {isSubmitted && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-700">✅ Zadanie wysłane</h4>
                                                    {isGraded && (
                                                        <span className="text-2xl font-bold text-green-600">
                                                            {answer.ocena}/100
                                                        </span>
                                                    )}
                                                </div>
                                                {!isGraded && (
                                                    <p className="text-sm text-gray-500">
                                                        Oczekuje na sprawdzenie przez nauczyciela
                                                    </p>
                                                )}
                                                {isGraded && (
                                                    <p className="text-sm text-gray-500">
                                                        Zadanie zostało ocenione przez nauczyciela
                                                    </p>
                                                )}
                                            </div>
                                        )}

                           
                                        {!isSubmitted && (
                                            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-between">
                                                <p className="text-yellow-800 text-sm">
                                                    ⚠️ Nie wysłałeś jeszcze odpowiedzi na to zadanie
                                                </p>
                                                <button
                                                    onClick={() => openSubmitModal(homework)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                                >
                                                    ✏️ Wykonaj zadanie
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {submitModal.visible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    ✏️ Wykonaj zadanie
                                </h2>
                                <button
                                    onClick={closeSubmitModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                    disabled={submitting}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                 
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-bold text-gray-800 mb-2">
                                    {submitModal.homework?.tytul}
                                </h3>
                                {submitModal.homework?.opis && (
                                    <p className="text-gray-600 text-sm mb-2">
                                        {submitModal.homework.opis}
                                    </p>
                                )}
                                {submitModal.homework?.termin && (
                                    <p className="text-sm text-gray-500">
                                        📅 Termin: {new Date(submitModal.homework.termin).toLocaleDateString('pl-PL')}
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Twoja odpowiedź:
                                </label>
                                <textarea
                                    value={submitModal.answer}
                                    onChange={(e) => setSubmitModal({...submitModal, answer: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Wpisz swoją odpowiedź tutaj..."
                                    disabled={submitting}
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Liczba znaków: {submitModal.answer.length}
                                </p>
                            </div>

                     
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={closeSubmitModal}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={submitting || !submitModal.answer.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Wysyłanie...
                                        </>
                                    ) : (
                                        <>
                                            ✅ Wyślij odpowiedź
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
