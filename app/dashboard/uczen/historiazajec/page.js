'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getStudentById } from '/lib/api/student.api';
import { getLessonsForGroup } from '/lib/api/lesson.api';
import { getPresenceForStudent } from '/lib/api/presence.api';
import { getGroupById } from '/lib/api/group.api';

export default function HistoriaZajec() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [pastLessons, setPastLessons] = useState([]);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [activeTab, setActiveTab] = useState('past');
    const [error, setError] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (user?.id) {
            fetchLessonsData();
        }
    }, [user]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, itemsPerPage]);

    const fetchLessonsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const studentData = await getStudentById(user.id);
            
            if (!studentData?.id_grupa) {
                setError('Nie jesteś przypisany do żadnej grupy');
                setLoading(false);
                return;
            }

            const groupData = await getGroupById(studentData.id_grupa);

            const lessonsData = await getLessonsForGroup(studentData.id_grupa);
            
            const presenceData = await getPresenceForStudent(user.id);
            
            const presenceMap = {};
            if (presenceData && Array.isArray(presenceData)) {
                presenceData.forEach(p => {
                    presenceMap[p.id_zajec] = p.czyObecny;
                });
            }

            const now = new Date();
            const past = [];
            const upcoming = [];

            if (lessonsData && Array.isArray(lessonsData)) {
                lessonsData.forEach(lesson => {
                    const lessonDate = new Date(lesson.data);
                    
                    const lessonWithPresence = {
                        ...lesson,
                        grupa: groupData,
                        presence: presenceMap[lesson.id_zajec] !== undefined 
                            ? presenceMap[lesson.id_zajec] 
                            : null
                    };

                    if (lessonDate < now) {
                        past.push(lessonWithPresence);
                    } else {
                        upcoming.push(lessonWithPresence);
                    }
                });

                past.sort((a, b) => new Date(b.data) - new Date(a.data));
                upcoming.sort((a, b) => new Date(a.data) - new Date(b.data));
            }

            setPastLessons(past);
            setUpcomingLessons(upcoming);
            setLoading(false);
        } catch (err) {
            console.error('Błąd podczas pobierania danych:', err);
            setError('Nie udało się pobrać danych o zajęciach');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPresenceStatus = (presence) => {
        if (presence === null) {
            return {
                text: 'Brak danych',
                color: 'bg-gray-100 text-gray-700',
                icon: '❓'
            };
        }
        if (presence === 1) {
            return {
                text: 'Obecny',
                color: 'bg-green-100 text-green-700',
                icon: '✅'
            };
        }
        return {
            text: 'Nieobecny',
            color: 'bg-red-100 text-red-700',
            icon: '❌'
        };
    };

    const calculateAttendanceStats = () => {
        const total = pastLessons.length;
        const present = pastLessons.filter(l => l.presence === 1).length;
        const absent = pastLessons.filter(l => l.presence === 0).length;
        const noData = pastLessons.filter(l => l.presence === null).length;
        
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        return { total, present, absent, noData, percentage };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Ładowanie danych o zajęciach...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-700 font-medium">❌ {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const stats = calculateAttendanceStats();
    const displayLessons = activeTab === 'past' ? pastLessons : upcomingLessons;

    const totalPages = Math.ceil(displayLessons.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLessons = displayLessons.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 Historia Zajęć</h1>
                    <p className="text-gray-600">Przegląd Twoich zajęć i frekwencji</p>
                </div>

                {pastLessons.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="text-sm text-gray-600 mb-1">Wszystkie zajęcia</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="text-sm text-gray-600 mb-1">Obecności</div>
                            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="text-sm text-gray-600 mb-1">Nieobecności</div>
                            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="text-sm text-gray-600 mb-1">Frekwencja</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.percentage}%</div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`flex-1 px-6 py-4 font-medium transition ${
                                activeTab === 'past'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            📝 Odbyte zajęcia ({pastLessons.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`flex-1 px-6 py-4 font-medium transition ${
                                activeTab === 'upcoming'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            🗓️ Nadchodzące zajęcia ({upcomingLessons.length})
                        </button>
                    </div>
                </div>

                {displayLessons.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Pokaż po:
                                </label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value={5}>5 zajęć</option>
                                    <option value={10}>10 zajęć</option>
                                    <option value={20}>20 zajęć</option>
                                    <option value={50}>50 zajęć</option>
                                    <option value={displayLessons.length}>Wszystkie ({displayLessons.length})</option>
                                </select>
                            </div>
                            <div className="text-sm text-gray-600">
                                Wyświetlane {startIndex + 1}-{Math.min(endIndex, displayLessons.length)} z {displayLessons.length}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {displayLessons.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <p className="text-gray-500 text-lg">
                                {activeTab === 'past' 
                                    ? '📭 Brak odbyłych zajęć'
                                    : '📭 Brak zaplanowanych zajęć'}
                            </p>
                        </div>
                    ) : (
                        paginatedLessons.map((lesson) => {
                            const presenceStatus = getPresenceStatus(lesson.presence);
                            
                            return (
                                <div
                                    key={lesson.id_zajec}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <span className="text-3xl">📅</span>
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                            {formatDate(lesson.data)}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                            {lesson.grupa?.godzina && (
                                                                <span className="flex items-center gap-1">
                                                                    🕐 {lesson.grupa.godzina.substring(0, 5)}
                                                                </span>
                                                            )}
                                                            {lesson.grupa?.dzien_tygodnia && (
                                                                <span className="flex items-center gap-1">
                                                                    📆 {lesson.grupa.dzien_tygodnia}
                                                                </span>
                                                            )}
                                                            {lesson.Sala_id_sali && (
                                                                <span className="flex items-center gap-1">
                                                                    🚪 Sala {lesson.Sala_id_sali}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {(lesson.temat || lesson.tematZajec) && (
                                                    <div className="mb-3 pl-11">
                                                        <p className="text-sm font-medium text-gray-500 mb-1">📝 Temat zajęć:</p>
                                                        <p className="text-gray-800 font-medium">
                                                            {lesson.temat || lesson.tematZajec}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {lesson.grupa && (
                                                    <div className="mb-3 pl-11">
                                                        <p className="text-sm text-gray-600">
                                                            👥 {lesson.grupa.nazwa_grupy || (lesson.grupa.numer_grupy ? `Grupa #${lesson.grupa.numer_grupy}` : `Grupa #${lesson.grupa.id_grupa}`)}
                                                            {lesson.grupa.liczba_uczniow && ` • ${lesson.grupa.liczba_uczniow} uczniów`}
                                                        </p>
                                                    </div>
                                                )}

                                                {lesson.uwaga_do_sprzetu && (
                                                    <div className="mt-4 pl-11">
                                                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                            ⚠️ Uwagi do sprzętu:
                                                        </p>
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                            <p className="text-gray-700">{lesson.uwaga_do_sprzetu}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {lesson.notatki_od_nauczyciela && (
                                                    <div className="mt-4 pl-11">
                                                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                            📋 Notatki od nauczyciela:
                                                        </p>
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <p className="text-gray-700">{lesson.notatki_od_nauczyciela}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {activeTab === 'past' && (
                                                <div className="lg:ml-6">
                                                    <div className={`
                                                        px-6 py-4 rounded-lg font-medium text-center min-w-[140px]
                                                        ${presenceStatus.color}
                                                    `}>
                                                        <div className="text-3xl mb-2">{presenceStatus.icon}</div>
                                                        <div className="text-sm font-bold">{presenceStatus.text}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'upcoming' && (
                                                <div className="lg:ml-6">
                                                    <div className="px-6 py-4 rounded-lg font-medium text-center bg-blue-100 text-blue-700 min-w-[140px]">
                                                        <div className="text-3xl mb-2">⏰</div>
                                                        <div className="text-sm font-bold">Zaplanowane</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
                            }`}
                        >
                            ← Poprzednia
                        </button>

                        <div className="flex gap-2">
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNum = index + 1;
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (
                                    pageNum === currentPage - 2 ||
                                    pageNum === currentPage + 2
                                ) {
                                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
                            }`}
                        >
                            Następna →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
