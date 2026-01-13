'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getStudentById } from '/lib/api/student.api';
import { getGroupById } from '/lib/api/group.api';
import { getRoomById } from '/lib/api/room.api';
import { getLessonsForGroup } from '/lib/api/lesson.api';
import { getAllPrizes, getStudentPrizes, getPrizeImageUrl } from '/lib/api/prize.api';
import { getQuizzesByGroup, getQuizResultsByStudent, getQuestionsByQuiz } from '/lib/api/quiz.api';
import { getHomeworksForGroupWithAnswers } from '/lib/api/homework.api';
import { getStudentTasks, TASK_STATUS } from '/lib/api/todo.api';
import { getUserIdFromToken } from '/lib/auth';
import Link from 'next/link';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState(null);
    const [groupData, setGroupData] = useState(null);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [availablePrizes, setAvailablePrizes] = useState([]);
    const [myPrizes, setMyPrizes] = useState([]);
    const [studentPoints, setStudentPoints] = useState(0);
    const [quizzes, setQuizzes] = useState([]);
    const [quizResults, setQuizResults] = useState([]);
    const [quizMaxPoints, setQuizMaxPoints] = useState({});
    const [homeworks, setHomeworks] = useState([]);
    const [todoTasks, setTodoTasks] = useState([]);

    useEffect(() => {
        const userId = getUserIdFromToken();
        if (userId) {
            loadDashboardData(userId);
        }
    }, []);

    const loadDashboardData = async (userId) => {
        try {
            setLoading(true);

            // Pobierz dane ucznia
            const student = await getStudentById(userId);
            setStudentData(student);

            if (!student.id_grupa) {
                setLoading(false);
                return;
            }

            // Pobierz dane grupy
            const group = await getGroupById(student.id_grupa);
            setGroupData(group);

            // Równolegle pobierz wszystkie dane
            const [
                lessons,
                allPrizes,
                myPrizesData,
                groupQuizzes,
                myQuizResults,
                groupHomeworks,
                myTasks
            ] = await Promise.all([
                getLessonsForGroup(student.id_grupa),
                getAllPrizes(),
                getStudentPrizes(userId),
                getQuizzesByGroup(student.id_grupa),
                getQuizResultsByStudent(userId),
                getHomeworksForGroupWithAnswers(student.id_grupa),
                getStudentTasks(userId).catch(err => { console.error('Błąd TODO:', err); return []; })
            ]);

            // Filtruj nadchodzące zajęcia (przyszłe i dziś) i dodaj dane grupy
            const now = new Date();
            const upcomingFiltered = (lessons || [])
                .filter(lesson => {
                    const lessonDate = new Date(lesson.data);
                    return lessonDate >= now;
                })
                .sort((a, b) => new Date(a.data) - new Date(b.data))
                .slice(0, 5);
            
            // Pobierz dane sal dla zajęć
            const upcomingWithDetails = await Promise.all(
                upcomingFiltered.map(async (lesson) => {
                    let roomData = null;
                    if (lesson.Sala_id_sali) {
                        try {
                            roomData = await getRoomById(lesson.Sala_id_sali);
                        } catch (err) {
                            console.error('Błąd pobierania sali:', err);
                        }
                    }
                    return {
                        ...lesson,
                        grupa: group,
                        sala: roomData
                    };
                })
            );
            setUpcomingLessons(upcomingWithDetails);

            // Wszystkie nagrody (na dashboardzie pokazujemy wszystkie)
            setAvailablePrizes(allPrizes || []);
            setMyPrizes(myPrizesData || []);

            // Punkty ucznia z tabelki uczniowie
            const studentPoints = student?.saldo_punktow || 0;
            console.log('Punkty ucznia z tabelki uczniowie:', studentPoints, 'Cały obiekt studenta:', student);
            setStudentPoints(studentPoints);

            // Quizy - pokaż wszystkie quizy grupy
            setQuizzes(groupQuizzes || []);
            setQuizResults(myQuizResults || []);
            
            // Pobierz pytania dla quizów i policz maksymalne punkty
            const maxPointsMap = {};
            await Promise.all(
                (groupQuizzes || []).map(async (quiz) => {
                    try {
                        const questions = await getQuestionsByQuiz(quiz.id_quizu);
                        const maxPoints = questions.reduce((sum, q) => sum + (q.ilosc_punktow || 1), 0);
                        maxPointsMap[quiz.id_quizu] = maxPoints;
                    } catch (err) {
                        console.error('Błąd pobierania pytań quizu:', err);
                        maxPointsMap[quiz.id_quizu] = 0;
                    }
                })
            );
            setQuizMaxPoints(maxPointsMap);

            // Prace domowe - filtruj te dla tego ucznia
            const studentHomeworks = (groupHomeworks || [])
                .filter(hw => hw.id_ucznia === userId || !hw.id_ucznia)
                .slice(0, 5);
            setHomeworks(studentHomeworks);

            // TODO - pokaż wszystkie zadania (do zrobienia, w trakcie, wykonane)
            console.log('Wszystkie zadania TODO:', myTasks);
            const allTodoTasks = (myTasks || []).filter(task => 
                task.id_statusu === 1 || task.id_statusu === 2 || task.id_statusu === 3
            );
            console.log('Wszystkie aktywne zadania TODO:', allTodoTasks);
            setTodoTasks(allTodoTasks);

        } catch (err) {
            console.error('Błąd ładowania danych dashboardu:', err);
        } finally {
            setLoading(false);
        }
    };

    // Sprawdź czy quiz został rozwiązany
    const getQuizResult = (quizId) => {
        return quizResults.find(result => result.Quiz_id_quizu === quizId || result.id_quizu === quizId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-orange-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4 mx-auto"></div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">Ładowanie dashboardu...
                    </div>
                </div>
            </div>
        );
    }

    if (!studentData?.id_grupa) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-orange-900 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-orange-900/50 border border-orange-500 text-orange-200 p-6 rounded-3xl backdrop-blur-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-4xl">⚠️</span>
                            <div>
                                <p className="font-bold text-xl text-orange-300">Nie przypisano do grupy</p>
                                <p className="text-orange-200">Skontaktuj się z administratorem, aby przypisaić Cię do grupy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-orange-900">
            <div className="p-8">
                {/* Header */}
                <header className="mb-8 text-center">
                    <div className="inline-block bg-white/10 backdrop-blur-lg border border-orange-500/30 rounded-3xl p-8 shadow-2xl">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent mb-3">
                            Witaj, {user?.imie}! 👋
                        </h1>
                        <p className="text-orange-200 text-lg mb-4">
                            Twój pulpit ucznia
                        </p>
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-lg">
                            <span>📎 Punkty:</span>
                            <span className="text-2xl">{studentPoints}</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Nadchodzące zajęcia */}
                    <div className="lg:col-span-6 bg-white/10 backdrop-blur-lg border border-orange-500/30 rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                    <span className="text-white text-xl">📅</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Nadchodzące zajęcia</h3>
                            </div>
                            <Link href="/dashboard/uczen/historiazajec" className="text-sm bg-gradient-to-r from-orange-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {upcomingLessons.length > 0 ? (
                                upcomingLessons.map((lesson) => (
                                    <div key={lesson.id_zajec} className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl border border-orange-200 hover:border-orange-400 transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800 text-lg">
                                                    {lesson.tematZajec || lesson.temat || 'Temat nieznany'}
                                                </div>
                                                <div className="text-sm text-orange-700 mt-2 flex items-center gap-4">
                                                    {lesson.sala && (
                                                        <span className="flex items-center gap-1">
                                                            <span>📍</span>
                                                            {lesson.sala.lokalizacja || ''}
                                                            {lesson.sala.lokalizacja && lesson.sala.numer && ' - '}
                                                            {lesson.sala.numer && `Sala ${lesson.sala.numer}`}
                                                        </span>
                                                    )}
                                                    {!lesson.sala && lesson.Sala_id_sali && (
                                                        <span className="flex items-center gap-1">
                                                            <span>🚪</span>
                                                            Sala {lesson.Sala_id_sali}
                                                        </span>
                                                    )}
                                                    {lesson.grupa?.godzina && (
                                                        <span className="flex items-center gap-1">
                                                            <span>🕐</span>
                                                            {lesson.grupa.godzina.substring(0, 5)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right ml-4 bg-white/70 rounded-xl p-3">
                                                <div className="text-lg font-bold text-purple-700">
                                                    {new Date(lesson.data).toLocaleDateString('pl-PL')}
                                                </div>
                                                <div className="text-sm text-orange-600 font-semibold">
                                                    {lesson.grupa?.dzien_tygodnia || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-orange-200 py-12 bg-orange-900/30 rounded-2xl">
                                    <span className="text-4xl block mb-2">📅</span>
                                    Brak nadchodzących zajęć
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dostępne nagrody */}
                    <div className="lg:col-span-6 bg-white/10 backdrop-blur-lg border border-orange-500/30 rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                    <span className="text-white text-xl">🎁</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Dostępne nagrody</h3>
                            </div>
                            <Link href="/dashboard/uczen/prizes" className="text-sm bg-gradient-to-r from-orange-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {availablePrizes.length > 0 ? (
                                availablePrizes.slice(0, 6).map((prize) => {
                                    const isOwned = myPrizes.some(mp => mp.id_nagrody === prize.id_nagrody);
                                    const prizeCost = Number(prize.koszt_punktow || prize.koszt || 0);
                                    return (
                                        <div key={prize.id_nagrody} className="relative p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl text-center hover:from-orange-100 hover:to-purple-100 transition border border-orange-200">
                                            {isOwned && (
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                                                    ✓
                                                </div>
                                            )}
                                            <div className="h-16 flex items-center justify-center mb-3">
                                                {prize.zdjecie ? (
                                                    <img 
                                                        src={getPrizeImageUrl(prize.id_nagrody)} 
                                                        alt={prize.nazwa}
                                                        className="max-h-16 max-w-full object-contain rounded-lg"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            const parent = e.target.parentElement;
                                                            if (parent && !parent.querySelector('.fallback-emoji')) {
                                                                const emoji = document.createElement('div');
                                                                emoji.className = 'fallback-emoji text-3xl';
                                                                emoji.textContent = '🎁';
                                                                parent.appendChild(emoji);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-3xl">🎁</div>
                                                )}
                                            </div>
                                            <div className="font-bold text-gray-800 text-sm mb-2 truncate">
                                                {prize.nazwa}
                                            </div>
                                            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                <span>💎</span>
                                                {prizeCost} pkt
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 text-center text-orange-200 py-12 bg-orange-900/30 rounded-2xl">
                                    <span className="text-4xl block mb-2">🎁</span>
                                    Brak dostępnych nagród
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quizy */}
                    <div className="lg:col-span-6 bg-white/10 backdrop-blur-lg border border-orange-500/30 rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                    <span className="text-white text-xl">📝</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Quizy</h3>
                            </div>
                            <Link href="/dashboard/uczen/quizy" className="text-sm bg-gradient-to-r from-orange-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {quizzes.length > 0 ? (
                                quizzes.slice(0, 5).map((quiz) => {
                                    const result = getQuizResult(quiz.id_quizu);
                                    const maxPoints = quizMaxPoints[quiz.id_quizu] || '?';
                                    return (
                                        <div key={quiz.id_quizu} className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl border border-orange-200 hover:border-orange-400 transition">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-800 text-lg">
                                                        {quiz.nazwa || quiz.tytul}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    {result ? (
                                                        <div className="bg-green-100 border-2 border-green-400 px-4 py-3 rounded-2xl text-center">
                                                            <div className="text-sm font-bold text-green-700 mb-1">
                                                                ✓ Ukończono
                                                            </div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                {result.wynik}/{maxPoints} pkt
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Link href={`/dashboard/uczen/quizy/${quiz.id_quizu}`}>
                                                            <button className="bg-gradient-to-r from-orange-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-purple-600 transition transform hover:scale-105">
                                                                Rozwiąż
                                                            </button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-orange-200 py-12 bg-orange-900/30 rounded-2xl">
                                    <span className="text-4xl block mb-2">📝</span>
                                    Brak quizów
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prace domowe */}
                    <div className="lg:col-span-6 bg-white/10 backdrop-blur-lg border border-orange-500/30 rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                    <span className="text-white text-xl">📚</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Prace domowe</h3>
                            </div>
                            <Link href="/dashboard/uczen/grades" className="text-sm bg-gradient-to-r from-orange-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {homeworks.length > 0 ? (
                                homeworks.map((hw) => (
                                    <div key={hw.id_zadania} className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl border border-orange-200 hover:border-orange-400 transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800 text-lg">
                                                    {hw.tytul || 'Bez tytułu'}
                                                </div>
                                                <div className="text-sm text-orange-700 mt-2">
                                                    {hw.tresc ? hw.tresc.substring(0, 50) + '...' : ''}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                {hw.ocena !== null && hw.ocena !== undefined ? (
                                                    <div className="bg-green-100 border-2 border-green-400 px-4 py-3 rounded-2xl text-center">
                                                        <div className="text-sm font-bold text-green-700 mb-1">
                                                            Ocena
                                                        </div>
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {hw.ocena}
                                                        </div>
                                                    </div>
                                                ) : hw.id_odpowiedzi ? (
                                                    <div className="bg-blue-100 border-2 border-blue-400 px-4 py-2 rounded-2xl text-center">
                                                        <div className="text-sm font-bold text-blue-700">
                                                            Wysłano
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-orange-100 border-2 border-orange-400 px-4 py-2 rounded-2xl text-center">
                                                        <div className="text-sm font-bold text-orange-700">
                                                            Do zrobienia
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-orange-200 py-12 bg-orange-900/30 rounded-2xl">
                                    <span className="text-4xl block mb-2">📚</span>
                                    Brak prac domowych
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TODO lista */}
                    <div className="lg:col-span-12 bg-white/10 backdrop-blur-lg border border-orange-500/30 rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                    <span className="text-white text-xl">✅</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Zadania TODO</h3>
                            </div>
                            <Link href="/dashboard/uczen/todolist" className="text-sm bg-gradient-to-r from-orange-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition">
                                Zarządzaj listami
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Do zrobienia */}
                            <div className="bg-orange-500/20 border-2 border-orange-400 rounded-2xl p-6 backdrop-blur-sm">
                                <h4 className="font-bold text-orange-200 mb-4 flex items-center gap-3 text-xl">
                                    <span className="text-2xl">📝</span>
                                    Do zrobienia
                                </h4>
                                <div className="space-y-3">
                                    {todoTasks.filter(task => task.id_statusu === 1).length > 0 ? (
                                        todoTasks.filter(task => task.id_statusu === 1).slice(0, 3).map((task) => (
                                            <div key={task.id_zadania} className="p-4 bg-white/80 rounded-2xl hover:bg-white/90 transition">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1 text-lg">
                                                        {task.priorytet === 1 ? '🔴' : task.priorytet === 2 ? '🟡' : '🟢'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-800 truncate">
                                                            {task.tytul}
                                                        </div>
                                                        {task.termin && (
                                                            <div className="text-sm text-orange-700 mt-2 flex items-center gap-1">
                                                                <span>📅</span>
                                                                {new Date(task.termin).toLocaleDateString('pl-PL')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-orange-200 py-8 bg-orange-900/30 rounded-2xl">
                                            <span className="text-3xl block mb-2">📝</span>
                                            Brak zadań
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* W trakcie */}
                            <div className="bg-purple-500/20 border-2 border-purple-400 rounded-2xl p-6 backdrop-blur-sm">
                                <h4 className="font-bold text-purple-200 mb-4 flex items-center gap-3 text-xl">
                                    <span className="text-2xl">⏳</span>
                                    W trakcie
                                </h4>
                                <div className="space-y-3">
                                    {todoTasks.filter(task => task.id_statusu === 2).length > 0 ? (
                                        todoTasks.filter(task => task.id_statusu === 2).slice(0, 3).map((task) => (
                                            <div key={task.id_zadania} className="p-4 bg-white/80 rounded-2xl hover:bg-white/90 transition">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1 text-lg">
                                                        {task.priorytet === 1 ? '🔴' : task.priorytet === 2 ? '🟡' : '🟢'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-800 truncate">
                                                            {task.tytul}
                                                        </div>
                                                        {task.termin && (
                                                            <div className="text-sm text-purple-700 mt-2 flex items-center gap-1">
                                                                <span>📅</span>
                                                                {new Date(task.termin).toLocaleDateString('pl-PL')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-purple-200 py-8 bg-purple-900/30 rounded-2xl">
                                            <span className="text-3xl block mb-2">⏳</span>
                                            Brak zadań
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Wykonane */}
                            <div className="bg-green-500/20 border-2 border-green-400 rounded-2xl p-6 backdrop-blur-sm">
                                <h4 className="font-bold text-green-200 mb-4 flex items-center gap-3 text-xl">
                                    <span className="text-2xl">✅</span>
                                    Wykonane
                                </h4>
                                <div className="space-y-3">
                                    {todoTasks.filter(task => task.id_statusu === 3).length > 0 ? (
                                        todoTasks.filter(task => task.id_statusu === 3).slice(0, 3).map((task) => (
                                            <div key={task.id_zadania} className="p-4 bg-white/80 rounded-2xl hover:bg-white/90 transition">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1 text-lg">
                                                        {task.priorytet === 1 ? '🔴' : task.priorytet === 2 ? '🟡' : '🟢'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-800 truncate line-through">
                                                            {task.tytul}
                                                        </div>
                                                        {task.termin && (
                                                            <div className="text-sm text-green-700 mt-2 flex items-center gap-1">
                                                                <span>📅</span>
                                                                {new Date(task.termin).toLocaleDateString('pl-PL')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-green-200 py-8 bg-green-900/30 rounded-2xl">
                                            <span className="text-3xl block mb-2">🎉</span>
                                            Brak zadań 🎉
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
