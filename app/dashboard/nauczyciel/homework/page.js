"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyCourses, getGroupHomeworks, addHomework, getHomeworkAnswers, gradeHomeworkAnswer, updateHomework, deleteHomework } from "../../../../lib/api/course.api";
import { awardHomeworkPoints, revokeHomeworkPoints } from "../../../../lib/api/student-points.api";
import PageHeader from '../../../../components/PageHeader';

export default function TeacherHomeworkPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState("");
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [expandedHomeworks, setExpandedHomeworks] = useState(new Set());
    const [addingHomework, setAddingHomework] = useState(false);
    const [grading, setGrading] = useState(false);

    const [homeworkModal, setHomeworkModal] = useState({
        visible: false,
        groupId: null,
        groupName: "",
        editMode: false,
        homeworkId: null,
        homeworkForm: {
            tytul: '',
            opis: '',
            termin: ''
        }
    });

    const [gradeModal, setGradeModal] = useState({
        visible: false,
        answerId: null,
        homeworkId: null,
        studentId: null,
        studentName: "",
        answerText: "",
        currentGrade: null,
        newGrade: ""
    });

    const [groupHomeworks, setGroupHomeworks] = useState({});
    const [homeworkAnswers, setHomeworkAnswers] = useState({});

    // Helper functions defined first to avoid dependency issues
    const loadGroupHomeworks = useCallback(async (groupId) => {
        try {
            const homeworks = await getGroupHomeworks(groupId);
            console.log(`Pobrane zadania dla grupy ${groupId}:`, homeworks);

            setGroupHomeworks(prev => ({
                ...prev,
                [groupId]: homeworks || []
            }));

            if (homeworks && homeworks.length > 0) {
                for (const homework of homeworks) {
                    try {
                        const answers = await getHomeworkAnswers(homework.id_zadania);
                        setHomeworkAnswers(prev => ({
                            ...prev,
                            [homework.id_zadania]: answers || []
                        }));
                    } catch (answerError) {
                        console.error(`Błąd pobierania odpowiedzi dla zadania ${homework.id_zadania}:`, answerError);
                        setHomeworkAnswers(prev => ({
                            ...prev,
                            [homework.id_zadania]: []
                        }));
                    }
                }
            }
        } catch (error) {
            console.error("Błąd pobierania zadań:", error);
            setGroupHomeworks(prev => ({
                ...prev,
                [groupId]: []
            }));
        }
    }, []);

    // Handler functions defined using useCallback to ensure stable references
    const openEditHomeworkModal = useCallback((homework, groupId, groupName) => {
        setHomeworkModal({
            visible: true,
            groupId,
            groupName,
            editMode: true,
            homeworkId: homework.id_zadania,
            homeworkForm: {
                tytul: homework.tytul,
                opis: homework.opis,
                termin: homework.termin ? homework.termin.substring(0, 16) : ''
            }
        });
    }, []);

    const handleDeleteHomework = useCallback(async (homework, groupId) => {
        if (!confirm(`Czy na pewno chcesz usunąć zadanie "${homework.tytul}"?\nTa operacja jest nieodwracalna!`)) {
            return;
        }

        try {
            await deleteHomework(homework.id_zadania);
            alert("Zadanie zostało usunięte!");
            await loadGroupHomeworks(groupId);
        } catch (error) {
            console.error("Błąd usuwania zadania:", error);
            alert(`Nie udało się usunąć zadania: ${error.message}`);
        }
    }, [loadGroupHomeworks]);

    
    const calculateHomeworkPoints = (grade) => {
        if (grade >= 80) return 5;     
        if (grade >= 60) return 4;      
        if (grade >= 40) return 3;      
        if (grade >= 20) return 2;      
        if (grade > 0) return 1;        
        return 0;
    };

    const dniTygodnia = [
        "Poniedziałek",
        "Wtorek",
        "Środa",
        "Czwartek",
        "Piątek",
        "Sobota",
        "Niedziela"
    ];

    useEffect(() => {
        loadCourses(selectedDay);
    }, [selectedDay]);

    async function loadCourses(dzien) {
        try {
            setLoading(true);
            const kursy = await getMyCourses(dzien);
            console.log('Pobrane kursy:', kursy);
            setCourses(kursy || []);
            setExpandedGroups(new Set());
            setExpandedHomeworks(new Set());
            setGroupHomeworks({});
            setHomeworkAnswers({});
        } catch (err) {
            console.error("Błąd przy ładowaniu kursów:", err);
        } finally {
            setLoading(false);
        }
    }

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
            return newSet;
        });
    };

    const toggleHomework = (homeworkId) => {
        setExpandedHomeworks(prev => {
            const newSet = new Set(prev);
            newSet.has(homeworkId) ? newSet.delete(homeworkId) : newSet.add(homeworkId);
            return newSet;
        });
    };

    const loadHomeworkAnswers = async (homeworkId) => {
        try {
            const answers = await getHomeworkAnswers(homeworkId);
            console.log(`Pobrane odpowiedzi dla zadania ${homeworkId}:`, answers);

            setHomeworkAnswers(prev => ({
                ...prev,
                [homeworkId]: answers || []
            }));
        } catch (error) {
            console.error("Błąd pobierania odpowiedzi:", error);
            setHomeworkAnswers(prev => ({
                ...prev,
                [homeworkId]: []
            }));
        }
    };

    const refreshHomeworkAnswers = async (homeworkId) => {
        try {
            console.log(`Odświeżanie odpowiedzi dla zadania: ${homeworkId}`);
            const answers = await getHomeworkAnswers(homeworkId);

            setHomeworkAnswers(prev => ({
                ...prev,
                [homeworkId]: answers || []
            }));

            console.log(`Odświeżono odpowiedzi dla zadania ${homeworkId}:`, answers);
            return true;
        } catch (error) {
            console.error("Błąd odświeżania odpowiedzi:", error);
            return false;
        }
    };

    const openHomeworkModal = (groupId, groupName) => {
        setHomeworkModal({
            visible: true,
            groupId,
            groupName,
            editMode: false,
            homeworkId: null,
            homeworkForm: {
                tytul: '',
                opis: '',
                termin: ''
            }
        });
    };

    const closeHomeworkModal = () => {
        setHomeworkModal({
            visible: false,
            groupId: null,
            groupName: "",
            editMode: false,
            homeworkId: null,
            homeworkForm: {
                tytul: '',
                opis: '',
                termin: ''
            }
        });
    };

    const openGradeModal = (answerId, homeworkId, studentId, studentName, answerText, currentGrade) => {
        setGradeModal({
            visible: true,
            answerId,
            homeworkId,
            studentId,
            studentName,
            answerText,
            currentGrade,
            newGrade: currentGrade || ""
        });
    };

    const closeGradeModal = () => {
        setGradeModal({
            visible: false,
            answerId: null,
            homeworkId: null,
            studentId: null,
            studentName: "",
            answerText: "",
            currentGrade: null,
            newGrade: ""
        });
    };

    const handleHomeworkInputChange = (e) => {
        const { name, value } = e.target;
        setHomeworkModal(prev => ({
            ...prev,
            homeworkForm: {
                ...prev.homeworkForm,
                [name]: value
            }
        }));
    };

    const handleGradeInputChange = (e) => {
        setGradeModal(prev => ({
            ...prev,
            newGrade: e.target.value
        }));
    };

    const handleAddHomework = async () => {
        if (!homeworkModal.homeworkForm.tytul.trim() || !homeworkModal.homeworkForm.opis.trim()) {
            alert("Wypełnij tytuł i opis zadania!");
            return;
        }

        try {
            setAddingHomework(true);

            if (homeworkModal.editMode) {
                
                const homeworkData = {
                    tytul: homeworkModal.homeworkForm.tytul.trim(),
                    opis: homeworkModal.homeworkForm.opis.trim(),
                    termin: homeworkModal.homeworkForm.termin
                };

                console.log('Aktualizowanie zadania:', homeworkData);
                const result = await updateHomework(homeworkModal.homeworkId, homeworkData);
                console.log('Zadanie zaktualizowane:', result);
                
                alert("Zadanie zostało zaktualizowane!");
            } else {
               
                const homeworkData = {
                    id_grupy: homeworkModal.groupId,
                    tytul: homeworkModal.homeworkForm.tytul.trim(),
                    opis: homeworkModal.homeworkForm.opis.trim(),
                    termin: homeworkModal.homeworkForm.termin
                };

                console.log('Wysyłane dane zadania:', homeworkData);
                const result = await addHomework(homeworkData);
                console.log('Odpowiedź z API:', result);
                
                alert("Zadanie zostało dodane!");
            }

            await loadGroupHomeworks(homeworkModal.groupId);
            closeHomeworkModal();
        } catch (error) {
            console.error("Błąd", homeworkModal.editMode ? "aktualizacji" : "dodawania", "zadania:", error);
            alert(`Wystąpił błąd podczas ${homeworkModal.editMode ? "aktualizacji" : "dodawania"} zadania: ${error.message}`);
        } finally {
            setAddingHomework(false);
        }
    };

    const handleGradeAnswer = async () => {
        if (!gradeModal.newGrade.trim() || isNaN(gradeModal.newGrade)) {
            alert("Wprowadź poprawną ocenę!");
            return;
        }

        const grade = parseInt(gradeModal.newGrade);
        if (grade < 0 || grade > 100) {
            alert("Ocena musi być w zakresie 0-100!");
            return;
        }

        try {
            setGrading(true);

            const gradeData = {
                id_odpowiedzi: gradeModal.answerId,
                ocena: grade
            };

            console.log('Wysyłane dane oceny:', gradeData);
            console.log('Homework ID do odświeżenia:', gradeModal.homeworkId);

            const result = await gradeHomeworkAnswer(gradeData);
            console.log('Odpowiedź z API:', result);

            
            console.log('=== DEBUG PUNKTÓW ===');
            console.log('gradeModal.studentId:', gradeModal.studentId);
            console.log('grade:', grade);
            console.log('grade > 0:', grade > 0);

            
            if (gradeModal.studentId) {
                try {
                    
                    if (gradeModal.currentGrade !== null && gradeModal.currentGrade !== undefined && gradeModal.currentGrade > 0) {
                        const previousPoints = calculateHomeworkPoints(gradeModal.currentGrade);
                        if (previousPoints > 0) {
                            console.log(`Odejmowanie ${previousPoints} punktów za poprzednią ocenę ${gradeModal.currentGrade}%`);
                            await revokeHomeworkPoints(gradeModal.studentId, previousPoints);
                            console.log(`Odjęto ${previousPoints} punktów uczniowi ${gradeModal.studentId}`);
                        }
                    }

                    
                    if (grade > 0) {
                        const newPoints = calculateHomeworkPoints(grade);
                        if (newPoints > 0) {
                            console.log(`Przyznawanie ${newPoints} punktów za nową ocenę ${grade}%`);
                            await awardHomeworkPoints(gradeModal.studentId, newPoints);
                            console.log(`Przyznano ${newPoints} punktów uczniowi ${gradeModal.studentId} za ocenę ${grade}%`);
                        }
                    }
                } catch (pointsError) {
                    console.error('Błąd zarządzania punktami:', pointsError);
                    
                }
            } else {
                console.log('Brak studentId - punkty nie zarządzane');
            }

            
            if (gradeModal.homeworkId) {
                await refreshHomeworkAnswers(gradeModal.homeworkId);
            }

            closeGradeModal();
            alert("Ocena została zapisana i lista odpowiedzi została zaktualizowana!");

        } catch (error) {
            console.error("Błąd oceniania odpowiedzi:", error);
            alert(`Wystąpił błąd podczas oceniania: ${error.message}`);
        } finally {
            setGrading(false);
        }
    };

    const handleGroupExpand = async (groupId) => {
        toggleGroup(groupId);
        if (!groupHomeworks[groupId]) {
            await loadGroupHomeworks(groupId);
        }
    };

    const handleHomeworkExpand = async (homeworkId) => {
        toggleHomework(homeworkId);
        if (!homeworkAnswers[homeworkId]) {
            await loadHomeworkAnswers(homeworkId);
        }
    };

    const formatDate = d => d ? new Date(d).toLocaleDateString("pl-PL") : "Nieustalona";
    const formatTime = t => t ? t.split(":").slice(0, 2).join(":") : "Nieustalona";
    const formatDateTime = d => d ? new Date(d).toLocaleString("pl-PL") : "Nieustalona";

    const countTotalGroups = () => {
        return courses.reduce((total, course) => total + (course.grupy?.length || 0), 0);
    };

    const countTotalStudents = () => {
        return courses.reduce((total, course) => {
            return total + (course.grupy?.reduce((sum, group) =>
                sum + (group.uczniowie?.length || 0), 0) || 0);
        }, 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie kursów i grup...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader 
                title="📝 Zadania domowe - Moje grupy"
                description="Przeglądaj zadania, odpowiedzi i oceniaj"
            />
            <div className="min-h-screen bg-gray-50 p-6 relative">
                <div className="max-w-7xl mx-auto">

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtruj po dniu tygodnia:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedDay("")}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                selectedDay === ""
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            }`}
                        >
                            Wszystkie dni
                        </button>

                        {dniTygodnia.map(dzien => (
                            <button
                                key={dzien}
                                onClick={() => setSelectedDay(dzien)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    selectedDay === dzien
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                }`}
                            >
                                {dzien}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        title="Liczba kursów"
                        value={courses.length}
                        color="text-blue-600"
                    />
                    <StatCard
                        title="Liczba grup"
                        value={countTotalGroups()}
                        color="text-green-600"
                    />
                    <StatCard
                        title="Łączna liczba uczniów"
                        value={countTotalStudents()}
                        color="text-purple-600"
                    />
                </div>

                {addingHomework && (
                    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                        Dodawanie zadania...
                    </div>
                )}

                {grading && (
                    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                        Ocenianie...
                    </div>
                )}

                {courses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            {selectedDay
                                ? `Brak kursów w dniu: ${selectedDay}`
                                : "Brak przypisanych kursów"}
                        </h2>
                        <p className="text-gray-600">
                            {selectedDay
                                ? "Nie masz żadnych kursów w tym dniu."
                                : "Brak przypisanych kursów."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {courses.map(course => (
                            <div key={course.id_kursu} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="bg-blue-50 px-6 py-4 border-b flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {course.nazwa_kursu}
                                        </h2>
                                        <p className="text-gray-600">
                                            {formatDate(course.data_rozpoczecia)} - {formatDate(course.data_zakonczenia)}
                                        </p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {course.grupy?.length || 0} {course.grupy?.length === 1 ? 'grupa' : 'grup'}
                                    </span>
                                </div>

                                <div className="p-6 space-y-6">
                                    {course.grupy?.map(grupa => (
                                        <GroupSection
                                            key={grupa.id_grupa}
                                            grupa={grupa}
                                            expanded={expandedGroups.has(grupa.id_grupa)}
                                            toggleGroup={() => handleGroupExpand(grupa.id_grupa)}
                                            onAddHomework={() => openHomeworkModal(grupa.id_grupa, `${course.nazwa_kursu} - Grupa #${grupa.id_grupa}`)}
                                            homeworks={groupHomeworks[grupa.id_grupa] || []}
                                            homeworkAnswers={homeworkAnswers}
                                            expandedHomeworks={expandedHomeworks}
                                            onHomeworkExpand={handleHomeworkExpand}
                                            onOpenGradeModal={openGradeModal}
                                            onEditHomework={openEditHomeworkModal}
                                            onDeleteHomework={handleDeleteHomework}
                                            formatDate={formatDate}
                                            formatTime={formatTime}
                                            formatDateTime={formatDateTime}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {homeworkModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {homeworkModal.editMode 
                                            ? `Edytuj zadanie dla grupy: ${homeworkModal.groupName}`
                                            : `Dodaj zadanie dla grupy: ${homeworkModal.groupName}`
                                        }
                                    </h3>
                                    <button
                                        onClick={closeHomeworkModal}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tytuł zadania *
                                        </label>
                                        <input
                                            type="text"
                                            name="tytul"
                                            value={homeworkModal.homeworkForm.tytul}
                                            onChange={handleHomeworkInputChange}
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Wprowadź tytuł zadania"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Opis zadania *
                                        </label>
                                        <textarea
                                            name="opis"
                                            value={homeworkModal.homeworkForm.opis}
                                            onChange={handleHomeworkInputChange}
                                            required
                                            rows="4"
                                            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Opisz szczegóły zadania..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Termin wykonania *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="termin"
                                            value={homeworkModal.homeworkForm.termin}
                                            onChange={handleHomeworkInputChange}
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={closeHomeworkModal}
                                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            onClick={handleAddHomework}
                                            disabled={addingHomework || !homeworkModal.homeworkForm.tytul.trim() || !homeworkModal.homeworkForm.opis.trim()}
                                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {addingHomework ? "Dodawanie..." : "Dodaj zadanie"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            
                {gradeModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Oceń odpowiedź: {gradeModal.studentName}
                                    </h3>
                                    <button
                                        onClick={closeGradeModal}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Odpowiedź ucznia:
                                        </label>
                                        <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-60 overflow-y-auto">
                                            {gradeModal.answerText}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ocena (0-100 pkt) *
                                        </label>
                                        <input
                                            type="number"
                                            value={gradeModal.newGrade}
                                            onChange={handleGradeInputChange}
                                            min="0"
                                            max="100"
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Wprowadź ocenę"
                                        />
                                        {gradeModal.currentGrade !== null && gradeModal.currentGrade !== undefined && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Poprzednia ocena: {gradeModal.currentGrade} pkt
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={closeGradeModal}
                                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            onClick={handleGradeAnswer}
                                            disabled={grading || !gradeModal.newGrade}
                                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {grading ? "Zapisywanie..." : "Zapisz ocenę"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, color }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-100">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-600 text-sm mt-1">{title}</div>
        </div>
    );
}

function GroupSection({
                          grupa,
                          expanded,
                          toggleGroup,
                          onAddHomework,
                          homeworks,
                          homeworkAnswers,
                          expandedHomeworks,
                          onHomeworkExpand,
                          onOpenGradeModal,
                          onEditHomework,
                          onDeleteHomework,
                          formatDate,
                          formatTime,
                          formatDateTime
                      }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div
                className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={toggleGroup}
            >
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                        <svg
                            className={`w-4 h-4 transition-transform text-gray-500 ${expanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                        <div>
                            <h3 className="font-semibold text-gray-800">Grupa: #{grupa.id_grupa}</h3>
                            <p className="text-sm text-gray-600">
                                Dzień: <b>{grupa.dzien_tygodnia}</b> |
                                Godzina: <b>{formatTime(grupa.godzina)}</b> |
                                Uczniowie: <b>{grupa.uczniowie?.length || 0}</b>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddHomework();
                            }}
                            className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 w-full sm:w-auto"
                        >
                            <span>+</span>
                            <span>Dodaj zadanie</span>
                        </button>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium w-fit">
                            {homeworks.length} {homeworks.length === 1 ? 'zadanie' : 'zadań'}
                        </span>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="p-4">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-700">
                                Zadania domowe ({homeworks.length})
                            </h4>
                        </div>

                        {homeworks.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                Brak zadań dla tej grupy. Kliknij "Dodaj zadanie" aby dodać pierwsze zadanie.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {homeworks.map(homework => {
                                    const answers = homeworkAnswers[homework.id_zadania] || [];
                                    const isExpanded = expandedHomeworks.has(homework.id_zadania);

                                    return (
                                        <div key={homework.id_zadania} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div
                                                className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100"
                                                onClick={() => onHomeworkExpand(homework.id_zadania)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <svg
                                                            className={`w-4 h-4 transition-transform text-gray-500 ${isExpanded ? "rotate-90" : ""}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                                        </svg>
                                                        <div>
                                                            <h5 className="font-semibold text-gray-800">{homework.tytul}</h5>
                                                            <p className="text-sm text-gray-600">
                                                                Termin: {formatDateTime(homework.termin)} |
                                                                Odpowiedzi: {answers.length}/{grupa.uczniowie?.length || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                            ID: {homework.id_zadania}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEditHomework(homework, grupa.id_grupa, `Grupa #${grupa.id_grupa}`);
                                                            }}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded text-xs transition-colors"
                                                            title="Edytuj zadanie"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteHomework(homework, grupa.id_grupa);
                                                            }}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs transition-colors"
                                                            title="Usuń zadanie"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-4 bg-white">
                                                    <div className="mb-4">
                                                        <h6 className="font-medium text-gray-700 mb-2">Opis zadania:</h6>
                                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                            {homework.opis}
                                                        </p>
                                                    </div>

                                                    <h6 className="font-medium text-gray-700 mb-3">Odpowiedzi uczniów:</h6>

                                                    {grupa.uczniowie && grupa.uczniowie.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {grupa.uczniowie.map(uczen => {
                                                                const studentAnswer = answers.find(
                                                                    a => a.id_ucznia === uczen.id_ucznia
                                                                );

                                                                const getStatusColor = () => {
                                                                    if (!studentAnswer) return "bg-red-100 text-red-800";
                                                                    if (studentAnswer.ocena === null || studentAnswer.ocena === undefined)
                                                                        return "bg-yellow-100 text-yellow-800";
                                                                    return "bg-green-100 text-green-800";
                                                                };

                                                                const getStatusText = () => {
                                                                    if (!studentAnswer) return "Nie wysłano";
                                                                    if (studentAnswer.ocena === null || studentAnswer.ocena === undefined)
                                                                        return "Wysłano (oczekuje na ocenę)";
                                                                    return `Ocenione: ${studentAnswer.ocena} pkt`;
                                                                };

                                                                return (
                                                                    <div key={uczen.id_ucznia} className="border border-gray-200 rounded-lg p-3">
                                                                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                    <span className="text-blue-600 text-sm font-medium">
                                                                                        {uczen.imie?.charAt(0).toUpperCase()}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-medium text-gray-900">
                                                                                        {uczen.imie} {uczen.nazwisko}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                                                <span className={`text-xs px-2 py-1 rounded-full w-fit ${getStatusColor()}`}>
                                                                                    {getStatusText()}
                                                                                </span>
                                                                                {studentAnswer && (
                                                                                    <button
                                                                                        onClick={() => onOpenGradeModal(
                                                                                            studentAnswer.id_odpowiedzi,
                                                                                            homework.id_zadania,
                                                                                            uczen.id_ucznia,
                                                                                            `${uczen.imie} ${uczen.nazwisko}`,
                                                                                            studentAnswer.tresc,
                                                                                            studentAnswer.ocena
                                                                                        )}
                                                                                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
                                                                                    >
                                                                                        {studentAnswer.ocena !== null && studentAnswer.ocena !== undefined
                                                                                            ? "Zmień ocenę"
                                                                                            : "Oceń"}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {studentAnswer && (
                                                                            <div className="mt-2">
                                                                                <p className="text-sm text-gray-700 mb-1">Odpowiedź:</p>
                                                                                <div className="bg-gray-50 p-3 rounded text-sm">
                                                                                    {studentAnswer.tresc}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-center py-4">
                                                            Brak uczniów w grupie
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        </>
    );
}