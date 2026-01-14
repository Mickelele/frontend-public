'use client';

import { useState, useEffect } from 'react';
import { getTechnicalReports, clearTechnicalReport } from '../../../../lib/api/lesson.api';
import { getAllRooms } from '../../../../lib/api/room.api';
import { getTeachers } from '../../../../lib/api/teacher.api';
import { getCourses } from '../../../../lib/api/course.api';

export default function TechnicalReportsPage() {
    const [reports, setReports] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [reportsData, roomsData, teachersData, coursesData] = await Promise.all([
                getTechnicalReports(),
                getAllRooms(),
                getTeachers(),
                getCourses()
            ]);
            
            setReports(reportsData || []);
            setRooms(roomsData || []);
            setTeachers(teachersData || []);
            setCourses(coursesData || []);
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            alert('Nie udało się załadować danych');
        } finally {
            setLoading(false);
        }
    };

    const handleClearReport = async (id) => {
        if (!confirm('Czy na pewno chcesz oznaczyć to zgłoszenie jako rozwiązane?')) {
            return;
        }

        try {
            await clearTechnicalReport(id);
       
            await loadData();
        } catch (error) {
            console.error('Błąd usuwania zgłoszenia:', error);
            alert('Nie udało się oznaczyć zgłoszenia jako rozwiązane');
        }
    };


    const filteredReports = reports.filter(report => {
        const room = report.sala;
        
      
        if (selectedLocation && room?.lokalizacja !== selectedLocation) {
            return false;
        }

       
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesRemark = report.uwaga_do_sprzetu?.toLowerCase().includes(searchLower);
            const matchesRoom = room?.numer?.toString().includes(searchLower);
            const matchesLocation = room?.lokalizacja?.toLowerCase().includes(searchLower);
            
            if (!matchesRemark && !matchesRoom && !matchesLocation) {
                return false;
            }
        }

        return true;
    });

  
    const sortedReports = [...filteredReports].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.data) - new Date(a.data);
        } else if (sortBy === 'location') {
            return (a.sala?.lokalizacja || '').localeCompare(b.sala?.lokalizacja || '');
        }
        return 0;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie zgłoszeń...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Zgłoszenia Techniczne
                </h1>
                <p className="text-gray-600">Uwagi dotyczące sprzętu i problemów technicznych</p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-blue-600">{filteredReports.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Zgłoszeń ogółem</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-orange-600">
                        {[...new Set(filteredReports.map(r => r.sala?.lokalizacja))].filter(Boolean).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Lokalizacje</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-green-600">
                        {[...new Set(filteredReports.map(r => r.Sala_id_sali))].length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Sale dotknięte</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-red-600">
                        {filteredReports.filter(r => {
                            const date = new Date(r.data);
                            const today = new Date();
                            const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                            return diffDays <= 7;
                        }).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Ostatni tydzień</div>
                </div>
            </div>

         
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📍 Filtruj po lokalizacji
                        </label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Wszystkie lokalizacje</option>
                            {[...new Set(rooms.map(r => r.lokalizacja).filter(Boolean))].sort().map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔍 Wyszukaj
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Szukaj po sali, lokalizacji lub treści..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📋 Sortuj po
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="date">Data (najnowsze)</option>
                            <option value="location">Lokalizacja (A-Z)</option>
                        </select>
                    </div>
                </div>
                {(selectedLocation || searchTerm) && (
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                setSelectedLocation('');
                                setSearchTerm('');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ✖️ Wyczyść filtry
                        </button>
                    </div>
                )}
            </div>

           
            {sortedReports.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {reports.length === 0 ? 'Brak zgłoszeń' : 'Brak wyników'}
                    </h3>
                    <p className="text-gray-600">
                        {reports.length === 0 
                            ? 'Nie ma żadnych zgłoszeń technicznych.'
                            : 'Zmień kryteria filtrowania, aby zobaczyć wyniki.'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedReports.map((lesson) => {
                        const group = lesson.grupa;
                        const room = lesson.sala;
                        const teacher = teachers.find(t => t.id_nauczyciela === group?.id_nauczyciela);
                        const course = courses.find(c => c.id_kursu === group?.Kurs_id_kursu);
                        
                        const lessonDate = new Date(lesson.data);
                        const today = new Date();
                        const diffDays = Math.floor((today - lessonDate) / (1000 * 60 * 60 * 24));
                        const isRecent = diffDays <= 7;

                        return (
                            <div 
                                key={lesson.id_zajec} 
                                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6 border-l-4 ${
                                    isRecent ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                Sala {room?.numer || 'Brak'}
                                            </h3>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                                {room?.lokalizacja || 'Brak lokalizacji'}
                                            </span>
                                            {isRecent && (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                                    🔴 Nowe
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>
                                                <span className="font-semibold">Data:</span>{' '}
                                                {lessonDate.toLocaleDateString('pl-PL')} 
                                                {diffDays === 0 ? ' (dzisiaj)' : diffDays === 1 ? ' (wczoraj)' : ` (${diffDays} dni temu)`}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Kurs:</span> {course?.nazwa_kursu || 'Brak'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Grupa:</span> Grupa #{group?.id_grupa || 'Brak'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Dzień/Godzina:</span>{' '}
                                                {group?.dzien_tygodnia || 'Brak'} {group?.godzina || ''}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Nauczyciel:</span>{' '}
                                                {teacher?.user ? `${teacher.user.imie} ${teacher.user.nazwisko}` : 'Brak'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Temat zajęć:</span> {lesson.tematZajec || 'Brak'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <span className="text-2xl">⚠️</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 mb-1">Zgłoszenie:</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{lesson.uwaga_do_sprzetu}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleClearReport(lesson.id_zajec)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <span>✓</span>
                                        Oznacz jako rozwiązane
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
