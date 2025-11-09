'use client';
import { useEffect, useState } from 'react';
import { getCourses } from '../lib/api/course.api';
import { parseISO, differenceInDays, format } from 'date-fns';

export default function CourseTimeline() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <p className="text-center mt-10 text-gray-500">Ładowanie kursów...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">Błąd: {error}</p>;

    const minDate = courses.length
        ? courses.reduce((min, c) => (parseISO(c.data_rozpoczecia) < min ? parseISO(c.data_rozpoczecia) : min), parseISO(courses[0].data_rozpoczecia))
        : new Date();

    const maxDate = courses.length
        ? courses.reduce((max, c) => (parseISO(c.data_zakonczenia) > max ? parseISO(c.data_zakonczenia) : max), parseISO(courses[0].data_zakonczenia))
        : new Date();

    const totalDays = differenceInDays(maxDate, minDate) + 1;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Oś czasu kursów</h2>
            <div className="space-y-4">
                {courses.map((kurs) => {
                    const startOffset = differenceInDays(parseISO(kurs.data_rozpoczecia), minDate);
                    const duration = differenceInDays(parseISO(kurs.data_zakonczenia), parseISO(kurs.data_rozpoczecia)) + 1;
                    const widthPercent = (duration / totalDays) * 100;
                    const marginLeftPercent = (startOffset / totalDays) * 100;

                    return (
                        <div key={kurs.id_kursu}>
                            <p className="font-medium">{kurs.nazwa_kursu}</p>
                            <div className="relative h-6 bg-gray-100 rounded">
                                <div
                                    className="absolute h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center"
                                    style={{
                                        width: `${widthPercent}%`,
                                        marginLeft: `${marginLeftPercent}%`,
                                    }}
                                >
                                    {format(parseISO(kurs.data_rozpoczecia), 'dd/MM')} - {format(parseISO(kurs.data_zakonczenia), 'dd/MM')}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
