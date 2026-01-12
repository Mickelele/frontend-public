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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl text-gray-600">Ładowanie...</div>
            </div>
        );
    }

    if (!studentData?.id_grupa) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
                    <p className="font-bold">Nie przypisano do grupy</p>
                    <p>Skontaktuj się z administratorem, aby przypisać Cię do grupy.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-8">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Witaj, {user?.imie}! 👋
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Twój pulpit ucznia
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            💎 Punkty: <span className="font-bold text-blue-600">{studentPoints}</span>
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Nadchodzące zajęcia */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">📅 Nadchodzące zajęcia</h3>
                            <Link href="/dashboard/uczen/historiazajec" className="text-sm text-blue-600 hover:underline">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {upcomingLessons.length > 0 ? (
                                upcomingLessons.map((lesson) => (
                                    <div key={lesson.id_zajec} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">
                                                    {lesson.tematZajec || lesson.temat || 'Temat nieznany'}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {lesson.sala && (
                                                        <span>
                                                            📍 {lesson.sala.lokalizacja || ''}
                                                            {lesson.sala.lokalizacja && lesson.sala.numer && ' - '}
                                                            {lesson.sala.numer && `Sala ${lesson.sala.numer}`}
                                                        </span>
                                                    )}
                                                    {!lesson.sala && lesson.Sala_id_sali && `🚪 Sala ${lesson.Sala_id_sali}`}
                                                    {lesson.grupa?.godzina && ` • 🕐 ${lesson.grupa.godzina.substring(0, 5)}`}
                                                </div>
                                            </div>
                                            <div className="text-right ml-3">
                                                <div className="text-sm font-medium text-blue-600">
                                                    {new Date(lesson.data).toLocaleDateString('pl-PL')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {lesson.grupa?.dzien_tygodnia || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Brak nadchodzących zajęć
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dostępne nagrody */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">🎁 Dostępne nagrody</h3>
                            <Link href="/dashboard/uczen/prizes" className="text-sm text-blue-600 hover:underline">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {availablePrizes.length > 0 ? (
                                availablePrizes.slice(0, 6).map((prize) => {
                                    const isOwned = myPrizes.some(mp => mp.id_nagrody === prize.id_nagrody);
                                    const prizeCost = Number(prize.koszt_punktow || prize.koszt || 0);
                                    return (
                                        <div key={prize.id_nagrody} className="relative p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition">
                                            {isOwned && (
                                                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                    ✓
                                                </div>
                                            )}
                                            <div className="h-16 flex items-center justify-center mb-2">
                                                {prize.zdjecie ? (
                                                    <img 
                                                        src={getPrizeImageUrl(prize.id_nagrody)} 
                                                        alt={prize.nazwa}
                                                        className="max-h-16 max-w-full object-contain"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            const parent = e.target.parentElement;
                                                            if (parent && !parent.querySelector('.fallback-emoji')) {
                                                                const emoji = document.createElement('div');
                                                                emoji.className = 'fallback-emoji text-2xl';
                                                                emoji.textContent = '🎁';
                                                                parent.appendChild(emoji);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-2xl">🎁</div>
                                                )}
                                            </div>
                                            <div className="font-medium text-sm text-gray-800 truncate">
                                                {prize.nazwa}
                                            </div>
                                            <div className="text-xs text-blue-600 font-bold mt-1">
                                                💎 {prizeCost} pkt
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 text-center text-gray-500 py-8">
                                    Brak dostępnych nagród
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quizy */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">📝 Quizy</h3>
                            <Link href="/dashboard/uczen/quizy" className="text-sm text-blue-600 hover:underline">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {quizzes.length > 0 ? (
                                quizzes.slice(0, 5).map((quiz) => {
                                    const result = getQuizResult(quiz.id_quizu);
                                    const maxPoints = quizMaxPoints[quiz.id_quizu] || '?';
                                    return (
                                        <div key={quiz.id_quizu} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800">
                                                        {quiz.nazwa || quiz.tytul}
                                                    </div>
                                                </div>
                                                <div className="ml-3 text-right">
                                                    {result ? (
                                                        <div className="bg-green-100 px-3 py-2 rounded-lg">
                                                            <div className="text-xs font-bold text-green-700">
                                                                ✓ Ukończono
                                                            </div>
                                                            <div className="text-sm font-bold text-green-600">
                                                                {result.wynik}/{maxPoints} pkt
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Link href={`/dashboard/uczen/quizy/${quiz.id_quizu}`}>
                                                            <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
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
                                <div className="text-center text-gray-500 py-8">
                                    Brak quizów
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prace domowe */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">📚 Prace domowe</h3>
                            <Link href="/dashboard/uczen/grades" className="text-sm text-blue-600 hover:underline">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {homeworks.length > 0 ? (
                                homeworks.map((hw) => (
                                    <div key={hw.id_zadania} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">
                                                    {hw.tytul || 'Bez tytułu'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {hw.tresc ? hw.tresc.substring(0, 50) + '...' : ''}
                                                </div>
                                            </div>
                                            <div className="ml-3 text-right">
                                                {hw.ocena !== null && hw.ocena !== undefined ? (
                                                    <>
                                                        <div className="text-sm font-bold text-green-600">
                                                            Ocena: {hw.ocena}
                                                        </div>
                                                    </>
                                                ) : hw.id_odpowiedzi ? (
                                                    <div className="text-xs text-blue-600">
                                                        Wysłano
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-orange-600 font-medium">
                                                        Do zrobienia
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Brak prac domowych
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TODO lista */}
                    <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">✅ Zadania TODO</h3>
                            <Link href="/dashboard/uczen/todolist" className="text-sm text-blue-600 hover:underline">
                                Zarządzaj listami
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Do zrobienia */}
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                                <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    Do zrobienia
                                </h4>
                                <div className="space-y-2">
                                    {todoTasks.filter(task => task.id_statusu === 1).length > 0 ? (
                                        todoTasks.filter(task => task.id_statusu === 1).slice(0, 3).map((task) => (
                                            <div key={task.id_zadania} className="p-2 bg-white rounded hover:bg-orange-50 transition text-sm">
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {task.priorytet === 1 ? '🔴' : task.priorytet === 2 ? '🟡' : '🟢'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-800 truncate">
                                                            {task.tytul}
                                                        </div>
                                                        {task.termin && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                📅 {new Date(task.termin).toLocaleDateString('pl-PL')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            Brak zadań
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* W trakcie */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                                    <span className="text-lg">⏳</span>
                                    W trakcie
                                </h4>
                                <div className="space-y-2">
                                    {todoTasks.filter(task => task.id_statusu === 2).length > 0 ? (
                                        todoTasks.filter(task => task.id_statusu === 2).slice(0, 3).map((task) => (
                                            <div key={task.id_zadania} className="p-2 bg-white rounded hover:bg-blue-50 transition text-sm">
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {task.priorytet === 1 ? '🔴' : task.priorytet === 2 ? '🟡' : '🟢'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-800 truncate">
                                                            {task.tytul}
                                                        </div>
                                                        {task.termin && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                📅 {new Date(task.termin).toLocaleDateString('pl-PL')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            Brak zadań
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Wykonane */}
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                    <span className="text-lg">✅</span>
                                    Wykonane
                                </h4>
                                <div className="space-y-2">
                                    {todoTasks.filter(task => task.id_statusu === 3).length > 0 ? (
                                        todoTasks.filter(task => task.id_statusu === 3).slice(0, 3).map((task) => (
                                            <div key={task.id_zadania} className="p-2 bg-white rounded hover:bg-green-50 transition text-sm">
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {task.priorytet === 1 ? '🔴' : task.priorytet === 2 ? '🟡' : '🟢'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-800 truncate line-through">
                                                            {task.tytul}
                                                        </div>
                                                        {task.termin && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                📅 {new Date(task.termin).toLocaleDateString('pl-PL')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
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
