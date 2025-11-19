"use client";

import { useEffect, useState } from "react";
import { getMyCourses } from "../../../../lib/api/course.api";
import { getUserIdFromToken } from "../../../../lib/auth";

export default function TeacherCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState("");
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    const dniTygodnia = [
        "Poniedziałek",
        "Wtorek",
        "Środa",
        "Czwartek",
        "Piątek",
        "Sobota",
        "Niedziela"
    ];

    useEffect(() => {
        const teacherId = getUserIdFromToken();
        console.log("Nauczyciel ID z tokena:", teacherId);

        if (!teacherId) {
            console.warn("Brak nauczyciela w tokenie");
            setLoading(false);
            return;
        }

        loadCourses(selectedDay);
    }, [selectedDay]);

    async function loadCourses(dzien) {
        try {
            setLoading(true);
            console.log("Pobieranie kursów...", { dzien });

            const kursy = await getMyCourses(dzien);
            console.log("Kursy pobrane:", kursy);
            setCourses(kursy);
        } catch (err) {
            console.error("Błąd przy ładowaniu kursów:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleDayChange = (dzien) => {
        setSelectedDay(dzien);
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const countTotalLessons = (grupy) => {
        return grupy.reduce((total, grupa) => total + (grupa.zajecia?.length || 0), 0);
    };

    const countTotalGroups = (grupy) => {
        return grupy.length;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Nieustalona';
        return new Date(dateString).toLocaleDateString('pl-PL');
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'Nieustalona';
        return timeString.split(':').slice(0, 2).join(':');
    };

    const getNazwaZajec = (zajecie) => {
        return zajecie.tematZajec || "Brak tematu";
    };

    // Funkcja do pobrania obecności ucznia na danych zajęciach
    const getStudentPresence = (zajecie, studentId) => {
        if (!zajecie.obecnosci) return null;
        const obecnosc = zajecie.obecnosci.find(o => o.id_ucznia === studentId);
        return obecnosc ? obecnosc.czyObecny : null;
    };

    // Funkcja do uzyskania koloru dla statusu obecności
    const getPresenceColor = (status) => {
        if (status === null) return 'bg-gray-200 border-gray-300';
        if (status === true) return 'bg-green-100 border-green-300';
        return 'bg-red-100 border-red-300';
    };

    const getPresenceText = (status) => {
        if (status === null) return '?';
        if (status === true) return '✓';
        return '✗';
    };

    const getPresenceTextColor = (status) => {
        if (status === null) return 'text-gray-600';
        if (status === true) return 'text-green-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Ładowanie kursów...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-full mx-auto">

                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Moje kursy i grupy
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Przeglądaj swoje kursy, grupy i obecności
                    </p>
                </header>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtruj po dniu tygodnia:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleDayChange("")}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                selectedDay === ""
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            }`}
                        >
                            Wszystkie dni
                        </button>
                        {dniTygodnia.map((dzien) => (
                            <button
                                key={dzien}
                                onClick={() => handleDayChange(dzien)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    selectedDay === dzien
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                }`}
                            >
                                {dzien}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                        <div className="text-gray-600">Liczba kursów</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {courses.reduce((total, course) => total + countTotalGroups(course.grupy), 0)}
                        </div>
                        <div className="text-gray-600">Liczba grup</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {courses.reduce((total, course) => total + countTotalLessons(course.grupy), 0)}
                        </div>
                        <div className="text-gray-600">Liczba zajęć</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {selectedDay || "Wszystkie dni"}
                        </div>
                        <div className="text-gray-600">Wybrany dzień</div>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            {selectedDay ? `Brak kursów w dniu: ${selectedDay}` : "Brak przypisanych kursów"}
                        </h2>
                        <p className="text-gray-600">
                            {selectedDay
                                ? "Nie masz żadnych kursów prowadzonych w wybranym dniu tygodnia."
                                : "Nie masz jeszcze żadnych przypisanych kursów."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {courses.map((course) => (
                            <div key={course.id_kursu} className="bg-white rounded-lg shadow overflow-hidden">

                                <div className="bg-blue-50 px-6 py-4 border-b">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">
                                                {course.nazwa_kursu}
                                            </h2>
                                            <p className="text-gray-600">
                                                {formatDate(course.data_rozpoczecia)} - {formatDate(course.data_zakonczenia)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {course.grupy.length} grup
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {course.grupy.map((grupa) => (
                                        <div key={grupa.id_grupa} className="mb-6 last:mb-0 border border-gray-200 rounded-lg">

                                            <div
                                                className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => toggleGroup(grupa.id_grupa)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <svg
                                                            className={`w-4 h-4 transition-transform ${
                                                                expandedGroups.has(grupa.id_grupa) ? 'rotate-90' : ''
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800">
                                                                Grupa #{grupa.id_grupa}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                Dzień: <span className="font-medium">{grupa.dzien_tygodnia}</span> |
                                                                Godzina: <span className="font-medium">{formatTime(grupa.godzina)}</span> |
                                                                Uczniowie: <span className="font-medium">{grupa.uczniowie?.length || 0}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                            {grupa.zajecia?.length || 0} zajęć
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedGroups.has(grupa.id_grupa) && (
                                                <div className="p-4">
                                                    {/* Matrix obecności */}
                                                    {grupa.uczniowie && grupa.uczniowie.length > 0 && grupa.zajecia && grupa.zajecia.length > 0 ? (
                                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full">
                                                                    {/* Nagłówek - zajęcia */}
                                                                    <thead>
                                                                    <tr className="bg-gray-50">
                                                                        {/* Lewa komórka - Uczniowie */}
                                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                                                                            Uczeń
                                                                        </th>
                                                                        {/* Zajęcia poziomo z numeracją 1, 2, 3... */}
                                                                        {grupa.zajecia.map((zajecie, index) => (
                                                                            <th
                                                                                key={zajecie.id_zajec}
                                                                                className="px-3 py-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200 min-w-[120px]"
                                                                            >
                                                                                <div className="flex flex-col items-center">
                                                                                    <span className="font-semibold text-sm">{index + 1}.</span>
                                                                                    <span className="text-xs text-gray-500 mt-1">
                                                                                            {formatDate(zajecie.data)}
                                                                                        </span>
                                                                                    <span className="text-xs text-gray-400 mt-1 truncate max-w-[100px]">
                                                                                            {getNazwaZajec(zajecie)}
                                                                                        </span>
                                                                                </div>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                    </thead>

                                                                    {/* Ciało tabeli - uczniowie i obecności */}
                                                                    <tbody>
                                                                    {grupa.uczniowie.map((student, index) => (
                                                                        <tr
                                                                            key={student.id_ucznia}
                                                                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                                                        >
                                                                            {/* Komórka z uczniem - sticky */}
                                                                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit z-10">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                                            <span className="text-blue-600 font-medium text-xs">
                                                                                                {student.pseudonim.charAt(0).toUpperCase()}
                                                                                            </span>
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        <div className="font-medium text-gray-900 text-sm truncate">
                                                                                            {student.pseudonim}
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-500">
                                                                                            Punkty: {student.saldo_punktow}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                            {/* Komórki z obecnościami dla każdego zajęcia */}
                                                                            {grupa.zajecia.map((zajecie) => {
                                                                                const status = getStudentPresence(zajecie, student.id_ucznia);
                                                                                return (
                                                                                    <td
                                                                                        key={`${student.id_ucznia}-${zajecie.id_zajec}`}
                                                                                        className="px-2 py-2 text-center border-b border-gray-200"
                                                                                    >
                                                                                        <div
                                                                                            className={`w-8 h-8 rounded border-2 flex items-center justify-center mx-auto cursor-pointer transition-all ${getPresenceColor(status)}`}
                                                                                            title={`${student.pseudonim} - Zajęcia ${grupa.zajecia.indexOf(zajecie) + 1}. (${formatDate(zajecie.data)}): ${status === null ? 'Nieustalony' : status ? 'Obecny' : 'Nieobecny'}`}
                                                                                        >
                                                                                                <span className={`font-bold text-sm ${getPresenceTextColor(status)}`}>
                                                                                                    {getPresenceText(status)}
                                                                                                </span>
                                                                                        </div>
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            {/* Legenda */}
                                                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                                                <div className="flex flex-wrap gap-4 justify-center text-xs">
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
                                                                            <span className="text-green-600 font-bold">✓</span>
                                                                        </div>
                                                                        <span className="text-gray-600">Obecny</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
                                                                            <span className="text-red-600 font-bold">✗</span>
                                                                        </div>
                                                                        <span className="text-gray-600">Nieobecny</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded flex items-center justify-center">
                                                                            <span className="text-gray-600 font-bold">?</span>
                                                                        </div>
                                                                        <span className="text-gray-600">Nieustalony</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-center py-4">
                                                            {!grupa.uczniowie || grupa.uczniowie.length === 0
                                                                ? "Brak uczniów w grupie"
                                                                : "Brak zaplanowanych zajęć"}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}