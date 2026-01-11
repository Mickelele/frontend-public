'use client';

import { useState, useEffect } from 'react';
import { getStudents } from '../../../../lib/api/student.api';
import { getAllGroups } from '../../../../lib/api/group.api';
import { getPresenceForStudent } from '../../../../lib/api/presence.api';
import { getGroupHomeworks, getHomeworkAnswers } from '../../../../lib/api/homework.api';

export default function RankingsPage() {
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [studentsWithStats, setStudentsWithStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [criterion, setCriterion] = useState('points'); // points, grades, attendance
    const [topCount, setTopCount] = useState(10);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [studentsData, groupsData] = await Promise.all([
                getStudents(),
                getAllGroups()
            ]);

            setStudents(studentsData || []);
            setGroups(groupsData || []);

            // Oblicz statystyki dla każdego ucznia
            const studentsWithCalculatedStats = await Promise.all(
                (studentsData || []).map(async (student) => {
                    try {
                        // Pobierz obecności ucznia
                        const presences = await getPresenceForStudent(student.id_ucznia);
                        
                        // Oblicz frekwencję
                        let attendanceRate = 0;
                        if (presences && presences.length > 0) {
                            const presentCount = presences.filter(p => p.czyObecny === 1 || p.czyObecny === true).length;
                            attendanceRate = (presentCount / presences.length) * 100;
                        }

                        // Pobierz wszystkie odpowiedzi ucznia na zadania domowe
                        let averageGrade = 0;
                        if (student.id_grupa) {
                            try {
                                // Pobierz wszystkie zadania domowe dla grupy
                                let homeworks = await getGroupHomeworks(student.id_grupa);
                                console.log(`=== Dane dla ucznia ${student.id_ucznia} (${student.imie} ${student.nazwisko}) ===`);
                                console.log('Grupa ID:', student.id_grupa);
                                console.log('RAW Odpowiedź z backendu:', homeworks);
                                console.log('Type:', typeof homeworks, 'Is Array:', Array.isArray(homeworks));
                                
                                // Upewnij się że homeworks jest tablicą
                                if (!Array.isArray(homeworks)) {
                                    // Jeśli to pusty obiekt (brak zadań) lub obiekt bez id_zadania - pomiń
                                    if (!homeworks || !homeworks.id_zadania) {
                                        homeworks = [];
                                    } else {
                                        homeworks = [homeworks];
                                    }
                                }
                                
                                console.log('Zadania jako tablica:', homeworks);
                                
                                // Zbierz wszystkie odpowiedzi ucznia z wszystkich zadań
                                const allStudentAnswers = [];
                                
                                for (const homework of homeworks) {
                                    try {
                                        // Dla każdego zadania pobierz wszystkie odpowiedzi
                                        const answers = await getHomeworkAnswers(homework.id_zadania);
                                        console.log(`Zadanie "${homework.tytul}" (ID: ${homework.id_zadania}):`, answers);
                                        
                                        // Filtruj odpowiedzi danego ucznia
                                        const studentAnswersForTask = answers?.filter(
                                            answer => answer.id_ucznia === student.id_ucznia
                                        ) || [];
                                        
                                        console.log(`Odpowiedzi ucznia ${student.id_ucznia}:`, studentAnswersForTask);
                                        allStudentAnswers.push(...studentAnswersForTask);
                                    } catch (err) {
                                        console.error(`Błąd pobierania odpowiedzi dla zadania ${homework.id_zadania}:`, err);
                                    }
                                }
                                
                                console.log('Wszystkie odpowiedzi ucznia:', allStudentAnswers);
                                
                                // Filtruj tylko odpowiedzi z oceną (pomiń te gdzie ocena === null)
                                const gradedAnswers = allStudentAnswers.filter(
                                    answer => answer.ocena !== null && answer.ocena !== undefined
                                );
                                
                                console.log('Ocenione odpowiedzi:', gradedAnswers);
                                
                                if (gradedAnswers.length > 0) {
                                    const totalGrades = gradedAnswers.reduce((sum, answer) => sum + Number(answer.ocena), 0);
                                    averageGrade = totalGrades / gradedAnswers.length;
                                    console.log(`Suma ocen: ${totalGrades}, Średnia: ${averageGrade}`);
                                } else {
                                    console.log('Brak ocenionych odpowiedzi');
                                }
                            } catch (err) {
                                console.error(`Błąd pobierania ocen dla ucznia ${student.id_ucznia}:`, err);
                            }
                        }

                        return {
                            ...student,
                            attendance_rate: attendanceRate,
                            average_grade: averageGrade
                        };
                    } catch (err) {
                        console.error(`Błąd obliczania statystyk dla ucznia ${student.id_ucznia}:`, err);
                        return {
                            ...student,
                            attendance_rate: 0,
                            average_grade: 0
                        };
                    }
                })
            );

            setStudentsWithStats(studentsWithCalculatedStats);
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            alert('Nie udało się załadować danych');
        } finally {
            setLoading(false);
        }
    };

    // Obliczanie rankingu
    const calculateRanking = () => {
        let rankedStudents = [...studentsWithStats];

        // Sortowanie według wybranego kryterium
        if (criterion === 'points') {
            rankedStudents.sort((a, b) => (b.saldo_punktow || 0) - (a.saldo_punktow || 0));
        } else if (criterion === 'grades') {
            rankedStudents.sort((a, b) => (b.average_grade || 0) - (a.average_grade || 0));
        } else if (criterion === 'attendance') {
            rankedStudents.sort((a, b) => (b.attendance_rate || 0) - (a.attendance_rate || 0));
        }

        // Ograniczenie do top N
        return rankedStudents.slice(0, topCount);
    };

    const rankedStudents = calculateRanking();

    const getCriterionLabel = () => {
        switch (criterion) {
            case 'points': return 'Suma punktów';
            case 'grades': return 'Średnia ocen';
            case 'attendance': return 'Frekwencja';
            default: return '';
        }
    };

    const getCriterionValue = (student) => {
        switch (criterion) {
            case 'points': return student.saldo_punktow || 0;
            case 'grades': return (student.average_grade || 0).toFixed(2);
            case 'attendance': return `${(student.attendance_rate || 0).toFixed(1)}%`;
            default: return '-';
        }
    };

    const getMedalEmoji = (position) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie danych...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Rankingi Uczniów
                </h1>
                <p className="text-gray-600">
                    Przeglądaj i analizuj osiągnięcia uczniów
                </p>
            </div>

            {/* Filtry */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kryterium */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kryterium rankingu
                        </label>
                        <select
                            value={criterion}
                            onChange={(e) => setCriterion(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="points">Suma punktów</option>
                            <option value="grades">Średnia ocen</option>
                            <option value="attendance">Frekwencja</option>
                        </select>
                    </div>

                    {/* Liczba wyników */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Wyświetl top
                        </label>
                        <select
                            value={topCount}
                            onChange={(e) => setTopCount(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={5}>Top 5</option>
                            <option value={10}>Top 10</option>
                            <option value={20}>Top 20</option>
                            <option value={50}>Top 50</option>
                            <option value={100}>Top 100</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Ranking */}
            {rankedStudents.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Brak danych
                    </h3>
                    <p className="text-gray-600">
                        Nie ma jeszcze uczniów do wyświetlenia w rankingu.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
                        <h2 className="text-2xl font-bold text-white">
                            Top {topCount} - {getCriterionLabel()}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pozycja
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Uczeń
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pseudonim
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Grupa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {getCriterionLabel()}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rankedStudents.map((student, index) => {
                                    const position = index + 1;
                                    const group = groups.find(g => g.id_grupa === student.id_grupa);
                                    const isTopThree = position <= 3;

                                    return (
                                        <tr 
                                            key={student.id_ucznia} 
                                            className={`hover:bg-gray-50 ${
                                                position === 1 ? 'bg-yellow-50' :
                                                position === 2 ? 'bg-gray-100' :
                                                position === 3 ? 'bg-orange-50' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-bold ${
                                                        position === 1 ? 'text-yellow-600' :
                                                        position === 2 ? 'text-gray-600' :
                                                        position === 3 ? 'text-orange-600' :
                                                        'text-gray-400'
                                                    }`}>
                                                        {position}
                                                    </span>
                                                    <span className="text-2xl">
                                                        {getMedalEmoji(position)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.user?.imie} {student.user?.nazwisko}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {student.id_ucznia}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                                                    {student.pseudonim || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.id_grupa ? (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        Grupa #{student.id_grupa}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Brak grupy</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-lg font-bold ${
                                                    isTopThree ? 'text-blue-600' : 'text-gray-700'
                                                }`}>
                                                    {getCriterionValue(student)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Legenda */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="font-semibold">💡 Informacja:</span>
                    <span>
                        Ranking jest aktualizowany na bieżąco na podstawie wybranego kryterium.
                        {criterion === 'grades' && ' Średnia ocen obliczana jest na podstawie ocenionych zadań domowych.'}
                        {criterion === 'attendance' && ' Frekwencja obliczana jest na podstawie wpisanych obecności.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
