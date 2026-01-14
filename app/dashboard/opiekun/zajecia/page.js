'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { getLessonsForGroup } from '/lib/api/lesson.api';
import { getPresenceForStudent } from '/lib/api/presence.api';
import { getGroupById } from '/lib/api/group.api';
import { getUserIdFromToken } from '/lib/auth';

export default function GuardianLessons() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [pastLessons, setPastLessons] = useState([]);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [activeTab, setActiveTab] = useState('past');
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [allLessons, setAllLessons] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const opiekunId = getUserIdFromToken();
        if (opiekunId) {
            fetchStudents(opiekunId);
        }
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchLessonsForStudent(selectedStudent);
        }
    }, [selectedStudent]);

    const fetchStudents = async (opiekunId) => {
        try {
            setLoading(true);
            const studentsData = await getOpiekunStudents(opiekunId);
            
            const studentsWithGroups = await Promise.all(
                (studentsData || []).map(async (student) => {
                    if (student.id_grupa) {
                        try {
                            const groupData = await getGroupById(student.id_grupa);
                            return { ...student, grupa: groupData };
                        } catch (err) {
                            console.error(`Błąd pobierania grupy ${student.id_grupa}:`, err);
                            return student;
                        }
                    }
                    return student;
                })
            );
            
            setStudents(studentsWithGroups);
            
            if (studentsWithGroups && studentsWithGroups.length > 0) {
                setSelectedStudent(studentsWithGroups[0]);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Błąd podczas pobierania uczniów:', err);
            setError('Nie udało się pobrać listy uczniów');
            setLoading(false);
        }
    };

    const fetchLessonsForStudent = async (student) => {
        try {
            setLoading(true);
            setError(null);

            if (!student.id_grupa) {
                setError('Uczeń nie jest przypisany do żadnej grupy');
                setPastLessons([]);
                setUpcomingLessons([]);
                setAllLessons([]);
                setLoading(false);
                return;
            }

            const groupData = await getGroupById(student.id_grupa);
            const lessonsData = await getLessonsForGroup(student.id_grupa);
            const presenceData = await getPresenceForStudent(student.id_ucznia);

            const presenceMap = {};
            if (presenceData && Array.isArray(presenceData)) {
                presenceData.forEach(p => {
                    presenceMap[p.id_zajec] = p.czyObecny;
                });
            }

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const past = [];
            const upcoming = [];
            const all = [];

            if (lessonsData && Array.isArray(lessonsData)) {
                lessonsData.forEach(lesson => {
                    const lessonDate = new Date(lesson.data);
                    lessonDate.setHours(0, 0, 0, 0);
                    
                    const lessonWithPresence = {
                        ...lesson,
                        grupa: groupData,
                        presence: presenceMap[lesson.id_zajec] !== undefined 
                            ? presenceMap[lesson.id_zajec] 
                            : null
                    };

                    all.push(lessonWithPresence);

                    if (lessonDate < now) {
                        past.push(lessonWithPresence);
                    } else {
                        upcoming.push(lessonWithPresence);
                    }
                });

                past.sort((a, b) => new Date(b.data) - new Date(a.data));
                upcoming.sort((a, b) => new Date(a.data) - new Date(b.data));
                all.sort((a, b) => new Date(a.data) - new Date(b.data));
            }

            setPastLessons(past);
            setUpcomingLessons(upcoming);
            setAllLessons(all);
            setLoading(false);
        } catch (err) {
            console.error('Błąd podczas pobierania zajęć:', err);
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

    const formatTime = (timeString) => {
        if (!timeString) return '--:--';
        return timeString.substring(0, 5);
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
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        return { total, present, absent, percentage };
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        const days = [];
        for (let i = 0; i < adjustedStartingDay; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        const lessonsInMonth = allLessons.filter(lesson => {
            const lessonDate = new Date(lesson.data);
            return lessonDate.getMonth() === month && lessonDate.getFullYear() === year;
        });

        const lessonsByDay = {};
        lessonsInMonth.forEach(lesson => {
            const day = new Date(lesson.data).getDate();
            if (!lessonsByDay[day]) {
                lessonsByDay[day] = [];
            }
            lessonsByDay[day].push(lesson);
        });

        const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                           'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        ← Poprzedni
                    </button>
                    <h3 className="text-xl font-bold text-gray-800">
                        {monthNames[month]} {year}
                    </h3>
                    <button
                        onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Następny →
                    </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(dayName => (
                        <div key={dayName} className="text-center font-semibold text-gray-600 text-sm py-2">
                            {dayName}
                        </div>
                    ))}
                    
                    {days.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square"></div>;
                        }

                        const lessons = lessonsByDay[day] || [];
                        const today = new Date();
                        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                        return (
                            <div
                                key={day}
                                className={`min-h-[100px] border rounded-lg p-2 ${
                                    isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                } ${lessons.length > 0 ? 'bg-green-50 hover:bg-green-100' : ''}`}
                            >
                                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {day}
                                </div>
                                {lessons.length > 0 && (
                                    <div className="space-y-1">
                                        {lessons.slice(0, 2).map((lesson, i) => (
                                            <div key={i} className="text-xs bg-white rounded p-1 border border-green-200">
                                                <div className="font-semibold text-green-700">
                                                    🕐 {formatTime(lesson.grupa?.godzina)}
                                                </div>
                                                <div className="text-gray-600 truncate" title={lesson.tematZajec}>
                                                    {lesson.tematZajec || 'Brak tematu'}
                                                </div>
                                                {lesson.presence !== null && (
                                                    <div className="text-[10px] flex items-center gap-1">
                                                        <span className="text-gray-500">Obecność:</span>
                                                        {lesson.presence === 1 ? '✅' : '❌'}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {lessons.length > 2 && (
                                            <div className="text-xs text-green-700 font-bold text-center">+{lessons.length - 2}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const currentLessons = activeTab === 'past' 
        ? pastLessons.slice(0, itemsPerPage) 
        : upcomingLessons.slice(0, itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (students.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">📚 Zajęcia uczniów</h1>
                        <p className="text-gray-600 mt-2">Historia i plan zajęć Twoich podopiecznych</p>
                    </header>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Brak przypisanych uczniów
                        </h3>
                        <p className="text-gray-600">
                            Nie masz jeszcze przypisanych uczniów do opieki.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">📚 Zajęcia uczniów</h1>
                        <p className="text-gray-600 mt-2">Historia i plan zajęć Twoich podopiecznych</p>
                    </header>
                    <div className="bg-red-50 rounded-lg shadow-md p-8 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-semibold text-red-800 mb-2">Wystąpił błąd</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const stats = calculateAttendanceStats();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">📚 Zajęcia uczniów</h1>
                    <p className="text-gray-600 mt-2">Historia i plan zajęć Twoich podopiecznych</p>
                </header>

                {students.length > 1 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Wybierz ucznia:
                        </label>
                        <select
                            value={selectedStudent?.id_ucznia || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.id_ucznia === parseInt(e.target.value));
                                setSelectedStudent(student);
                                setCurrentPage(1);
                            }}
                            className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium"
                        >
                            {students.map((student) => (
                                <option key={student.id_ucznia} value={student.id_ucznia}>
                                    {student.user?.imie} {student.user?.nazwisko}
                                    {student.pseudonim && ` (${student.pseudonim})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedStudent && (
                    <>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 mb-6 text-white">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        {selectedStudent.user?.imie} {selectedStudent.user?.nazwisko}
                                    </h2>
                                    {selectedStudent.pseudonim && (
                                        <p className="text-blue-100">Pseudonim: {selectedStudent.pseudonim}</p>
                                    )}
                                    {selectedStudent.grupa?.nazwa_grupy && (
                                        <p className="text-blue-100 text-sm mt-1">
                                            Grupa: {selectedStudent.grupa.nazwa_grupy}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{stats.total}</div>
                                        <div className="text-sm text-blue-100">Wszystkie zajęcia</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{stats.percentage}%</div>
                                        <div className="text-sm text-blue-100">Frekwencja</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden min-[500px]:block">
                            {renderCalendar()}
                        </div>

                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="flex">
                                    <button
                                        onClick={() => {
                                            setActiveTab('past');
                                            setCurrentPage(1);
                                        }}
                                        className={`flex-1 px-6 py-4 font-medium transition-colors ${
                                            activeTab === 'past'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                    >
                                        📅 Odbyte zajęcia ({pastLessons.length})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('upcoming');
                                            setCurrentPage(1);
                                        }}
                                        className={`flex-1 px-6 py-4 font-medium transition-colors ${
                                            activeTab === 'upcoming'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                    >
                                        🔜 Nadchodzące zajęcia ({upcomingLessons.length})
                                    </button>
                                </nav>
                            </div>

                            <div className="p-6">
                                <div className="mb-4 flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">
                                        Pokaż:
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                            className="ml-2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={5}>5 zajęć</option>
                                            <option value={10}>10 zajęć</option>
                                            <option value={20}>20 zajęć</option>
                                            <option value={50}>50 zajęć</option>
                                        </select>
                                    </label>
                                </div>

                                {currentLessons.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <div className="text-6xl mb-4">📭</div>
                                        <p className="text-lg font-medium">
                                            {activeTab === 'past' 
                                                ? 'Brak odbytych zajęć' 
                                                : 'Brak zaplanowanych zajęć'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {currentLessons.map((lesson) => {
                                            const presenceStatus = getPresenceStatus(lesson.presence);
                                            
                                            return (
                                                <div
                                                    key={lesson.id_zajec}
                                                    className={`relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 ${
                                                        lesson.presence === 1 
                                                            ? 'bg-gradient-to-br from-green-50 to-white border-2 border-green-200' 
                                                            : lesson.presence === 0 
                                                            ? 'bg-gradient-to-br from-red-50 to-white border-2 border-red-200'
                                                            : 'bg-white border-2 border-gray-200'
                                                    }`}
                                                >
                                                   
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                                        lesson.presence === 1 
                                                            ? 'bg-gradient-to-b from-green-400 to-green-600' 
                                                            : lesson.presence === 0 
                                                            ? 'bg-gradient-to-b from-red-400 to-red-600'
                                                            : 'bg-gradient-to-b from-gray-400 to-gray-600'
                                                    }`}></div>

                                                    <div className="p-5 pl-6">
                                                      
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                                                                <div className="flex-shrink-0">
                                                                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                                                                        {formatTime(lesson.grupa?.godzina)}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {new Date(lesson.data).toLocaleDateString('pl-PL', { 
                                                                            day: '2-digit', 
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                <div className="hidden sm:block h-12 w-px bg-gray-300"></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-bold text-gray-800 break-words">
                                                                        {lesson.tematZajec || 'Brak tematu'}
                                                                    </div>
                                                                    {lesson.grupa?.nazwa_grupy && (
                                                                        <p className="text-xs text-gray-500 mt-1 break-words">
                                                                            {lesson.grupa.nazwa_grupy}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {activeTab === 'past' && lesson.presence !== null && (
                                                                <div className={`px-3 py-2 rounded-full font-semibold text-xs sm:text-sm flex-shrink-0 text-center ${
                                                                    lesson.presence === 1 
                                                                        ? 'bg-green-100 text-green-700 border border-green-300' 
                                                                        : 'bg-red-100 text-red-700 border border-red-300'
                                                                }`}>
                                                                    {presenceStatus.icon} {presenceStatus.text}
                                                                </div>
                                                            )}
                                                        </div>

                                                    
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {lesson.postepy && (
                                                                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="text-lg">📈</span>
                                                                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Postępy</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{lesson.postepy}</p>
                                                                </div>
                                                            )}

                                                            {lesson.uwagi_nauczyciela && (
                                                                <div className="p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="text-lg">💬</span>
                                                                        <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Uwagi</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{lesson.uwagi_nauczyciela}</p>
                                                                </div>
                                                            )}

                                                            {lesson.zadanie_domowe && (
                                                                <div className="p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="text-lg">📝</span>
                                                                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Zadanie domowe</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{lesson.zadanie_domowe}</p>
                                                                </div>
                                                            )}

                                                            {lesson.uwaga_do_sprzetu && (
                                                                <div className="p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="text-lg">🔧</span>
                                                                        <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Sprzęt</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{lesson.uwaga_do_sprzetu}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                       
                                                        {lesson.nauczyciel && (
                                                            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                                                                <span className="text-lg">👨‍🏫</span>
                                                                <span className="font-medium">{lesson.nauczyciel.user?.imie} {lesson.nauczyciel.user?.nazwisko}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
