'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { getPresenceForStudent } from '/lib/api/presence.api';
import { getGuardianHomeworks, getHomeworksForGroup, getHomeworksForGroupWithAnswers } from '/lib/api/homework.api';
// Removed duplicate import of getHomeworksForGroupWithAnswers
import { getHomeworkAnswers } from '/lib/api/homework.api';
// Removed duplicate import of getHomeworksForGroupWithAnswers
import { getStudentById } from '/lib/api/student.api';
import { getLessonsForGroup } from '/lib/api/lesson.api';
import { getUserIdFromToken } from '/lib/auth';
import Link from 'next/link';

export default function GuardianDashboard() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [presence, setPresence] = useState({});
    const [homeworks, setHomeworks] = useState([]);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const opiekunId = getUserIdFromToken();
        if (opiekunId) loadData(opiekunId);
    }, []);

    async function loadData(opiekunId) {
        try {
            // Pobierz uczniów opiekuna
            const uczniowie = await getOpiekunStudents(opiekunId);
            setStudents(uczniowie);
            
            // Ustaw pierwszego ucznia jako domyślnie wybranego
            // i użyj lokalnego ID do pobierania danych, bo aktualizacja stanu jest asynchroniczna
            let studentIdForFetch = selectedStudent;
            if (uczniowie.length > 0) {
                setSelectedStudent(uczniowie[0].id_ucznia);
                studentIdForFetch = uczniowie[0].id_ucznia;
            }

            // Pobierz obecności dla każdego ucznia
            const presenceResults = await Promise.all(
                uczniowie.map((u) => getPresenceForStudent(u.id_ucznia))
            );

            const presenceMap = {};
            uczniowie.forEach((u, i) => {
                presenceMap[u.id_ucznia] = presenceResults[i];
            });
            console.log('Presence map:', presenceMap);
            console.log('Sample presence item:', presenceResults[0]?.[0]);
            setPresence(presenceMap);

            // Pobierz unikalne ID grup uczniów
            const uniqueGroupIds = [...new Set(uczniowie.map(u => u.id_grupa).filter(Boolean))];
            
            // Pobierz zadania dla każdej grupy ucznia
            const allTasksPerGroup = await Promise.all(
                uniqueGroupIds.map(async (groupId) => {
                    try {
                        const tasks = await getHomeworksForGroupWithAnswers(groupId);
                        return tasks || [];
                    } catch (err) {
                        console.error(`Błąd pobierania zadań z odpowiedziami dla grupy ${groupId}:`, err);
                        return [];
                    }
                })
            );

            // Jeśli wybrano ucznia (lokalny ID), pobierz tylko jego odpowiedzi
            let studentAnswers = [];
            console.log('Student selected for fetch:', studentIdForFetch);
            if (studentIdForFetch) {
                // Debug: pokaż wszystkie zadania dla grup
                console.log('All tasks per group (raw):', allTasksPerGroup);

                // Pobierz odpowiedzi dla każdego zadania
                const allTasks = allTasksPerGroup.flat();
                console.log('All tasks (flattened):', allTasks);

                const answersPerTask = await Promise.all(
                    allTasks.map(async (task) => {
                        try {
                            const answers = await getHomeworkAnswers(task.id_zadania);
                            console.log(`Answers for task ${task.id_zadania}:`, answers);
                            return answers.filter(ans => ans.id_ucznia === studentIdForFetch);
                        } catch (err) {
                            console.error(`Błąd pobierania odpowiedzi dla zadania ${task.id_zadania}:`, err);
                            return [];
                        }
                    })
                );

                console.log('Answers per task (filtered to selected student):', answersPerTask);
                studentAnswers = answersPerTask.flat();
                console.log('Student answers (flattened):', studentAnswers);

                // Połącz zadania z odpowiedziami tylko wybranego ucznia
                const tasksWithStudentAnswers = allTasks.map(task => ({
                    ...task,
                    odpowiedzi: studentAnswers.filter(ans => ans.id_zadania === task.id_zadania)
                }));
                console.log('Tasks with selected student answers:', tasksWithStudentAnswers);

                setHomeworks(tasksWithStudentAnswers);
            } else {
                console.log('No student selected — setting all homeworks for groups.');
                setHomeworks(allTasksPerGroup.flat());
            }

            // Pobierz nadchodzące zajęcia dla wszystkich uczniów
            const lessonsPerGroup = await Promise.all(
                uniqueGroupIds.map(async (groupId) => {
                    try {
                        const lessons = await getLessonsForGroup(groupId);
                        return lessons || [];
                    } catch (err) {
                        console.error(`Błąd pobierania zajęć dla grupy ${groupId}:`, err);
                        return [];
                    }
                })
            );

            // Połącz wszystkie zajęcia i filtruj nadchodzące
            const now = new Date();
            const allLessons = lessonsPerGroup.flat();
            const upcoming = allLessons
                .filter(lesson => {
                    const lessonDate = new Date(lesson.data);
                    return lessonDate >= now;
                })
                .sort((a, b) => new Date(a.data) - new Date(b.data))
                .slice(0, 6);
            
            setUpcomingLessons(upcoming);

        } catch (err) {
            console.error("Błąd przy ładowaniu danych:", err);
        } finally {
            setLoading(false);
        }
    }

    // When selected student changes, fetch their answers for all loaded homeworks
    useEffect(() => {
        async function fetchAnswersForSelectedStudent() {
            if (!selectedStudent || homeworks.length === 0) return;
            try {
                console.log('Fetching answers for newly selected student:', selectedStudent);
                const answersPerTask = await Promise.all(
                    homeworks.map(async (task) => {
                        try {
                            const answers = await getHomeworkAnswers(task.id_zadania);
                            return answers.filter(a => a.id_ucznia === selectedStudent);
                        } catch (err) {
                            console.error(`Błąd pobierania odpowiedzi dla zadania ${task.id_zadania}:`, err);
                            return [];
                        }
                    })
                );
                const studentAnswers = answersPerTask.flat();
                const updated = homeworks.map(task => ({
                    ...task,
                    odpowiedzi: studentAnswers.filter(ans => ans.id_zadania === task.id_zadania)
                }));
                console.log('Updated homeworks with new student answers:', updated);
                setHomeworks(updated);
            } catch (err) {
                console.error('Błąd przy aktualizacji odpowiedzi dla wybranego ucznia:', err);
            }
        }

        fetchAnswersForSelectedStudent();
    }, [selectedStudent]);

    // Zbierz wszystkie obecności w jedną tablicę
    const allPresence = Object.values(presence).flat();
    
    // Filtruj dane według wybranego ucznia
    const filteredPresence = selectedStudent 
        ? allPresence.filter(p => p.id_ucznia === selectedStudent)
        : [];
    
    const latestPresence = filteredPresence
        .sort((a, b) => new Date(b.zajecia?.data || 0) - new Date(a.zajecia?.data || 0))
        .slice(0, 8);

    const selectedStudentData = students.find(s => s.id_ucznia === selectedStudent);
    
    // Filtruj prace domowe dla grupy wybranego ucznia
    const filteredHomeworks = selectedStudent && selectedStudentData?.id_grupa
        ? homeworks.filter(hw => hw.id_grupy === selectedStudentData.id_grupa)
        : [];
    
    const filteredLessons = selectedStudent && selectedStudentData?.id_grupa
        ? upcomingLessons.filter(lesson => {
            // Pobierz grupę ucznia i porównaj z grupą zajęć
            return lesson.id_grupy === selectedStudentData.id_grupa;
        })
        : [];

    const getStudentForPresence = (presenceItem) =>
        students.find(student => student.id_ucznia === presenceItem.id_ucznia);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl text-gray-600">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Witaj, {user?.imie}! 👋
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Panel opiekuna - przegląd aktywności Twoich podopiecznych
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            👥 Liczba uczniów: <span className="font-bold text-blue-600">{students.length}</span>
                        </span>
                    </div>
                    
                    {/* Wybór ucznia */}
                    <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Wybierz ucznia:
                        </label>
                        <select
                            value={selectedStudent || ''}
                            onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {students.map((student) => (
                                <option key={student.id_ucznia} value={student.id_ucznia}>
                                    {student.user?.imie} {student.user?.nazwisko}
                                    {student.pseudonim ? ` (${student.pseudonim})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* Lista uczniów z frekwencją */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Twoi podopieczni</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map((student) => {
                            const studentPresence = allPresence.filter(p => p.id_ucznia === student.id_ucznia);
                            const totalClasses = studentPresence.length;
                            const presentCount = studentPresence.filter(p => p.czyObecny === 1 || p.czyObecny === true).length;
                            const attendancePercent = totalClasses > 0 
                                ? ((presentCount / totalClasses) * 100).toFixed(1)
                                : 0;
                            
                            return (
                                <div key={student.id_ucznia} className="bg-white p-4 rounded-lg shadow-md">
                                    <h3 className="font-bold text-lg text-gray-800">
                                        {student.user?.imie} {student.user?.nazwisko}
                                        {student.pseudonim && <span className="text-sm text-gray-500"> ({student.pseudonim})</span>}
                                    </h3>
                                    <div className="mt-2">
                                        <span className="text-sm text-gray-600">Frekwencja: </span>
                                        <span className={`font-bold ${
                                            attendancePercent >= 80 ? 'text-green-600' :
                                            attendancePercent >= 60 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                            {attendancePercent}%
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({presentCount}/{totalClasses})
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ostatnie obecności */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">📋 Ostatnie obecności</h3>
                            <Link href="/dashboard/shared_components/students_presence" className="text-sm text-blue-600 hover:underline">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {latestPresence.length > 0 ? (
                                latestPresence.map((presenceItem) => {
                                    const student = getStudentForPresence(presenceItem);
                                    return (
                                        <div
                                            key={presenceItem.id_obecnosci}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <span className={`flex-shrink-0 w-3 h-3 rounded-full ${
                                                    presenceItem.czyObecny ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-sm text-gray-800 truncate">
                                                        {student?.user?.imie} {student?.user?.nazwisko}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {presenceItem.zajecia?.tematZajec || 'Brak tematu'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right ml-3 flex-shrink-0">
                                                <div className="text-xs text-gray-600">
                                                    {presenceItem.zajecia?.data
                                                        ? new Date(presenceItem.zajecia.data).toLocaleDateString('pl-PL')
                                                        : 'Brak daty'}
                                                </div>
                                                <div className={`text-xs font-medium ${
                                                    presenceItem.czyObecny ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {presenceItem.czyObecny ? 'Obecny' : 'Nieobecny'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Brak danych o obecnościach
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prace domowe */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">📚 Prace domowe</h3>
                        <div className="space-y-2">
                            {filteredHomeworks.length > 0 ? (
                                filteredHomeworks.slice(0, 6).map(hw => {
                                    const studentAnswer = hw.odpowiedzi?.find(odp => odp.id_ucznia === selectedStudent);
                                    const isSubmitted = !!studentAnswer;
                                    const isGraded = studentAnswer && studentAnswer.ocena !== null && studentAnswer.ocena !== undefined;
                                    return (
                                        <div key={hw.id_zadania} className={`p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition border-l-4 ${
                                            isGraded ? 'border-green-500' :
                                            isSubmitted ? 'border-yellow-500' :
                                            'border-red-500'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-gray-800">
                                                        {hw.tytul || hw.zadanie?.tytul || 'Brak tytułu'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Termin: {hw.termin ? new Date(hw.termin).toLocaleDateString('pl-PL') : 'Brak'}
                                                    </div>
                                                </div>
                                                <div className="ml-3 flex-shrink-0">
                                                    {!isSubmitted && (
                                                        <span className="text-xs text-red-600 font-semibold">Do wykonania</span>
                                                    )}
                                                    {isSubmitted && !isGraded && (
                                                        <span className="text-xs text-orange-600 font-semibold">Oczekuje na ocenę</span>
                                                    )}
                                                    {isGraded && (
                                                        <span className="text-sm font-bold text-green-600">Ocenione: {studentAnswer.ocena}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Brak prac domowych
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nadchodzące zajęcia */}
                    <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">📅 Nadchodzące zajęcia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredLessons.length > 0 ? (
                                filteredLessons.map((lesson) => (
                                    <div key={lesson.id_zajec} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="font-medium text-sm text-gray-800 truncate">
                                            {lesson.tematZajec || lesson.temat || 'Temat nieznany'}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            📅 {new Date(lesson.data).toLocaleDateString('pl-PL')}
                                        </div>
                                        {lesson.Sala_id_sali && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                🚪 Sala {lesson.Sala_id_sali}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center text-gray-500 py-8">
                                    Brak nadchodzących zajęć
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista uczniów */}
                    <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            👥 {selectedStudent ? 'Wybrany uczeń' : 'Twoi podopieczni'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(selectedStudent ? students.filter(s => s.id_ucznia === selectedStudent) : students).map((student) => {
                                const studentPresence = presence[student.id_ucznia] || [];
                                const attendanceCount = studentPresence.filter(p => p.czyObecny).length;
                                const totalCount = studentPresence.length;
                                const attendancePercent = totalCount > 0 
                                    ? Math.round((attendanceCount / totalCount) * 100) 
                                    : 0;

                                return (
                                    <div key={student.id_ucznia} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="font-medium text-gray-800">
                                            {student.user?.imie} {student.user?.nazwisko}
                                        </div>
                                        {student.pseudonim && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                ({student.pseudonim})
                                            </div>
                                        )}
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Obecność:</span>
                                            <span className={`font-bold ${
                                                attendancePercent >= 80 ? 'text-green-600' : 
                                                attendancePercent >= 60 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {attendancePercent}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {attendanceCount}/{totalCount} zajęć
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
