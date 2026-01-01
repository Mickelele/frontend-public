'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '/context/AuthContext';
import { getStudents, enrollStudentToGroup } from '/lib/api/student.api';
import { getTeachers } from '/lib/api/teacher.api';
import { getCourses, getCourseGroups } from '/lib/api/course.api';
import { getAllQuizzes } from '/lib/api/quiz.api';
import { getOpiekunStudents } from '/lib/api/guardian.api';
import { registerUser } from '/lib/api/auth.api';

export default function AdministratorDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        courses: 0,
        quizzes: 0
    });
    
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [guardians, setGuardians] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState('');
    
    const [userForm, setUserForm] = useState({
        imie: '',
        nazwisko: '',
        email: '',
        haslo: '',
        telefon: '',
        rola: 'uczen',
        id_grupa: '',
        id_opiekuna: ''
    });

    useEffect(() => {
        if (user?.id) {
            loadDashboardData();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            const [studentsData, teachersData, coursesData, quizzesData] = await Promise.all([
                getStudents(),
                getTeachers(),
                getCourses(),
                getAllQuizzes()
            ]);

            setStudents(studentsData || []);
            setTeachers(teachersData || []);
            setCourses(coursesData || []);
            setQuizzes(quizzesData || []);
            
            const guardiansData = studentsData?.filter(s => s.rola === 'opiekun') || [];
            setGuardians(guardiansData);
            
            const groupsPromises = coursesData?.map(course => getCourseGroups(course.id_kursu)) || [];
            const groupsArrays = await Promise.all(groupsPromises);
            const allGroupsFlat = groupsArrays.flat();
            setAllGroups(allGroupsFlat);

            setStats({
                students: studentsData?.filter(s => s.rola === 'uczen').length || 0,
                teachers: teachersData?.length || 0,
                courses: coursesData?.length || 0,
                quizzes: quizzesData?.length || 0
            });

            setLoading(false);
        } catch (err) {
            console.error('Błąd ładowania danych:', err);
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const searchMatch = searchTerm === '' || 
            `${student.imie} ${student.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (selectedFilter === 'all') return searchMatch;
        if (selectedFilter === 'assigned') return searchMatch && student.id_grupa;
        if (selectedFilter === 'unassigned') return searchMatch && !student.id_grupa;
        
        return searchMatch;
    });

    const filteredTeachers = teachers.filter(teacher =>
        searchTerm === '' || 
        `${teacher.imie} ${teacher.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCourses = courses.filter(course =>
        searchTerm === '' || 
        course.nazwa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateUser = (role) => {
        setModalType('create');
        setSelectedUser(null);
        setUserForm({
            imie: '',
            nazwisko: '',
            email: '',
            haslo: '',
            telefon: '',
            rola: role,
            id_grupa: '',
            id_opiekuna: ''
        });
        setShowUserModal(true);
    };

    const handleEditUser = (userToEdit, role) => {
        setModalType('edit');
        setSelectedUser(userToEdit);
        setUserForm({
            imie: userToEdit.imie || '',
            nazwisko: userToEdit.nazwisko || '',
            email: userToEdit.email || '',
            haslo: '',
            telefon: userToEdit.telefon || '',
            rola: role,
            id_grupa: userToEdit.id_grupa || '',
            id_opiekuna: userToEdit.id_opiekuna || ''
        });
        setShowUserModal(true);
    };

    const handleAssignGuardian = (student) => {
        setSelectedUser(student);
        setShowAssignModal(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        
        try {
            if (modalType === 'create') {
                await registerUser(userForm);
                alert('Użytkownik został utworzony pomyślnie!');
            }
            
            await loadDashboardData();
            setShowUserModal(false);
            setUserForm({
                imie: '',
                nazwisko: '',
                email: '',
                haslo: '',
                telefon: '',
                rola: 'uczen',
                id_grupa: '',
                id_opiekuna: ''
            });
        } catch (err) {
            console.error('Błąd zapisywania użytkownika:', err);
            alert('Nie udało się zapisać użytkownika');
        }
    };

    const handleAssignToGroup = async (studentId, groupId) => {
        try {
            await enrollStudentToGroup({
                id_ucznia: studentId,
                id_grupa: groupId
            });
            alert('Uczeń został przypisany do grupy!');
            await loadDashboardData();
        } catch (err) {
            console.error('Błąd przypisywania do grupy:', err);
            alert('Nie udało się przypisać ucznia do grupy');
        }
    };

    const handleAssignToGuardian = async (e) => {
        e.preventDefault();
        
        try {
            alert('Funkcja przypisywania do opiekuna zostanie wkrótce dodana');
            setShowAssignModal(false);
        } catch (err) {
            console.error('Błąd przypisywania opiekuna:', err);
            alert('Nie udało się przypisać opiekuna');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Ładowanie panelu administratora...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🛡️ Panel Administratora</h1>
                    <p className="text-gray-600">Witaj, {user?.imie}! Zarządzaj systemem z jednego miejsca.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Uczniowie</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.students}</p>
                            </div>
                            <div className="text-4xl">👨‍🎓</div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            Z grupy: {students.filter(s => s.id_grupa).length} | 
                            Bez grupy: {students.filter(s => !s.id_grupa).length}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Nauczyciele</p>
                                <p className="text-3xl font-bold text-green-600">{stats.teachers}</p>
                            </div>
                            <div className="text-4xl">👨‍🏫</div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            Aktywni nauczyciele w systemie
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Kursy</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.courses}</p>
                            </div>
                            <div className="text-4xl">📚</div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            Dostępne kursy w ofercie
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Quizy</p>
                                <p className="text-3xl font-bold text-orange-600">{stats.quizzes}</p>
                            </div>
                            <div className="text-4xl">📝</div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            Utworzone quizy i testy
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'overview'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                📊 Przegląd
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'students'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                👨‍🎓 Uczniowie ({stats.students})
                            </button>
                            <button
                                onClick={() => setActiveTab('teachers')}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'teachers'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                👨‍🏫 Nauczyciele ({stats.teachers})
                            </button>
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'courses'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                📚 Kursy ({stats.courses})
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'users'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                👥 Użytkownicy
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Przegląd systemu</h2>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            👨‍🎓 Status uczniów
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Przypisani do grup:</span>
                                                <span className="font-bold text-blue-700">
                                                    {students.filter(s => s.id_grupa).length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Bez grupy:</span>
                                                <span className="font-bold text-orange-700">
                                                    {students.filter(s => !s.id_grupa).length}
                                                </span>
                                            </div>
                                            <div className="pt-3 border-t border-blue-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-700 font-medium">Razem:</span>
                                                    <span className="font-bold text-blue-900">{stats.students}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            📚 Statystyki kursów
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Aktywne kursy:</span>
                                                <span className="font-bold text-green-700">{stats.courses}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Utworzone quizy:</span>
                                                <span className="font-bold text-purple-700">{stats.quizzes}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Aktywni nauczyciele:</span>
                                                <span className="font-bold text-blue-700">{stats.teachers}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                                    <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                        ⚠️ Wymagana uwaga
                                    </h3>
                                    <ul className="list-disc list-inside text-yellow-800 space-y-1">
                                        {students.filter(s => !s.id_grupa).length > 0 && (
                                            <li>
                                                {students.filter(s => !s.id_grupa).length} uczniów bez przypisanej grupy
                                            </li>
                                        )}
                                        {stats.courses === 0 && <li>Brak kursów w systemie</li>}
                                        {stats.teachers === 0 && <li>Brak nauczycieli w systemie</li>}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'students' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista uczniów</h2>
                                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj ucznia..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-initial"
                                        />
                                        <select
                                            value={selectedFilter}
                                            onChange={(e) => setSelectedFilter(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="all">Wszyscy</option>
                                            <option value="assigned">Z grupą</option>
                                            <option value="unassigned">Bez grupy</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Imię i nazwisko
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Telefon
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Grupa
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredStudents.map((student) => (
                                                <tr key={student.id_ucznia} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {student.id_ucznia}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.imie} {student.nazwisko}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {student.email || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {student.telefon || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {student.id_grupa ? `Grupa #${student.id_grupa}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.id_grupa ? (
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                Przypisany
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                                Bez grupy
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredStudents.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            Nie znaleziono uczniów spełniających kryteria
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'teachers' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista nauczycieli</h2>
                                    <input
                                        type="text"
                                        placeholder="🔍 Szukaj nauczyciela..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTeachers.map((teacher) => (
                                        <div key={teacher.id_nauczyciela} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {teacher.imie?.[0]}{teacher.nazwisko?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {teacher.imie} {teacher.nazwisko}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        📧 {teacher.email || 'Brak email'}
                                                    </p>
                                                    {teacher.telefon && (
                                                        <p className="text-sm text-gray-600">
                                                            📱 {teacher.telefon}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredTeachers.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        Nie znaleziono nauczycieli spełniających kryteria
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'courses' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista kursów</h2>
                                    <input
                                        type="text"
                                        placeholder="🔍 Szukaj kursu..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredCourses.map((course) => (
                                        <div key={course.id_kursu} className="bg-white border-l-4 border-blue-500 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {course.nazwa}
                                                </h3>
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    ID: {course.id_kursu}
                                                </span>
                                            </div>
                                            {course.opis && (
                                                <p className="text-gray-600 mb-4">{course.opis}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                                {course.cena && (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                                        💰 {course.cena} zł
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredCourses.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        Nie znaleziono kursów spełniających kryteria
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
