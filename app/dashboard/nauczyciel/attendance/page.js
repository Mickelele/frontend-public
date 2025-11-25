"use client";

import { useEffect, useState } from "react";
import { getMyCourses, addComment } from "../../../../lib/api/course.api";
import { getUserIdFromToken } from "../../../../lib/auth";
import { setPresence, createPresence, deletePresence } from "../../../../lib/api/presence.api";
import { updateEquipmentRemark } from "../../../../lib/api/lesson.api";

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
        idObecnosci: null,
        idZajec: null,
        idStudenta: null
    });
    const [remarkModal, setRemarkModal] = useState({
        visible: false,
        zajecie: null,
        selectedStudent: null,
        tresc: ""
    });

    const [equipmentRemarkModal, setEquipmentRemarkModal] = useState({
        visible: false,
        zajecie: null,
        tresc: ""
    });

    const handleEquipmentRemarkSubmit = async () => {
        if (!equipmentRemarkModal.tresc.trim()) {
            alert("Wpisz treść uwagi o sprzęcie");
            return;
        }

        try {
            setUpdating(true);

            await updateEquipmentRemark(
                equipmentRemarkModal.zajecie.id_zajec,
                equipmentRemarkModal.tresc
            );

            alert("Uwaga o sprzęcie zapisana!");
            closeEquipmentRemarkModal();

            loadCourses(selectedDay);
        } catch (err) {
            console.error(err);
            alert("Błąd przy zapisie uwagi o sprzęcie");
        } finally {
            setUpdating(false);
        }
    };

    const openEquipmentRemarkModal = (zajecie) => {
        setEquipmentRemarkModal({
            visible: true,
            zajecie,
            tresc: zajecie.uwaga_do_sprzetu || ""
        });
    };

    const closeEquipmentRemarkModal = () => {
        setEquipmentRemarkModal({
            visible: false,
            zajecie: null,
            tresc: ""
        });
    };

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

    const getStudentFullName = (student) => {
        return `${student.imie} ${student.nazwisko}`;
    };

    const isStudentPresent = (zajecie, studentId) => {
        const status = getStudentPresence(zajecie, studentId);
        return status === true;
    };

    const openPresenceMenu = (e, obecnosc, zajecieId, studentId) => {
        const rect = e.target.getBoundingClientRect();
        setPresenceMenu({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height,
            idObecnosci: obecnosc?.id_obecnosci || null,
            idZajec: zajecieId,
            idStudenta: studentId
        });
    };

    const openRemarkModal = (zajecie) => {
        setRemarkModal({
            visible: true,
            zajecie,
            selectedStudent: null,
            tresc: ""
        });
    };

    const closeRemarkModal = () => {
        setRemarkModal({
            visible: false,
            zajecie: null,
            selectedStudent: null,
            tresc: ""
        });
    };

    const handleRemarkSubmit = async () => {
        if (!remarkModal.tresc.trim()) {
            alert("Proszę wpisać treść uwagi");
            return;
        }

        if (!remarkModal.selectedStudent) {
            alert("Proszę wybrać ucznia");
            return;
        }

        try {
            setUpdating(true);
            const teacherId = getUserIdFromToken();

            const remarkData = {
                id_ucznia: remarkModal.selectedStudent.id_ucznia,
                id_zajec: remarkModal.zajecie.id_zajec,
                tresc: remarkModal.tresc,
                id_nauczyciela: teacherId
            };

            const result = await addComment(remarkData);

            closeRemarkModal();
            alert("Uwaga została dodana pomyślnie!");

        } catch (error) {
            console.error("Błąd przy dodawaniu uwagi:", error);
            alert("Wystąpił błąd podczas dodawania uwagi");
        } finally {
            setUpdating(false);
        }
    };

    const updatePresenceOptimistically = (zajecieId, studentId, value) => {
        setCourses(prevCourses =>
            prevCourses.map(course => ({
                ...course,
                grupy: course.grupy.map(grupa => ({
                    ...grupa,
                    zajecia: grupa.zajecia.map(zajecie => {
                        if (zajecie.id_zajec === zajecieId) {
                            const existingObecnosc = zajecie.obecnosci?.find(o => o.id_ucznia === studentId);

                            if (value === null) {
                                const updatedObecnosci = zajecie.obecnosci?.filter(o => o.id_ucznia !== studentId) || [];
                                return {
                                    ...zajecie,
                                    obecnosci: updatedObecnosci
                                };
                            } else {
                                const newObecnosc = {
                                    id_obecnosci: existingObecnosc?.id_obecnosci || `temp-${Date.now()}`,
                                    id_ucznia: studentId,
                                    id_zajec: zajecieId,
                                    czyObecny: value ? 1 : 0
                                };

                                const updatedObecnosci = existingObecnosc
                                    ? zajecie.obecnosci?.map(o =>
                                    o.id_ucznia === studentId ? newObecnosc : o
                                ) || []
                                    : [...(zajecie.obecnosci || []), newObecnosc];

                                return {
                                    ...zajecie,
                                    obecnosci: updatedObecnosci
                                };
                            }
                        }
                        return zajecie;
                    })
                }))
            }))
        );
    };

    const choosePresence = async (value) => {
        if (updating) return;

        try {
            setUpdating(true);
            const { idObecnosci, idZajec, idStudenta } = presenceMenu;

            if (!idZajec || !idStudenta) {
                console.error("Brak wymaganych danych:", presenceMenu);
                return;
            }

            updatePresenceOptimistically(idZajec, idStudenta, value);

            setPresenceMenu({
                visible: false,
                x: 0,
                y: 0,
                idObecnosci: null,
                idZajec: null,
                idStudenta: null
            });

            let apiCall;
            if (!idObecnosci && value !== null) {
                apiCall = createPresence(idZajec, idStudenta, value);
            } else if (idObecnosci && value !== null) {
                apiCall = setPresence(idObecnosci, value);
            } else if (idObecnosci && value === null) {
                apiCall = deletePresence(idObecnosci);
            }

            if (apiCall) {
                apiCall
                    .then(result => {
                    })
                    .catch(error => {
                        loadCourses(selectedDay);
                    });
            }

        } catch (err) {
            console.error("Błąd przy zapisie obecności:", err);
            loadCourses(selectedDay);
        } finally {
            setUpdating(false);
        }
    };

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

                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Moje kursy i grupy</h1>
                    <p className="text-gray-600 mt-2">Przeglądaj swoje kursy, grupy i obecności</p>
                </header>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtruj po dniu tygodnia:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedDay("")}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                selectedDay === ""
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            }`}
                        >
                            Wszystkie dni
                        </button>

                        {dniTygodnia.map(dzien => (
                            <button
                                key={dzien}
                                onClick={() => setSelectedDay(dzien)}
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

                {updating && (
                    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                        Zapisuję zmiany...
                    </div>
                )}

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
                        {courses.map(course => (
                            <div key={course.id_kursu} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="bg-blue-50 px-6 py-4 border-b flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {course.nazwa_kursu}
                                        </h2>
                                        <p className="text-gray-600">
                                            {formatDate(course.data_rozpoczecia)} - {formatDate(course.data_zakonczenia)}
                                        </p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {course.grupy.length} {course.grupy.length === 1 ? 'grupa' : 'grup'}
                                    </span>
                                </div>

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
                                            openRemarkModal={openRemarkModal}
                                            openEquipmentRemarkModal={openEquipmentRemarkModal}
                                            getStudentFullName={getStudentFullName}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {presenceMenu.visible && (
                    <div
                        style={{
                            position: "fixed",
                            top: presenceMenu.y,
                            left: presenceMenu.x,
                            transform: "translate(-50%, 10px)"
                        }}
                        className="bg-white shadow-lg border border-gray-300 rounded-lg p-2 z-50 min-w-[140px]"
                    >
                        <button
                            onClick={() => choosePresence(true)}
                            className="block w-full px-3 py-2 hover:bg-green-50 text-green-700 rounded text-left transition-colors"
                        >
                            ✓ Obecny
                        </button>
                        <button
                            onClick={() => choosePresence(false)}
                            className="block w-full px-3 py-2 hover:bg-red-50 text-red-700 rounded text-left transition-colors"
                        >
                            ✗ Nieobecny
                        </button>
                        <button
                            onClick={() => choosePresence(null)}
                            className="block w-full px-3 py-2 hover:bg-gray-50 text-gray-700 rounded text-left transition-colors"
                        >
                            ? Nieustalone
                        </button>
                        <div className="border-t border-gray-200 mt-1 pt-1">
                            <button
                                onClick={() => setPresenceMenu(p => ({ ...p, visible: false }))}
                                className="block w-full px-3 py-2 text-gray-500 hover:bg-gray-100 rounded text-left transition-colors"
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                )}

                {remarkModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Dodaj uwagę
                                </h3>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Zajęcia: <strong>{getNazwaZajec(remarkModal.zajecie)}</strong><br />
                                        Data: <strong>{formatDate(remarkModal.zajecie?.data)}</strong>
                                    </p>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Wybierz ucznia (tylko obecni):
                                    </label>
                                    <select
                                        value={remarkModal.selectedStudent?.id_ucznia || ""}
                                        onChange={(e) => {
                                            const studentId = e.target.value;
                                            const grupa = courses
                                                .flatMap(c => c.grupy)
                                                .find(g => g.zajecia?.some(z => z.id_zajec === remarkModal.zajecie?.id_zajec));
                                            const student = grupa?.uczniowie?.find(u => u.id_ucznia == studentId);
                                            setRemarkModal(prev => ({ ...prev, selectedStudent: student || null }));
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Wybierz ucznia...</option>
                                        {(() => {
                                            const grupa = courses
                                                .flatMap(c => c.grupy)
                                                .find(g => g.zajecia?.some(z => z.id_zajec === remarkModal.zajecie?.id_zajec));

                                            // Filtruj tylko obecnych uczniów
                                            const obecniUczniowie = grupa?.uczniowie?.filter(student =>
                                                isStudentPresent(remarkModal.zajecie, student.id_ucznia)
                                            ) || [];

                                            return obecniUczniowie.map(student => (
                                                <option key={student.id_ucznia} value={student.id_ucznia}>
                                                    {getStudentFullName(student)}
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                    {(() => {
                                        const grupa = courses
                                            .flatMap(c => c.grupy)
                                            .find(g => g.zajecia?.some(z => z.id_zajec === remarkModal.zajecie?.id_zajec));
                                        const obecniUczniowie = grupa?.uczniowie?.filter(student =>
                                            isStudentPresent(remarkModal.zajecie, student.id_ucznia)
                                        ) || [];

                                        if (obecniUczniowie.length === 0) {
                                            return (
                                                <p className="text-sm text-red-600 mt-2">
                                                    Brak obecnych uczniów na tych zajęciach
                                                </p>
                                            );
                                        }
                                    })()}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Treść uwagi:
                                    </label>
                                    <textarea
                                        value={remarkModal.tresc}
                                        onChange={(e) => setRemarkModal(prev => ({ ...prev, tresc: e.target.value }))}
                                        placeholder="Wpisz treść uwagi..."
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={closeRemarkModal}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={handleRemarkSubmit}
                                        disabled={updating || !remarkModal.tresc.trim() || !remarkModal.selectedStudent}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {updating ? "Dodawanie..." : "Dodaj uwagę"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {equipmentRemarkModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Uwaga o sprzęcie
                                </h3>

                                <p className="text-sm text-gray-600 mb-2">
                                    Zajęcia: <strong>{getNazwaZajec(equipmentRemarkModal.zajecie)}</strong><br />
                                    Data: <strong>{formatDate(equipmentRemarkModal.zajecie?.data)}</strong>
                                </p>

                                <textarea
                                    value={equipmentRemarkModal.tresc}
                                    onChange={e => setEquipmentRemarkModal(prev => ({ ...prev, tresc: e.target.value }))}
                                    placeholder="Opisz problem ze sprzętem..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={closeEquipmentRemarkModal}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={handleEquipmentRemarkSubmit}
                                        disabled={updating || !equipmentRemarkModal.tresc.trim()}
                                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
                                    >
                                        {updating ? "Zapis..." : "Zapisz"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, color }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-100">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-600 text-sm mt-1">{title}</div>
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
                          openPresenceMenu,
                          openRemarkModal,
                          openEquipmentRemarkModal,
                          getStudentFullName
                      }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div
                className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center transition-colors"
                onClick={toggleGroup}
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-4 h-4 transition-transform text-gray-500 ${expanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
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
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {grupa.zajecia?.length || 0} {grupa.zajecia?.length === 1 ? 'zajęcie' : 'zajęć'}
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
                            openRemarkModal={openRemarkModal}
                            openEquipmentRemarkModal={openEquipmentRemarkModal}
                            getStudentFullName={getStudentFullName}
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
                              openPresenceMenu,
                              openRemarkModal,
                              openEquipmentRemarkModal,
                              getStudentFullName
                          }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                    <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 sticky left-0 bg-gray-50 border-r min-w-[200px] z-10">
                            Uczeń
                        </th>

                        {grupa.zajecia.map((zajecie, index) => (
                            <th key={zajecie.id_zajec} className="px-3 py-2 text-center border-b min-w-[120px]">
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold text-sm">{index + 1}.</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {formatDate(zajecie.data)}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1 truncate max-w-[100px]" title={getNazwaZajec(zajecie)}>
                                        {getNazwaZajec(zajecie)}
                                    </span>
                                    <button
                                        onClick={() => openRemarkModal(zajecie)}
                                        className="text-xs text-blue-500 hover:text-blue-700 mt-1 underline"
                                        title="Dodaj uwagę do tych zajęć"
                                    >
                                        Dodaj uwagę
                                    </button>
                                    <button
                                        onClick={() => openEquipmentRemarkModal(zajecie)}
                                        className="text-xs text-orange-500 hover:text-orange-700 mt-1 underline"
                                        title="Dodaj uwagę do sprzętu"
                                    >
                                        Sprzęt
                                    </button>
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {grupa.uczniowie.map((student, rowIndex) => {
                        return (
                            <tr key={student.id_ucznia} className={rowIndex % 2 ? "bg-gray-50" : "bg-white"}>
                                <td className="px-4 py-3 sticky left-0 bg-inherit border-r z-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 text-sm font-medium">
                                                {student.imie?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate text-gray-900">
                                                {getStudentFullName(student)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Punkty: {student.saldo_punktow}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {grupa.zajecia.map(zajecie => {
                                    const status = getStudentPresence(zajecie, student.id_ucznia);
                                    const obecnosc = zajecie.obecnosci?.find(o => o.id_ucznia === student.id_ucznia);

                                    return (
                                        <td key={`${student.id_ucznia}-${zajecie.id_zajec}`} className="px-2 py-2 text-center border-b">
                                            <div
                                                onClick={(e) => openPresenceMenu(e, obecnosc, zajecie.id_zajec, student.id_ucznia)}
                                                className={`w-8 h-8 rounded border-2 cursor-pointer flex items-center justify-center mx-auto transition-all hover:scale-110 ${getPresenceColor(status)}`}
                                                title={`Kliknij aby zmienić obecność dla ${getStudentFullName(student)}`}
                                            >
                                                <span className={`font-bold text-sm ${getPresenceTextColor(status)}`}>
                                                    {getPresenceText(status)}
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="p-3 bg-gray-50 border-t text-xs flex justify-center gap-4 flex-wrap">
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
                <span className="font-bold text-xs">{symbol}</span>
            </div>
            <span className="text-gray-600">{text}</span>
        </div>
    );
}