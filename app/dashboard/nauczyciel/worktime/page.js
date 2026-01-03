'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '/context/AuthContext';
import { getTeacherLessonsForMonth } from '/lib/api/lesson.api';
import { getSubstitutesByTeacherReporting, getSubstitutesByTeacherSubstituting } from '/lib/api/substitute.api';
import { getGroupById } from '/lib/api/group.api';

export default function TeacherLessonsPage() {
    const { user } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hoveredLesson, setHoveredLesson] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [mySubstitutesReporting, setMySubstitutesReporting] = useState([]);
    const [mySubstitutesTaken, setMySubstitutesTaken] = useState([]);

    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth() + 1;

    useEffect(() => {
        if (user && user.id) {
            fetchSubstitutes();
        }
    }, [user]);

    useEffect(() => {
        if (user && user.id) {
            fetchLessons();
        }
    }, [selectedDate, user, mySubstitutesTaken]);

    const fetchSubstitutes = async () => {
        if (!user || !user.id) return;
        
        try {
            const [reporting, taken] = await Promise.all([
                getSubstitutesByTeacherReporting(user.id),
                getSubstitutesByTeacherSubstituting(user.id)
            ]);
            setMySubstitutesReporting(reporting || []);
            setMySubstitutesTaken(taken || []);
        } catch (error) {
            console.error('Błąd pobierania zastępstw:', error);
        }
    };

    const fetchLessons = async () => {
        if (!user || !user.id) {
            setError('Użytkownik nie jest zalogowany');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await getTeacherLessonsForMonth(user.id, currentYear, currentMonth);
            
            const substituteLessonsRaw = mySubstitutesTaken
                .filter(sub => sub.zajecia)
                .map(sub => ({
                    ...sub.zajecia,
                    isSubstituteLesson: true,
                    id_zastepstwa: sub.id_zastepstwa
                }))
                .filter(lesson => {
                    const lessonDate = new Date(lesson.data);
                    return lessonDate.getFullYear() === currentYear && 
                           lessonDate.getMonth() + 1 === currentMonth;
                });
            
            const substituteLessons = await Promise.all(
                substituteLessonsRaw.map(async (lesson) => {
                    if (!lesson.grupa && lesson.id_grupy) {
                        try {
                            const grupa = await getGroupById(lesson.id_grupy);
                            return { ...lesson, grupa };
                        } catch (err) {
                            console.error(`Błąd pobierania grupy ${lesson.id_grupy}:`, err);
                            return lesson;
                        }
                    }
                    return lesson;
                })
            );
            
            const allLessons = [...data, ...substituteLessons];
            setLessons(allLessons);
        } catch (error) {
            console.error('Błąd pobierania lekcji:', error);
            setError('Nie udało się pobrać lekcji: ' + (error.message || 'Sprawdź połączenie z serwerem'));

            if (error.message?.includes('Failed to fetch') || error.message?.includes('CONNECTION_REFUSED')) {
                setLessons(getDemoLessons());
                setError('Backend niedostępny - wyświetlam dane demo');
            }
        } finally {
            setLoading(false);
        }
    };

    const getDemoLessons = () => {
        const baseDate = new Date();
        const demoLessons = [
            {
                id_zajec: 1,
                id_grupy: 1,
                Sala_id_sali: 1,
                tematZajec: "Programowanie w Pythonie",
                data: new Date(currentYear, currentMonth - 1, 5).toISOString().split('T')[0],
                notatki_od_nauczyciela: "Pierwsze zajęcia z podstaw Pythona",
                grupa: {
                    id_grupa: 1,
                    id_nauczyciela: user?.id || 13,
                    Kurs_id_kursu: 4,
                    liczba_uczniow: 12,
                    dzien_tygodnia: "Poniedziałek",
                    godzina: "16:45:00"
                },
                godzina: "16:45:00"
            },
            {
                id_zajec: 2,
                id_grupy: 2,
                Sala_id_sali: 2,
                tematZajec: "Zaawansowane algorytmy",
                data: new Date(currentYear, currentMonth - 1, 12).toISOString().split('T')[0],
                notatki_od_nauczyciela: "Analiza złożoności obliczeniowej",
                grupa: {
                    id_grupa: 2,
                    id_nauczyciela: user?.id || 13,
                    Kurs_id_kursu: 4,
                    liczba_uczniow: 8,
                    dzien_tygodnia: "Środa",
                    godzina: "14:30:00"
                },
                godzina: "14:30:00"
            },
            {
                id_zajec: 3,
                id_grupy: 1,
                Sala_id_sali: 1,
                tematZajec: "Struktury danych",
                data: new Date(currentYear, currentMonth - 1, 19).toISOString().split('T')[0],
                notatki_od_nauczyciela: "Listy, krotki, słowniki",
                grupa: {
                    id_grupa: 1,
                    id_nauczyciela: user?.id || 13,
                    Kurs_id_kursu: 4,
                    liczba_uczniow: 12,
                    dzien_tygodnia: "Poniedziałek",
                    godzina: "16:45:00"
                },
                godzina: "16:45:00"
            }
        ];

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        demoLessons.push({
            id_zajec: 4,
            id_grupy: 3,
            Sala_id_sali: 3,
            tematZajec: "Baza danych SQL",
            data: pastDate.toISOString().split('T')[0],
            notatki_od_nauczyciela: "Podstawy zapytań SQL",
            grupa: {
                id_grupa: 3,
                id_nauczyciela: user?.id || 13,
                Kurs_id_kursu: 4,
                liczba_uczniow: 10,
                dzien_tygodnia: "Piątek",
                godzina: "10:00:00"
            },
            godzina: "10:00:00"
        });

        demoLessons.push({
            id_zajec: 5,
            id_grupy: 2,
            Sala_id_sali: 2,
            tematZajec: "Projekt końcowy",
            data: futureDate.toISOString().split('T')[0],
            notatki_od_nauczyciela: "Omówienie wymagań projektu",
            grupa: {
                id_grupa: 2,
                id_nauczyciela: user?.id || 13,
                Kurs_id_kursu: 4,
                liczba_uczniow: 8,
                dzien_tygodnia: "Środa",
                godzina: "14:30:00"
            },
            godzina: "14:30:00"
        });

        return demoLessons;
    };

    const handleMouseEnter = (lesson, event) => {
        setHoveredLesson(lesson.id_zajec);

        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX
        });
    };

    const changeMonth = (increment) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setSelectedDate(newDate);
    };

    const isLessonPast = (lessonDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lesson = new Date(lessonDate);
        return lesson < today;
    };

    const isLessonToday = (lessonDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lesson = new Date(lessonDate);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return lesson >= today && lesson < tomorrow;
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

    const getMonthName = (date) => {
        return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    };

    const groupedLessons = lessons.reduce((acc, lesson) => {
        const date = lesson.data;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(lesson);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedLessons).sort();

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-800">Moje lekcje</h1>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm transition"
                            >
                                ←
                            </button>

                            <span className="text-lg font-semibold text-gray-700 min-w-[180px] text-center">
                                {getMonthName(selectedDate)}
                            </span>

                            <button
                                onClick={() => changeMonth(1)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm transition"
                            >
                                →
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                            <div className="text-blue-600 text-xs font-medium">Wszystkie</div>
                            <div className="text-lg font-bold text-blue-700">
                                {lessons.filter(lesson => {
                                    if (lesson.isSubstituteLesson) return true;
                                    
                                    const substituteAssigned = mySubstitutesReporting.find(sub => 
                                        (sub.zajecia_id_zajec === lesson.id_zajec || sub.zajecia?.id_zajec === lesson.id_zajec) && 
                                        sub.id_nauczyciel_zastepujacy
                                    );
                                    return !substituteAssigned;
                                }).length}
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                            <div className="text-green-600 text-xs font-medium">Odbyte</div>
                            <div className="text-lg font-bold text-green-700">
                                {lessons.filter(lesson => {
                                    if (!isLessonPast(lesson.data)) return false;
                                    
                                    if (lesson.isSubstituteLesson) return true;
                                    
                                    const substituteAssigned = mySubstitutesReporting.find(sub => 
                                        (sub.zajecia_id_zajec === lesson.id_zajec || sub.zajecia?.id_zajec === lesson.id_zajec) && 
                                        sub.id_nauczyciel_zastepujacy
                                    );
                                    return !substituteAssigned;
                                }).length}
                            </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                            <div className="text-gray-600 text-xs font-medium">Nadchodzące</div>
                            <div className="text-lg font-bold text-gray-700">
                                {lessons.filter(lesson => {
                                    if (isLessonPast(lesson.data)) return false;
                                    
                                    if (lesson.isSubstituteLesson) return true;
                                    
                                    const substituteAssigned = mySubstitutesReporting.find(sub => 
                                        (sub.zajecia_id_zajec === lesson.id_zajec || sub.zajecia?.id_zajec === lesson.id_zajec) && 
                                        sub.id_nauczyciel_zastepujacy
                                    );
                                    return !substituteAssigned;
                                }).length}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className={`border px-3 py-2 rounded mb-4 text-sm ${
                        error.includes('demo')
                            ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                            : 'bg-red-100 border-red-400 text-red-700'
                    }`}>
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-500 text-sm">Ładowanie lekcji...</p>
                    </div>
                )}

                {!loading && sortedDates.length === 0 && !error && (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-gray-500">Brak lekcji w wybranym miesiącu</p>
                    </div>
                )}

                {!loading && sortedDates.length > 0 && (
                    <div className="space-y-4 relative">
                        {hoveredLesson && (
                            <div
                                className="fixed bg-white border border-gray-300 rounded shadow-lg p-3 z-50 min-w-[200px] pointer-events-none"
                                style={{
                                    top: `${tooltipPosition.top}px`,
                                    left: `${tooltipPosition.left}px`
                                }}
                            >
                                <div className="space-y-1">
                                    {(() => {
                                        const lesson = lessons.find(l => l.id_zajec === hoveredLesson);
                                        if (!lesson) return null;
                                        const isPast = isLessonPast(lesson.data);

                                        return (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-medium text-gray-500">Godzina:</span>
                                                    <span className="text-sm font-bold text-gray-700">{formatTime(lesson.godzina)}</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-xs font-medium text-gray-500">Grupa:</span>
                                                    <span className="text-sm text-gray-700">#{lesson.grupa?.id_grupa || lesson.id_grupy || '?'}</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-xs font-medium text-gray-500">Sala:</span>
                                                    <span className="text-sm text-gray-700">{lesson.Sala_id_sali || '-'}</span>
                                                </div>

                                                <div className="border-t pt-1 mt-1">
                                                    <span className="text-xs font-medium text-gray-500">Temat:</span>
                                                    <p className={`text-xs mt-1 ${
                                                        lesson.tematZajec === 'Brak'
                                                            ? 'text-gray-400 italic'
                                                            : 'text-gray-700'
                                                    }`}>
                                                        {lesson.tematZajec || 'Brak'}
                                                    </p>
                                                </div>

                                                {lesson.grupa?.dzien_tygodnia && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-500">Dzień:</span>
                                                        <span className="text-gray-700">{lesson.grupa.dzien_tygodnia}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Uczniów:</span>
                                                    <span className="text-gray-700">{lesson.grupa.liczba_uczniow}</span>
                                                </div>

                                                {lesson.notatki_od_nauczyciela !== 'Brak' && (
                                                    <div className="border-t pt-1 mt-1">
                                                        <span className="text-xs font-medium text-gray-500">Notatki:</span>
                                                        <p className="text-xs text-gray-600 mt-1">{lesson.notatki_od_nauczyciela}</p>
                                                    </div>
                                                )}

                                                <div className={`text-xs px-2 py-1 rounded-full text-center mt-2 ${
                                                    isPast
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {isPast ? '✓ Odbyta' : '○ Zaplanowana'}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}


                        {sortedDates.map(date => (
                            <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className={`px-4 py-3 ${
                                    isLessonToday(date)
                                        ? 'bg-blue-500 text-white'
                                        : isLessonPast(date)
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                }`}>
                                    <h3 className="text-md font-semibold">
                                        {formatDate(date)}
                                        {isLessonToday(date) && (
                                            <span className="ml-2 text-xs bg-white text-blue-500 px-2 py-1 rounded-full">
                                                DZISIAJ
                                            </span>
                                        )}
                                    </h3>
                                </div>

                                <div className="p-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                        {groupedLessons[date].map(lesson => {
                                            const isPast = isLessonPast(date);
                                            const isHovered = hoveredLesson === lesson.id_zajec;
                                            
                                            const substitute = mySubstitutesReporting.find(sub => 
                                                sub.zajecia_id_zajec === lesson.id_zajec || sub.zajecia?.id_zajec === lesson.id_zajec
                                            );
                                            const hasSubstitute = substitute && substitute.id_nauczyciel_zastepujacy;
                                            
                                            const isSubstituteLesson = lesson.isSubstituteLesson;

                                            return (
                                                <div
                                                    key={lesson.id_zajec}
                                                    className={`relative border rounded p-2 transition-all duration-200 cursor-pointer ${
                                                        isSubstituteLesson
                                                            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                                                            : hasSubstitute
                                                            ? 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                                                            : isPast
                                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                    } ${isHovered ? 'ring-1 ring-blue-400 shadow-md' : ''}`}
                                                    onMouseEnter={(e) => handleMouseEnter(lesson, e)}
                                                    onMouseLeave={() => setHoveredLesson(null)}
                                                >
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-gray-800 mb-1">
                                                            Grupa #{lesson.grupa?.id_grupa || lesson.id_grupy || '?'}
                                                        </div>
                                                        {isSubstituteLesson && (
                                                            <div className="text-xs font-bold text-blue-600 mb-1">
                                                                ✅ TWOJE ZASTĘPSTWO
                                                            </div>
                                                        )}
                                                        {hasSubstitute && !isSubstituteLesson && (
                                                            <div className="text-xs font-bold text-orange-600 mb-1">
                                                                ZASTĘPSTWO
                                                            </div>
                                                        )}
                                                        {!isSubstituteLesson && (
                                                            <div className={`text-sm font-bold ${
                                                                hasSubstitute 
                                                                    ? 'text-orange-700' 
                                                                    : isPast 
                                                                    ? 'text-green-700' 
                                                                    : 'text-gray-700'
                                                            }`}>
                                                                {formatTime(lesson.godzina)}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            S{lesson.Sala_id_sali}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}