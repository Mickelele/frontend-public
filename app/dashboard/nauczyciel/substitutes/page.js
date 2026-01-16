'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { 
    getAvailableSubstitutes, 
    getSubstitutesByTeacherReporting,
    getSubstitutesByTeacherSubstituting,
    createSubstitute,
    deleteSubstitute,
    assignTeacherToSubstitute,
    unassignTeacherFromSubstitute
} from '../../../../lib/api/substitute.api';
import { getTeacherLessonsForMonth } from '../../../../lib/api/lesson.api';
import { getUserById } from '../../../../lib/api/users.api';

export default function SubstitutesPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('my-lessons');
    const [loading, setLoading] = useState(true);
    
    const [myLessons, setMyLessons] = useState([]);
    const [mySubstitutes, setMySubstitutes] = useState([]);
    const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
    const [takenSubstitutes, setTakenSubstitutes] = useState([]);
    
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    
    const [filterGroup, setFilterGroup] = useState('');
    const [filterTopic, setFilterTopic] = useState('');

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            if (user?.id && isMounted) {
                await loadData();
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [user?.id, currentMonth, currentYear]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadMyLessons(),
                loadMySubstitutes(),
                loadAvailableSubstitutes(),
                loadTakenSubstitutes()
            ]);
        } catch (err) {
            console.error('Błąd ładowania danych:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMyLessons = async () => {
        try {
            const lessons = await getTeacherLessonsForMonth(user.id, currentYear, currentMonth);
            const uniqueLessons = Array.from(
                new Map((lessons || []).map(lesson => [lesson.id_zajec, lesson])).values()
            ).sort((a, b) => new Date(a.data) - new Date(b.data));
            setMyLessons(uniqueLessons);
        } catch (err) {
            console.error('Błąd ładowania zajęć:', err);
            setMyLessons([]);
        }
    };

    const loadMySubstitutes = async () => {
        try {
            const substitutes = await getSubstitutesByTeacherReporting(user.id);
            
            const substitutesWithUsers = await Promise.all(
                (substitutes || []).map(async (sub) => {
                    if (sub.id_nauczyciel_zastepujacy) {
                        try {
                            const substituteTeacher = await getUserById(sub.id_nauczyciel_zastepujacy);
                            return {
                                ...sub,
                                nauczyciel_zastepujacy: substituteTeacher
                            };
                        } catch (err) {
                            console.error('Błąd pobierania nauczyciela:', err);
                            return sub;
                        }
                    }
                    return sub;
                })
            );
            
            setMySubstitutes(substitutesWithUsers);
        } catch (err) {
            console.error('Błąd ładowania moich zastępstw:', err);
            setMySubstitutes([]);
        }
    };

    const loadAvailableSubstitutes = async () => {
        try {
            const substitutes = await getAvailableSubstitutes();
            
            const substitutesWithUsers = await Promise.all(
                (substitutes || []).map(async (sub) => {
                    try {
                        const reportingTeacher = await getUserById(sub.id_nauczyciela_zglaszajacego);
                        return {
                            ...sub,
                            nauczyciel_zglaszajacy: reportingTeacher
                        };
                    } catch (err) {
                        console.error('Błąd pobierania nauczyciela:', err);
                        return sub;
                    }
                })
            );
            
            setAvailableSubstitutes(substitutesWithUsers.filter(s => s.id_nauczyciela_zglaszajacego !== user.id));
        } catch (err) {
            console.error('Błąd ładowania dostępnych zastępstw:', err);
            setAvailableSubstitutes([]);
        }
    };

    const loadTakenSubstitutes = async () => {
        try {
            const substitutes = await getSubstitutesByTeacherSubstituting(user.id);
            
            const substitutesWithUsers = await Promise.all(
                (substitutes || []).map(async (sub) => {
                    try {
                        const reportingTeacher = await getUserById(sub.id_nauczyciela_zglaszajacego);
                        return {
                            ...sub,
                            nauczyciel_zglaszajacy: reportingTeacher
                        };
                    } catch (err) {
                        console.error('Błąd pobierania nauczyciela:', err);
                        return sub;
                    }
                })
            );
            
            setTakenSubstitutes(substitutesWithUsers);
        } catch (err) {
            console.error('Błąd ładowania wziętych zastępstw:', err);
            setTakenSubstitutes([]);
        }
    };

    const handleCreateSubstitute = async () => {
        if (!selectedLesson) return;
        
        try {
            await createSubstitute({
                zajecia_id_zajec: selectedLesson.id_zajec,
                id_nauczyciela_zglaszajacego: user.id
            });
            
            alert('Prośba o zastępstwo została zgłoszona! 🔄');
            setShowCreateModal(false);
            setSelectedLesson(null);
            await loadData();
        } catch (err) {
            console.error('Błąd tworzenia zastępstwa:', err);
            alert('Nie udało się zgłosić zastępstwa');
        }
    };

    const handleDeleteSubstitute = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć to zastępstwo?')) return;
        
        try {
            await deleteSubstitute(id);
            await loadData();
        } catch (err) {
            console.error('Błąd usuwania zastępstwa:', err);
            alert('Nie udało się usunąć zastępstwa');
        }
    };

    const handleTakeSubstitute = async (substituteId) => {
        if (!confirm('Czy na pewno chcesz wziąć to zastępstwo?')) return;
        
        try {
            await assignTeacherToSubstitute(substituteId, user.id);
            alert('Zastępstwo zostało przypisane! 👍');
            await loadData();
        } catch (err) {
            console.error('Błąd przypisywania zastępstwa:', err);
            alert('Nie udało się przypisać zastępstwa');
        }
    };

    const handleCancelTaken = async (substituteId) => {
        if (!confirm('Czy na pewno chcesz zrezygnować z tego zastępstwa?')) return;
        
        try {
            await unassignTeacherFromSubstitute(substituteId);
            alert('Zrezygnowano z zastępstwa');
            await loadData();
        } catch (err) {
            console.error('Błąd rezygnacji z zastępstwa:', err);
            alert('Nie udało się zrezygnować z zastępstwa');
        }
    };

    const changeMonth = (delta) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;
        
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

    const filteredLessons = myLessons.filter(lesson => {
        const groupMatch = !filterGroup || lesson.grupa?.id_grupa?.toString().includes(filterGroup);
        const topicMatch = !filterTopic || lesson.tematZajec?.toLowerCase().includes(filterTopic.toLowerCase());
        const notAlreadyRequested = !mySubstitutes.some(sub => sub.zajecia?.id_zajec === lesson.id_zajec);
        const isFutureLesson = lesson.data && new Date(lesson.data) >= new Date(new Date().setHours(0, 0, 0, 0));
        return groupMatch && topicMatch && notAlreadyRequested && isFutureLesson;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie zastępstw...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">🔄 Zastępstwa</h1>
                    <p className="text-gray-600 mt-1">Zarządzaj zastępstwami i przeglądaj dostępne zastępstwa</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('my-lessons')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                            activeTab === 'my-lessons'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        📅 Moje zajęcia ({filteredLessons.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('my-substitutes')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                            activeTab === 'my-substitutes'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        📝 Moje zgłoszenia ({mySubstitutes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                            activeTab === 'available'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🔍 Dostępne ({availableSubstitutes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('taken')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                            activeTab === 'taken'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        ✅ Moje zastępstwa ({takenSubstitutes.length})
                    </button>
                </div>

                {activeTab === 'my-lessons' && (
                    <div>
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => changeMonth(-1)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    ← Poprzedni
                                </button>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {monthNames[currentMonth - 1]} {currentYear}
                                </h2>
                                <button
                                    onClick={() => changeMonth(1)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Następny →
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🔍 Filtruj po numerze grupy
                                    </label>
                                    <input
                                        type="text"
                                        value={filterGroup}
                                        onChange={(e) => setFilterGroup(e.target.value)}
                                        placeholder="Wpisz numer grupy..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        📝 Filtruj po temacie
                                    </label>
                                    <input
                                        type="text"
                                        value={filterTopic}
                                        onChange={(e) => setFilterTopic(e.target.value)}
                                        placeholder="Wpisz temat zajęć..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {(filterGroup || filterTopic) && (
                                    <button
                                        onClick={() => {
                                            setFilterGroup('');
                                            setFilterTopic('');
                                        }}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition w-full sm:w-auto"
                                    >
                                        🗑️ Wyczyść
                                    </button>
                                )}
                            </div>
                            {(filterGroup || filterTopic) && (
                                <p className="text-sm text-gray-600 mt-3">
                                    Znaleziono: <span className="font-bold">{filteredLessons.length}</span> z {myLessons.length} zajęć
                                </p>
                            )}
                        </div>

                        {myLessons.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">📅</div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Brak zajęć</h2>
                                <p className="text-gray-600">Nie masz zaplanowanych zajęć w tym miesiącu</p>
                            </div>
                        ) : filteredLessons.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Brak zajęć spełniających kryteria</h2>
                                <p className="text-gray-600">Spróbuj zmienić filtry wyszukiwania</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredLessons.map((lesson) => (
                                    <div key={lesson.id_zajec} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
                                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">📚</span>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {lesson.tematZajec || 'Zajęcia'}
                                                        </h3>
                                                    </div>
                                                    {lesson.grupa && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded w-fit">
                                                            Grupa {lesson.grupa.id_grupa}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ml-0 sm:ml-8 space-y-1 text-sm">
                                                    <p className="text-gray-600">
                                                        📅 {new Date(lesson.data).toLocaleDateString('pl-PL', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    {(lesson.godzina || lesson.godzina_rozpoczecia) && (
                                                        <p className="text-gray-600">
                                                            ⏰ {lesson.godzina || lesson.godzina_rozpoczecia}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedLesson(lesson);
                                                    setShowCreateModal(true);
                                                }}
                                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition w-full lg:w-auto lg:self-start"
                                            >
                                                🔄 Poproś o zastępstwo
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'my-substitutes' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Moje zgłoszone zastępstwa</h2>
                        
                        {mySubstitutes.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">📝</div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Brak zgłoszonych zastępstw</h2>
                                <p className="text-gray-600">Nie zgłosiłeś jeszcze żadnych zastępstw</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {mySubstitutes.map((sub) => (
                                    <div key={sub.id_zastepstwa} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-orange-500">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                                    {sub.zajecia?.tematZajec || 'Zajęcia'}
                                                </h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="text-gray-600">
                                                        📅 {sub.zajecia?.data ? new Date(sub.zajecia.data).toLocaleDateString('pl-PL') : 'Brak daty'}
                                                    </p>
                                                    {sub.id_nauczyciel_zastepujacy ? (
                                                        <p className="text-green-600 font-medium">
                                                            ✅ Zastępca: {sub.nauczyciel_zastepujacy?.imie} {sub.nauczyciel_zastepujacy?.nazwisko}
                                                        </p>
                                                    ) : (
                                                        <p className="text-orange-600 font-medium">
                                                            ⏳ Oczekuje na zastępcę
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!sub.id_nauczyciel_zastepujacy && (
                                                <button
                                                    onClick={() => handleDeleteSubstitute(sub.id_zastepstwa)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                                >
                                                    🗑️ Usuń
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'available' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Dostępne zastępstwa</h2>
                        
                        {availableSubstitutes.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Brak dostępnych zastępstw</h2>
                                <p className="text-gray-600">W tej chwili nie ma żadnych zastępstw do wzięcia</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availableSubstitutes.map((sub) => (
                                    <div key={sub.id_zastepstwa} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                                    {sub.zajecia?.tematZajec || 'Zajęcia'}
                                                </h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="text-gray-600">
                                                        📅 {sub.zajecia?.data ? new Date(sub.zajecia.data).toLocaleDateString('pl-PL', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        }) : 'Brak daty'}
                                                    </p>
                                                    {sub.zajecia?.godzina_rozpoczecia && (
                                                        <p className="text-gray-600">
                                                            ⏰ {sub.zajecia.godzina_rozpoczecia}
                                                        </p>
                                                    )}
                                                    <p className="text-gray-600">
                                                        👤 Zgłaszający: {sub.nauczyciel_zglaszajacy?.imie} {sub.nauczyciel_zglaszajacy?.nazwisko}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleTakeSubstitute(sub.id_zastepstwa)}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                            >
                                                ✅ Weź zastępstwo
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'taken' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Moje zastępstwa</h2>
                        
                        {takenSubstitutes.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">✅</div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Nie wzięto żadnych zastępstw</h2>
                                <p className="text-gray-600">Nie masz jeszcze żadnych zastępstw, które wziąłeś</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {takenSubstitutes.map((sub) => (
                                    <div key={sub.id_zastepstwa} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                                    {sub.zajecia?.tematZajec || 'Zajęcia'}
                                                </h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="text-gray-600">
                                                        📅 {sub.zajecia?.data ? new Date(sub.zajecia.data).toLocaleDateString('pl-PL', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        }) : 'Brak daty'}
                                                    </p>
                                                    {sub.zajecia?.godzina && (
                                                        <p className="text-gray-600">
                                                            ⏰ {sub.zajecia.godzina}
                                                        </p>
                                                    )}
                                                    <p className="text-gray-600">
                                                        👤 Proszący: {sub.nauczyciel_zglaszajacy?.imie} {sub.nauczyciel_zglaszajacy?.nazwisko}
                                                    </p>
                                                    {sub.zajecia?.grupa && (
                                                        <p className="text-gray-600">
                                                            👥 Grupa {sub.zajecia.grupa.id_grupa}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {(() => {
                                                const lessonDate = new Date(sub.zajecia?.data);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                lessonDate.setHours(0, 0, 0, 0);
                                                
                                                return lessonDate > today && (
                                                    <button
                                                        onClick={() => handleCancelTaken(sub.id_zastepstwa)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                                    >
                                                        ❌ Zrezygnuj
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showCreateModal && selectedLesson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">🔄 Poproś o zastępstwo</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setSelectedLesson(null);
                                }}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Szczegóły zajęć:</h3>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <p className="text-gray-700">
                                        <span className="font-semibold">Temat:</span> {selectedLesson.temat || 'Brak tematu'}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-semibold">Data:</span> {new Date(selectedLesson.data).toLocaleDateString('pl-PL', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    {selectedLesson.godzina_rozpoczecia && (
                                        <p className="text-gray-700">
                                            <span className="font-semibold">Godzina:</span> {selectedLesson.godzina_rozpoczecia}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedLesson(null);
                                    }}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleCreateSubstitute}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Poproś
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
