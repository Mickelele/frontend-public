'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourses, getCourseGroups } from '../lib/api/course.api';
import { getToken } from '../lib/auth';

export default function CourseListPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleGroups, setVisibleGroups] = useState({});
    const router = useRouter();

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

    const goToGroupPage = (courseId, groupId) => {
        const token = getToken();

        if (!token) {
            alert('Zaloguj się lub utwórz konto, aby zapisać ucznia na kurs!');
            router.push('/auth/login');
            return;
        }

        router.push(`/courses/${courseId}/groups/${groupId}`);
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
                    <div
                        onClick={() => toggleGroups(kurs.id_kursu)}
                        className="cursor-pointer"
                    >
                        <h2 className="text-xl font-semibold mb-2">{kurs.nazwa_kursu}</h2>
                        <p className="text-gray-600 mb-2">
                            <span className="font-medium">Data rozpoczęcia:</span> {kurs.data_rozpoczecia} |{' '}
                            <span className="font-medium">Data zakończenia:</span> {kurs.data_zakonczenia}
                        </p>
                        <p className="text-sm text-blue-600 hover:underline">
                            {visibleGroups[kurs.id_kursu] ? 'Ukryj grupy' : 'Pokaż grupy'}
                        </p>
                    </div>

                    {visibleGroups[kurs.id_kursu] && (
                        <div className="mt-3 space-y-3">
                            {kurs.grupy && kurs.grupy.length > 0 ? (
                                kurs.grupy.map((grupa) => (
                                    <div
                                        key={grupa.id_grupa}
                                        onClick={() => goToGroupPage(kurs.id_kursu, grupa.id_grupa)}
                                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                                    >
                                        <p className="font-semibold">Grupa {grupa.id_grupa}</p>
                                        <p className="text-sm text-gray-600">
                                            Nauczyciel: {grupa.nauczyciel.uzytkownik.imie}{' '}
                                            {grupa.nauczyciel.uzytkownik.nazwisko}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Liczba uczniów: {grupa.liczba_uczniow}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Brak grup dla tego kursu</p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
