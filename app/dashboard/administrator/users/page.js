'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '/context/AuthContext';
import { getStudents, createStudent, updateStudent, deleteStudent, enrollStudentToGroup, assignGuardianToStudent } from '/lib/api/student.api';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '/lib/api/teacher.api';
import { getAllGuardians, createGuardian, updateGuardian, deleteGuardian } from '/lib/api/guardian.api';
import { getAdministrators, createAdministrator, deleteAdministrator } from '/lib/api/administrator.api';
import { getCourses, getCourseGroups } from '/lib/api/course.api';
import { createUser, getUserById, updateUser, deleteUser } from '/lib/api/users.api';
import { adjustStudentCount } from '/lib/api/group.api';
import { updateStudentPoints, getStudentPoints } from '/lib/api/student-points.api';
import PageHeader from '../../../../components/PageHeader';

export default function UsersManagement() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');
    
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [guardians, setGuardians] = useState([]);
    const [administrators, setAdministrators] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
    const [showPointsModal, setShowPointsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState('');
    const [guardianSearchTerm, setGuardianSearchTerm] = useState('');
    const [newRole, setNewRole] = useState('');
    const [pointsForm, setPointsForm] = useState({
        points: '',
        operation: 'add' 
    });
    
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
            
            const [studentsData, teachersData, guardiansData, administratorsData, coursesData] = await Promise.all([
                getStudents(),
                getTeachers(),
                getAllGuardians(),
                getAdministrators(),
                getCourses()
            ]);

            const studentsWithUserData = await Promise.all(
                (studentsData || []).map(async (student) => {
                    try {
                        const userData = await getUserById(student.id_ucznia);
                        let guardianData = null;
                        if (student.Opiekun_id_opiekuna) {
                            try {
                                guardianData = await getUserById(student.Opiekun_id_opiekuna);
                            } catch (err) {
                                console.error(`Błąd pobierania danych opiekuna ${student.Opiekun_id_opiekuna}:`, err);
                            }
                        }
                        return { ...student, ...userData, opiekun: guardianData };
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
            setAdministrators(administratorsData || []);
            
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
                    if (!userForm.id_grupa || !userForm.id_opiekuna) {
                        throw new Error('Wybierz grupę i opiekuna dla ucznia');
                    }
                    
                    await createStudent({
                        id_ucznia: userId,
                        id_grupa: parseInt(userForm.id_grupa),
                        Opiekun_id_opiekuna: parseInt(userForm.id_opiekuna),
                        saldo_punktow: 0,
                        pseudonim: userForm.pseudonim || `${userForm.imie}_${userForm.nazwisko}`
                    });
                    
                   
                    await adjustStudentCount(parseInt(userForm.id_grupa), 1);
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
            
            if (err.message && err.message.includes('Wybierz grupę i opiekuna')) {
                alert(err.message);
            } else {
                alert('Nie udało się zapisać użytkownika: ' + (err.message || 'Nieznany błąd'));
            }
        }
    };

    const handleAssignToGroup = async (studentId, groupId) => {
        if (!groupId || groupId === '') {
            alert('Wybierz grupę');
            return;
        }
        
        try {
            console.log('Przypisywanie ucznia do grupy:', { studentId, groupId });
            await enrollStudentToGroup(studentId, parseInt(groupId));
            
           
            await adjustStudentCount(parseInt(groupId), 1);
            
            alert('Uczeń został przypisany do grupy!');
            await loadUsersData();
        } catch (err) {
            console.error('Błąd przypisywania do grupy:', err);
            alert('Nie udało się przypisać ucznia do grupy: ' + (err.message || 'Nieznany błąd'));
        }
    };

    const handleRemoveFromGroup = async (studentId) => {
        if (!confirm('Czy na pewno chcesz usunąć przypisanie do grupy?')) {
            return;
        }
        
        try {
            
            const student = students.find(s => s.id_ucznia === studentId);
            const oldGroupId = student?.id_grupa;
            
            await enrollStudentToGroup(studentId, null);
            
            
            if (oldGroupId) {
                await adjustStudentCount(oldGroupId, -1);
            }
            
            alert('Uczeń został usunięty z grupy!');
            await loadUsersData();
        } catch (err) {
            console.error('Błąd usuwania z grupy:', err);
            alert('Nie udało się usunąć ucznia z grupy: ' + (err.message || 'Nieznany błąd'));
        }
    };

    const handleAssignGuardian = (student) => {
        setSelectedUser(student);
        setGuardianSearchTerm('');
        setShowAssignModal(true);
    };

    const handleSaveGuardianAssignment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const guardianId = formData.get('guardian_id');
        
        if (!guardianId) {
            alert('Wybierz opiekuna');
            return;
        }
        
        try {
            await assignGuardianToStudent(selectedUser.id_ucznia, parseInt(guardianId));
            alert('Opiekun został przypisany pomyślnie!');
            setShowAssignModal(false);
            setGuardianSearchTerm('');
            await loadUsersData();
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
           
            let oldGroupId = null;
            if (userType === 'student') {
                const student = students.find(s => s.id_ucznia === userId);
                oldGroupId = student?.id_grupa;
            }
            
        
            if (userType === 'guardian') {
               
                const studentsOfGuardian = students.filter(s => s.Opiekun_id_opiekuna === userId);
                console.log('Uczniowie opiekuna:', studentsOfGuardian);
                
                if (studentsOfGuardian.length > 0) {
                    const studentNames = studentsOfGuardian.map(s => `${s.imie} ${s.nazwisko}`).join(', ');
                    alert(`❌ Nie można usunąć opiekuna!\n\nOpiekun ma przypisanych uczniów: ${studentNames}\n\nNajpierw usuń lub przepisz uczniów do innego opiekuna, a następnie usuń opiekuna.`);
                    return; 
                }
            } else if (userType === 'teacher') {
                
            }
            
     
            if (userType === 'student') {
                await deleteStudent(userId);
            } else if (userType === 'teacher') {
                await deleteTeacher(userId);
            } else if (userType === 'guardian') {
                await deleteGuardian(userId);
            } else if (userType === 'administrator') {
                await deleteAdministrator(userId);
            }
            
          
            try {
                await deleteUser(userId);
            } catch (err) {
                console.warn('Błąd usuwania głównego rekordu użytkownika (możliwe że już nie istnieje):', err);
               
            }
            
        
            if (userType === 'student' && oldGroupId) {
                await adjustStudentCount(oldGroupId, -1);
            }
            
            alert('✅ Użytkownik został usunięty!');
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

    const handleOpenPointsModal = async (student) => {
        try {
            setSelectedUser(student);
            setPointsForm({
                points: '',
                operation: 'add'
            });
            setShowPointsModal(true);
        } catch (err) {
            console.error('Błąd przy otwieraniu modala punktów:', err);
            alert('Błąd przy otwieraniu modala punktów');
        }
    };

    const handleUpdatePoints = async (e) => {
        e.preventDefault();
        
        if (!selectedUser || !pointsForm.points || isNaN(pointsForm.points)) {
            alert('Wprowadź poprawną liczbę punktów');
            return;
        }

        const pointsToUpdate = parseInt(pointsForm.points);
        if (pointsToUpdate <= 0) {
            alert('Liczba punktów musi być większa od 0');
            return;
        }

        const delta = pointsForm.operation === 'add' ? pointsToUpdate : -pointsToUpdate;
        
        if (!confirm(`Czy na pewno chcesz ${pointsForm.operation === 'add' ? 'dodać' : 'odjąć'} ${pointsToUpdate} punktów uczniowi ${selectedUser.imie} ${selectedUser.nazwisko}?`)) {
            return;
        }

        try {
            await updateStudentPoints(selectedUser.id_ucznia, delta);
            
            
            setStudents(prev => prev.map(student => 
                student.id_ucznia === selectedUser.id_ucznia 
                    ? { 
                        ...student, 
                        saldo_punktow: Math.max(0, (student.saldo_punktow || 0) + delta)
                    }
                    : student
            ));
            
            setShowPointsModal(false);
            setPointsForm({ points: '', operation: 'add' });
            alert('✅ Punkty zostały zaktualizowane!');
            
        } catch (err) {
            console.error('Błąd przy aktualizacji punktów:', err);
            alert('Błąd przy aktualizacji punktów: ' + (err.message || 'Nieznany błąd'));
        }
    };

    const handleOpenRoleChange = (userToEdit, currentRole) => {
        setSelectedUser(userToEdit);
        setNewRole(currentRole);
        setShowRoleChangeModal(true);
    };

    const handleChangeRole = async () => {
        if (!selectedUser || !newRole) {
            alert('Wybierz nową rolę');
            return;
        }

        const userId = selectedUser.id_ucznia || selectedUser.id_nauczyciela || selectedUser.id_opiekuna || selectedUser.id_uzytkownika;
        const oldRole = selectedUser.rola || (selectedUser.id_ucznia ? 'uczen' : selectedUser.id_nauczyciela ? 'nauczyciel' : 'opiekun');

        if (oldRole === newRole) {
            alert('Nowa rola jest taka sama jak obecna');
            return;
        }

        if (!confirm(`Czy na pewno chcesz zmienić rolę użytkownika ${selectedUser.imie} ${selectedUser.nazwisko} z "${oldRole}" na "${newRole}"? To spowoduje usunięcie danych z tabeli "${oldRole}" i utworzenie w tabeli "${newRole}".`)) {
            return;
        }

        try {
            
            if (oldRole === 'uczen') {
                await deleteStudent(userId);
            } else if (oldRole === 'nauczyciel') {
                await deleteTeacher(userId);
            } else if (oldRole === 'opiekun') {
                await deleteGuardian(userId);
            } else if (oldRole === 'administrator') {
                await deleteAdministrator(userId);
            }

          
            await updateUser(userId, { rola: newRole });

          
            if (newRole === 'uczen') {
                await createStudent({
                    id_ucznia: userId,
                    id_grupa: null,
                    Opiekun_id_opiekuna: null,
                    saldo_punktow: 0,
                    pseudonim: `${selectedUser.imie}_${selectedUser.nazwisko}`
                });
            } else if (newRole === 'nauczyciel') {
                await createTeacher({
                    id_nauczyciela: userId,
                    numer_nauczyciela: Math.floor(Math.random() * 10000),
                    nr_konta_bankowego: ''
                });
            } else if (newRole === 'opiekun') {
                await createGuardian({
                    id_opiekuna: userId,
                    nr_indy_konta_bankowego: ''
                });
            } else if (newRole === 'administrator') {
                await createAdministrator({
                    id_administratora: userId
                });
            }

            alert(`Rola użytkownika została zmieniona z "${oldRole}" na "${newRole}"!`);
            setShowRoleChangeModal(false);
            await loadUsersData();
        } catch (err) {
            console.error('Błąd zmiany roli:', err);
            alert('Nie udało się zmienić roli użytkownika: ' + (err.message || 'Nieznany błąd'));
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

    const filteredGuardians = guardians.filter(guardian =>
        searchTerm === '' || 
        `${guardian.imie} ${guardian.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guardian.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAdministrators = administrators.filter(admin =>
        searchTerm === '' || 
        `${admin.user?.imie} ${admin.user?.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <>
            <PageHeader 
                title="👥 Zarządzanie Użytkownikami"
                description="Twórz, edytuj i zarządzaj użytkownikami systemu"
            />
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">

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
                        <nav className="flex flex-col">
                            <button
                                onClick={() => {
                                    setActiveTab('students');
                                    setSearchTerm('');
                                    setSelectedFilter('all');
                                }}
                                className={`px-6 py-4 font-medium transition-colors text-left ${
                                    activeTab === 'students'
                                        ? 'border-l-4 border-blue-600 text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                                👨‍🎓 Uczniowie ({students.length})
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('teachers');
                                    setSearchTerm('');
                                }}
                                className={`px-6 py-4 font-medium transition-colors text-left ${
                                    activeTab === 'teachers'
                                        ? 'border-l-4 border-blue-600 text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                                👨‍🏫 Nauczyciele ({teachers.length})
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('guardians');
                                    setSearchTerm('');
                                }}
                                className={`px-6 py-4 font-medium transition-colors text-left ${
                                    activeTab === 'guardians'
                                        ? 'border-l-4 border-blue-600 text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                                👨‍👩‍👦 Opiekunowie ({guardians.length})
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('administrators');
                                    setSearchTerm('');
                                }}
                                className={`px-6 py-4 font-medium transition-colors text-left ${
                                    activeTab === 'administrators'
                                        ? 'border-l-4 border-blue-600 text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                                🔑 Administratorzy ({administrators.length})
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punkty</th>
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
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                    Grupa #{student.id_grupa}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleRemoveFromGroup(student.id_ucznia)}
                                                                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                                    title="Usuń z grupy"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 text-sm font-bold rounded-full bg-yellow-100 text-yellow-800">
                                                                ⭐ {student.saldo_punktow || 0}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {student.Opiekun_id_opiekuna ? (
                                                            <div className="flex items-center gap-2">
                                                                <div>
                                                                    <div className="text-gray-900 font-medium">
                                                                        {student.opiekun ? `${student.opiekun.imie} ${student.opiekun.nazwisko}` : `ID: ${student.Opiekun_id_opiekuna}`}
                                                                    </div>
                                                                    {student.opiekun && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {student.opiekun.email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAssignGuardian(student)}
                                                                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                                                                    title="Zmień opiekuna"
                                                                >
                                                                    🔄 Zmień
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAssignGuardian(student)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                ➕ Przypisz
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button 
                                                            onClick={() => handleOpenRoleChange(student, 'uczen')}
                                                            className="text-purple-600 hover:text-purple-800 mr-3"
                                                            title="Zmień rolę"
                                                        >
                                                            🔄
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEditUser(student, 'uczen')}
                                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenPointsModal(student)}
                                                            className="text-yellow-600 hover:text-yellow-800 mr-3"
                                                            title="Zarządzaj punktami"
                                                        >
                                                            ⭐
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
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista nauczycieli</h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                        />
                                        <button
                                            onClick={() => handleCreateUser('nauczyciel')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium w-full sm:w-auto"
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
                                                    onClick={() => handleOpenRoleChange(teacher, 'nauczyciel')}
                                                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                                >
                                                    🔄 Rola
                                                </button>
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
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista opiekunów</h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                        />
                                        <button
                                            onClick={() => handleCreateUser('opiekun')}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium w-full sm:w-auto"
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
                                                    onClick={() => handleOpenRoleChange(guardian, 'opiekun')}
                                                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                                >
                                                    🔄 Rola
                                                </button>
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

                        {activeTab === 'administrators' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Lista administratorów</h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="🔍 Szukaj..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAdministrators.map((admin) => (
                                        <div key={admin.id_administratora} className="bg-white border-2 border-yellow-200 rounded-lg p-6 shadow-md">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {admin.user?.imie?.[0]}{admin.user?.nazwisko?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {admin.user?.imie} {admin.user?.nazwisko}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        📧 {admin.user?.email || 'Brak'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        ID: {admin.id_administratora}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                                <span className="text-xs font-bold text-yellow-700 uppercase">🔑 Administrator</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredAdministrators.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        Nie znaleziono administratorów
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
                                {modalType === 'create' && (
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
                                )}

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
                                    <>
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
                                        
                                        {(modalType === 'create') && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Grupa *
                                                    </label>
                                                    <select
                                                        value={userForm.id_grupa}
                                                        onChange={(e) => setUserForm({ ...userForm, id_grupa: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    >
                                                        <option value="">Wybierz grupę...</option>
                                                        {allGroups.map(group => (
                                                            <option key={group.id_grupa} value={group.id_grupa}>
                                                                Grupa #{group.id_grupa} - {group.nazwa_grupy || group.numer_grupy}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Opiekun *
                                                    </label>
                                                    <select
                                                        value={userForm.id_opiekuna}
                                                        onChange={(e) => setUserForm({ ...userForm, id_opiekuna: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    >
                                                        <option value="">Wybierz opiekuna...</option>
                                                        {guardians.map(guardian => (
                                                            <option key={guardian.id_opiekuna} value={guardian.id_opiekuna}>
                                                                {guardian.imie} {guardian.nazwisko} ({guardian.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </>
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
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Wyszukaj opiekuna
                                </label>
                                <input
                                    type="text"
                                    placeholder="Szukaj po imieniu, nazwisku lub emailu..."
                                    value={guardianSearchTerm}
                                    onChange={(e) => setGuardianSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Wybierz opiekuna
                                </label>
                                <select
                                    name="guardian_id"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                    size="5"
                                >
                                    <option value="">Wybierz...</option>
                                    {guardians.filter(guardian => 
                                        guardianSearchTerm === '' ||
                                        `${guardian.imie} ${guardian.nazwisko}`.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                                        guardian.email?.toLowerCase().includes(guardianSearchTerm.toLowerCase())
                                    ).map(guardian => (
                                        <option key={guardian.id_opiekuna} value={guardian.id_opiekuna}>
                                            {guardian.imie} {guardian.nazwisko} ({guardian.email})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Znaleziono: {guardians.filter(guardian => 
                                        guardianSearchTerm === '' ||
                                        `${guardian.imie} ${guardian.nazwisko}`.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                                        guardian.email?.toLowerCase().includes(guardianSearchTerm.toLowerCase())
                                    ).length} opiekunów
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setGuardianSearchTerm('');
                                    }}
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

            {showRoleChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            🔄 Zmień rolę użytkownika
                        </h2>

                        <div className="mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="text-sm text-gray-700 mb-2">
                                    <strong>Użytkownik:</strong> {selectedUser?.imie} {selectedUser?.nazwisko}
                                </div>
                                <div className="text-sm text-gray-700">
                                    <strong>Obecna rola:</strong> 
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        {selectedUser?.rola || (selectedUser?.id_ucznia ? 'uczen' : selectedUser?.id_nauczyciela ? 'nauczyciel' : 'opiekun')}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 text-xl">⚠️</span>
                                    <div className="text-sm text-gray-700">
                                        <strong>Uwaga!</strong> Zmiana roli spowoduje:
                                        <ul className="list-disc ml-5 mt-2 space-y-1">
                                            <li>Usunięcie danych z tabeli starej roli</li>
                                            <li>Zmianę roli w tabeli użytkowników</li>
                                            <li>Utworzenie wpisu w tabeli nowej roli</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nowa rola:
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="uczen">👨‍🎓 Uczeń</option>
                                    <option value="nauczyciel">👨‍🏫 Nauczyciel</option>
                                    <option value="opiekun">👨‍👩‍👦 Opiekun</option>
                                    <option value="administrator">🔑 Administrator</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRoleChangeModal(false);
                                    setSelectedUser(null);
                                    setNewRole('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                onClick={handleChangeRole}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Zmień rolę
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPointsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            ⭐ Zarządzaj punktami
                        </h2>
                        
                        {selectedUser && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Uczeń:</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {selectedUser.imie} {selectedUser.nazwisko}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Aktualne punkty: <span className="font-bold text-yellow-600">⭐ {selectedUser.saldo_punktow || 0}</span>
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleUpdatePoints}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Operacja:
                                    </label>
                                    <select
                                        value={pointsForm.operation}
                                        onChange={(e) => setPointsForm({ ...pointsForm, operation: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    >
                                        <option value="add">➕ Dodaj punkty</option>
                                        <option value="subtract">➖ Odejmij punkty</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Liczba punktów:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={pointsForm.points}
                                        onChange={(e) => setPointsForm({ ...pointsForm, points: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                        placeholder="Wprowadź liczbę punktów"
                                        required
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Zasady punktów:</strong>
                                    </p>
                                    <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                                        <li>+1 punkt za obecność na zajęciach</li>
                                        <li>-1 punkt za zmianę obecności na "nie określone"</li>
                                        <li>-5 punktów za uwagę</li>
                                        <li>Punkty nie mogą być ujemne (minimum 0)</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPointsModal(false);
                                        setSelectedUser(null);
                                        setPointsForm({ points: '', operation: 'add' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                    {pointsForm.operation === 'add' ? '➕' : '➖'} Zaktualizuj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
