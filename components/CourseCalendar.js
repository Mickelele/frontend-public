'use client';
import { useEffect, useState } from 'react';
import { getCourses } from '../lib/api/course.api';
import { parseISO, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function CourseCalendar() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const kursy = await getCourses();
                setCourses(kursy);
            } catch (err) {
                console.error('Błąd pobierania kursów:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center mt-10"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div><p className="mt-2 text-gray-600">Ładowanie kursów...</p></div>;
    if (error) return <p className="text-center mt-10 text-red-500 bg-red-50 p-4 rounded-lg">Błąd: {error}</p>;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getCourseForDay = (day) => {
        return courses.filter(course => {
            const startDate = parseISO(course.data_rozpoczecia);
            return isSameDay(day, startDate);
        });
    };

    const nextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const prevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

    for (let i = 0; i < days.length; i += 7) {
        rows.push(days.slice(i, i + 7));
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                    ←
                </button>
                <h2 className="text-2xl font-bold text-orange-600">
                    {format(currentDate, 'MMMM yyyy', { locale: pl })}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                    →
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="p-2 text-center font-semibold text-orange-600 bg-orange-50 rounded">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {rows.map((row, i) => (
                    row.map((day, idx) => {
                        const dayKey = `${i}-${idx}`;
                        const dayNumber = format(day, dateFormat);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        const coursesForDay = getCourseForDay(day);

                        return (
                            <div
                                key={dayKey}
                                className={`
                                    min-h-[100px] p-2 border border-orange-100 rounded-lg
                                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                                    ${isToday ? 'bg-orange-100 border-orange-300' : ''}
                                    hover:bg-orange-50 transition-colors
                                `}
                            >
                                <div className={`
                                    text-sm font-semibold mb-1
                                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                                    ${isToday ? 'text-orange-600' : ''}
                                `}>
                                    {dayNumber}
                                </div>
                                <div className="space-y-1">
                                    {coursesForDay.map((course, index) => (
                                        <div
                                            key={`${course.id_kursu}-${index}`}
                                            className="text-xs bg-gradient-to-r from-orange-400 to-orange-600 text-white px-2 py-1 rounded-full truncate font-medium"
                                            title={course.nazwa_kursu}
                                        >
                                            {course.nazwa_kursu}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>

            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-700 mb-2">Legenda:</h4>
                <div className="text-sm text-gray-600">
                    Kursy wyświetlane są w dniach rozpoczęcia. Najedź na kurs aby zobaczyć pełną nazwę.
                </div>
            </div>
        </div>
    );
}
