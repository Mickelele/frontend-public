'use client';

import { useState, useEffect } from 'react';
import { 
    getCourses, 
    createCourse, 
    updateCourse, 
    deleteCourse 
} from '../../../../lib/api/course.api';
import { 
    getAllGroups, 
    createGroup, 
    updateGroup, 
    deleteGroup,
    getGroupStudents,
    assignStudentToGroup,
    removeStudentFromGroup,
    adjustStudentCount
} from '../../../../lib/api/group.api';
import { 
    getLessonsForGroup,
    createLesson, 
    updateLesson, 
    deleteLesson,
    createLessonsForGroup
} from '../../../../lib/api/lesson.api';
import { 
    getAllRooms, 
    createRoom, 
    updateRoom, 
    deleteRoom 
} from '../../../../lib/api/room.api';
import { getTeachers } from '../../../../lib/api/teacher.api';
import { getStudents, updateStudent } from '../../../../lib/api/student.api';
import { getUserById } from '../../../../lib/api/users.api';

export default function CoursesManagementPage() {
    const [activeTab, setActiveTab] = useState('courses');
    const [loading, setLoading] = useState(true);

    
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);

    
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStudentManagement, setShowStudentManagement] = useState(false);
    const [showRoomAvailability, setShowRoomAvailability] = useState(false);
    const [showBulkLessonModal, setShowBulkLessonModal] = useState(false);
    const [availabilityForm, setAvailabilityForm] = useState({
        id_sali: '',
        data: '',
        godzina_od: '',
        godzina_do: ''
    });
    const [availabilityResults, setAvailabilityResults] = useState(null);
    const [availabilityLocationFilter, setAvailabilityLocationFilter] = useState('');

   
    const [editingCourse, setEditingCourse] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupStudents, setGroupStudents] = useState([]);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [searchStudentTerm, setSearchStudentTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
    const [selectedLocationFilter, setSelectedLocationFilter] = useState('');
    const [selectedDayFilter, setSelectedDayFilter] = useState('');
    const [selectedCourseFilterLessons, setSelectedCourseFilterLessons] = useState('');
    const [selectedGroupFilterLessons, setSelectedGroupFilterLessons] = useState('');
    const [searchLessonTerm, setSearchLessonTerm] = useState('');
    const [selectedLocationFilterRooms, setSelectedLocationFilterRooms] = useState('');


    const [courseForm, setCourseForm] = useState({ 
        nazwa_kursu: '', 
        data_rozpoczecia: '', 
        data_zakonczenia: '' 
    });
    const [groupForm, setGroupForm] = useState({ 
        Kurs_id_kursu: '', 
        id_nauczyciela: '',
        godzina: '',
        dzien_tygodnia: ''
    });
    const [lessonForm, setLessonForm] = useState({
        id_grupy: '',
        data: '',
        tematZajec: '',
        Sala_id_sali: ''
    });
    const [roomForm, setRoomForm] = useState({ 
        numer: '', 
        lokalizacja: '',
        ilosc_miejsc: '' 
    });
    const [bulkLessonForm, setBulkLessonForm] = useState({
        id_grupa: ''
    });
    const [bulkLessonLoading, setBulkLessonLoading] = useState(false);
    const [bulkLessonSuccess, setBulkLessonSuccess] = useState(null);
    const [groupSearchTerm, setGroupSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'courses') {
                const coursesData = await getCourses();
                setCourses(Array.isArray(coursesData) ? coursesData : (coursesData?.data || []));
            } else if (activeTab === 'groups') {
                const [groupsData, coursesData, teachersData] = await Promise.all([
                    getAllGroups(),
                    getCourses(),
                    getTeachers()
                ]);
                setGroups(groupsData || []);
                setCourses(coursesData || []);
                setTeachers(teachersData || []);
            } else if (activeTab === 'lessons') {
                const [groupsData, teachersData, roomsData] = await Promise.all([
                    getAllGroups(),
                    getTeachers(),
                    getAllRooms()
                ]);
                
                
                const allLessons = [];
                for (const group of (groupsData || [])) {
                    try {
                        const groupLessons = await getLessonsForGroup(group.id_grupa);
                        allLessons.push(...(groupLessons || []));
                    } catch (error) {
                        console.error(`Błąd pobierania zajęć dla grupy ${group.id_grupa}:`, error);
                    }
                }
                
                setLessons(allLessons);
                setGroups(groupsData || []);
                setTeachers(teachersData || []);
                setRooms(roomsData || []);
            } else if (activeTab === 'rooms') {
                const roomsData = await getAllRooms();
                setRooms(roomsData || []);
            }
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
        }
        setLoading(false);
    };

   
    const handleSaveCourse = async () => {
        try {
           
            const startDate = new Date(courseForm.data_rozpoczecia);
            const endDate = new Date(courseForm.data_zakonczenia);
            
            if (endDate <= startDate) {
                alert('Data zakończenia musi być późniejsza niż data rozpoczęcia!');
                return;
            }
            
            if (editingCourse) {
                await updateCourse(editingCourse.id_kursu, courseForm);
            } else {
                await createCourse(courseForm);
            }
            setShowCourseModal(false);
            setCourseForm({ nazwa_kursu: '', data_rozpoczecia: '', data_zakonczenia: '' });
            setEditingCourse(null);
            loadData();
        } catch (error) {
            console.error('Błąd zapisywania kursu:', error);
            alert('Nie udało się zapisać kursu');
        }
    };

    const handleEditCourse = (course) => {
        setEditingCourse(course);
        setCourseForm({
            nazwa_kursu: course.nazwa_kursu,
            data_rozpoczecia: course.data_rozpoczecia ? course.data_rozpoczecia.split('T')[0] : '',
            data_zakonczenia: course.data_zakonczenia ? course.data_zakonczenia.split('T')[0] : ''
        });
        setShowCourseModal(true);
    };

    const handleDeleteCourse = async () => {
        try {
            await deleteCourse(deleteTarget.id_kursu);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            loadData();
        } catch (error) {
            console.error('Błąd usuwania kursu:', error);
            alert('Nie udało się usunąć kursu');
        }
    };

 
    const handleSaveGroup = async () => {
        try {
            const formData = {
                Kurs_id_kursu: Number(groupForm.Kurs_id_kursu),
                id_nauczyciela: Number(groupForm.id_nauczyciela),
                godzina: groupForm.godzina,
                dzien_tygodnia: groupForm.dzien_tygodnia
            };
            
            if (editingGroup) {
                await updateGroup(editingGroup.id_grupa, formData);
            } else {
                await createGroup(formData);
            }
            setShowGroupModal(false);
            setGroupForm({ Kurs_id_kursu: '', id_nauczyciela: '', godzina: '', dzien_tygodnia: '' });
            setEditingGroup(null);
            loadData();
        } catch (error) {
            console.error('Błąd zapisywania grupy:', error);
            alert('Nie udało się zapisać grupy');
        }
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setGroupForm({
            Kurs_id_kursu: group.Kurs_id_kursu || '',
            id_nauczyciela: group.id_nauczyciela || '',
            godzina: group.godzina || '',
            dzien_tygodnia: group.dzien_tygodnia || ''
        });
        setShowGroupModal(true);
    };

    const handleDeleteGroup = async () => {
        if (deleteConfirmText !== 'USUN') {
            alert('Musisz wpisać słowo "USUN" aby potwierdzić usunięcie grupy');
            return;
        }
        
        try {
            await deleteGroup(deleteTarget.id_grupa);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            setDeleteConfirmText('');
            loadData();
        } catch (error) {
            console.error('Błąd usuwania grupy:', error);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            setDeleteConfirmText('');
            alert('Nie udało się usunąć grupy: ' + error.message);
        }
    };

    const handleManageStudents = async (group) => {
        try {
            setSelectedGroup(group);
            const [studentsInGroup, allStudents] = await Promise.all([
                getGroupStudents(group.id_grupa),
                getStudents()
            ]);
            console.log('Students in group:', studentsInGroup);
            console.log('All students:', allStudents);
            
         
            const studentsWithUserData = await Promise.all(
                (studentsInGroup || []).map(async (student) => {
                    try {
                        const userData = await getUserById(student.id_ucznia);
                        return { ...student, user: userData };
                    } catch (error) {
                        console.error(`Błąd pobierania danych użytkownika ${student.id_ucznia}:`, error);
                        return student;
                    }
                })
            );
            
           
            const allStudentsWithUserData = await Promise.all(
                (allStudents || []).map(async (student) => {
                    try {
                        const userData = await getUserById(student.id_ucznia);
                        return { ...student, user: userData };
                    } catch (error) {
                        console.error(`Błąd pobierania danych użytkownika ${student.id_ucznia}:`, error);
                        return student;
                    }
                })
            );
            
            console.log('Students with user data:', studentsWithUserData);
            console.log('All students with user data:', allStudentsWithUserData);
            
            setGroupStudents(studentsWithUserData);
            setStudents(allStudentsWithUserData);
            setShowStudentManagement(true);
        } catch (error) {
            console.error('Błąd ładowania uczniów:', error);
        }
    };

    const handleAddStudentToGroup = async (studentId) => {
        try {
       
            await updateStudent(studentId, { id_grupa: selectedGroup.id_grupa });
            
        
            await adjustStudentCount(selectedGroup.id_grupa, 1);
            
            await handleManageStudents(selectedGroup);
           
            const updatedGroups = await getAllGroups();
            setGroups(updatedGroups || []);
        } catch (error) {
            console.error('Błąd dodawania ucznia do grupy:', error);
            alert('Nie udało się dodać ucznia do grupy');
        }
    };

    const handleRemoveStudentFromGroup = async (studentId) => {
        try {
          
            await updateStudent(studentId, { id_grupa: null });
            
        
            await adjustStudentCount(selectedGroup.id_grupa, -1);
            
            await handleManageStudents(selectedGroup);
        
            const updatedGroups = await getAllGroups();
            setGroups(updatedGroups || []);
        } catch (error) {
            console.error('Błąd usuwania ucznia z grupy:', error);
            alert('Nie udało się usunąć ucznia z grupy');
        }
    };


    const handleSaveLesson = async () => {
        try {
            const formData = {
                id_grupy: parseInt(lessonForm.id_grupy),
                Sala_id_sali: parseInt(lessonForm.Sala_id_sali),
                tematZajec: lessonForm.tematZajec,
                data: lessonForm.data,
                notatki_od_nauczyciela: 'Brak'
            };
            
            if (editingLesson) {
                await updateLesson(editingLesson.id_zajec, formData);
            } else {
                await createLesson(formData);
            }
            setShowLessonModal(false);
            setLessonForm({
                id_grupy: '',
                data: '',
                tematZajec: '',
                Sala_id_sali: ''
            });
            setSelectedLocation('');
            setEditingLesson(null);
            loadData();
        } catch (error) {
            console.error('Błąd zapisywania zajęć:', error);
            alert('Nie udało się zapisać zajęć');
        }
    };

    const handleCreateLessonsForGroup = async () => {
        try {
            if (!bulkLessonForm.id_grupa) {
                return;
            }

            setBulkLessonLoading(true);
            setBulkLessonSuccess(null);

            const result = await createLessonsForGroup(parseInt(bulkLessonForm.id_grupa));
            
            setBulkLessonSuccess(`Pomyślnie utworzono ${result.zajecia?.length || 'wiele'} zajęć dla grupy`);
            
         
            setBulkLessonForm({ id_grupa: '' });
            
        
            loadData();
            
         
            setTimeout(() => {
                setShowBulkLessonModal(false);
                setBulkLessonSuccess(null);
            }, 2000);

        } catch (error) {
            console.error('Błąd tworzenia zajęć dla grupy:', error);
            setBulkLessonSuccess('❌ Nie udało się stworzyć zajęć dla grupy');
        } finally {
            setBulkLessonLoading(false);
        }
    };

    const handleEditLesson = (lesson) => {
        setEditingLesson(lesson);
       
        const room = rooms.find(r => r.id_sali === lesson.Sala_id_sali);
        if (room) {
            setSelectedLocation(room.lokalizacja);
        }
        
        setLessonForm({
            id_grupy: lesson.id_grupy || '',
            data: lesson.data ? lesson.data.split('T')[0] : '',
            tematZajec: lesson.tematZajec || '',
            Sala_id_sali: lesson.Sala_id_sali || ''
        });
        setShowLessonModal(true);
    };

    const handleDeleteLesson = async () => {
        try {
            await deleteLesson(deleteTarget.id_zajec);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            loadData();
        } catch (error) {
            console.error('Błąd usuwania zajęć:', error);
            alert('Nie udało się usunąć zajęć');
        }
    };

   
    const handleSaveRoom = async () => {
        try {
            const numer = parseInt(roomForm.numer);
            const ilosc_miejsc = parseInt(roomForm.ilosc_miejsc);
            
            if (isNaN(numer) || isNaN(ilosc_miejsc)) {
                alert('Numer sali i ilość miejsc muszą być liczbami');
                return;
            }
            
            const formData = {
                numer: numer,
                lokalizacja: roomForm.lokalizacja.trim(),
                ilosc_miejsc: ilosc_miejsc
            };
            
            if (editingRoom) {
                await updateRoom(editingRoom.id_sali, formData);
            } else {
                await createRoom(formData);
            }
            setShowRoomModal(false);
            setRoomForm({ numer: '', lokalizacja: '', ilosc_miejsc: '' });
            setEditingRoom(null);
            loadData();
        } catch (error) {
            console.error('Błąd zapisywania sali:', error);
            alert('Nie udało się zapisać sali');
        }
    };

    const handleCheckAvailability = () => {
        const { id_sali, data, godzina_od, godzina_do } = availabilityForm;
        
        if (!id_sali || !data || !godzina_od || !godzina_do) {
            alert('Wypełnij wszystkie pola');
            return;
        }
        
        
        if (godzina_od >= godzina_do) {
            alert('Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia');
            return;
        }
        
        
        const roomLessons = lessons.filter(lesson => {
            if (lesson.Sala_id_sali !== parseInt(id_sali)) return false;
            if (!lesson.data) return false;
            
            const lessonDate = lesson.data.split('T')[0];
            return lessonDate === data;
        });
        
        
        const conflicts = roomLessons.filter(lesson => {
            const group = groups.find(g => g.id_grupa === lesson.id_grupy);
            if (!group || !group.godzina) return false;
            
            const lessonStart = group.godzina.substring(0, 5);
            
            const [hours, minutes] = lessonStart.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 90;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const lessonEnd = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
            
          
            return !(godzina_do <= lessonStart || godzina_od >= lessonEnd);
        });
        
        const room = rooms.find(r => r.id_sali === parseInt(id_sali));
        
        setAvailabilityResults({
            room: room,
            isAvailable: conflicts.length === 0,
            conflicts: conflicts.map(lesson => {
                const group = groups.find(g => g.id_grupa === lesson.id_grupy);
                const course = courses.find(c => c.id_kursu === group?.Kurs_id_kursu);
                const teacher = teachers.find(t => t.id_nauczyciela === group?.id_nauczyciela);
                return {
                    ...lesson,
                    group,
                    course,
                    teacher,
                    time: group?.godzina?.substring(0, 5)
                };
            }),
            allLessons: roomLessons.map(lesson => {
                const group = groups.find(g => g.id_grupa === lesson.id_grupy);
                const course = courses.find(c => c.id_kursu === group?.Kurs_id_kursu);
                const teacher = teachers.find(t => t.id_nauczyciela === group?.id_nauczyciela);
                return {
                    ...lesson,
                    group,
                    course,
                    teacher,
                    time: group?.godzina?.substring(0, 5)
                };
            })
        });
    };

   
    const isRoomOccupied = (roomId, date, groupId) => {
        if (!date || !groupId) return false;
        
        const selectedGroup = groups.find(g => g.id_grupa === parseInt(groupId));
        if (!selectedGroup || !selectedGroup.godzina) return false;
        
        const selectedTime = selectedGroup.godzina.substring(0, 5);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + 90; 
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        const selectedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        
       
        const conflicts = lessons.filter(lesson => {
           
            if (editingLesson && lesson.id_zajec === editingLesson.id_zajec) return false;
            
            if (lesson.Sala_id_sali !== parseInt(roomId)) return false;
            if (!lesson.data) return false;
            
            const lessonDate = lesson.data.split('T')[0];
            if (lessonDate !== date) return false;
            
            const lessonGroup = groups.find(g => g.id_grupa === lesson.id_grupy);
            if (!lessonGroup || !lessonGroup.godzina) return false;
            
            const lessonStart = lessonGroup.godzina.substring(0, 5);
            const [lHours, lMinutes] = lessonStart.split(':').map(Number);
            const lTotalMinutes = lHours * 60 + lMinutes + 90;
            const lEndHours = Math.floor(lTotalMinutes / 60);
            const lEndMinutes = lTotalMinutes % 60;
            const lessonEnd = `${String(lEndHours).padStart(2, '0')}:${String(lEndMinutes).padStart(2, '0')}`;
            
           
            return !(selectedEndTime <= lessonStart || selectedTime >= lessonEnd);
        });
        
        return conflicts.length > 0;
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setRoomForm({
            numer: room.numer || '',
            lokalizacja: room.lokalizacja || '',
            ilosc_miejsc: room.ilosc_miejsc || ''
        });
        setShowRoomModal(true);
    };

    const handleDeleteRoom = async () => {
        try {
            await deleteRoom(deleteTarget.id_sali);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            loadData();
        } catch (error) {
            console.error('Błąd usuwania sali:', error);
            alert('Nie udało się usunąć sali');
        }
    };

    const openDeleteConfirm = (type, item) => {
        setDeleteTarget({ type, ...item });
        setDeleteConfirmText('');
        setShowDeleteConfirm(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        📚 Zarządzanie Kursami
                    </h1>
                    <p className="text-gray-600">
                        Pełna kontrola nad kursami, grupami, zajęciami i salami
                    </p>
                </div>

              
                <div className="flex flex-col sm:flex-row gap-2 mb-6 bg-white p-2 rounded-lg shadow">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                            activeTab === 'courses'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📖 Kursy
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                            activeTab === 'groups'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        👥 Grupy
                    </button>
                    <button
                        onClick={() => setActiveTab('lessons')}
                        className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                            activeTab === 'lessons'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📅 Zajęcia
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                            activeTab === 'rooms'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        🏫 Sale
                    </button>
                </div>

               
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Ładowanie danych...</p>
                    </div>
                ) : (
                    <>
                        
                        {activeTab === 'courses' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Kursy ({courses.length})
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setEditingCourse(null);
                                            setCourseForm({ nazwa_kursu: '', data_rozpoczecia: '', data_zakonczenia: '' });
                                            setShowCourseModal(true);
                                        }}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                                    >
                                        ➕ Dodaj Kurs
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {courses.map((course) => (
                                        <div
                                            key={course.id_kursu}
                                            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
                                        >
                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                                                <h3 className="text-xl font-bold text-white">
                                                    {course.nazwa_kursu}
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-gray-600 mb-2 text-sm">
                                                    <span className="font-semibold">Start:</span> {course.data_rozpoczecia ? new Date(course.data_rozpoczecia).toLocaleDateString('pl-PL') : '-'}
                                                </p>
                                                <p className="text-gray-600 mb-4 text-sm">
                                                    <span className="font-semibold">Koniec:</span> {course.data_zakonczenia ? new Date(course.data_zakonczenia).toLocaleDateString('pl-PL') : '-'}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditCourse(course)}
                                                        className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-all font-medium"
                                                    >
                                                        ✏️ Edytuj
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteConfirm('course', course)}
                                                        className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-all font-medium"
                                                    >
                                                        🗑️ Usuń
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {courses.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-lg shadow">
                                        <p className="text-gray-500 text-lg">
                                            Brak kursów. Dodaj pierwszy kurs!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                       
                        {activeTab === 'groups' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Grupy ({groups.filter(group => {
                                           
                                            const groupLessons = lessons.filter(l => l.id_grupy === group.id_grupa);
                                            const firstLesson = groupLessons.length > 0 ? groupLessons[0] : null;
                                            const room = firstLesson ? rooms.find(r => r.id_sali === firstLesson.Sala_id_sali) : null;
                                            const groupLocation = room?.lokalizacja || '';
                                            
                                            const matchesCourse = !selectedCourseFilter || group.Kurs_id_kursu === parseInt(selectedCourseFilter);
                                            const matchesLocation = !selectedLocationFilter || groupLocation === selectedLocationFilter;
                                            const matchesDay = !selectedDayFilter || group.dzien_tygodnia === selectedDayFilter;
                                            return matchesCourse && matchesLocation && matchesDay;
                                        }).length})
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setEditingGroup(null);
                                            setGroupForm({ Kurs_id_kursu: '', id_nauczyciela: '', godzina: '', dzien_tygodnia: '' });
                                            setShowGroupModal(true);
                                        }}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all w-full sm:w-auto"
                                    >
                                        ➕ Dodaj Grupę
                                    </button>
                                </div>

                         
                                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Filtruj po kursie
                                            </label>
                                            <select
                                                value={selectedCourseFilter}
                                                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                                                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <option value="">Wszystkie kursy</option>
                                                {courses.map(course => (
                                                    <option key={course.id_kursu} value={course.id_kursu}>
                                                        {course.nazwa_kursu}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Filtruj po lokalizacji
                                            </label>
                                            <select
                                                value={selectedLocationFilter}
                                                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                                                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <option value="">Wszystkie lokalizacje</option>
                                                {[...new Set(rooms.map(r => r.lokalizacja))].map(loc => (
                                                    <option key={loc} value={loc}>
                                                        {loc}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Filtruj po dniu
                                            </label>
                                            <select
                                                value={selectedDayFilter}
                                                onChange={(e) => setSelectedDayFilter(e.target.value)}
                                                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <option value="">Wszystkie dni</option>
                                                <option value="Poniedziałek">Poniedziałek</option>
                                                <option value="Wtorek">Wtorek</option>
                                                <option value="Środa">Środa</option>
                                                <option value="Czwartek">Czwartek</option>
                                                <option value="Piątek">Piątek</option>
                                                <option value="Sobota">Sobota</option>
                                                <option value="Niedziela">Niedziela</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groups
                                        .filter(group => {
                                         
                                            const groupLessons = lessons.filter(l => l.id_grupy === group.id_grupa);
                                            const firstLesson = groupLessons.length > 0 ? groupLessons[0] : null;
                                            const room = firstLesson ? rooms.find(r => r.id_sali === firstLesson.Sala_id_sali) : null;
                                            const groupLocation = room?.lokalizacja || '';
                                            
                                            const matchesCourse = !selectedCourseFilter || group.Kurs_id_kursu === parseInt(selectedCourseFilter);
                                            const matchesLocation = !selectedLocationFilter || groupLocation === selectedLocationFilter;
                                            const matchesDay = !selectedDayFilter || group.dzien_tygodnia === selectedDayFilter;
                                            return matchesCourse && matchesLocation && matchesDay;
                                        })
                                        .map((group) => {
                                        const course = courses.find(c => c.id_kursu === group.Kurs_id_kursu);
                                        const teacher = teachers.find(t => t.id_nauczyciela === group.id_nauczyciela);
                                        
                                       
                                        const groupLessons = lessons.filter(l => l.id_grupy === group.id_grupa);
                                        const anyLesson = groupLessons.length > 0 ? groupLessons[0] : null;
                                        const room = anyLesson ? rooms.find(r => r.id_sali === anyLesson.Sala_id_sali) : null;
                                        const groupLocation = room?.lokalizacja || 'Brak';
                                        
                                        return (
                                            <div
                                                key={group.id_grupa}
                                                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
                                            >
                                                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                                                    <h3 className="text-xl font-bold text-white">
                                                        Grupa #{group.id_grupa}
                                                    </h3>
                                                </div>
                                                <div className="p-4">
                                                    <div className="space-y-2 mb-4">
                                                        <p className="text-sm">
                                                            <span className="font-semibold text-gray-700">Kurs:</span>{' '}
                                                            <span className="text-gray-600">
                                                                {course?.nazwa_kursu || 'Brak'}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="font-semibold text-gray-700">Nauczyciel:</span>{' '}
                                                            <span className="text-gray-600">
                                                                {teacher?.user ? `${teacher.user.imie} ${teacher.user.nazwisko}` : 'Brak'}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="font-semibold text-gray-700">Dzień:</span>{' '}
                                                            <span className="text-gray-600">
                                                                {group.dzien_tygodnia || 'Brak'}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="font-semibold text-gray-700">Godzina:</span>{' '}
                                                            <span className="text-gray-600">
                                                                {group.godzina ? group.godzina.substring(0, 5) : 'Brak'}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="font-semibold text-gray-700">Lokalizacja:</span>{' '}
                                                            <span className="text-gray-600">
                                                                {groupLocation}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm">
                                                            <span className="font-semibold text-gray-700">Liczba uczniów:</span>{' '}
                                                            <span className="text-gray-600">
                                                                {group.liczba_uczniow || 0}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 mb-2">
                                                        <button
                                                            onClick={() => handleEditGroup(group)}
                                                            className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-all font-medium text-sm"
                                                        >
                                                            ✏️ Edytuj
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteConfirm('group', group)}
                                                            className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-all font-medium text-sm"
                                                        >
                                                            🗑️ Usuń
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleManageStudents(group)}
                                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md hover:shadow-lg transition-all font-medium text-sm"
                                                    >
                                                        👥 Zarządzaj Uczniami
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {groups.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-lg shadow">
                                        <p className="text-gray-500 text-lg">
                                            Brak grup. Dodaj pierwszą grupę!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                      
                        {activeTab === 'lessons' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Zajęcia ({lessons.filter(lesson => {
                                            const group = groups.find(g => g.id_grupa === lesson.id_grupy);
                                            const matchesCourse = !selectedCourseFilterLessons || group?.Kurs_id_kursu === parseInt(selectedCourseFilterLessons);
                                            const matchesGroup = !selectedGroupFilterLessons || lesson.id_grupy === parseInt(selectedGroupFilterLessons);
                                            const matchesSearch = !searchLessonTerm || lesson.tematZajec?.toLowerCase().includes(searchLessonTerm.toLowerCase());
                                            return matchesCourse && matchesGroup && matchesSearch;
                                        }).length})
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                setEditingLesson(null);
                                                setSelectedLocation('');
                                                setLessonForm({
                                                    id_grupy: '',
                                                    data: '',
                                                    tematZajec: '',
                                                    Sala_id_sali: ''
                                                });
                                                setShowLessonModal(true);
                                            }}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all w-full sm:w-auto"
                                        >
                                            ➕ Dodaj Zajęcia
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBulkLessonForm({ id_grupa: '' });
                                                setBulkLessonSuccess(null);
                                                setGroupSearchTerm('');
                                                setShowBulkLessonModal(true);
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all w-full sm:w-auto"
                                        >
                                            🎯 Stwórz wiele zajęć
                                        </button>
                                    </div>
                                </div>

                            
                                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                🎓 Filtruj po kursie
                                            </label>
                                            <select
                                                value={selectedCourseFilterLessons}
                                                onChange={(e) => {
                                                    setSelectedCourseFilterLessons(e.target.value);
                                                    setSelectedGroupFilterLessons('');
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Wszystkie kursy</option>
                                                {courses.map(course => (
                                                    <option key={course.id_kursu} value={course.id_kursu}>
                                                        {course.nazwa_kursu}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                👥 Filtruj po grupie
                                            </label>
                                            <select
                                                value={selectedGroupFilterLessons}
                                                onChange={(e) => setSelectedGroupFilterLessons(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={!selectedCourseFilterLessons}
                                            >
                                                <option value="">Wszystkie grupy</option>
                                                {groups
                                                    .filter(g => !selectedCourseFilterLessons || g.Kurs_id_kursu === parseInt(selectedCourseFilterLessons))
                                                    .map(group => {
                                                        const course = courses.find(c => c.id_kursu === group.Kurs_id_kursu);
                                                        return (
                                                            <option key={group.id_grupa} value={group.id_grupa}>
                                                                Grupa #{group.id_grupa} - {course?.nazwa_kursu}
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                🔍 Szukaj po nazwie zajęć
                                            </label>
                                            <input
                                                type="text"
                                                value={searchLessonTerm}
                                                onChange={(e) => setSearchLessonTerm(e.target.value)}
                                                placeholder="Wpisz nazwę lub temat zajęć..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    {(selectedCourseFilterLessons || selectedGroupFilterLessons || searchLessonTerm) && (
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCourseFilterLessons('');
                                                    setSelectedGroupFilterLessons('');
                                                    setSearchLessonTerm('');
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                ✖️ Wyczyść filtry
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Data</th>
                                                <th className="px-4 py-3 text-left">Godziny</th>
                                                <th className="px-4 py-3 text-left">Temat</th>
                                                <th className="px-4 py-3 text-left">Grupa</th>
                                                <th className="px-4 py-3 text-left">Nauczyciel</th>
                                                <th className="px-4 py-3 text-left">Sala</th>
                                                <th className="px-4 py-3 text-center">Akcje</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lessons
                                                .filter(lesson => {
                                                    const group = groups.find(g => g.id_grupa === lesson.id_grupy);
                                                    const matchesCourse = !selectedCourseFilterLessons || group?.Kurs_id_kursu === parseInt(selectedCourseFilterLessons);
                                                    const matchesGroup = !selectedGroupFilterLessons || lesson.id_grupy === parseInt(selectedGroupFilterLessons);
                                                    const matchesSearch = !searchLessonTerm || lesson.tematZajec?.toLowerCase().includes(searchLessonTerm.toLowerCase());
                                                    return matchesCourse && matchesGroup && matchesSearch;
                                                })
                                                .map((lesson, index) => {
                                                const group = groups.find(g => g.id_grupa === lesson.id_grupy);
                                                const teacher = group ? teachers.find(t => t.id_nauczyciela === group.id_nauczyciela) : null;
                                                const room = rooms.find(r => r.id_sali === lesson.Sala_id_sali);
                                                
                                                return (
                                                    <tr
                                                        key={lesson.id_zajec}
                                                        className={`${
                                                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                                        } hover:bg-blue-50 transition-colors`}
                                                    >
                                                        <td className="px-4 py-3 text-gray-700">
                                                            {lesson.data ? new Date(lesson.data).toLocaleDateString('pl-PL') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700">
                                                            {group?.godzina ? group.godzina.substring(0, 5) : 'Brak'}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 font-medium">
                                                            {lesson.tematZajec || 'Brak tematu'}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {group ? `Grupa #${group.id_grupa}` : 'Brak'}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {teacher?.user ? `${teacher.user.imie} ${teacher.user.nazwisko}` : 'Brak'}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {room?.numer || 'Brak'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    onClick={() => handleEditLesson(lesson)}
                                                                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-all text-sm"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => openDeleteConfirm('lesson', lesson)}
                                                                    className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-all text-sm"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {lessons.length === 0 && (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500 text-lg">
                                                Brak zajęć. Dodaj pierwsze zajęcia!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                     
                        {activeTab === 'rooms' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        Sale ({rooms.filter(room => !selectedLocationFilterRooms || room.lokalizacja === selectedLocationFilterRooms).length})
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                setAvailabilityForm({
                                                    id_sali: '',
                                                    data: '',
                                                    godzina_od: '',
                                                    godzina_do: ''
                                                });
                                                setAvailabilityResults(null);
                                                setAvailabilityLocationFilter('');
                                                setShowRoomAvailability(true);
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all w-full sm:w-auto"
                                        >
                                            🔍 Sprawdź Dostępność
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingRoom(null);
                                                setRoomForm({ numer: '', lokalizacja: '', ilosc_miejsc: '' });
                                                setShowRoomModal(true);
                                            }}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all w-full sm:w-auto"
                                        >
                                            ➕ Dodaj Salę
                                        </button>
                                    </div>
                                </div>

                            
                                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                📍 Filtruj po lokalizacji
                                            </label>
                                            <select
                                                value={selectedLocationFilterRooms}
                                                onChange={(e) => setSelectedLocationFilterRooms(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            >
                                                <option value="">Wszystkie lokalizacje</option>
                                                {[...new Set(rooms.map(r => r.lokalizacja).filter(Boolean))].sort().map(loc => (
                                                    <option key={loc} value={loc}>
                                                        {loc}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedLocationFilterRooms && (
                                            <button
                                                onClick={() => setSelectedLocationFilterRooms('')}
                                                className="mt-6 text-sm text-orange-600 hover:text-orange-800 font-medium"
                                            >
                                                ✖️ Wyczyść filtr
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {rooms
                                        .filter(room => !selectedLocationFilterRooms || room.lokalizacja === selectedLocationFilterRooms)
                                        .map((room) => (
                                        <div
                                            key={room.id_sali}
                                            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
                                        >
                                            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-center">
                                                <h3 className="text-3xl font-bold text-white">
                                                    {room.numer}
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-center text-gray-600 mb-2">
                                                    <span className="font-semibold">Lokalizacja:</span>{' '}
                                                    {room.lokalizacja || 'Brak'}
                                                </p>
                                                <p className="text-center text-gray-600 mb-4">
                                                    <span className="font-semibold">Pojemność:</span>{' '}
                                                    {room.ilosc_miejsc || 'Brak'} osób
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditRoom(room)}
                                                        className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-all font-medium"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteConfirm('room', room)}
                                                        className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-all font-medium"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {rooms.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-lg shadow">
                                        <p className="text-gray-500 text-lg">
                                            Brak sal. Dodaj pierwszą salę!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

        
            {showCourseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-lg">
                            <h3 className="text-2xl font-bold text-white">
                                {editingCourse ? '✏️ Edytuj Kurs' : '➕ Dodaj Nowy Kurs'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nazwa Kursu *
                                </label>
                                <input
                                    type="text"
                                    value={courseForm.nazwa_kursu}
                                    onChange={(e) => setCourseForm({ ...courseForm, nazwa_kursu: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="np. Programowanie w Python"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Data rozpoczęcia *
                                    </label>
                                    <input
                                        type="date"
                                        value={courseForm.data_rozpoczecia}
                                        onChange={(e) => setCourseForm({ ...courseForm, data_rozpoczecia: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Data zakończenia *
                                    </label>
                                    <input
                                        type="date"
                                        value={courseForm.data_zakonczenia}
                                        onChange={(e) => setCourseForm({ ...courseForm, data_zakonczenia: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowCourseModal(false);
                                        setEditingCourse(null);
                                        setCourseForm({ nazwa_kursu: '', data_rozpoczecia: '', data_zakonczenia: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleSaveCourse}
                                    disabled={!courseForm.nazwa_kursu.trim() || !courseForm.data_rozpoczecia || !courseForm.data_zakonczenia}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingCourse ? 'Zapisz' : 'Dodaj'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        
            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-t-lg">
                            <h3 className="text-2xl font-bold text-white">
                                {editingGroup ? '✏️ Edytuj Grupę' : '➕ Dodaj Nową Grupę'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kurs *
                                </label>
                                <select
                                    value={groupForm.Kurs_id_kursu}
                                    onChange={(e) => setGroupForm({ ...groupForm, Kurs_id_kursu: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Wybierz kurs</option>
                                    {courses.map(course => (
                                        <option key={course.id_kursu} value={course.id_kursu}>
                                            {course.nazwa_kursu}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nauczyciel *
                                </label>
                                <select
                                    value={groupForm.id_nauczyciela}
                                    onChange={(e) => setGroupForm({ ...groupForm, id_nauczyciela: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Wybierz nauczyciela</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher.id_nauczyciela} value={teacher.id_nauczyciela}>
                                            {teacher.user ? `${teacher.user.imie} ${teacher.user.nazwisko}` : `Nauczyciel ${teacher.id_nauczyciela}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dzień tygodnia *
                                </label>
                                <select
                                    value={groupForm.dzien_tygodnia}
                                    onChange={(e) => setGroupForm({ ...groupForm, dzien_tygodnia: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Wybierz dzień</option>
                                    <option value="Poniedziałek">Poniedziałek</option>
                                    <option value="Wtorek">Wtorek</option>
                                    <option value="Środa">Środa</option>
                                    <option value="Czwartek">Czwartek</option>
                                    <option value="Piątek">Piątek</option>
                                    <option value="Sobota">Sobota</option>
                                    <option value="Niedziela">Niedziela</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Godzina rozpoczęcia *
                                </label>
                                <input
                                    type="time"
                                    value={groupForm.godzina}
                                    onChange={(e) => setGroupForm({ ...groupForm, godzina: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowGroupModal(false);
                                        setEditingGroup(null);
                                        setGroupForm({ Kurs_id_kursu: '', id_nauczyciela: '', godzina: '', dzien_tygodnia: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleSaveGroup}
                                    disabled={!groupForm.Kurs_id_kursu || !groupForm.id_nauczyciela || !groupForm.godzina || !groupForm.dzien_tygodnia}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingGroup ? 'Zapisz' : 'Dodaj'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            
            {showLessonModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-lg">
                            <h3 className="text-2xl font-bold text-white">
                                {editingLesson ? '✏️ Edytuj Zajęcia' : '➕ Dodaj Nowe Zajęcia'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grupa *
                                    </label>
                                    <select
                                        value={lessonForm.id_grupy}
                                        onChange={(e) => setLessonForm({ ...lessonForm, id_grupy: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Wybierz grupę</option>
                                        {groups.map(group => {
                                            const course = courses.find(c => c.id_kursu === group.Kurs_id_kursu);
                                            const teacher = teachers.find(t => t.id_nauczyciela === group.id_nauczyciela);
                                            return (
                                                <option key={group.id_grupa} value={group.id_grupa}>
                                                    Grupa #{group.id_grupa} - {course?.nazwa_kursu || 'Brak kursu'} ({group.dzien_tygodnia} {group.godzina?.substring(0,5)})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Data *
                                    </label>
                                    <input
                                        type="date"
                                        value={lessonForm.data}
                                        onChange={(e) => setLessonForm({ ...lessonForm, data: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Temat *
                                </label>
                                <input
                                    type="text"
                                    value={lessonForm.tematZajec}
                                    onChange={(e) => setLessonForm({ ...lessonForm, tematZajec: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="np. Funkcje kwadratowe"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lokalizacja *
                                    </label>
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => {
                                            setSelectedLocation(e.target.value);
                                            setLessonForm({ ...lessonForm, Sala_id_sali: '' });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Wybierz lokalizację</option>
                                        {[...new Set(rooms.map(r => r.lokalizacja))].map(loc => (
                                            <option key={loc} value={loc}>
                                                {loc}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sala * {lessonForm.id_grupy && lessonForm.data && (
                                            <span className="text-xs text-gray-500">(pokazuję tylko wolne sale)</span>
                                        )}
                                    </label>
                                    <select
                                        value={lessonForm.Sala_id_sali}
                                        onChange={(e) => setLessonForm({ ...lessonForm, Sala_id_sali: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={!selectedLocation}
                                    >
                                        <option value="">Wybierz salę</option>
                                        {rooms
                                            .filter(room => room.lokalizacja === selectedLocation)
                                            .filter(room => {
                                              
                                                if (lessonForm.id_grupy && lessonForm.data) {
                                                    return !isRoomOccupied(room.id_sali, lessonForm.data, lessonForm.id_grupy);
                                                }
                                                return true;
                                            })
                                            .map(room => {
                                                const isOccupied = lessonForm.id_grupy && lessonForm.data 
                                                    ? isRoomOccupied(room.id_sali, lessonForm.data, lessonForm.id_grupy)
                                                    : false;
                                                return (
                                                    <option key={room.id_sali} value={room.id_sali}>
                                                        Sala {room.numer} ({room.ilosc_miejsc} miejsc) {isOccupied ? '❌ Zajęta' : '✅'}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                    {lessonForm.id_grupy && lessonForm.data && selectedLocation && rooms.filter(room => room.lokalizacja === selectedLocation && !isRoomOccupied(room.id_sali, lessonForm.data, lessonForm.id_grupy)).length === 0 && (
                                        <p className="text-sm text-red-600 mt-1">
                                            ⚠️ Brak wolnych sal w tej lokalizacji o wybranej godzinie
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowLessonModal(false);
                                        setEditingLesson(null);
                                        setSelectedLocation('');
                                        setLessonForm({
                                            id_grupy: '',
                                            data: '',
                                            tematZajec: '',
                                            Sala_id_sali: ''
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleSaveLesson}
                                    disabled={
                                        !lessonForm.id_grupy ||
                                        !lessonForm.data ||
                                        !lessonForm.tematZajec.trim() ||
                                        !lessonForm.Sala_id_sali
                                    }
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingLesson ? 'Zapisz' : 'Dodaj'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        
            {showRoomModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-t-lg">
                            <h3 className="text-2xl font-bold text-white">
                                {editingRoom ? '✏️ Edytuj Salę' : '➕ Dodaj Nową Salę'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numer Sali *
                                </label>
                                <input
                                    type="number"
                                    value={roomForm.numer}
                                    onChange={(e) => setRoomForm({ ...roomForm, numer: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="np. 101"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lokalizacja *
                                </label>
                                <input
                                    type="text"
                                    value={roomForm.lokalizacja}
                                    onChange={(e) => setRoomForm({ ...roomForm, lokalizacja: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="np. Budynek A, piętro 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ilość miejsc *
                                </label>
                                <input
                                    type="number"
                                    value={roomForm.ilosc_miejsc}
                                    onChange={(e) => setRoomForm({ ...roomForm, ilosc_miejsc: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="np. 30"
                                    min="1"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowRoomModal(false);
                                        setEditingRoom(null);
                                        setRoomForm({ numer: '', lokalizacja: '', ilosc_miejsc: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleSaveRoom}
                                    disabled={!roomForm.numer || !roomForm.lokalizacja.trim() || !roomForm.ilosc_miejsc}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingRoom ? 'Zapisz' : 'Dodaj'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

          
            {showStudentManagement && selectedGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                            <h3 className="text-2xl font-bold text-white">
                                👥 Zarządzanie Uczniami: {selectedGroup.nazwa}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            
                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="🔍 Szukaj ucznia (imię, nazwisko, pseudonim)..."
                                    value={searchStudentTerm}
                                    onChange={(e) => setSearchStudentTerm(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                              
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Uczniowie w grupie ({groupStudents.filter(student => {
                                            const searchLower = searchStudentTerm.toLowerCase();
                                            const imie = student.user?.imie || student.imie || '';
                                            const nazwisko = student.user?.nazwisko || student.nazwisko || '';
                                            const pseudonim = student.pseudonim || '';
                                            return imie.toLowerCase().includes(searchLower) || 
                                                   nazwisko.toLowerCase().includes(searchLower) ||
                                                   pseudonim.toLowerCase().includes(searchLower);
                                        }).length})
                                    </h4>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {groupStudents
                                            .filter(student => {
                                                const searchLower = searchStudentTerm.toLowerCase();
                                                const imie = student.user?.imie || student.imie || '';
                                                const nazwisko = student.user?.nazwisko || student.nazwisko || '';
                                                const pseudonim = student.pseudonim || '';
                                                return imie.toLowerCase().includes(searchLower) || 
                                                       nazwisko.toLowerCase().includes(searchLower) ||
                                                       pseudonim.toLowerCase().includes(searchLower);
                                            })
                                            .map(student => (
                                            <div
                                                key={student.id_ucznia}
                                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <span className="text-gray-700">
                                                    {student.user?.imie || student.imie} {student.user?.nazwisko || student.nazwisko}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveStudentFromGroup(student.id_ucznia)}
                                                    className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-all text-sm"
                                                >
                                                    ➖ Usuń
                                                </button>
                                            </div>
                                        ))}
                                        {groupStudents.length === 0 && (
                                            <p className="text-gray-500 text-center py-8">
                                                Brak uczniów w tej grupie
                                            </p>
                                        )}
                                    </div>
                                </div>

                           
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Dostępni Uczniowie
                                    </h4>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {students
                                            .filter(s => !groupStudents.some(gs => gs.id_ucznia === s.id_ucznia))
                                            .filter(student => {
                                                const searchLower = searchStudentTerm.toLowerCase();
                                                const imie = student.user?.imie || student.imie || '';
                                                const nazwisko = student.user?.nazwisko || student.nazwisko || '';
                                                const pseudonim = student.pseudonim || '';
                                                return imie.toLowerCase().includes(searchLower) || 
                                                       nazwisko.toLowerCase().includes(searchLower) ||
                                                       pseudonim.toLowerCase().includes(searchLower);
                                            })
                                            .map(student => (
                                                <div
                                                    key={student.id_ucznia}
                                                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                                >
                                                    <span className="text-gray-700">
                                                        {student.user?.imie || student.imie} {student.user?.nazwisko || student.nazwisko}
                                                    </span>
                                                    <button
                                                        onClick={() => handleAddStudentToGroup(student.id_ucznia)}
                                                        className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-all text-sm"
                                                    >
                                                        ➕ Dodaj
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t">
                            <button
                                onClick={() => {
                                    setShowStudentManagement(false);
                                    setSelectedGroup(null);
                                    setGroupStudents([]);
                                    setSearchStudentTerm('');
                                }}
                                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all font-medium"
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                </div>
            )}

           
            {showRoomAvailability && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-lg">
                            <h3 className="text-2xl font-bold text-white">
                                🔍 Sprawdzanie Dostępności Sali
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        📍 Lokalizacja (filtr)
                                    </label>
                                    <select
                                        value={availabilityLocationFilter}
                                        onChange={(e) => {
                                            setAvailabilityLocationFilter(e.target.value);
                                            setAvailabilityForm({ ...availabilityForm, id_sali: '' });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Wszystkie lokalizacje</option>
                                        {[...new Set(rooms.map(r => r.lokalizacja).filter(Boolean))].sort().map(loc => (
                                            <option key={loc} value={loc}>
                                                {loc}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sala *
                                    </label>
                                    <select
                                        value={availabilityForm.id_sali}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, id_sali: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Wybierz salę</option>
                                        {rooms
                                            .filter(room => !availabilityLocationFilter || room.lokalizacja === availabilityLocationFilter)
                                            .map(room => (
                                            <option key={room.id_sali} value={room.id_sali}>
                                                Sala {room.numer} - {room.lokalizacja} ({room.ilosc_miejsc} miejsc)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Data *
                                    </label>
                                    <input
                                        type="date"
                                        value={availabilityForm.data}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, data: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Godzina rozpoczęcia *
                                    </label>
                                    <input
                                        type="time"
                                        value={availabilityForm.godzina_od}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, godzina_od: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Godzina zakończenia *
                                    </label>
                                    <input
                                        type="time"
                                        value={availabilityForm.godzina_do}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, godzina_do: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <button
                                onClick={handleCheckAvailability}
                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all mb-6"
                            >
                                🔍 Sprawdź
                            </button>

                          
                            {availabilityResults && (
                                <div className="mt-6">
                                    <div className={`p-6 rounded-lg border-2 ${
                                        availabilityResults.isAvailable 
                                            ? 'bg-green-50 border-green-500' 
                                            : 'bg-red-50 border-red-500'
                                    }`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`text-4xl`}>
                                                {availabilityResults.isAvailable ? '✅' : '❌'}
                                            </div>
                                            <div>
                                                <h4 className={`text-xl font-bold ${
                                                    availabilityResults.isAvailable ? 'text-green-800' : 'text-red-800'
                                                }`}>
                                                    {availabilityResults.isAvailable ? 'Sala jest dostępna!' : 'Sala jest zajęta!'}
                                                </h4>
                                                <p className={`text-sm ${
                                                    availabilityResults.isAvailable ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                    Sala {availabilityResults.room?.numer} - {availabilityResults.room?.lokalizacja}
                                                </p>
                                            </div>
                                        </div>

                                        {!availabilityResults.isAvailable && availabilityResults.conflicts.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-red-800 mb-3">Konflikty w wybranym terminie:</h5>
                                                <div className="space-y-2">
                                                    {availabilityResults.conflicts.map((conflict, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-red-200">
                                                            <p className="font-medium text-gray-800">{conflict.tematZajec}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Kurs: {conflict.course?.nazwa_kursu || 'Brak'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Nauczyciel: {conflict.teacher?.user ? `${conflict.teacher.user.imie} ${conflict.teacher.user.nazwisko}` : 'Brak'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Godzina: {conflict.time} (zakładany czas: 90 min)
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {availabilityResults.allLessons.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-gray-800 mb-3">
                                                    Wszystkie zajęcia w tym dniu ({availabilityResults.allLessons.length}):
                                                </h5>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {availabilityResults.allLessons.map((lesson, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <p className="font-medium text-gray-800">{lesson.tematZajec}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {lesson.course?.nazwa_kursu} - {lesson.time}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {availabilityResults.allLessons.length === 0 && availabilityResults.isAvailable && (
                                            <p className="text-green-700 text-sm mt-2">
                                                Brak zaplanowanych zajęć w tym dniu.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t">
                            <button
                                onClick={() => {
                                    setShowRoomAvailability(false);
                                    setAvailabilityForm({
                                        id_sali: '',
                                        data: '',
                                        godzina_od: '',
                                        godzina_do: ''
                                    });
                                    setAvailabilityResults(null);
                                    setAvailabilityLocationFilter('');
                                }}
                                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all font-medium"
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && deleteTarget && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 rounded-t-lg">
                            <h3 className="text-2xl font-bold text-white">
                                ⚠️ Potwierdź Usunięcie
                            </h3>
                        </div>
                        <div className="p-6">
                            {deleteTarget.type === 'group' ? (
                                <>
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                        <p className="text-red-800 font-semibold mb-2">
                                            ⚠️ UWAGA! Nieodwracalna operacja!
                                        </p>
                                        <p className="text-red-700 text-sm">
                                            Usunięcie grupy #{deleteTarget.id_grupa} spowoduje również usunięcie wszystkich przypisanych do niej zajęć!
                                        </p>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Aby potwierdzić usunięcie grupy, wpisz słowo <strong className="text-red-600">USUN</strong> poniżej:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Wpisz USUN"
                                        className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                                        autoFocus
                                    />
                                </>
                            ) : (
                                <p className="text-gray-700 mb-6">
                                    Czy na pewno chcesz usunąć{' '}
                                    {deleteTarget.type === 'course' && `kurs "${deleteTarget.nazwa_kursu}"`}
                                    {deleteTarget.type === 'lesson' && `zajęcia "${deleteTarget.tematZajec}"`}
                                    {deleteTarget.type === 'room' && `salę nr ${deleteTarget.numer}"`}
                                    ?
                                </p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteTarget(null);
                                        setDeleteConfirmText('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={() => {
                                        if (deleteTarget.type === 'course') handleDeleteCourse();
                                        else if (deleteTarget.type === 'group') handleDeleteGroup();
                                        else if (deleteTarget.type === 'lesson') handleDeleteLesson();
                                        else if (deleteTarget.type === 'room') handleDeleteRoom();
                                    }}
                                    disabled={deleteTarget.type === 'group' && deleteConfirmText !== 'USUN'}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Usuń
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkLessonModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">
                                🎯 Tworzenie zajęć dla grupy
                            </h3>
                        </div>
                        <div className="p-6">
                            {!bulkLessonSuccess ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Wyszukaj i wybierz grupę
                                        </label>
                                        <div className="mb-2">
                                            <input
                                                type="text"
                                                placeholder="🔍 Wyszukaj po nazwie kursu..."
                                                value={groupSearchTerm}
                                                onChange={(e) => setGroupSearchTerm(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={bulkLessonLoading}
                                            />
                                        </div>
                                        <select
                                            value={bulkLessonForm.id_grupa}
                                            onChange={(e) => setBulkLessonForm({ id_grupa: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={bulkLessonLoading}
                                        >
                                            <option value="">-- Wybierz grupę --</option>
                                            {groups
                                                .filter(group => {
                                                    if (!groupSearchTerm) return true;
                                                    const course = courses.find(c => c.id_kursu === group.Kurs_id_kursu);
                                                    const courseName = course?.nazwa_kursu || '';
                                                    return courseName.toLowerCase().includes(groupSearchTerm.toLowerCase());
                                                })
                                                .map(group => {
                                                    const course = courses.find(c => c.id_kursu === group.Kurs_id_kursu);
                                                    return (
                                                        <option key={group.id_grupa} value={group.id_grupa}>
                                                            {course?.nazwa_kursu || 'Nieznany kurs'} (Grupa {group.id_grupa})
                                                        </option>
                                                    );
                                                })
                                            }
                                        </select>
                                        {groupSearchTerm && groups.filter(group => {
                                            const course = courses.find(c => c.id_kursu === group.Kurs_id_kursu);
                                            const courseName = course?.nazwa_kursu || '';
                                            return courseName.toLowerCase().includes(groupSearchTerm.toLowerCase());
                                        }).length === 0 && (
                                            <p className="text-sm text-gray-500 mt-1">Nie znaleziono grup pasujących do wyszukiwania</p>
                                        )}
                                    </div>
                                    
                                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>ℹ️ Jak to działa:</strong><br/>
                                            System automatycznie utworzy wszystkie zajęcia dla wybranej grupy na podstawie:
                                        </p>
                                        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                                            <li>Dat rozpoczęcia i zakończenia kursu</li>
                                            <li>Dnia tygodnia grupy</li>
                                            <li>Godziny zajęć grupy</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowBulkLessonModal(false);
                                                setBulkLessonForm({ id_grupa: '' });
                                                setBulkLessonSuccess(null);
                                                setGroupSearchTerm('');
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                            disabled={bulkLessonLoading}
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            onClick={handleCreateLessonsForGroup}
                                            disabled={!bulkLessonForm.id_grupa || bulkLessonLoading}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {bulkLessonLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Tworzę...
                                                </span>
                                            ) : (
                                                '✨ Stwórz zajęcia'
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="text-4xl mb-3">
                                        {bulkLessonSuccess.includes('❌') ? '❌' : '✅'}
                                    </div>
                                    <p className={`text-lg font-medium ${bulkLessonSuccess.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
                                        {bulkLessonSuccess}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Modal zamknie się automatycznie...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
