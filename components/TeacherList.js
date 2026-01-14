'use client';
import { useEffect, useState } from 'react';
import { getTeachers } from '../lib/api/teacher.api';
import { getUserById } from '../lib/api/users.api';
import TeacherCarousel from './TeacherCarousel';

export default function TeacherList({ renderCarousel = false }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await getTeachers();
                console.log('Fetched teachers:', data);

                
                const enriched = await Promise.all(
                    (data || []).map(async (t) => {
                        try {
                            const userId = t.user?.id_uzytkownika || t.user?.id_uzytkownika;
                            if (!userId) return t;
                            const fullUser = await getUserById(userId);
                            return { ...t, user: { ...t.user, ...fullUser } };
                        } catch (err) {
                            console.error('Błąd pobierania pełnego profilu użytkownika:', err);
                            return t;
                        }
                    })
                );

                enriched.forEach(t => console.log('teacher.zdjecie after enrich:', t.user?.zdjecie));
                setTeachers(enriched);
            } catch (err) {
                console.error('Błąd pobierania nauczycieli:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    if (loading) return <p className="text-center mt-10 text-gray-500">Ładowanie nauczycieli...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">Błąd: {error}</p>;

    if (renderCarousel) {
        if (teachers.length === 0) {
            return <p className="text-center text-gray-500">Brak nauczycieli do wyświetlenia</p>;
        }
        return <TeacherCarousel teachers={teachers} />;
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center justify-center mx-auto">
            {teachers.length === 0 && <p className="text-center text-gray-500">Brak nauczycieli do wyświetlenia</p>}
            {teachers.map((teacher) => (
                <div
                    key={teacher.id_nauczyciela}
                    className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 w-60"
                >
                    <div className="w-full bg-gray-100 relative" style={{ paddingTop: '100%' }}>
                        {teacher.user?.zdjecie && teacher.user.zdjecie.dane ? (
                            <img
                                src={`data:image/png;base64,${teacher.user.zdjecie.dane}`}
                                alt={`${teacher.user.imie} ${teacher.user.nazwisko}`}
                                className="absolute top-0 left-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.61 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="p-4 text-center">
                        <h4 className="text-lg font-semibold truncate">{teacher.user?.imie} {teacher.user?.nazwisko}</h4>
                    </div>
                </div>
            ))}
        </div>
    );
}
