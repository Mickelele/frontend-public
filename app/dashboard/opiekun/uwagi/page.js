'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { getStudentRemarks } from '/lib/api/course.api';
import { getGroupById } from '/lib/api/group.api';
import { getTeacherById } from '/lib/api/teacher.api';
import { getUserIdFromToken } from '/lib/auth';

export default function GuardianRemarks() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [remarks, setRemarks] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const opiekunId = getUserIdFromToken();
        if (opiekunId) {
            fetchStudents(opiekunId);
        }
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentRemarks(selectedStudent);
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

    const fetchStudentRemarks = async (student) => {
        try {
            setLoading(true);
            const remarksData = await getStudentRemarks(student.id_ucznia);
            
            // Fetch teacher details for each remark
            const remarksWithTeachers = await Promise.all(
                (remarksData || []).map(async (remark) => {
                    if (remark.id_nauczyciela) {
                        try {
                            const teacherData = await getTeacherById(remark.id_nauczyciela);
                            return { ...remark, nauczyciel: { ...remark.nauczyciel, user: teacherData.user } };
                        } catch (err) {
                            console.error(`Błąd pobierania nauczyciela ${remark.id_nauczyciela}:`, err);
                            return remark;
                        }
                    }
                    return remark;
                })
            );
            
            setRemarks(remarksWithTeachers);
            setLoading(false);
        } catch (err) {
            // If endpoint doesn't exist (404), show empty state without logging error
            if (err.status !== 404) {
                console.error('Błąd podczas pobierania uwag:', err);
            }
            setRemarks([]);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Ładowanie uwag...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">💬 Uwagi nauczycieli</h1>
                        <p className="text-gray-600 mt-2">Wszystkie uwagi dotyczące Twoich podopiecznych</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">💬 Uwagi nauczycieli</h1>
                        <p className="text-gray-600 mt-2">Wszystkie uwagi dotyczące Twoich podopiecznych</p>
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">💬 Uwagi nauczycieli</h1>
                    <p className="text-gray-600 mt-2">Wszystkie uwagi dotyczące Twoich podopiecznych</p>
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
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg shadow-md p-6 mb-6 text-white">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        {selectedStudent.user?.imie} {selectedStudent.user?.nazwisko}
                                    </h2>
                                    {selectedStudent.pseudonim && (
                                        <p className="text-yellow-100">Pseudonim: {selectedStudent.pseudonim}</p>
                                    )}
                                    {selectedStudent.grupa?.nazwa_grupy && (
                                        <p className="text-yellow-100 text-sm mt-1">
                                            Grupa: {selectedStudent.grupa.nazwa_grupy}
                                        </p>
                                    )}
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold">{remarks.length}</div>
                                    <div className="text-sm text-yellow-100">Uwagi ogółem</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            {remarks.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-lg font-medium">Brak uwag dla tego ucznia</p>
                                    <p className="text-sm mt-2">Nauczyciele nie dodali jeszcze żadnych uwag</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {remarks.map((remark) => (
                                        <div
                                            key={remark.id}
                                            className="border border-yellow-300 rounded-lg p-5 hover:shadow-lg transition-all bg-white"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    💬 Uwaga od nauczyciela
                                                </h3>
                                                {remark.data && (
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(remark.data)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-700 mb-4 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                                                {remark.tresc}
                                            </p>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                {remark.nauczyciel && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="font-semibold text-gray-800">👨‍🏫 Nauczyciel:</span>
                                                        <span>
                                                            {remark.nauczyciel.user?.imie && remark.nauczyciel.user?.nazwisko
                                                                ? `${remark.nauczyciel.user.imie} ${remark.nauczyciel.user.nazwisko}`
                                                                : `#${remark.nauczyciel.numer_nauczyciela}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {remark.zajecia && (
                                                    <>
                                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                                            <span className="font-semibold text-gray-800">📚 Temat zajęć:</span>
                                                            <span>{remark.zajecia.tematZajec || 'Brak'}</span>
                                                        </div>
                                                        {remark.zajecia.data && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                <span className="font-semibold text-gray-800">📅 Data zajęć:</span>
                                                                <span>{new Date(remark.zajecia.data).toLocaleDateString('pl-PL')}</span>
                                                            </div>
                                                        )}
                                                        {remark.zajecia.grupa?.godzina && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                <span className="font-semibold text-gray-800">🕐 Godzina:</span>
                                                                <span>{remark.zajecia.grupa.godzina.substring(0, 5)}</span>
                                                            </div>
                                                        )}
                                                        {remark.zajecia.grupa?.dzien_tygodnia && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                <span className="font-semibold text-gray-800">📆 Dzień:</span>
                                                                <span>{remark.zajecia.grupa.dzien_tygodnia}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
