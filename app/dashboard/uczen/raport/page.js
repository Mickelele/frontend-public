'use client';

import { useState, useEffect } from 'react';
import { getDetailedReport } from '../../../../lib/api/reports.api';
import { getUserIdFromToken } from '../../../../lib/auth';

export default function StudentReportPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            const studentId = getUserIdFromToken();
            const detailedReport = await getDetailedReport({ studentId });
            setReport(detailedReport);
        } catch (err) {
            console.error('Błąd pobierania raportu:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        window.print();
    };

    const exportToCSV = () => {
        if (!report) return;

        const headers = ['Kategoria', 'Wartość'];
        const rows = [
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
            ['Nieznany', report.attendance.unknown],
            ['Procent obecności', `${report.attendance.attendancePercentage}%`],
            [''],
            ['ZADANIA DOMOWE'],
            ['Wszystkie zadania', report.homework.totalHomeworks],
            ['Ocenione', report.homework.graded],
            ['Nieocenione', report.homework.ungraded],
            ['Średnia ocena', report.homework.averageGrade],
            [''],
            ['Rozkład ocen:'],
            ['0-20%', report.homework.gradeDistribution['0-20']],
            ['21-40%', report.homework.gradeDistribution['21-40']],
            ['41-60%', report.homework.gradeDistribution['41-60']],
            ['61-80%', report.homework.gradeDistribution['61-80']],
            ['81-100%', report.homework.gradeDistribution['81-100']],
            [''],
            ['QUIZY'],
            ['Wszystkie quizy', report.quiz.totalQuizzes],
            ['Średni wynik', `${report.quiz.averageScore.toFixed(2)}%`],
            [''],
            ['Rozkład wyników quizów:'],
            ['0-20%', report.quiz.scoreDistribution['0-20']],
            ['21-40%', report.quiz.scoreDistribution['21-40']],
            ['41-60%', report.quiz.scoreDistribution['41-60']],
            ['61-80%', report.quiz.scoreDistribution['61-80']],
            ['81-100%', report.quiz.scoreDistribution['81-100']]
        ];

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `moj_raport_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Ładowanie raportu...</p>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Brak danych do wyświetlenia</p>
            </div>
        );
    }

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
                    .max-w-6xl {
                        max-width: 100% !important;
                    }
                }
            `}</style>
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 Mój raport semestralny</h1>
                        <div className="hidden min-[500px]:flex gap-3 no-print">
                            <button
                                onClick={exportToCSV}
                                className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm md:text-base"
                            >
                                📊 Eksportuj CSV
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm md:text-base"
                            >
                                📄 Eksportuj PDF
                            </button>
                        </div>
                    </div>

                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
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

                    <div className="bg-white rounded-lg shadow-md p-6">
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

                    <div className="bg-white rounded-lg shadow-md p-6">
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

             
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">📅 Obecności</h2>
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
                            <p className="text-sm text-gray-600">Procent obecności</p>
                            <p className="text-2xl font-bold text-blue-600">{report.attendance.attendancePercentage}%</p>
                        </div>
                    </div>
                </div>

               
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">📝 Zadania domowe</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                  
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Rozkład ocen</h3>
                        <div className="space-y-2">
                            {Object.entries(report.homework.gradeDistribution).map(([range, count]) => (
                                <div key={range} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 w-20">{range}%</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                                        <div
                                            className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                            style={{
                                                width: `${report.homework.totalHomeworks > 0 ? (count / report.homework.totalHomeworks) * 100 : 0}%`,
                                                minWidth: count > 0 ? '30px' : '0'
                                            }}
                                        >
                                            {count > 0 ? count : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">🎯 Quizy</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Wszystkie quizy</p>
                            <p className="text-2xl font-bold text-purple-600">{report.quiz.totalQuizzes}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Średni wynik</p>
                            <p className="text-2xl font-bold text-green-600">{report.quiz.averageScore.toFixed(2)}%</p>
                        </div>
                    </div>

                   
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Rozkład wyników</h3>
                        <div className="space-y-2">
                            {Object.entries(report.quiz.scoreDistribution).map(([range, count]) => (
                                <div key={range} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 w-20">{range}%</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                                        <div
                                            className="bg-purple-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                            style={{
                                                width: `${report.quiz.totalQuizzes > 0 ? (count / report.quiz.totalQuizzes) * 100 : 0}%`,
                                                minWidth: count > 0 ? '30px' : '0'
                                            }}
                                        >
                                            {count > 0 ? count : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
