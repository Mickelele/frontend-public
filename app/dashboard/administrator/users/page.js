'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '/context/AuthContext';
import { getStudents, createStudent, updateStudent, deleteStudent, enrollStudentToGroup } from '/lib/api/student.api';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '/lib/api/teacher.api';
import { getAllGuardians, createGuardian, updateGuardian, deleteGuardian } from '/lib/api/guardian.api';
import { getCourses, getCourseGroups } from '/lib/api/course.api';
import { createUser, getUserById, updateUser, deleteUser } from '/lib/api/users.api';

export default function UsersManagement() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');
    
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
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
        id_opiekuna: '',
        pseudonim: '',
        nr_konta_bankowego: ''
    });

    useEffect(() => {
        if (user?.id) {
            loadUsersData();
        }
    }, [user]);

    const loadUsersData = async () => {
        try {
            setLoading(true);
            
            const [studentsData, teachersData, guardiansData, coursesData] = await Promise.all([
                getStudents(),
                getTeachers(),
                getAllGuardians(),
                getCourses()
            ]);

            const studentsWithUserData = await Promise.all(
                (studentsData || []).map(async (student) => {
                    try {
                        const userData = await getUserById(student.id_ucznia);
                        return { ...student, ...userData };
                    } catch (err) {
                        console.error(`Błąd pobierania danych użytkownika dla ucznia ${student.id_ucznia}:`, err);
                        return student;
                    }
                })
            );

            const teachersWithUserData = await Promise.all(
                (teachersData || []).map(async (teacher) => {
                    try {
                        const userData = await getUserById(teacher.id_nauczyciela);
                        return { ...teacher, ...userData };
                    } catch (err) {
                        console.error(`Błąd pobierania danych użytkownika dla nauczyciela ${teacher.id_nauczyciela}:`, err);
                        return teacher;
                    }
                })
            );

            const guardiansWithUserData = await Promise.all(
                (guardiansData || []).map(async (guardian) => {
                    try {
                        const userData = await getUserById(guardian.id_opiekuna);
                        return { ...guardian, ...userData };
                    } catch (err) {
                        console.error(`Błąd pobierania danych użytkownika dla opiekuna ${guardian.id_opiekuna}:`, err);
                        return guardian;
                    }
                })
            );

            setStudents(studentsWithUserData);
            setTeachers(teachersWithUserData);
            setGuardians(guardiansWithUserData);
            
            const groupsPromises = coursesData?.map(course => getCourseGroups(course.id_kursu)) || [];
            const groupsArrays = await Promise.all(groupsPromises);
            const allGroupsFlat = groupsArrays.flat();
            setAllGroups(allGroupsFlat);

            setLoading(false);
        } catch (err) {
            console.error('Błąd ładowania danych:', err);
            setLoading(false);
        }
    };

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
            id_opiekuna: '',
            pseudonim: '',
            nr_konta_bankowego: ''
        });
        setShowUserModal(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        
        try {
            if (modalType === 'create') {
                const newUser = await createUser({
                    imie: userForm.imie,
                    nazwisko: userForm.nazwisko,
                    email: userForm.email,
                    haslo: userForm.haslo,
                    rola: userForm.rola
                });

                const userId = newUser.id_uzytkownika;

                if (userForm.rola === 'uczen') {
                    await createStudent({
                        id_ucznia: userId,
                        id_grupa: userForm.id_grupa || null,
                        Opiekun_id_opiekuna: userForm.id_opiekuna || null,
                        saldo_punktow: 0,
                        pseudonim: userForm.pseudonim || `${userForm.imie}_${userForm.nazwisko}`
                    });
                } else if (userForm.rola === 'nauczyciel') {
                    await createTeacher({
                        id_nauczyciela: userId,
                        numer_nauczyciela: Math.floor(Math.random() * 10000),
                        nr_konta_bankowego: userForm.nr_konta_bankowego || ''
                    });
                } else if (userForm.rola === 'opiekun') {
                    await createGuardian({
                        id_opiekuna: userId,
                        nr_indy_konta_bankowego: userForm.nr_konta_bankowego || ''
                    });
                }
                
                alert('Użytkownik został utworzony pomyślnie!');
            } else {
                const userId = selectedUser.id_ucznia || selectedUser.id_nauczyciela || selectedUser.id_opiekuna || selectedUser.id_uzytkownika;
                
                await updateUser(userId, {
                    imie: userForm.imie,
                    nazwisko: userForm.nazwisko,
                    email: userForm.email,
                    rola: userForm.rola
                });

                if (userForm.rola === 'uczen') {
                    await updateStudent(selectedUser.id_ucznia, {
                        id_grupa: userForm.id_grupa || selectedUser.id_grupa,
                        Opiekun_id_opiekuna: userForm.id_opiekuna || selectedUser.Opiekun_id_opiekuna,
                        pseudonim: userForm.pseudonim || selectedUser.pseudonim
                    });
                } else if (userForm.rola === 'nauczyciel') {
                    await updateTeacher(selectedUser.id_nauczyciela, {
                        numer_nauczyciela: selectedUser.numer_nauczyciela,
                        nr_konta_bankowego: userForm.nr_konta_bankowego || selectedUser.nr_konta_bankowego
                    });
                } else if (userForm.rola === 'opiekun') {
                    await updateGuardian(selectedUser.id_opiekuna, {
                        nr_indy_konta_bankowego: userForm.nr_konta_bankowego || selectedUser.nr_indy_konta_bankowego
                    });
                }
                alert('Użytkownik został zaktualizowany!');
            }
            
            await loadUsersData();
            setShowUserModal(false);
            setUserForm({
                imie: '',
                nazwisko: '',
                email: '',
                haslo: '',
                telefon: '',
                rola: 'uczen',
                id_grupa: '',
                id_opiekuna: '',
                pseudonim: '',
                nr_konta_bankowego: ''
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
                id_grupa: parseInt(groupId)
            });
            alert('Uczeń został przypisany do grupy!');
            await loadUsersData();
        } catch (err) {
            console.error('Błąd przypisywania do grupy:', err);
            alert('Nie udało się przypisać ucznia do grupy');
        }
    };

    const handleAssignGuardian = (student) => {
        setSelectedUser(student);
        setShowAssignModal(true);
    };

    const handleSaveGuardianAssignment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const guardianId = formData.get('guardian_id');
        
        try {
            alert(`Funkcja przypisywania opiekuna ${guardianId} do ucznia ${selectedUser.id_ucznia} zostanie wkrótce zaimplementowana w API`);
            setShowAssignModal(false);
        } catch (err) {
            console.error('Błąd przypisywania opiekuna:', err);
            alert('Nie udało się przypisać opiekuna');
        }
    };

    const handleDeleteUser = async (userId, userType) => {
        if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            return;
        }
        
        try {
            if (userType === 'student') {
                await deleteStudent(userId);
            } else if (userType === 'teacher') {
                await deleteTeacher(userId);
            } else if (userType === 'guardian') {
                await deleteGuardian(userId);
            } else if (userType === 'administrator') {
                await deleteUser(userId);
            }
            
            alert('Użytkownik został usunięty!');
            await loadUsersData();
        } catch (err) {
            console.error('Błąd usuwania użytkownika:', err);
            alert('Nie udało się usunąć użytkownika');
        }
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
            id_opiekuna: userToEdit.id_opiekuna || '',
            pseudonim: userToEdit.pseudonim || '',
            nr_konta_bankowego: userToEdit.nr_konta_bankowego || userToEdit.nr_indy_konta_bankowego || ''
        });
        setShowUserModal(true);
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

    const filteredGuardians = guardians.filter(guardian =>
        searchTerm === '' || 
        `${guardian.imie} ${guardian.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guardian.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Ładowanie użytkowników...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Zarządzanie Użytkownikami</h1>
                    <p className="text-gray-600">Twórz, edytuj i zarządzaj użytkownikami systemu</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Uczniowie</p>
                                <p className="text-3xl font-bold text-blue-600">{students.length}</p>
                            </div>
                            <div className="text-4xl">👨‍🎓</div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Z grupą: {students.filter(s => s.id_grupa).length} | 
                            Bez grupy: {students.filter(s => !s.id_grupa).length}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Nauczyciele</p>
                                <p className="text-3xl font-bold text-green-600">{teachers.length}</p>
                            </div>
                            <div className="text-4xl">👨‍🏫</div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Aktywni nauczyciele
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Opiekunowie</p>
                                <p className="text-3xl font-bold text-purple-600">{guardians.length}</p>
                            </div>
                            <div className="text-4xl">👨‍👩‍👦</div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Opiekunowie uczniów
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => {
                                    setActiveTab('students');
                                    setSearchTerm('');
                                    setSelectedFilter('all');
                                }}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'students'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                👨‍🎓 Uczniowie ({students.length})
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('teachers');
                                    setSearchTerm('');
                                }}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'teachers'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                👨‍🏫 Nauczyciele ({teachers.length})
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('guardians');
                                    setSearchTerm('');
                                }}
                                className={`px-6 py-4 font-medium transition-colors ${
                                    activeTab === 'guardians'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                👨‍👩‍👦 Opiekunowie ({guardians.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'students' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista uczniów</h2>
                                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        <button
                                            onClick={() => handleCreateUser('uczen')}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            ➕ Dodaj ucznia
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imię i nazwisko</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupa</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opiekun</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
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
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.id_grupa ? (
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                Grupa #{student.id_grupa}
                                                            </span>
                                                        ) : (
                                                            <select
                                                                onChange={(e) => handleAssignToGroup(student.id_ucznia, e.target.value)}
                                                                className="text-xs px-2 py-1 border border-gray-300 rounded"
                                                                defaultValue=""
                                                            >
                                                                <option value="">Przypisz grupę</option>
                                                                {allGroups.map(group => (
                                                                    <option key={group.id_grupa} value={group.id_grupa}>
                                                                        Grupa #{group.id_grupa}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {student.id_opiekuna ? (
                                                            <span className="text-gray-700">ID: {student.id_opiekuna}</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAssignGuardian(student)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                Przypisz
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button 
                                                            onClick={() => handleEditUser(student, 'uczen')}
                                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(student.id_ucznia, 'student')}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredStudents.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            Nie znaleziono uczniów
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'teachers' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista nauczycieli</h2>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => handleCreateUser('nauczyciel')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                        >
                                            ➕ Dodaj nauczyciela
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTeachers.map((teacher) => (
                                        <div key={teacher.id_nauczyciela} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {teacher.imie?.[0]}{teacher.nazwisko?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {teacher.imie} {teacher.nazwisko}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        📧 {teacher.email || 'Brak'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleEditUser(teacher, 'nauczyciel')}
                                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                                >
                                                    ✏️ Edytuj
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(teacher.id_nauczyciela, 'teacher')}
                                                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                                >
                                                    🗑️ Usuń
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredTeachers.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        Nie znaleziono nauczycieli
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'guardians' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista opiekunów</h2>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => handleCreateUser('opiekun')}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                        >
                                            ➕ Dodaj opiekuna
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredGuardians.map((guardian) => (
                                        <div key={guardian.id_opiekuna} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {guardian.imie?.[0]}{guardian.nazwisko?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {guardian.imie} {guardian.nazwisko}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        📧 {guardian.email || 'Brak'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleEditUser(guardian, 'opiekun')}
                                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                                >
                                                    ✏️ Edytuj
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(guardian.id_opiekuna, 'guardian')}
                                                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                                >
                                                    🗑️ Usuń
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredGuardians.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        Nie znaleziono opiekunów
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {modalType === 'create' ? 'Dodaj użytkownika' : 'Edytuj użytkownika'}
                        </h2>

                        <form onSubmit={handleSaveUser}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rola *
                                    </label>
                                    <select
                                        value={userForm.rola}
                                        onChange={(e) => setUserForm({ ...userForm, rola: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="uczen">Uczeń</option>
                                        <option value="nauczyciel">Nauczyciel</option>
                                        <option value="opiekun">Opiekun</option>
                                        <option value="administrator">Administrator</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Imię *
                                        </label>
                                        <input
                                            type="text"
                                            value={userForm.imie}
                                            onChange={(e) => setUserForm({ ...userForm, imie: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nazwisko *
                                        </label>
                                        <input
                                            type="text"
                                            value={userForm.nazwisko}
                                            onChange={(e) => setUserForm({ ...userForm, nazwisko: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hasło *
                                    </label>
                                    <input
                                        type="password"
                                        value={userForm.haslo}
                                        onChange={(e) => setUserForm({ ...userForm, haslo: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required={modalType === 'create'}
                                    />
                                </div>

                                {userForm.rola === 'uczen' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pseudonim
                                        </label>
                                        <input
                                            type="text"
                                            value={userForm.pseudonim}
                                            onChange={(e) => setUserForm({ ...userForm, pseudonim: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Zostaw puste dla automatycznego"
                                        />
                                    </div>
                                )}

                                {(userForm.rola === 'nauczyciel' || userForm.rola === 'opiekun') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Numer konta bankowego
                                        </label>
                                        <input
                                            type="text"
                                            value={userForm.nr_konta_bankowego}
                                            onChange={(e) => setUserForm({ ...userForm, nr_konta_bankowego: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {modalType === 'create' ? 'Utwórz' : 'Zapisz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Przypisz opiekuna
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Uczeń: <strong>{selectedUser?.imie} {selectedUser?.nazwisko}</strong>
                        </p>

                        <form onSubmit={handleSaveGuardianAssignment}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Wybierz opiekuna
                                </label>
                                <select
                                    name="guardian_id"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Wybierz...</option>
                                    {guardians.map(guardian => (
                                        <option key={guardian.id_ucznia} value={guardian.id_ucznia}>
                                            {guardian.imie} {guardian.nazwisko}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Przypisz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
