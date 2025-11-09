'use client';
import { useEffect, useState } from 'react';
import { getCourses, getCourseGroups } from '../lib/api/course.api';

export default function CourseList() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleGroups, setVisibleGroups] = useState({});

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
                console.error('Błąd pobierania kursów:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleGroups = (kursId) => {
        setVisibleGroups((prev) => ({
            ...prev,
            [kursId]: !prev[kursId],
        }));
    };

    const handleEnroll = (kursId) => {
        // TODO: zamień na prawdziwe wywołanie API
        alert(`Zapisano na kurs o ID ${kursId}`);
    };

    if (loading) return <p className="text-center mt-10 text-gray-500">Ładowanie kursów...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">Błąd: {error}</p>;

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {courses.length === 0 && <p className="text-center text-gray-500">Brak kursów do wyświetlenia</p>}
            {courses.map((kurs) => (
                <div
                    key={kurs.id_kursu}
                    className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2">{kurs.nazwa_kursu}</h2>
                    <p className="text-gray-600 mb-4">
                        <span className="font-medium">Data rozpoczęcia:</span> {kurs.data_rozpoczecia} |{' '}
                        <span className="font-medium">Data zakończenia:</span> {kurs.data_zakonczenia}
                    </p>

                    <button
                        onClick={() => toggleGroups(kurs.id_kursu)}
                        className="mb-3 text-sm text-blue-600 hover:underline"
                    >
                        {visibleGroups[kurs.id_kursu] ? 'Ukryj grupy' : 'Pokaż grupy'}
                    </button>

                    {visibleGroups[kurs.id_kursu] && (
                        <>
                            {kurs.grupy && kurs.grupy.length > 0 ? (
                                <ul className="space-y-2 mb-3">
                                    {kurs.grupy.map((grupa) => (
                                        <li
                                            key={grupa.id_grupa}
                                            className="bg-gray-50 p-3 rounded border border-gray-200"
                                        >
                                            <p>
                                                <span className="font-semibold">Grupa {grupa.id_grupa}</span> - Nauczyciel:{' '}
                                                {grupa.nauczyciel.uzytkownik.imie}{' '}
                                                {grupa.nauczyciel.uzytkownik.nazwisko} - Liczba uczniów:{' '}
                                                {grupa.liczba_uczniow}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 mb-3">Brak grup dla tego kursu</p>
                            )}
                        </>
                    )}

                    <button
                        onClick={() => handleEnroll(kurs.id_kursu)}
                        className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
                    >
                        Zapisz na kurs
                    </button>
                </div>
            ))}
        </div>
    );
}
