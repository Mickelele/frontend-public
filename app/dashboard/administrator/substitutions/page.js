'use client';

import { useState, useEffect } from 'react';
import { getAllSubstitutes, deleteSubstitute, assignTeacherToSubstitute, unassignTeacherFromSubstitute } from '../../../../lib/api/substitute.api';
import { getTeachers } from '../../../../lib/api/teacher.api';
import { getCourses } from '../../../../lib/api/course.api';
import { getAllGroups } from '../../../../lib/api/group.api';
import { getAllRooms } from '../../../../lib/api/room.api';

export default function SubstitutionsPage() {
    const [substitutes, setSubstitutes] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, assigned, unassigned
    const [sortBy, setSortBy] = useState('date'); // date, course, status
    const [teacherSearchTerms, setTeacherSearchTerms] = useState({}); // Wyszukiwanie nauczycieli dla każdego zastępstwa
    const [activeTab, setActiveTab] = useState('current'); // current, archived

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [substitutesData, teachersData, coursesData, groupsData, roomsData] = await Promise.all([
                getAllSubstitutes(),
                getTeachers(),
                getCourses(),
                getAllGroups(),
                getAllRooms()
            ]);

            console.log('Dane zastępstw:', substitutesData);
            console.log('Zajęcia z zastępstwa:', substitutesData?.[0]?.zajecia);
            console.log('Grupy:', groupsData);

            setSubstitutes(substitutesData || []);
            setTeachers(teachersData || []);
            setCourses(coursesData || []);
            setGroups(groupsData || []);
            setRooms(roomsData || []);
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            alert('Nie udało się załadować danych');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć to zastępstwo?')) {
            return;
        }

        try {
            await deleteSubstitute(id);
            await loadData();
        } catch (error) {
            console.error('Błąd usuwania zastępstwa:', error);
            alert('Nie udało się usunąć zastępstwa');
        }
    };

    const handleAssignTeacher = async (substituteId, teacherId) => {
        if (!teacherId) {
            alert('Wybierz nauczyciela');
            return;
        }

        try {
            await assignTeacherToSubstitute(substituteId, teacherId);
            await loadData();
        } catch (error) {
            console.error('Błąd przypisywania nauczyciela:', error);
            alert('Nie udało się przypisać nauczyciela');
        }
    };

    const handleUnassignTeacher = async (substituteId) => {
        if (!confirm('Czy na pewno chcesz usunąć przypisanie nauczyciela?')) {
            return;
        }

        try {
            await unassignTeacherFromSubstitute(substituteId);
            await loadData();
        } catch (error) {
            console.error('Błąd usuwania przypisania:', error);
            alert('Nie udało się usunąć przypisania');
        }
    };

    // Data dzisiejsza (potrzebna do filtrowania)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtruj zastępstwa
    const filteredSubstitutes = substitutes.filter(sub => {
        const subDate = new Date(sub.zajecia?.data);
        subDate.setHours(0, 0, 0, 0);
        
        // Filtr zakładki (aktualne vs zarchiwizowane)
        if (activeTab === 'current' && subDate < today) return false;
        if (activeTab === 'archived' && subDate >= today) return false;
        
        // Filtr statusu
        if (statusFilter === 'assigned' && !sub.id_nauczyciel_zastepujacy) return false;
        if (statusFilter === 'unassigned' && sub.id_nauczyciel_zastepujacy) return false;

        // Wyszukiwanie
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const reportingTeacher = teachers.find(t => t.id_nauczyciela === sub.id_nauczyciela_zglaszajacego);
            const substituteTeacher = teachers.find(t => t.id_nauczyciela === sub.id_nauczyciel_zastepujacy);
            
            const matchesReportingTeacher = reportingTeacher?.user ? 
                `${reportingTeacher.user.imie} ${reportingTeacher.user.nazwisko}`.toLowerCase().includes(searchLower) : false;
            const matchesSubstituteTeacher = substituteTeacher?.user ? 
                `${substituteTeacher.user.imie} ${substituteTeacher.user.nazwisko}`.toLowerCase().includes(searchLower) : false;
            const matchesReason = sub.powod?.toLowerCase().includes(searchLower);

            if (!matchesReportingTeacher && !matchesSubstituteTeacher && !matchesReason) {
                return false;
            }
        }

        return true;
    });

    // Sortowanie
    const sortedSubstitutes = [...filteredSubstitutes].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.zajecia?.data || 0) - new Date(a.zajecia?.data || 0);
        } else if (sortBy === 'course') {
            const groupA = groups.find(g => g.id_grupa === a.zajecia?.id_grupy);
            const groupB = groups.find(g => g.id_grupa === b.zajecia?.id_grupy);
            const courseA = courses.find(c => c.id_kursu === groupA?.Kurs_id_kursu)?.nazwa_kursu || '';
            const courseB = courses.find(c => c.id_kursu === groupB?.Kurs_id_kursu)?.nazwa_kursu || '';
            return courseA.localeCompare(courseB);
        } else if (sortBy === 'status') {
            const statusA = a.id_nauczyciel_zastepujacy ? 1 : 0;
            const statusB = b.id_nauczyciel_zastepujacy ? 1 : 0;
            return statusB - statusA;
        }
        return 0;
    });

    // Statystyki
    const currentSubstitutes = substitutes.filter(s => {
        const subDate = new Date(s.zajecia?.data);
        subDate.setHours(0, 0, 0, 0);
        return subDate >= today;
    });
    
    const archivedSubstitutes = substitutes.filter(s => {
        const subDate = new Date(s.zajecia?.data);
        subDate.setHours(0, 0, 0, 0);
        return subDate < today;
    });
    
    const stats = {
        total: activeTab === 'current' ? currentSubstitutes.length : archivedSubstitutes.length,
        assigned: (activeTab === 'current' ? currentSubstitutes : archivedSubstitutes).filter(s => s.id_nauczyciel_zastepujacy).length,
        unassigned: (activeTab === 'current' ? currentSubstitutes : archivedSubstitutes).filter(s => !s.id_nauczyciel_zastepujacy).length,
        thisMonth: (activeTab === 'current' ? currentSubstitutes : archivedSubstitutes).filter(s => {
            const subDate = new Date(s.zajecia?.data);
            const now = new Date();
            return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
        }).length
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie zastępstw...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Zarządzanie Zastępstwami
                </h1>
                <p className="text-gray-600">
                    Przegląd i zarządzanie wszystkimi zastępstwami
                </p>
            </div>

            {/* Zakładki */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        activeTab === 'current'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    📋 Aktualne ({currentSubstitutes.length})
                </button>
                <button
                    onClick={() => setActiveTab('archived')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        activeTab === 'archived'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    📦 Zarchiwizowane ({archivedSubstitutes.length})
                </button>
            </div>

            {/* Statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600 mt-1">
                        {activeTab === 'current' ? 'Aktualne zastępstwa' : 'Zarchiwizowane'}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-green-600">{stats.assigned}</div>
                    <div className="text-sm text-gray-600 mt-1">Przypisane</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-orange-600">{stats.unassigned}</div>
                    <div className="text-sm text-gray-600 mt-1">Nieprzypisane</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-3xl font-bold text-purple-600">{stats.thisMonth}</div>
                    <div className="text-sm text-gray-600 mt-1">W tym miesiącu</div>
                </div>
            </div>

            {/* Filtry i wyszukiwanie */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Wyszukiwanie */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Wyszukaj
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nauczyciel, powód..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Wszystkie</option>
                            <option value="assigned">Przypisane</option>
                            <option value="unassigned">Nieprzypisane</option>
                        </select>
                    </div>

                    {/* Sortowanie */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sortuj według
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="date">Data (najnowsze)</option>
                            <option value="course">Kurs (A-Z)</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista zastępstw */}
            {sortedSubstitutes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {substitutes.length === 0 ? 'Brak zastępstw' : 'Brak wyników'}
                    </h3>
                    <p className="text-gray-600">
                        {substitutes.length === 0 
                            ? 'Nie ma żadnych zastępstw w systemie.'
                            : 'Zmień kryteria filtrowania, aby zobaczyć wyniki.'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedSubstitutes.map((substitute) => {
                        const reportingTeacher = teachers.find(t => t.id_nauczyciela === substitute.id_nauczyciela_zglaszajacego);
                        const substituteTeacher = teachers.find(t => t.id_nauczyciela === substitute.id_nauczyciel_zastepujacy);
                        const group = groups.find(g => g.id_grupa === substitute.zajecia?.id_grupy);
                        const course = courses.find(c => c.id_kursu === group?.Kurs_id_kursu);
                        const room = rooms.find(r => r.id_sali === substitute.zajecia?.Sala_id_sali);
                        
                        const subDate = new Date(substitute.zajecia?.data);
                        const isAssigned = !!substitute.id_nauczyciel_zastepujacy;

                        return (
                            <div 
                                key={substitute.id_zastepstwa} 
                                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6 border-l-4 ${
                                    isAssigned ? 'border-green-500' : 'border-orange-500'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                    {/* Główne informacje */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {course?.nazwa_kursu || 'Nieznany kurs'}
                                            </h3>
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                                isAssigned 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {isAssigned ? '✓ Przypisane' : '⏳ Nieprzypisane'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                            <p>
                                                <span className="font-semibold">Data:</span>{' '}
                                                {subDate.toLocaleDateString('pl-PL')} o {group?.godzina || 'Brak'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Grupa:</span>{' '}
                                                #{group?.id_grupa || 'Brak'} - {group?.dzien_tygodnia || 'Brak'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Lokalizacja:</span>{' '}
                                                {room?.lokalizacja || 'Brak'} - Sala {room?.numer || 'Brak'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Zgłaszający:</span>{' '}
                                                {reportingTeacher?.user ? 
                                                    `${reportingTeacher.user.imie} ${reportingTeacher.user.nazwisko}` 
                                                    : 'Nieznany'}
                                            </p>
                                            {substitute.powod && (
                                                <p className="md:col-span-2">
                                                    <span className="font-semibold">Powód:</span>{' '}
                                                    {substitute.powod}
                                                </p>
                                            )}
                                            {isAssigned && (
                                                <p className="md:col-span-2">
                                                    <span className="font-semibold">Zastępujący:</span>{' '}
                                                    <span className="text-green-600 font-medium">
                                                        {substituteTeacher?.user ? 
                                                            `${substituteTeacher.user.imie} ${substituteTeacher.user.nazwisko}` 
                                                            : 'Nieznany'}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Akcje */}
                                    <div className="flex flex-col gap-2 lg:w-64">
                                        {!isAssigned ? (
                                            <div className="flex flex-col gap-2">
                                                {/* Wyszukiwanie nauczyciela */}
                                                <input
                                                    type="text"
                                                    placeholder="Szukaj nauczyciela..."
                                                    value={teacherSearchTerms[substitute.id_zastepstwa] || ''}
                                                    onChange={(e) => setTeacherSearchTerms({
                                                        ...teacherSearchTerms,
                                                        [substitute.id_zastepstwa]: e.target.value
                                                    })}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                
                                                {/* Lista nauczycieli */}
                                                <select
                                                    id={`teacher-select-${substitute.id_zastepstwa}`}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
                                                    defaultValue=""
                                                    size={5}
                                                >
                                                    <option value="" disabled>Wybierz nauczyciela</option>
                                                    {teachers
                                                        .filter(teacher => {
                                                            // Nie pokazuj nauczyciela, który zgłosił zastępstwo
                                                            if (teacher.id_nauczyciela === substitute.id_nauczyciela_zglaszajacego) {
                                                                return false;
                                                            }
                                                            
                                                            // Filtr wyszukiwania
                                                            const searchTerm = teacherSearchTerms[substitute.id_zastepstwa]?.toLowerCase() || '';
                                                            if (!searchTerm) return true;
                                                            const fullName = teacher.user ? 
                                                                `${teacher.user.imie} ${teacher.user.nazwisko}`.toLowerCase() : '';
                                                            return fullName.includes(searchTerm);
                                                        })
                                                        .map(teacher => (
                                                            <option key={teacher.id_nauczyciela} value={teacher.id_nauczyciela}>
                                                                {teacher.user ? `${teacher.user.imie} ${teacher.user.nazwisko}` : 'Brak danych'}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const select = document.getElementById(`teacher-select-${substitute.id_zastepstwa}`);
                                                        handleAssignTeacher(substitute.id_zastepstwa, select.value);
                                                    }}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span>✓</span>
                                                    Przypisz nauczyciela
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleUnassignTeacher(substitute.id_zastepstwa)}
                                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>✕</span>
                                                Usuń przypisanie
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDelete(substitute.id_zastepstwa)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>🗑️</span>
                                            Usuń zastępstwo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
