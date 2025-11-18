"use client";

import { useEffect, useState } from "react";
import { getOpiekunStudents } from "../../../../lib/api/guardian.api";
import { getPresenceForStudent } from "../../../../lib/api/presence.api";
import { getUserIdFromToken } from "../../../../lib/auth";
import PresenceCard from "/components/PresenceCard";
// lub: import SimplePresenceCard from "/components/SimplePresenceCard";

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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Nagłówek strony */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Obecności uczniów
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Przeglądaj obecności wszystkich przypisanych uczniów
                    </p>
                </header>

                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                        <div className="text-gray-600">Liczba uczniów</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {Object.values(presence).flat().filter(p => p.czyObecny).length}
                        </div>
                        <div className="text-gray-600">Obecności</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {Object.values(presence).flat().filter(p => !p.czyObecny).length}
                        </div>
                        <div className="text-gray-600">Nieobecności</div>
                    </div>
                </div>

                {/* Lista uczniów z obecnościami */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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