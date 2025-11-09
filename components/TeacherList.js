'use client';
import { useEffect, useState } from 'react';
import { getTeachers } from '../lib/api/teacher.api';

export default function TeacherList() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await getTeachers();
                setTeachers(data);
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

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {teachers.length === 0 && <p className="text-center text-gray-500">Brak nauczycieli do wyświetlenia</p>}
            {teachers.map((teacher) => (
                <div
                    key={teacher.id_nauczyciela}
                    className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center border border-gray-200"
                >
                    {teacher.user?.zdjecie && (
                        <img
                            src={`data:image/png;base64,${teacher.user.zdjecie.dane}`}
                            alt={`${teacher.user.imie} ${teacher.user.nazwisko}`}
                            className="w-24 h-24 rounded-full object-cover mb-3"
                        />
                    )}
                    <p className="text-lg font-semibold text-center">
                        {teacher.user?.imie} {teacher.user?.nazwisko}
                    </p>
                    <p className="text-sm text-gray-500 text-center">{teacher.user?.email}</p>
                </div>
            ))}
        </div>
    );
}
