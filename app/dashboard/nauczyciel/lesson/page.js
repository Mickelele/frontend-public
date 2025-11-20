"use client";

import { useEffect, useState } from "react";
import { getMyCourses } from "../../../../lib/api/course.api";
import { getUserIdFromToken } from "../../../../lib/auth";
import { setPresence, createPresence, deletePresence } from "../../../../lib/api/presence.api";

export default function TeacherCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState("");
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [updating, setUpdating] = useState(false);
    const [presenceMenu, setPresenceMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        idObecnosci: null
    });

    const dniTygodnia = [
        "Poniedziałek",
        "Wtorek",
        "Środa",
        "Czwartek",
        "Piątek",
        "Sobota",
        "Niedziela"
    ];

    // ---------------------------------------------------
    // ŁADOWANIE KURSÓW
    // ---------------------------------------------------
    useEffect(() => {
        const teacherId = getUserIdFromToken();
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
            const kursy = await getMyCourses(dzien);
            setCourses(kursy || []);
        } catch (err) {
            console.error("Błąd przy ładowaniu kursów:", err);
        } finally {
            setLoading(false);
        }
    }

    // ---------------------------------------------------
    // FUNKCJE POMOCNICZE
    // ---------------------------------------------------
    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
            return newSet;
        });
    };

    const countTotalGroups = grupy => grupy.length;
    const countTotalLessons = grupy => grupy.reduce((s, g) => s + (g.zajecia?.length || 0), 0);

    const formatDate = d => d ? new Date(d).toLocaleDateString("pl-PL") : "Nieustalona";
    const formatTime = t => t ? t.split(":").slice(0, 2).join(":") : "Nieustalona";

    const getNazwaZajec = z => z.tematZajec || "Brak tematu";

    const getStudentPresence = (zajecie, studentId) => {
        const o = zajecie.obecnosci?.find(x => x.id_ucznia === studentId);
        if (!o) return null;
        return o.czyObecny == 1;
    };

    const getPresenceColor = status => {
        if (status === null) return "bg-gray-200 border-gray-300";
        if (status === true) return "bg-green-100 border-green-300";
        return "bg-red-100 border-red-300";
    };

    const getPresenceText = s => s === null ? "?" : s === true ? "✓" : "✗";
    const getPresenceTextColor = s =>
        s === null ? "text-gray-600" : s ? "text-green-600" : "text-red-600";

    // ---------------------------------------------------
    // OBSŁUGA MENU OBECNOŚCI
    // ---------------------------------------------------
    const openPresenceMenu = (e, obecnosc, zajecieId, studentId) => {
        const rect = e.target.getBoundingClientRect();
        setPresenceMenu({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height,
            idObecnosci: obecnosc?.id_obecnosci || null,
            idZajec: zajecieId,
            idStudenta: studentId,
            currentObecnosc: obecnosc // Zapisz aktualną obecność
        });
    };


    const choosePresence = async (value) => {
        if (updating) return;

        try {
            setUpdating(true);

            // ZAPISZ DANE DO LOKALNYCH ZMIENNYCH PRZED RESETEM
            const currentMenuData = { ...presenceMenu };

            console.log("Dane z menu:", currentMenuData);
            console.log("Wybrana wartość:", value);
            console.log("Typ wartości:", typeof value);

            // NATYCHMIAST ZAMKNIJ MENU
            setPresenceMenu({
                visible: false,
                x: 0,
                y: 0,
                idObecnosci: null,
                idZajec: null,
                idStudenta: null,
                currentObecnosc: null
            });

            // WALIDACJA DANYCH
            if (!currentMenuData.idZajec || !currentMenuData.idStudenta) {
                console.error("Brak wymaganych danych:", currentMenuData);
                alert("Błąd: Brak wymaganych danych");
                return;
            }

            // WYKONAJ OPERACJĘ
            let result;
            if (!currentMenuData.idObecnosci && value !== null) {
                console.log("CREATE - idZajec:", currentMenuData.idZajec, "idStudenta:", currentMenuData.idStudenta, "value:", value);
                result = await createPresence(currentMenuData.idZajec, currentMenuData.idStudenta, value);
                console.log("Odpowiedź CREATE:", result);
            } else if (currentMenuData.idObecnosci && value !== null) {
                console.log("UPDATE - idObecnosci:", currentMenuData.idObecnosci, "value:", value);
                result = await setPresence(currentMenuData.idObecnosci, value);
                console.log("Odpowiedź UPDATE:", result);
            } else if (currentMenuData.idObecnosci && value === null) {
                console.log("DELETE - idObecnosci:", currentMenuData.idObecnosci);
                result = await deletePresence(currentMenuData.idObecnosci);
                console.log("Odpowiedź DELETE:", result);
            }

            // KRÓTKIE OPÓŹNIENIE PRZED PRZEŁADOWANIEM
            await new Promise(resolve => setTimeout(resolve, 100));

            // PRZEŁADUJ DANE
            await loadCourses(selectedDay);

        } catch (err) {
            console.error("Błąd przy zapisie obecności:", err);
            alert("Wystąpił błąd podczas zapisywania obecności");
        } finally {
            setUpdating(false);
        }
    };



    // ---------------------------------------------------
    // RENDER
    // ---------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie kursów...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 relative">
            <div className="max-w-full mx-auto">

                {/* ------------------ Nagłówki ------------------ */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Moje kursy i grupy</h1>
                    <p className="text-gray-600 mt-2">Przeglądaj swoje kursy, grupy i obecności</p>
                </header>

                {/* ------------------ Filtr ------------------ */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtruj po dniu tygodnia:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedDay("")}
                            className={`px-4 py-2 rounded-lg ${
                                selectedDay === "" ? "bg-blue-500 text-white" :
                                    "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            }`}
                        >
                            Wszystkie dni
                        </button>

                        {dniTygodnia.map(dzien => (
                            <button
                                key={dzien}
                                onClick={() => setSelectedDay(dzien)}
                                className={`px-4 py-2 rounded-lg ${
                                    selectedDay === dzien ? "bg-blue-500 text-white" :
                                        "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                }`}
                            >
                                {dzien}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ------------------ Statystyki ------------------ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Liczba kursów" value={courses.length} color="text-blue-600" />
                    <StatCard
                        title="Liczba grup"
                        value={courses.reduce((s, c) => s + countTotalGroups(c.grupy), 0)}
                        color="text-green-600"
                    />
                    <StatCard
                        title="Liczba zajęć"
                        value={courses.reduce((s, c) => s + countTotalLessons(c.grupy), 0)}
                        color="text-purple-600"
                    />
                    <StatCard
                        title="Wybrany dzień"
                        value={selectedDay || "Wszystkie dni"}
                        color="text-orange-600"
                    />
                </div>

                {/* ------------------ Brak kursów ------------------ */}
                {courses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            {selectedDay
                                ? `Brak kursów w dniu: ${selectedDay}`
                                : "Brak przypisanych kursów"}
                        </h2>
                        <p className="text-gray-600">
                            {selectedDay
                                ? "Nie masz żadnych kursów w tym dniu."
                                : "Brak przypisanych kursów."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* ------------------ Kursy ------------------ */}
                        {courses.map(course => (
                            <div key={course.id_kursu} className="bg-white rounded-lg shadow overflow-hidden">

                                {/* Nagłówek kursu */}
                                <div className="bg-blue-50 px-6 py-4 border-b flex justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {course.nazwa_kursu}
                                        </h2>
                                        <p className="text-gray-600">
                                            {formatDate(course.data_rozpoczecia)} - {formatDate(course.data_zakonczenia)}
                                        </p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        {course.grupy.length} grup
                                    </span>
                                </div>

                                {/* Grupy */}
                                <div className="p-6 space-y-6">
                                    {course.grupy.map(grupa => (
                                        <GroupSection
                                            key={grupa.id_grupa}
                                            grupa={grupa}
                                            expanded={expandedGroups.has(grupa.id_grupa)}
                                            toggleGroup={() => toggleGroup(grupa.id_grupa)}
                                            formatDate={formatDate}
                                            formatTime={formatTime}
                                            getNazwaZajec={getNazwaZajec}
                                            getStudentPresence={getStudentPresence}
                                            getPresenceColor={getPresenceColor}
                                            getPresenceText={getPresenceText}
                                            getPresenceTextColor={getPresenceTextColor}
                                            openPresenceMenu={openPresenceMenu}
                                        />
                                    ))}
                                </div>

                            </div>
                        ))}

                    </div>
                )}

                {/* ------------------ MENU OBECNOŚCI ------------------ */}
                {presenceMenu.visible && (
                    <div
                        style={{
                            position: "fixed",
                            top: presenceMenu.y,
                            left: presenceMenu.x,
                            transform: "translate(-50%, 10px)"
                        }}
                        className="bg-white shadow-lg border border-gray-300 rounded-lg p-2 z-50"
                    >
                        <button onClick={() => choosePresence(true)}
                                className="block w-full px-3 py-2 hover:bg-green-100 text-green-700">
                            ✓ Obecny
                        </button>
                        <button onClick={() => choosePresence(false)}
                                className="block w-full px-3 py-2 hover:bg-red-100 text-red-700">
                            ✗ Nieobecny
                        </button>
                        <button onClick={() => choosePresence(null)}
                                className="block w-full px-3 py-2 hover:bg-gray-100 text-gray-700">
                            ? Nieustalone
                        </button>
                        <button onClick={() => setPresenceMenu(p => ({ ...p, visible: false }))}
                                className="block w-full px-3 py-2 text-gray-500 hover:bg-gray-200">
                            Zamknij
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ======================================================================== */
/* ======================== KOMPONENTY POMOCNICZE ========================== */
/* ======================================================================== */

function StatCard({ title, value, color }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-600">{title}</div>
        </div>
    );
}

function GroupSection({
                          grupa,
                          expanded,
                          toggleGroup,
                          formatDate,
                          formatTime,
                          getNazwaZajec,
                          getStudentPresence,
                          getPresenceColor,
                          getPresenceText,
                          getPresenceTextColor,
                          openPresenceMenu
                      }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Nagłówek grupy */}
            <div
                className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 flex justify-between"
                onClick={toggleGroup}
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5l7 7-7 7"/>
                    </svg>
                    <div>
                        <h3 className="font-semibold text-gray-800">Grupa #{grupa.id_grupa}</h3>
                        <p className="text-sm text-gray-600">
                            Dzień: <b>{grupa.dzien_tygodnia}</b> |
                            Godzina: <b>{formatTime(grupa.godzina)}</b> |
                            Uczniowie: <b>{grupa.uczniowie?.length || 0}</b>
                        </p>
                    </div>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {grupa.zajecia?.length || 0} zajęć
                </span>
            </div>

            {expanded && (
                <div className="p-4">
                    {(!grupa.uczniowie?.length || !grupa.zajecia?.length) ? (
                        <p className="text-gray-500 text-center py-4">
                            {!grupa.uczniowie?.length
                                ? "Brak uczniów w grupie"
                                : "Brak zaplanowanych zajęć"}
                        </p>
                    ) : (
                        <AttendanceMatrix
                            grupa={grupa}
                            formatDate={formatDate}
                            getNazwaZajec={getNazwaZajec}
                            getStudentPresence={getStudentPresence}
                            getPresenceColor={getPresenceColor}
                            getPresenceText={getPresenceText}
                            getPresenceTextColor={getPresenceTextColor}
                            openPresenceMenu={openPresenceMenu}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function AttendanceMatrix({
                              grupa,
                              formatDate,
                              getNazwaZajec,
                              getStudentPresence,
                              getPresenceColor,
                              getPresenceText,
                              getPresenceTextColor,
                              openPresenceMenu
                          }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                    <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 sticky left-0 bg-gray-50 border-r min-w-[200px]">
                            Uczeń
                        </th>

                        {grupa.zajecia.map((zajecie, index) => (
                            <th key={zajecie.id_zajec}
                                className="px-3 py-2 text-center border-b min-w-[120px]">
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold">{index + 1}.</span>
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

                    <tbody>
                    {grupa.uczniowie.map((student, rowIndex) => (
                        <tr key={student.id_ucznia}
                            className={rowIndex % 2 ? "bg-gray-50" : "bg-white"}>

                            {/* Lewa kolumna: student */}
                            <td className="px-4 py-3 sticky left-0 bg-inherit border-r">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-xs font-medium">
                                            {student.pseudonim.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">
                                            {student.pseudonim}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Punkty: {student.saldo_punktow}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Komórki obecności */}
                            {grupa.zajecia.map(zajecie => {
                                const status = getStudentPresence(zajecie, student.id_ucznia);
                                const obecnosc = zajecie.obecnosci?.find(
                                    o => o.id_ucznia === student.id_ucznia
                                );

                                return (
                                    <td key={`${student.id_ucznia}-${zajecie.id_zajec}`}
                                        className="px-2 py-2 text-center border-b">

                                        <div
                                            onClick={(e) =>
                                                openPresenceMenu(
                                                    e,
                                                    obecnosc,
                                                    zajecie.id_zajec,
                                                    student.id_ucznia
                                                )
                                            }
                                            className={`w-8 h-8 rounded border-2 cursor-pointer flex items-center justify-center mx-auto ${getPresenceColor(status)}`}
                                        >
                                            <span className={`font-bold ${getPresenceTextColor(status)}`}>
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
            <div className="p-3 bg-gray-50 border-t text-xs flex justify-center gap-4">
                <LegendItem color="green" text="Obecny" symbol="✓"/>
                <LegendItem color="red" text="Nieobecny" symbol="✗"/>
                <LegendItem color="gray" text="Nieustalone" symbol="?"/>
            </div>
        </div>
    );
}

function LegendItem({ color, text, symbol }) {
    const bg = {
        green: "bg-green-100 border-green-300 text-green-600",
        red: "bg-red-100 border-red-300 text-red-600",
        gray: "bg-gray-200 border-gray-300 text-gray-600"
    }[color];

    return (
        <div className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${bg}`}>
                <span className="font-bold">{symbol}</span>
            </div>
            <span className="text-gray-600">{text}</span>
        </div>
    );
}
