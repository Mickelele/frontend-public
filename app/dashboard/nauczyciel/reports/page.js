'use client';

import { useState, useEffect } from 'react';
import { getMyCourses } from '../../../../lib/api/course.api';
import { getGroupById } from '../../../../lib/api/group.api';
import { getStudentsByGroup } from '../../../../lib/api/student.api';
import { getDetailedReport } from '../../../../lib/api/reports.api';
import { getCourseById } from '../../../../lib/api/course.api';
import { getUserIdFromToken } from '../../../../lib/auth';

export default function SemesterReportsPage() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupDetails, setGroupDetails] = useState(null);
    const [students, setStudents] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [reportType, setReportType] = useState('students');
    const [groupReport, setGroupReport] = useState(null);
    const [selectedStudentReport, setSelectedStudentReport] = useState(null);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const teacherCourses = await getMyCourses();
            const allGroups = [];
            
            (teacherCourses || []).forEach(course => {
                if (course.grupy && Array.isArray(course.grupy)) {
                    course.grupy.forEach(grupa => {
                        allGroups.push({
                            ...grupa,
                            kurs_nazwa: course.nazwa || 'Nieznany kurs'
                        });
                    });
                }
            });
            
            setGroups(allGroups);
        } catch (err) {
            console.error('Błąd pobierania grup nauczyciela:', err);
        }
    };

    const handleGroupChange = async (groupId) => {
        setSelectedGroup(groupId);
        setReportData([]);
        setGroupReport(null);
        setSelectedStudentReport(null);
        
        if (!groupId) {
            setGroupDetails(null);
            setStudents([]);
            return;
        }

        setLoading(true);
        try {
            const details = await getGroupById(groupId);
            
           
            if (details.Kurs_id_kursu) {
                try {
                    const course = await getCourseById(details.Kurs_id_kursu);
                    details.nazwa_kursu = course?.nazwa_kursu || 'Brak danych';
                } catch (err) {
                    console.error('Błąd pobierania kursu:', err);
                    details.nazwa_kursu = 'Brak danych';
                }
            } else {
                details.nazwa_kursu = 'Brak danych';
            }
            
            setGroupDetails(details);

            const groupStudents = await getStudentsByGroup(groupId);
            setStudents(groupStudents || []);
        } catch (err) {
            console.error('Błąd pobierania danych grupy:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateGroupReport = async () => {
        if (!selectedGroup) return;

        setGenerating(true);
        try {
            const report = await getDetailedReport({ groupId: selectedGroup });
            setGroupReport(report);
        } catch (err) {
            console.error('Błąd generowania raportu grupy:', err);
            alert('Wystąpił błąd podczas generowania raportu grupy');
        } finally {
            setGenerating(false);
        }
    };

    const generateStudentReport = async (studentId) => {
        setGenerating(true);
        try {
            const report = await getDetailedReport({ studentId });
            setSelectedStudentReport({ studentId, report });
        } catch (err) {
            console.error('Błąd generowania raportu ucznia:', err);
            alert('Wystąpił błąd podczas generowania raportu ucznia');
        } finally {
            setGenerating(false);
        }
    };

    const exportGroupToPDF = () => {
        window.print();
    };

    const exportStudentToPDF = () => {
        window.print();
    };

    const exportGroupToCSV = () => {
        if (!groupReport) return;

        const headers = ['Kategoria', 'Wartość'];
        const rows = [
            ['Zajęcia ogółem', groupReport.summary.totalLessons],
            ['Zadań domowych', groupReport.summary.totalHomeworks],
            ['Quizów', groupReport.summary.totalQuizzes],
            ['Średnia obecność', `${groupReport.summary.averageAttendance}%`],
            ['Średnia ocen z zadań', groupReport.summary.averageHomeworkGrade],
            ['Średnia wyników quizów', groupReport.summary.averageQuizScore],
            [''],
            ['OBECNOŚCI'],
            ['Obecny', groupReport.attendance.present],
            ['Nieobecny', groupReport.attendance.absent],
            ['Procent obecności', `${groupReport.attendance.attendancePercentage}%`],
            [''],
            ['ZADANIA DOMOWE'],
            ['Wszystkie zadania', groupReport.homework.totalHomeworks],
            ['Ocenione', groupReport.homework.graded],
            ['Nieocenione', groupReport.homework.ungraded],
            ['Średnia ocena', groupReport.homework.averageGrade],
            [''],
            ['QUIZY'],
            ['Wszystkie quizy', groupReport.quiz.totalQuizzes],
            ['Średni wynik', `${groupReport.quiz.averageScore.toFixed(2)}%`]
        ];

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `raport_grupy_${selectedGroup}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportStudentToCSV = () => {
        if (!selectedStudentReport) return;

        const report = selectedStudentReport.report;
        const student = students.find(s => s.id_ucznia === selectedStudentReport.studentId);

        const headers = ['Kategoria', 'Wartość'];
        const rows = [
            ['Uczeń', `${student?.imie} ${student?.nazwisko}`],
            ['Pseudonim', student?.pseudonim || '-'],
            [''],
            ['PODSUMOWANIE'],
            ['Zajęcia ogółem', report.summary.totalLessons],
            ['Zadań domowych', report.summary.totalHomeworks],
            ['Quizów', report.summary.totalQuizzes],
            ['Średnia obecność', `${report.summary.averageAttendance}%`],
            ['Średnia ocen z zadań', report.summary.averageHomeworkGrade],
            ['Średnia wyników quizów', report.summary.averageQuizScore],
            [''],
            ['OBECNOŚCI'],
            ['Obecny', report.attendance.present],
            ['Nieobecny', report.attendance.absent],
            ['Procent obecności', `${report.attendance.attendancePercentage}%`],
            [''],
            ['ZADANIA DOMOWE'],
            ['Wszystkie zadania', report.homework.totalHomeworks],
            ['Ocenione', report.homework.graded],
            ['Nieocenione', report.homework.ungraded],
            ['Średnia ocena', report.homework.averageGrade],
            [''],
            ['QUIZY'],
            ['Wszystkie quizy', report.quiz.totalQuizzes],
            ['Średni wynik', `${report.quiz.averageScore.toFixed(2)}%`]
        ];

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `raport_ucznia_${student?.nazwisko}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const generateReport = async () => {
        if (!selectedGroup || students.length === 0) return;

        setGenerating(true);
        try {
           
            const groupReport = await getDetailedReport({ groupId: selectedGroup });

            const reportsPromises = students.map(async (student) => {
                try {
                    const studentReport = await getDetailedReport({ studentId: student.id_ucznia });

                    
                    const presenceData = {
                        total: studentReport.attendance?.totalLessons || 0,
                        present: studentReport.attendance?.present || 0,
                        rate: Math.round(parseFloat(studentReport.attendance?.attendancePercentage || 0))
                    };

                    const gradesData = {
                        total: studentReport.homework?.totalHomeworks || 0,
                        graded: studentReport.homework?.graded || 0,
                        average: Math.round(studentReport.homework?.averageGrade || 0)
                    };

                    
                    const engagement = presenceData.total > 0 || gradesData.total > 0
                        ? Math.round((presenceData.rate * 0.6 + (gradesData.total > 0 ? (gradesData.graded / gradesData.total * 100) : 0) * 0.4))
                        : 0;

                    return {
                        student,
                        presence: presenceData,
                        grades: gradesData,
                        engagement,
                        quizAverage: Math.round(studentReport.quiz?.averageScore || 0),
                        prizesCount: 0
                    };
                } catch (err) {
                    console.error(`Błąd pobierania raportu dla ucznia ${student.id_ucznia}:`, err);
                    
                    return {
                        student,
                        presence: { total: 0, present: 0, rate: 0 },
                        grades: { total: 0, graded: 0, average: 0 },
                        engagement: 0,
                        quizAverage: 0,
                        prizesCount: 0
                    };
                }
            });

            const reports = await Promise.all(reportsPromises);
            setReportData(reports);
        } catch (err) {
            console.error('Błąd generowania raportu:', err);
            alert('Wystąpił błąd podczas generowania raportu');
        } finally {
            setGenerating(false);
        }
    };

    const getEngagementLabel = (engagement) => {
        if (engagement >= 80) return { label: 'Wysoki', color: 'text-green-600' };
        if (engagement >= 50) return { label: 'Średni', color: 'text-yellow-600' };
        return { label: 'Niski', color: 'text-red-600' };
    };

    const exportToCSV = () => {
        if (reportData.length === 0) return;

        const headers = ['Imię', 'Nazwisko', 'Obecności (%)', 'Obecności (ilość)', 'Średnia ocen', 'Oddane prace', 'Średnia quiz', 'Nagrody', 'Zaangażowanie (%)'];
        const rows = reportData.map(r => [
            r.student.imie,
            r.student.nazwisko,
            r.presence.rate,
            `${r.presence.present}/${r.presence.total}`,
            r.grades.average || '-',
            `${r.grades.graded}/${r.grades.total}`,
            r.quizAverage || '-',
            r.prizesCount || 0,
            r.engagement
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `raport_semestralny_grupa_${selectedGroup}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <>
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .min-h-screen {
                        min-height: auto !important;
                    }
                    .bg-gray-50 {
                        background: white !important;
                    }
                    nav, .navbar {
                        display: none !important;
                    }
                    .max-w-7xl {
                        max-width: 100% !important;
                    }
                }
            `}</style>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 no-print">📊 Raporty semestralne</h1>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6 no-print">
                    <h2 className="text-xl font-semibold mb-4">Wybierz grupę</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Grupa
                            </label>
                            <input
                                type="text"
                                placeholder="Wyszukaj grupę..."
                                value={groupSearch}
                                onChange={(e) => setGroupSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                            />
                            <select
                                value={selectedGroup}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">-- Wybierz grupę --</option>
                                {groups
                                    .filter(group => {
                                        if (!groupSearch) return true;
                                        const searchLower = groupSearch.toLowerCase();
                                        return (
                                            group.id_grupa.toString().includes(searchLower) ||
                                            group.dzien_tygodnia?.toLowerCase().includes(searchLower)
                                        );
                                    })
                                    .map(group => (
                                        <option key={group.id_grupa} value={group.id_grupa}>
                                            Grupa #{group.id_grupa} - {group.dzien_tygodnia}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {groupDetails && (
                            <div className="flex items-end">
                                <div className="text-sm text-gray-600">
                                    <p><strong>Kurs:</strong> {groupDetails.nazwa_kursu || 'Brak danych'}</p>
                                    <p><strong>Uczniów:</strong> {students.length}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setReportType('group');
                                generateGroupReport();
                            }}
                            disabled={!selectedGroup || generating}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            {generating && reportType === 'group' ? 'Generowanie...' : 'Raport grupy'}
                        </button>
                        <button
                            onClick={() => {
                                setReportType('students');
                                setReportData([]);
                                setGroupReport(null);
                            }}
                            disabled={!selectedGroup || students.length === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            Lista uczniów
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Ładowanie danych...</p>
                    </div>
                )}

                
                {groupReport && reportType === 'group' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">📊 Raport grupy #{selectedGroup}</h2>
                            <div className="gap-3 no-print hidden sm:flex">
                                <button
                                    onClick={exportGroupToCSV}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    📊 Eksportuj CSV
                                </button>
                                <button
                                    onClick={exportGroupToPDF}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                >
                                    📄 Eksportuj PDF
                                </button>
                            </div>
                        </div>
                        
                       
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Frekwencja</p>
                                        <p className="text-3xl font-bold text-blue-600">{groupReport.summary.averageAttendance}%</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {groupReport.attendance.present}/{groupReport.attendance.totalLessons} zajęć
                                        </p>
                                    </div>
                                    <div className="text-4xl">📅</div>
                                </div>
                            </div>

                            <div className="bg-green-50 p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Średnia z zadań</p>
                                        <p className="text-3xl font-bold text-green-600">{groupReport.summary.averageHomeworkGrade || '-'}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {groupReport.homework.graded}/{groupReport.homework.totalHomeworks} ocenionych
                                        </p>
                                    </div>
                                    <div className="text-4xl">📝</div>
                                </div>
                            </div>

                            <div className="bg-purple-50 p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Średnia z quizów</p>
                                        <p className="text-3xl font-bold text-purple-600">{groupReport.summary.averageQuizScore.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {groupReport.quiz.totalQuizzes} quizów
                                        </p>
                                    </div>
                                    <div className="text-4xl">🎯</div>
                                </div>
                            </div>
                        </div>

                      
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">📅 Obecności</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Obecny</p>
                                    <p className="text-2xl font-bold text-green-600">{groupReport.attendance.present}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Nieobecny</p>
                                    <p className="text-2xl font-bold text-red-600">{groupReport.attendance.absent}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Razem zajęć</p>
                                    <p className="text-2xl font-bold text-gray-700">{groupReport.attendance.totalLessons}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Procent</p>
                                    <p className="text-2xl font-bold text-blue-600">{groupReport.attendance.attendancePercentage}%</p>
                                </div>
                            </div>
                        </div>

                     
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">📝 Zadania domowe</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Wszystkie</p>
                                    <p className="text-2xl font-bold text-blue-600">{groupReport.homework.totalHomeworks}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Ocenione</p>
                                    <p className="text-2xl font-bold text-green-600">{groupReport.homework.graded}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Nieocenione</p>
                                    <p className="text-2xl font-bold text-yellow-600">{groupReport.homework.ungraded}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Średnia</p>
                                    <p className="text-2xl font-bold text-purple-600">{groupReport.homework.averageGrade || '-'}</p>
                                </div>
                            </div>
                        </div>

                      
                        <div>
                            <h3 className="text-lg font-semibold mb-3">🎯 Quizy</h3>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Wszystkie quizy</p>
                                    <p className="text-2xl font-bold text-purple-600">{groupReport.quiz.totalQuizzes}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Średni wynik</p>
                                    <p className="text-2xl font-bold text-green-600">{groupReport.quiz.averageScore.toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

               
                {reportType === 'students' && students.length > 0 && !selectedStudentReport && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Lista uczniów</h2>
                            <input
                                type="text"
                                placeholder="Wyszukaj ucznia..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4">Uczeń</th>
                                        <th className="text-left py-3 px-4">Email</th>
                                        <th className="text-left py-3 px-4">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students
                                        .filter(student => {
                                            if (!studentSearch) return true;
                                            const searchLower = studentSearch.toLowerCase();
                                            return (
                                                student.imie?.toLowerCase().includes(searchLower) ||
                                                student.nazwisko?.toLowerCase().includes(searchLower) ||
                                                student.pseudonim?.toLowerCase().includes(searchLower)
                                            );
                                        })
                                        .map((student) => (
                                            <tr key={student.id_ucznia} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium">{student.imie} {student.nazwisko}</p>
                                                        {student.pseudonim && (
                                                            <p className="text-sm text-gray-500">({student.pseudonim})</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-sm text-gray-600">{student.email || '-'}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => generateStudentReport(student.id_ucznia)}
                                                        disabled={generating}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition"
                                                    >
                                                        {generating ? 'Ładowanie...' : 'Pokaż raport'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

               
                {selectedStudentReport && reportType === 'students' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">📊 Raport ucznia</h2>
                            <div className="gap-3 no-print hidden sm:flex">
                                <button
                                    onClick={exportStudentToCSV}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition items-center gap-2 hidden sm:flex"
                                >
                                    📊 Eksportuj CSV
                                </button>
                                <button
                                    onClick={exportStudentToPDF}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition items-center gap-2 hidden sm:flex"
                                >
                                    📄 Eksportuj PDF
                                </button>
                                <button
                                    onClick={() => setSelectedStudentReport(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    Powrót do listy
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const student = students.find(s => s.id_ucznia === selectedStudentReport.studentId);
                            const report = selectedStudentReport.report;
                            return (
                                <>
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-lg font-semibold">{student?.imie} {student?.nazwisko}</p>
                                        {student?.pseudonim && <p className="text-sm text-gray-600">({student.pseudonim})</p>}
                                    </div>

                                  
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="bg-blue-50 p-6 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">Frekwencja</p>
                                                    <p className="text-3xl font-bold text-blue-600">{report.summary.averageAttendance}%</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {report.attendance.present}/{report.attendance.totalLessons} zajęć
                                                    </p>
                                                </div>
                                                <div className="text-4xl">📅</div>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 p-6 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">Średnia z zadań</p>
                                                    <p className="text-3xl font-bold text-green-600">{report.summary.averageHomeworkGrade || '-'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {report.homework.graded}/{report.homework.totalHomeworks} ocenionych
                                                    </p>
                                                </div>
                                                <div className="text-4xl">📝</div>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 p-6 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">Średnia z quizów</p>
                                                    <p className="text-3xl font-bold text-purple-600">{report.summary.averageQuizScore.toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {report.quiz.totalQuizzes} quizów
                                                    </p>
                                                </div>
                                                <div className="text-4xl">🎯</div>
                                            </div>
                                        </div>
                                    </div>

                                  
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">📅 Obecności</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Obecny</p>
                                                <p className="text-2xl font-bold text-green-600">{report.attendance.present}</p>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Nieobecny</p>
                                                <p className="text-2xl font-bold text-red-600">{report.attendance.absent}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Razem zajęć</p>
                                                <p className="text-2xl font-bold text-gray-700">{report.attendance.totalLessons}</p>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Procent</p>
                                                <p className="text-2xl font-bold text-blue-600">{report.attendance.attendancePercentage}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">📝 Zadania domowe</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Wszystkie</p>
                                                <p className="text-2xl font-bold text-blue-600">{report.homework.totalHomeworks}</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Ocenione</p>
                                                <p className="text-2xl font-bold text-green-600">{report.homework.graded}</p>
                                            </div>
                                            <div className="bg-yellow-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Nieocenione</p>
                                                <p className="text-2xl font-bold text-yellow-600">{report.homework.ungraded}</p>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Średnia</p>
                                                <p className="text-2xl font-bold text-purple-600">{report.homework.averageGrade || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">🎯 Quizy</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                            <div className="bg-purple-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Wszystkie quizy</p>
                                                <p className="text-2xl font-bold text-purple-600">{report.quiz.totalQuizzes}</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Średni wynik</p>
                                                <p className="text-2xl font-bold text-green-600">{report.quiz.averageScore.toFixed(2)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
