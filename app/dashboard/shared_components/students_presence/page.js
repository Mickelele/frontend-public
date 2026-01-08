"use client";

import { useEffect, useState } from "react";
import { getOpiekunStudents } from "../../../../lib/api/guardian.api";
import { getPresenceForStudent } from "../../../../lib/api/presence.api";
import { getUserIdFromToken } from "../../../../lib/auth";
import PresenceCard from "/components/PresenceCard";

export default function StudentsPresencePage() {
    const [students, setStudents] = useState([]);
    const [presence, setPresence] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const opiekunId = getUserIdFromToken();
        console.log("Opiekun ID z tokena:", opiekunId);

        if (!opiekunId) {
            console.warn("Brak opiekuna w tokenie");
            setLoading(false);
            return;
        }

        async function loadData() {
            try {
                console.log("Pobieranie uczniów dla opiekuna...");
                const uczniowie = await getOpiekunStudents(opiekunId);
                console.log("Uczniowie pobrani:", uczniowie);
                setStudents(uczniowie);

                console.log("Pobieranie obecności dla uczniów...");
                const presenceResults = await Promise.all(
                    uczniowie.map((u) => getPresenceForStudent(u.id_ucznia))
                );
                console.log("Wyniki obecności:", presenceResults);

                const presenceMap = {};
                uczniowie.forEach((u, i) => {
                    presenceMap[u.id_ucznia] = presenceResults[i];
                });

                console.log("Mapa obecności:", presenceMap);
                setPresence(presenceMap);
            } catch (err) {
                console.error("Błąd przy ładowaniu danych:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Ładowanie danych...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!students.length) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Brak uczniów przypisanych do opiekuna
                    </h1>
                    <p className="text-gray-600">
                        Nie masz jeszcze żadnych uczniów przypisanych do swojego konta.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">

                <header className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        📋 Obecności uczniów
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                        Przeglądaj frekwencję wszystkich przypisanych uczniów
                    </p>
                </header>


                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-blue-600">{students.length}</div>
                                <div className="text-gray-600 text-sm mt-1">Uczniów</div>
                            </div>
                            <div className="text-4xl">👥</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-green-600">
                                    {Object.values(presence).flat().filter(p => p.czyObecny).length}
                                </div>
                                <div className="text-gray-600 text-sm mt-1">Obecności</div>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-red-600">
                                    {Object.values(presence).flat().filter(p => !p.czyObecny).length}
                                </div>
                                <div className="text-gray-600 text-sm mt-1">Nieobecności</div>
                            </div>
                            <div className="text-4xl">❌</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-purple-600">
                                    {Object.values(presence).flat().length > 0
                                        ? ((Object.values(presence).flat().filter(p => p.czyObecny).length / 
                                           Object.values(presence).flat().length) * 100).toFixed(0)
                                        : 0}%
                                </div>
                                <div className="text-gray-600 text-sm mt-1">Frekwencja</div>
                            </div>
                            <div className="text-4xl">📊</div>
                        </div>
                    </div>
                </div>


                <div className="space-y-6">
                    {students.map((student) => (
                        <PresenceCard
                            key={student.id_ucznia}
                            student={student}
                            presence={presence[student.id_ucznia]}
                        />

                    ))}
                </div>
            </div>
        </div>
    );
}