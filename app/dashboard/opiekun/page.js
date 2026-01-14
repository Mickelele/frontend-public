'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { getPresenceForStudent } from '/lib/api/presence.api';
import { getGuardianHomeworks, getHomeworksForGroup, getHomeworksForGroupWithAnswers } from '/lib/api/homework.api';
import { getHomeworkAnswers } from '/lib/api/homework.api';
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
            
            const uczniowie = await getOpiekunStudents(opiekunId);
            setStudents(uczniowie);
            
        
            let studentIdForFetch = selectedStudent;
            if (uczniowie.length > 0) {
                setSelectedStudent(uczniowie[0].id_ucznia);
                studentIdForFetch = uczniowie[0].id_ucznia;
            }

           
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

           
            const uniqueGroupIds = [...new Set(uczniowie.map(u => u.id_grupa).filter(Boolean))];
            
            
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

            
            let studentAnswers = [];
            console.log('Student selected for fetch:', studentIdForFetch);
            if (studentIdForFetch) {
              
                console.log('All tasks per group (raw):', allTasksPerGroup);

                
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

   
    const allPresence = Object.values(presence).flat();
    

    const filteredPresence = selectedStudent 
        ? allPresence.filter(p => p.id_ucznia === selectedStudent)
        : [];
    
    const latestPresence = filteredPresence
        .sort((a, b) => new Date(b.zajecia?.data || 0) - new Date(a.zajecia?.data || 0))
        .slice(0, 8);

    const selectedStudentData = students.find(s => s.id_ucznia === selectedStudent);
    
  
    const filteredHomeworks = selectedStudent && selectedStudentData?.id_grupa
        ? homeworks.filter(hw => hw.id_grupy === selectedStudentData.id_grupa)
        : [];
    
    const filteredLessons = selectedStudent && selectedStudentData?.id_grupa
        ? upcomingLessons.filter(lesson => {
          
            return lesson.id_grupy === selectedStudentData.id_grupa;
        })
        : [];

    const getStudentForPresence = (presenceItem) =>
        students.find(student => student.id_ucznia === presenceItem.id_ucznia);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-white rounded-3xl shadow-2xl p-12 border border-orange-200">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ładowanie dashboard...</h2>
                        <p className="text-gray-600">Pobieranie danych o Twoich podopiecznych</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
            <div className="p-6 max-w-7xl mx-auto">
              
                <header className="mb-8">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl">
                                <span className="text-3xl">👋</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Witaj, {user?.imie}!
                                </h1>
                                <p className="text-white/90 text-lg mt-1">
                                    Panel opiekuna - przegląd aktywności Twoich podopiecznych
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">👥</span>
                                    <span className="text-sm text-white/90">Liczba uczniów:</span>
                                    <span className="font-bold text-white text-lg">{students.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
               
                    <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 border border-orange-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            Wybierz ucznia:
                        </label>
                        <select
                            value={selectedStudent || ''}
                            onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full md:w-96 px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white shadow-sm transition"
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

             
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                   
                    <section className="lg:col-span-8 bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                <span className="text-white text-xl">📊</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Twoi podopieczni</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {students.map((student) => {
                                const studentPresence = allPresence.filter(p => p.id_ucznia === student.id_ucznia);
                                const totalClasses = studentPresence.length;
                                const presentCount = studentPresence.filter(p => p.czyObecny === 1 || p.czyObecny === true).length;
                                const attendancePercent = totalClasses > 0 
                                    ? ((presentCount / totalClasses) * 100).toFixed(1)
                                    : 0;
                                
                                return (
                                    <div key={student.id_ucznia} className="bg-gradient-to-br from-orange-50 to-purple-50 p-5 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold">
                                                {student.user?.imie?.[0]}{student.user?.nazwisko?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">
                                                    {student.user?.imie} {student.user?.nazwisko}
                                                </h3>
                                                {student.pseudonim && (
                                                    <span className="text-sm text-gray-500">({student.pseudonim})</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Frekwencja:</span>
                                                <span className={`font-bold text-lg ${
                                                    attendancePercent >= 80 ? 'text-green-600' :
                                                    attendancePercent >= 60 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {attendancePercent}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {presentCount}/{totalClasses} zajęć
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

               
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-xl p-6 text-white">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📈</span>
                                <div>
                                    <h3 className="font-bold text-lg">Średnia frekwencja</h3>
                                    <p className="text-2xl font-bold mt-1">
                                        {students.length > 0 ? 
                                            Math.round(students.reduce((acc, student) => {
                                                const studentPresence = allPresence.filter(p => p.id_ucznia === student.id_ucznia);
                                                const percent = studentPresence.length > 0 
                                                    ? (studentPresence.filter(p => p.czyObecny).length / studentPresence.length) * 100
                                                    : 0;
                                                return acc + percent;
                                            }, 0) / students.length) : 0
                                        }%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📚</span>
                                <div>
                                    <h3 className="font-bold text-lg">Prace do sprawdzenia</h3>
                                    <p className="text-2xl font-bold mt-1">
                                        {filteredHomeworks.filter(hw => {
                                            const studentAnswer = hw.odpowiedzi?.find(odp => odp.id_ucznia === selectedStudent);
                                            return studentAnswer && !studentAnswer.ocena;
                                        }).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                
                    <div className="lg:col-span-6 bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
                        <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center mb-6 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                    <span className="text-white text-xl">📋</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Ostatnie obecności</h3>
                            </div>
                            <Link href="/dashboard/shared_components/students_presence" className="text-sm bg-gradient-to-r from-orange-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition text-center">
                                Zobacz wszystkie
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {latestPresence.length > 0 ? (
                                latestPresence.map((presenceItem) => {
                                    const student = getStudentForPresence(presenceItem);
                                    return (
                                        <div
                                            key={presenceItem.id_obecnosci}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-200 hover:border-orange-400 transition gap-3"
                                        >
                                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${presenceItem.czyObecny ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-gray-800 truncate">
                                                        {student?.user?.imie} {student?.user?.nazwisko}
                                                    </div>
                                                    <div className="text-sm text-gray-600 break-words">
                                                        {presenceItem.zajecia?.tematZajec || 'Brak tematu'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <div className="text-sm text-gray-600 mb-1">
                                                    {presenceItem.zajecia?.data
                                                        ? new Date(presenceItem.zajecia.data).toLocaleDateString('pl-PL')
                                                        : 'Brak daty'}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    presenceItem.czyObecny 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {presenceItem.czyObecny ? 'Obecny' : 'Nieobecny'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-2xl">
                                    <span className="text-4xl block mb-2">📭</span>
                                    Brak danych o obecnościach
                                </div>
                            )}
                        </div>
                    </div>

                
                    <div className="lg:col-span-6 bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                <span className="text-white text-xl">📚</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Prace domowe</h3>
                        </div>
                        <div className="space-y-3">
                            {filteredHomeworks.length > 0 ? (
                                filteredHomeworks.slice(0, 6).map(hw => {
                                    const studentAnswer = hw.odpowiedzi?.find(odp => odp.id_ucznia === selectedStudent);
                                    const isSubmitted = !!studentAnswer;
                                    const isGraded = studentAnswer && studentAnswer.ocena !== null && studentAnswer.ocena !== undefined;
                                    return (
                                        <div key={hw.id_zadania} className={`p-4 bg-gradient-to-r rounded-2xl border-2 transition hover:shadow-lg ${
                                            isGraded ? 'from-green-50 to-green-100 border-green-300' :
                                            isSubmitted ? 'from-yellow-50 to-yellow-100 border-yellow-300' :
                                            'from-red-50 to-red-100 border-red-300'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-800 mb-2">
                                                        {hw.tytul || hw.zadanie?.tytul || 'Brak tytułu'}
                                                    </div>
                                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                                        <span>📅</span>
                                                        Termin: {hw.termin ? new Date(hw.termin).toLocaleDateString('pl-PL') : 'Brak'}
                                                    </div>
                                                </div>
                                                <div className="ml-3 flex-shrink-0">
                                                    {!isSubmitted && (
                                                        <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full">Do wykonania</span>
                                                    )}
                                                    {isSubmitted && !isGraded && (
                                                        <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full">Oczekuje na ocenę</span>
                                                    )}
                                                    {isGraded && (
                                                        <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-bold rounded-full">Ocenione: {studentAnswer.ocena}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-2xl">
                                    <span className="text-4xl block mb-2">📝</span>
                                    Brak prac domowych
                                </div>
                            )}
                        </div>
                    </div>

                
                    <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                <span className="text-white text-xl">📅</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Nadchodzące zajęcia</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLessons.length > 0 ? (
                                filteredLessons.map((lesson) => (
                                    <div key={lesson.id_zajec} className="p-5 bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition">
                                        <div className="font-semibold text-gray-800 mb-3">
                                            {lesson.tematZajec || lesson.temat || 'Temat nieznany'}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                                <span className="text-orange-500">📅</span>
                                                {new Date(lesson.data).toLocaleDateString('pl-PL')}
                                            </div>
                                            {lesson.Sala_id_sali && (
                                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                                    <span className="text-orange-500">🚪</span>
                                                    Sala {lesson.Sala_id_sali}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-2xl">
                                    <span className="text-4xl block mb-2">📭</span>
                                    Brak nadchodzących zajęć
                                </div>
                            )}
                        </div>
                    </div>

                   
                    <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 p-3 rounded-2xl">
                                <span className="text-white text-xl">👤</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {selectedStudent ? 'Wybrany uczeń' : 'Twoi podopieczni'}
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {(selectedStudent ? students.filter(s => s.id_ucznia === selectedStudent) : students.slice(0, 3)).map((student) => {
                                const studentPresence = presence[student.id_ucznia] || [];
                                const attendanceCount = studentPresence.filter(p => p.czyObecny).length;
                                const totalCount = studentPresence.length;
                                const attendancePercent = totalCount > 0 
                                    ? Math.round((attendanceCount / totalCount) * 100) 
                                    : 0;

                                return (
                                    <div key={student.id_ucznia} className="p-5 bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl border-2 border-orange-200 hover:border-orange-400 transition">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold">
                                                {student.user?.imie?.[0]}{student.user?.nazwisko?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {student.user?.imie} {student.user?.nazwisko}
                                                </div>
                                                {student.pseudonim && (
                                                    <div className="text-sm text-gray-500">
                                                        ({student.pseudonim})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-600">Obecność:</span>
                                                <span className={`font-bold text-lg ${
                                                    attendancePercent >= 80 ? 'text-green-600' : 
                                                    attendancePercent >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {attendancePercent}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {attendanceCount}/{totalCount} zajęć
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!selectedStudent && students.length > 3 && (
                                <div className="text-center text-gray-500 text-sm">
                                    i {students.length - 3} więcej...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
