'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseById, getCourseGroups } from '../../../lib/api/course.api';
import { getLessonsForGroup } from '../../../lib/api/lesson.api';
import { enrollStudentToGroupWithData } from '../../../lib/api/student.api';
import { useAuth } from '../../../context/AuthContext';

export default function CourseDetailsPage() {
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [groups, setGroups] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollModal, setEnrollModal] = useState({ visible: false, group: null });
    const [enrolling, setEnrolling] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const [enrollForm, setEnrollForm] = useState({
        imie: '',
        nazwisko: '',
        email: '',
        pseudonim: '',
        haslo: ''
    });
    const params = useParams();
    const router = useRouter();
    const courseId = params.id_kursu;



    const courseImages = {
        python: '/grafiki/python.png',
        roblox: '/grafiki/roblox.jpg',
        'strony internetowe': '/grafiki/strony.jpg',
        scratch: '/grafiki/scratch.jpg',
    };

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const courseData = await getCourseById(courseId);
                setCourse(courseData);
                
                const groupsData = await getCourseGroups(courseId);
                setGroups(groupsData);
                
                // Pobierz lekcje ze wszystkich grup kursu
                if (groupsData && groupsData.length > 0) {
                    const allLessons = [];
                    
                    for (const group of groupsData) {
                        // Sprawdź różne możliwe nazwy właściwości ID grupy
                        const groupId = group.id_grupy || group.id_grupa || group.id || group.groupId;
                        
                        if (!groupId) {
                            console.warn('Brak ID grupy:', group);
                            continue; // Pomiń tę grupę
                        }
                        
                        try {
                            const groupLessons = await getLessonsForGroup(groupId);
                            if (groupLessons && Array.isArray(groupLessons)) {
                                // Dodaj informacje o grupie do każdej lekcji
                                const lessonsWithGroup = groupLessons.map(lesson => ({
                                    ...lesson,
                                    grupa: group
                                }));
                                allLessons.push(...lessonsWithGroup);
                            }
                        } catch (groupErr) {
                            console.error(`Błąd pobierania lekcji dla grupy ${groupId}:`, groupErr);
                        }
                    }
                    
                    // Sortuj lekcje według daty
                    allLessons.sort((a, b) => new Date(a.data) - new Date(b.data));
                    setLessons(allLessons);
                } else {
                    setLessons([]);
                }
            } catch (err) {
                console.error('Błąd pobierania danych kursu:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        if (courseId) {
            fetchCourseData();
        }
    }, [courseId]);

    const handleEnrollClick = (group) => {
        if (!user) {
            // Przekieruj do logowania jeśli nie zalogowany
            router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }
        
        // Sprawdź czy użytkownik ma rolę opiekuna
        if (user.role !== 'opiekun') {
            alert('Tylko opiekunowie mogą zapisywać uczniów na grupy. Zaloguj się jako opiekun.');
            router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }
        
        // Otwórz modal zapisu ucznia na grupę
        setEnrollModal({ visible: true, group });
        setEnrollForm({
            imie: '',
            nazwisko: '',
            email: '',
            pseudonim: '',
            haslo: ''
        });
    };

    const handleShowGroups = () => {
        setShowGroups(true);
    };

    const handleEnrollSubmit = async (e) => {
        e.preventDefault();
        if (!enrollModal.group) return;
        
        const groupId = enrollModal.group.id_grupy || enrollModal.group.id_grupa || enrollModal.group.id || enrollModal.group.groupId;
        
        if (!groupId) {
            alert('Błąd: Brak ID grupy');
            return;
        }

        // Sprawdź czy wszystkie pola są wypełnione
        if (!enrollForm.imie || !enrollForm.nazwisko || !enrollForm.email || !enrollForm.pseudonim || !enrollForm.haslo) {
            alert('Proszę wypełnić wszystkie wymagane pola');
            return;
        }

        try {
            setEnrolling(true);
            // Zapisz nowego ucznia na grupę używając endpoint'u zapiszNaGrupe
            await enrollStudentToGroupWithData({ ...enrollForm, id_grupa: groupId });
            alert('Uczeń został utworzony i zapisany na grupę!');
            setEnrollModal({ visible: false, group: null });
        } catch (err) {
            console.error('Błąd zapisu ucznia na grupę:', err);
            alert('Błąd podczas zapisu ucznia: ' + (err.message || 'Nieznany błąd'));
        } finally {
            setEnrolling(false);
        }
    };

    const closeEnrollModal = () => {
        setEnrollModal({ visible: false, group: null });
    };

    const handleFormChange = (e) => {
        setEnrollForm({
            ...enrollForm,
            [e.target.name]: e.target.value
        });
    };

    const getImageSrc = () => {
        if (!course) return '/grafiki/python.png';
        const rawName = course.name || course.nazwa || course.nazwa_kursu || '';
        const name = rawName.toLowerCase();
        if (name.includes('pierwsze kroki')) return courseImages['scratch'];
        else if (name.includes('python')) return courseImages['python'];
        else if (name.includes('roblox')) return courseImages['roblox'];
        else if (name.includes('strony')) return courseImages['strony internetowe'];
        else if (name.includes('scratch')) return courseImages['scratch'];
        return courseImages['python'];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p className="text-gray-600">Ładowanie szczegółów kursu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 bg-red-50 p-6 rounded-lg">Błąd: {error}</p>
                    <button 
                        onClick={() => router.back()} 
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Wróć
                    </button>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Kurs nie został znaleziony</p>
                    <button 
                        onClick={() => router.back()} 
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Wróć
                    </button>
                </div>
            </div>
        );
    }

    const courseName = course.name || course.nazwa || course.nazwa_kursu || 'Brak nazwy';

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <button 
                    onClick={() => router.back()} 
                    className="mb-6 flex items-center text-orange-600 hover:text-orange-700 transition"
                >
                    ← Wróć do listy kursów
                </button>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/2">
                            <img
                                src={getImageSrc()}
                                alt={courseName}
                                className="w-full h-64 md:h-full object-cover"
                            />
                        </div>
                        <div className="md:w-1/2 p-8">
                            <h1 className="text-3xl font-bold text-orange-600 mb-4">
                                {courseName}
                            </h1>
                            <p className="text-gray-700 mb-6">
                                {course.description || 'Opis kursu niedostępny'}
                            </p>

                            <div className="bg-orange-50 p-6 rounded-xl mb-6">
                                <h3 className="font-bold text-orange-700 mb-4">Informacje o kursie</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="text-orange-600 mr-3">⏰</span>
                                        <span className="text-gray-700">Lekcje trwają 2x45 min</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-orange-600 mr-3">👥</span>
                                        <span className="text-gray-700">Średnio 6 osób w grupie</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-orange-600 mr-3">💰</span>
                                        <span className="text-gray-700 font-semibold">Cena: 0 zł</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-full font-semibold text-lg shadow-lg hover:scale-105 transition transform"
                                onClick={handleShowGroups}
                            >
                                🚀 Zapisz się na kurs
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dostępne grupy - widoczne po kliknięciu */}
                {showGroups && (
                    <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-orange-600 mb-6">
                            🎯 Dostępne grupy {groups.length > 0 && `(${groups.length} grup)`}
                        </h2>
                        {groups.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.map((group, index) => {
                                    const groupId = group.id_grupa;
                                    return (
                                        <div key={groupId || index} className="bg-gradient-to-br from-orange-50 to-purple-50 p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition duration-300">
                                            <div className="text-center mb-4">
                                                <div className="bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                                    <span className="text-xl font-bold">#{groupId}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800">Grupa #{groupId}</h3>
                                            </div>
                                            
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center justify-center bg-white rounded-lg p-3">
                                                    <span className="text-orange-600 mr-3 text-lg">📅</span>
                                                    <span className="font-semibold text-gray-700">{group.dzien_tygodnia || 'Brak danych'}</span>
                                                </div>
                                                <div className="flex items-center justify-center bg-white rounded-lg p-3">
                                                    <span className="text-orange-600 mr-3 text-lg">🕐</span>
                                                    <span className="font-semibold text-gray-700">{group.godzina?.substring(0, 5) || 'Brak danych'}</span>
                                                </div>
                                                <div className="flex items-center justify-center bg-white rounded-lg p-3">
                                                    <span className="text-orange-600 mr-3 text-lg">👥</span>
                                                    <span className="font-semibold text-gray-700">{group.liczba_uczniow ?? 0} uczniów</span>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleEnrollClick(group)}
                                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition duration-300 flex items-center justify-center gap-2"
                                            >
                                                <span>✏️</span>
                                                Zapisz ucznia
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">📚</div>
                                <p className="text-gray-500 text-lg">Brak dostępnych grup dla tego kursu</p>
                                <p className="text-gray-400 text-sm mt-2">Skontaktuj się z nami aby otrzymać informacje o nowych grupach</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Program kursu - zawsze widoczny */}
                <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-orange-600 mb-6">
                        Program kursu
                    </h2>
                    {lessons.length > 0 ? (
                        <div className="space-y-6">
                            {/* Lista lekcji */}
                            <div className="grid gap-4">
                                {lessons.map((lesson, index) => {
                                    return (
                                        <div key={lesson.id_zajec || index} className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition">
                                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-gray-800 font-medium">
                                                    {lesson.temat || lesson.tematZajec || lesson.nazwa || `Lekcja ${index + 1}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>Program kursu będzie dostępny wkrótce</p>
                            {groups.length > 0 && (
                                <p className="mt-2 text-sm">
                                    Kurs ma {groups.length} grup, ale nie ma jeszcze zaplanowanych lekcji.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal zapisu ucznia na grupę */}
                {enrollModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                📝 Zapisz ucznia na grupę
                            </h3>
                            
                            {enrollModal.group && (
                                <div className="bg-orange-50 p-4 rounded-lg mb-6">
                                    <p className="font-medium text-orange-800 mb-2">
                                        Grupa #{enrollModal.group.id_grupy || enrollModal.group.id_grupa || enrollModal.group.id || 'N/A'}
                                    </p>
                                    <div className="space-y-1 text-sm text-orange-700">
                                        <p>📆 {enrollModal.group.dzien_tygodnia || 'Brak danych'}</p>
                                        <p>🕐 {enrollModal.group.godzina?.substring(0, 5) || 'Brak danych'}</p>
                                        <p>👥 {enrollModal.group.liczba_uczniow ?? 0} uczniów</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleEnrollSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imię <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="imie"
                                        value={enrollForm.imie}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Podaj imię ucznia"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nazwisko <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nazwisko"
                                        value={enrollForm.nazwisko}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Podaj nazwisko ucznia"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={enrollForm.email}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pseudonim <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pseudonim"
                                        value={enrollForm.pseudonim}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Unikalny pseudonim"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hasło <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="haslo"
                                        value={enrollForm.haslo}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Hasło dla ucznia"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeEnrollModal}
                                        disabled={enrolling}
                                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={enrolling}
                                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {enrolling ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Zapisywanie...
                                            </>
                                        ) : (
                                            <>
                                                ✅ Zapisz ucznia
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}