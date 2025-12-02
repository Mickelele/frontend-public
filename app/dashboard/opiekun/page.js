'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { getPresenceForStudent } from '/lib/api/presence.api';
import { getGuardianHomeworks } from '/lib/api/homework.api';
import { getUserIdFromToken } from '/lib/auth';
import Link from 'next/link';

export default function GuardianDashboard() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [presence, setPresence] = useState({});
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const opiekunId = getUserIdFromToken();

        async function loadData() {
            try {
                const uczniowie = await getOpiekunStudents(opiekunId);
                setStudents(uczniowie);

                const presenceResults = await Promise.all(
                    uczniowie.map((u) => getPresenceForStudent(u.id_ucznia))
                );

                const presenceMap = {};
                uczniowie.forEach((u, i) => {
                    presenceMap[u.id_ucznia] = presenceResults[i];
                });
                setPresence(presenceMap);

                const prace = await getGuardianHomeworks(opiekunId);
                setHomeworks(prace);

            } catch (err) {
                console.error("Błąd przy ładowaniu danych:", err);
            } finally {
                setLoading(false);
            }
        }

        if (opiekunId) loadData();
    }, []);

    const allPresence = Object.values(presence).flat();
    const latestPresence = allPresence
        .sort((a, b) => new Date(b.zajecia?.data || 0) - new Date(a.zajecia?.data || 0))
        .slice(0, 4);

    const getStudentForPresence = (presenceItem) =>
        students.find(student => student.id_ucznia === presenceItem.id_ucznia);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Witaj, {user?.imie}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        To jest Twój panel główny opiekuna
                    </p>
                </header>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">👥 Uczniowie</h3>
                        <div className="text-2xl font-bold text-blue-600 mb-2">{students.length}</div>
                        <div className="text-gray-600">Liczba przypisanych uczniów</div>
                    </div>


                    <Link href="/dashboard/shared_components/students_presence" className="block">
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500 h-full">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Ostatnie obecności</h3>
                            <div className="space-y-3">
                                {latestPresence.length > 0 ? (
                                    latestPresence.map((presenceItem) => {
                                        const student = getStudentForPresence(presenceItem);
                                        return (
                                            <div
                                                key={presenceItem.id_obecnosci}
                                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                    <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                                                        presenceItem.czyObecny ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-sm text-gray-800 truncate">
                                                            {student?.user?.imie} {student?.user?.nazwisko}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {presenceItem.zajecia?.tematZajec || `Zajęcia ${presenceItem.id_zajec}`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                                        {presenceItem.zajecia?.data
                                                            ? new Date(presenceItem.zajecia.data).toLocaleDateString('pl-PL')
                                                            : 'brak daty'}
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
                                    <div className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg">
                                        Brak danych o obecnościach
                                    </div>
                                )}
                            </div>
                            <div className="text-gray-600 text-sm text-center border-t pt-3 mt-3">
                                Zobacz wszystkie obecności →
                            </div>
                        </div>
                    </Link>


                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">⭐ Oceny</h3>
                        <div className="space-y-2 text-gray-600">
                            {homeworks.length === 0 ? (
                                <div className="text-sm text-gray-500">Brak ocenionych prac</div>
                            ) : (
                                homeworks.slice(0, 3).map(hw => (
                                    <div key={hw.id_odpowiedzi} className="flex justify-between text-sm text-gray-700">
                                        <span>
                                            {hw.user?.imie} {hw.user?.nazwisko} - <i>{hw.zadanie?.tytul ?? 'brak tytułu'}</i>
                                        </span>
                                        <span className="font-semibold text-blue-600">{hw.ocena ?? '—'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ostatnie aktywności</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                                <span>📋</span>
                                <span>Sprawdzono obecności - dziś</span>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                                <span>⭐</span>
                                <span>Dodano nowe oceny - wczoraj</span>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                                <span>👥</span>
                                <span>{students.length} uczniów przypisanych</span>
                            </div>
                        </div>
                    </div>


                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Twoi uczniowie</h3>
                            <span className="text-sm text-gray-500">{students.length} uczniów</span>
                        </div>
                        <div className="space-y-3">
                            {students.slice(0, 4).map((student) => (
                                <div key={student.id_ucznia} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <div>
                                        <span className="font-medium">{student.user?.imie} {student.user?.nazwisko}</span>
                                        {student.pseudonim && <span className="text-sm text-gray-500 ml-2">({student.pseudonim})</span>}
                                    </div>
                                    <span className="text-sm text-gray-500">{presence[student.id_ucznia]?.length || 0} zajęć</span>
                                </div>
                            ))}
                            {students.length > 4 && (
                                <div className="text-center text-sm text-blue-600 font-medium">
                                    +{students.length - 4} więcej uczniów
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
