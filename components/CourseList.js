'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourses, getCourseGroups } from '../lib/api/course.api';

export default function CourseList() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    
    const courseImages = {
        python: '/grafiki/python.png',
        roblox: '/grafiki/roblox.jpg',
        'strony internetowe': '/grafiki/strony.jpg',
        scratch: '/grafiki/scratch.jpg',
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const kursy = await getCourses();
                const kursyZGrupami = await Promise.all(
                    kursy.map(async (kurs) => {
                        const grupy = await getCourseGroups(kurs.id_kursu);
                        return { ...kurs, grupy };
                    })
                );
                setCourses(kursyZGrupami);
            } catch (err) {
                console.error(err);
                setError('Nie udało się pobrać kursów');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCourseClick = (id) => {
        router.push(`/courses/${id}`);
    };

    if (loading) return <p className="text-white text-center mt-10">Ładowanie kursów...</p>;
    if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {courses.slice(0, 4).map((course) => {
                const rawName = course.name || course.nazwa || course.nazwa_kursu || '';
                const name = rawName.toLowerCase();
                let imageSrc = '/grafiki/python.png';
                if (name.includes('pierwsze kroki')) imageSrc = courseImages['scratch'];
                else if (name.includes('python')) imageSrc = courseImages['python'];
                else if (name.includes('roblox')) imageSrc = courseImages['roblox'];
                else if (name.includes('strony')) imageSrc = courseImages['strony internetowe'];
                else if (name.includes('scratch')) imageSrc = courseImages['scratch'];

                return (
                    <div
                        key={course.id_kursu}
                        className="bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center transition hover:scale-105 hover:shadow-orange-400/30 border-2 border-neutral-800 w-full max-w-[420px] min-w-[280px] mx-auto"
                    >
                        <img
                            src={imageSrc}
                            alt={rawName}
                            className="w-full h-56 object-cover"
                        />
                        <div className="flex flex-col flex-grow p-7 w-full">
                            <h3 className="text-2xl font-bold text-orange-400 mb-4 text-center">
                                {rawName || 'Brak nazwy'}
                            </h3>
                            <p className="text-white text-base mb-7 text-center flex-grow">
                                {course.description}
                            </p>
                            <button
                                className="w-full px-7 py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:scale-105 transition"
                                onClick={() => handleCourseClick(course.id_kursu)}
                            >
                                Zapisz się na kurs
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
