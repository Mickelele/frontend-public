"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCourses, addComment, getCourseById } from "../../../../lib/api/course.api";
import { getUserIdFromToken } from "../../../../lib/auth";
import { setPresence, createPresence, deletePresence, getPresenceForStudent } from "../../../../lib/api/presence.api";
import { updateEquipmentRemark } from "../../../../lib/api/lesson.api";
import { getAllQuizzes, updateQuiz } from "../../../../lib/api/quiz.api";
import { getSubstitutesByTeacherReporting, getSubstitutesByTeacherSubstituting } from "../../../../lib/api/substitute.api";
import { getGroupById, getGroupStudents } from "../../../../lib/api/group.api";
import { getUserById } from "../../../../lib/api/users.api";
import { awardAttendancePoint, revokeAttendancePoint, penalizeForRemark } from "../../../../lib/api/student-points.api";

export default function TeacherCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState("");
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [updating, setUpdating] = useState(false);
    const [mySubstitutesReporting, setMySubstitutesReporting] = useState([]);
    const [mySubstitutesTaken, setMySubstitutesTaken] = useState([]);
    const [substituteLessons, setSubstituteLessons] = useState([]);
    const [substitutesExpanded, setSubstitutesExpanded] = useState(true);
    const [unsavedPresences, setUnsavedPresences] = useState({}); 
    const [saving, setSaving] = useState(false);
    const [presenceMenu, setPresenceMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        idObecnosci: null,
        idZajec: null,
        idStudenta: null
    });
    const [remarkModal, setRemarkModal] = useState({
        visible: false,
        zajecie: null,
        selectedStudent: null,
        tresc: ""
    });

    const [equipmentRemarkModal, setEquipmentRemarkModal] = useState({
        visible: false,
        zajecie: null,
        tresc: ""
    });

    const [quizModal, setQuizModal] = useState({
        visible: false,
        zajecie: null,
        quizzes: [],
        filteredQuizzes: [],
        searchTerm: "",
        loading: false
    });

    const handleEquipmentRemarkSubmit = async () => {
        if (!equipmentRemarkModal.tresc.trim()) {
            alert("Wpisz treść uwagi o sprzęcie");
            return;
        }

        try {
            setUpdating(true);

            await updateEquipmentRemark(
                equipmentRemarkModal.zajecie.id_zajec,
                equipmentRemarkModal.tresc
            );

            alert("Uwaga o sprzęcie zapisana!");
            closeEquipmentRemarkModal();

            loadCourses(selectedDay);
        } catch (err) {
            console.error(err);
            alert("Błąd przy zapisie uwagi o sprzęcie");
        } finally {
            setUpdating(false);
        }
    };

    const openEquipmentRemarkModal = (zajecie) => {
        setEquipmentRemarkModal({
            visible: true,
            zajecie,
            tresc: zajecie.uwaga_do_sprzetu || ""
        });
    };

    const closeEquipmentRemarkModal = () => {
        setEquipmentRemarkModal({
            visible: false,
            zajecie: null,
            tresc: ""
        });
    };

    const openQuizModal = async (zajecie) => {
        setQuizModal({
            visible: true,
            zajecie,
            quizzes: [],
            filteredQuizzes: [],
            searchTerm: "",
            loading: true
        });

        try {
            const quizzes = await getAllQuizzes();
            setQuizModal(prev => ({
                ...prev,
                quizzes,
                filteredQuizzes: quizzes,
                loading: false
            }));
        } catch (err) {
            console.error("Błąd ładowania quizów:", err);
            alert("Nie udało się załadować quizów");
            closeQuizModal();
        }
    };

    const closeQuizModal = () => {
        setQuizModal({
            visible: false,
            zajecie: null,
            quizzes: [],
            filteredQuizzes: [],
            searchTerm: "",
            loading: false
        });
    };

    const handleQuizSearch = (searchTerm) => {
        setQuizModal(prev => ({
            ...prev,
            searchTerm,
            filteredQuizzes: prev.quizzes.filter(quiz =>
                quiz.nazwa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quiz.opis?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }));
    };

    const handleAssignQuiz = async (quiz) => {
        if (!confirm(`Czy na pewno chcesz przypisać quiz "${quiz.nazwa}" do tych zajęć?`)) {
            return;
        }

        try {
            setUpdating(true);
            
            await updateQuiz(quiz.id_quizu, {
                nazwa: quiz.nazwa,
                opis: quiz.opis,
                Zajecia_id_zajec: quizModal.zajecie.id_zajec
            });

            alert("Quiz został przypisany do zajęć!");
            closeQuizModal();
        } catch (err) {
            console.error("Błąd przypisywania quizu:", err);
            alert("Nie udało się przypisać quizu");
        } finally {
            setUpdating(false);
        }
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

    function getSubstituteForLesson(lessonId) {
        if (!mySubstitutesReporting || !Array.isArray(mySubstitutesReporting)) return null;
        return mySubstitutesReporting.find(sub => sub.zajecia_id_zajec === lessonId || sub.zajecia?.id_zajec === lessonId);
    }

    function isLessonTakenByMe(lessonId) {
        if (!mySubstitutesTaken || !Array.isArray(mySubstitutesTaken)) return false;
        return mySubstitutesTaken.some(sub => sub.zajecia_id_zajec === lessonId || sub.zajecia?.id_zajec === lessonId);
    }

    useEffect(() => {
        const teacherId = getUserIdFromToken();
        if (!teacherId) {
            console.warn("Brak nauczyciela w tokenie");
            setLoading(false);
            return;
        }

        async function loadData() {
            await loadSubstitutes();
            await loadCourses(selectedDay);
        }
        
        loadData();
    }, [selectedDay]);

    async function loadCourses(dzien) {
        try {
            setLoading(true);
            const kursy = await getMyCourses(dzien);
            
            const coursesWithUsers = await Promise.all(
                (kursy || []).map(async (course) => {
                    const groupsWithUsers = await Promise.all(
                        (course.grupy || []).map(async (grupa) => {
                            const needsUserData = grupa.uczniowie?.some(s => !s.uzytkownik);
                            
                            if (needsUserData && grupa.uczniowie) {
                                const studentsWithUsers = await Promise.all(
                                    grupa.uczniowie.map(async (student) => {
                                        if (student.uzytkownik) return student;
                                        
                                        try {
                                            const user = await getUserById(student.id_ucznia);
                                            return {
                                                ...student,
                                                uzytkownik: user
                                            };
                                        } catch (err) {
                                            console.error(`Błąd pobierania użytkownika ${student.id_ucznia}:`, err);
                                            return student;
                                        }
                                    })
                                );
                                
                                return {
                                    ...grupa,
                                    uczniowie: studentsWithUsers,
                                    zajecia: (grupa.zajecia || []).sort((a, b) => new Date(a.data) - new Date(b.data))
                                };
                            }
                            
                            return {
                                ...grupa,
                                zajecia: (grupa.zajecia || []).sort((a, b) => new Date(a.data) - new Date(b.data))
                            };
                        })
                    );
                    
                    return {
                        ...course,
                        grupy: groupsWithUsers
                    };
                })
            );
            
           
            const coursesWithSubstitutes = await addSubstituteLessonsToCourses(coursesWithUsers);
            
            setCourses(coursesWithSubstitutes);
        } catch (err) {
            console.error("Błąd przy ładowaniu kursów:", err);
        } finally {
            setLoading(false);
        }
    }

    async function addSubstituteLessonsToCourses(courses) {
        if (!substituteLessons || substituteLessons.length === 0) {
            return courses;
        }

        const coursesMap = new Map(courses.map(c => [c.id_kursu, { ...c, grupy: c.grupy.map(g => ({ ...g, zajecia: [...(g.zajecia || [])] })) }]));

        for (const subLesson of substituteLessons) {
            const grupaId = subLesson.id_grupy;
            
           
            let foundGroup = null;
            let foundCourse = null;
            
            for (const course of coursesMap.values()) {
                const grupa = course.grupy.find(g => g.id_grupa === grupaId);
                if (grupa) {
                    foundGroup = grupa;
                    foundCourse = course;
                    break;
                }
            }

            if (!foundGroup) {
                // Pomiń zastępstwa dla grup, które nie są przypisane do tego nauczyciela
                // Nauczyciel powinien widzieć tylko zajęcia zastępstw dla swoich własnych grup
                console.log(`Pomijam zastępstwo dla grupy ${grupaId} - nie jest przypisana do nauczyciela`);
                continue;
            }

            if (foundGroup) {
                const exists = foundGroup.zajecia.some(z => z.id_zajec === subLesson.id_zajec);
                if (!exists) {
                    foundGroup.zajecia.push({
                        ...subLesson,
                        isSubstituteLesson: true
                    });
                    foundGroup.zajecia.sort((a, b) => new Date(a.data) - new Date(b.data));
                }
            }
        }

        return Array.from(coursesMap.values());
    }

    async function loadSubstitutes() {
        try {
            const teacherId = getUserIdFromToken();
            const [reporting, taken] = await Promise.all([
                getSubstitutesByTeacherReporting(teacherId),
                getSubstitutesByTeacherSubstituting(teacherId)
            ]);
            setMySubstitutesReporting(reporting || []);
            setMySubstitutesTaken(taken || []);
            
            if (taken && taken.length > 0) {
                await loadCoursesForSubstitutes(taken);
            }
        } catch (err) {
            console.error("Błąd przy ładowaniu zastępstw:", err);
        }
    }

    async function loadCoursesForSubstitutes(takenSubstitutes) {
        if (!takenSubstitutes || takenSubstitutes.length === 0) {
            return;
        }

        try {
           
            const lessonsWithStudents = await Promise.all(
                takenSubstitutes.map(async (sub) => {
                    if (!sub.zajecia) return null;
                    
                    const lesson = sub.zajecia;
                    const grupaId = lesson.id_grupy;
                    
                    try {
                        
                        const [students, groupData] = await Promise.all([
                            getGroupStudents(grupaId).catch(err => {
                                if (err.status === 403 || 
                                    err.message?.includes('403') || 
                                    err.message?.includes('Forbidden') || 
                                    err.message?.includes('Brak dostępu') ||
                                    err.message?.includes('Unauthorized')) {
                                    console.log(`Brak dostępu do uczniów grupy ${grupaId} dla zastępstwa - pomijam`);
                                    return [];
                                }
                                throw err;
                            }),
                            getGroupById(grupaId).catch(err => {
                                if (err.status === 403 || 
                                    err.message?.includes('403') || 
                                    err.message?.includes('Forbidden') || 
                                    err.message?.includes('Brak dostępu') ||
                                    err.message?.includes('Unauthorized')) {
                                    console.log(`Brak dostępu do grupy ${grupaId} dla zastępstwa - pomijam`);
                                    return null;
                                }
                                throw err;
                            })
                        ]);

                        
                        if (!groupData || !students) {
                            console.log(`Pomijam zastępstwo dla grupy ${grupaId} - brak uprawnień`);
                            return null;
                        }
                        
                   
                        const studentsWithUsers = await Promise.all(
                            (students || []).map(async (student) => {
                                try {
                                    const user = await getUserById(student.id_ucznia);
                                    return {
                                        ...student,
                                        uzytkownik: user
                                    };
                                } catch (err) {
                                    console.error(`Błąd pobierania użytkownika ${student.id_ucznia}:`, err);
                                    return student;
                                }
                            })
                        );
                        
                       
                        const allPresences = await Promise.all(
                            studentsWithUsers.map(async (student) => {
                                try {
                                    const presences = await getPresenceForStudent(student.id_ucznia);
                                    return presences || [];
                                } catch (err) {
                                    console.error(`Błąd pobierania obecności dla ucznia ${student.id_ucznia}:`, err);
                                    return [];
                                }
                            })
                        );
                        
                       
                        const lessonPresences = allPresences
                            .flat()
                            .filter(p => p.id_zajec === lesson.id_zajec);
                        
                        return {
                            ...lesson,
                            godzina: groupData?.godzina || lesson.godzina,
                            uczniowie: studentsWithUsers,
                            obecnosci: lessonPresences,
                            id_zastepstwa: sub.id_zastepstwa
                        };
                    } catch (err) {
                        console.error(`Błąd pobierania studentów dla grupy ${grupaId}:`, err);
                        return {
                            ...lesson,
                            uczniowie: [],
                            obecnosci: [],
                            id_zastepstwa: sub.id_zastepstwa
                        };
                    }
                })
            );
            
           
            const validLessons = lessonsWithStudents.filter(Boolean);
            setSubstituteLessons(validLessons);
            
        } catch (error) {
            console.error("Błąd podczas ładowania zajęć z zastępstw:", error);
        }
    }

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
            return newSet;
        });
    };

    const countTotalGroups = grupy => grupy.length;
    const countTotalLessons = grupy => grupy.reduce((s, g) => s + (g.zajecia?.length || 0), 0);

    const formatDate = d => d ? new Date(d).toLocaleDateString("pl-PL") : "Nieustalona";
    const formatTime = t => t ? t.split(":").slice(0, 2).join(":") : "Nieustalona";

    const getNazwaZajec = z => z.tematZajec || "Brak tematu";

    const getStudentPresence = (zajecie, studentId) => {
      
        const changeKey = `${zajecie.id_zajec}_${studentId}`;
        if (unsavedPresences[changeKey]) {
            return unsavedPresences[changeKey].value;
        }
        
      
        const o = zajecie.obecnosci?.find(x => x.id_ucznia === studentId);
        if (!o) return null;
        return o.czyObecny == 1;
    };

    const isUnsavedChange = (zajecieId, studentId) => {
        const changeKey = `${zajecieId}_${studentId}`;
        return !!unsavedPresences[changeKey];
    };

    const getPresenceColor = status => {
        if (status === null) return "bg-gray-200 border-gray-300";
        if (status === true) return "bg-green-100 border-green-300";
        return "bg-red-100 border-red-300";
    };

    const getPresenceText = s => s === null ? "?" : s === true ? "✓" : "✗";
    const getPresenceTextColor = s =>
        s === null ? "text-gray-600" : s ? "text-green-600" : "text-red-600";

    const getStudentFullName = (student) => {
        return `${student.uzytkownik?.imie || ''} ${student.uzytkownik?.nazwisko || ''}`.trim() || 'Brak danych';
    };

    const isStudentPresent = (zajecie, studentId) => {
        const status = getStudentPresence(zajecie, studentId);
        return status === true;
    };

    const openPresenceMenu = (e, obecnosc, zajecieId, studentId) => {
        const rect = e.target.getBoundingClientRect();
        setPresenceMenu({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height,
            idObecnosci: obecnosc?.id_obecnosci || null,
            idZajec: zajecieId,
            idStudenta: studentId
        });
    };

    const openRemarkModal = (zajecie) => {
        setRemarkModal({
            visible: true,
            zajecie,
            selectedStudent: null,
            tresc: ""
        });
    };

    const closeRemarkModal = () => {
        setRemarkModal({
            visible: false,
            zajecie: null,
            selectedStudent: null,
            tresc: ""
        });
    };

    const handleRemarkSubmit = async () => {
        if (!remarkModal.tresc.trim()) {
            alert("Proszę wpisać treść uwagi");
            return;
        }

        if (!remarkModal.selectedStudent) {
            alert("Proszę wybrać ucznia");
            return;
        }

        try {
            setUpdating(true);
            const teacherId = getUserIdFromToken();

            const remarkData = {
                id_ucznia: remarkModal.selectedStudent.id_ucznia,
                id_zajec: remarkModal.zajecie.id_zajec,
                tresc: remarkModal.tresc,
                id_nauczyciela: teacherId
            };

            const result = await addComment(remarkData);

           
            try {
                await penalizeForRemark(remarkModal.selectedStudent.id_ucznia);
                console.log(`Odebrano 5 punktów uczniowi ${remarkModal.selectedStudent.id_ucznia} za uwagę`);
            } catch (pointsError) {
                console.error("Błąd przy karze punktowej za uwagę:", pointsError);
             
            }

            closeRemarkModal();
            alert("Uwaga została dodana pomyślnie! Uczniowi odebrano 5 punktów.");

        } catch (error) {
            console.error("Błąd przy dodawaniu uwagi:", error);
            alert("Wystąpił błąd podczas dodawania uwagi");
        } finally {
            setUpdating(false);
        }
    };

    const updatePresenceOptimistically = (zajecieId, studentId, value) => {
        setCourses(prevCourses =>
            prevCourses.map(course => ({
                ...course,
                grupy: course.grupy.map(grupa => ({
                    ...grupa,
                    zajecia: grupa.zajecia.map(zajecie => {
                        if (zajecie.id_zajec === zajecieId) {
                            const existingObecnosc = zajecie.obecnosci?.find(o => o.id_ucznia === studentId);

                            if (value === null) {
                                const updatedObecnosci = zajecie.obecnosci?.filter(o => o.id_ucznia !== studentId) || [];
                                return {
                                    ...zajecie,
                                    obecnosci: updatedObecnosci
                                };
                            } else {
                                const newObecnosc = {
                                    id_obecnosci: existingObecnosc?.id_obecnosci || `temp-${Date.now()}`,
                                    id_ucznia: studentId,
                                    id_zajec: zajecieId,
                                    czyObecny: value ? 1 : 0
                                };

                                const updatedObecnosci = existingObecnosc
                                    ? zajecie.obecnosci?.map(o =>
                                    o.id_ucznia === studentId ? newObecnosc : o
                                ) || []
                                    : [...(zajecie.obecnosci || []), newObecnosc];

                                return {
                                    ...zajecie,
                                    obecnosci: updatedObecnosci
                                };
                            }
                        }
                        return zajecie;
                    }).sort((a, b) => new Date(a.data) - new Date(b.data))
                }))
            }))
        );
        
       
        setSubstituteLessons(prevLessons =>
            prevLessons.map(lesson => {
                if (lesson.id_zajec === zajecieId) {
                    const existingObecnosc = lesson.obecnosci?.find(o => o.id_ucznia === studentId);

                    if (value === null) {
                        const updatedObecnosci = lesson.obecnosci?.filter(o => o.id_ucznia !== studentId) || [];
                        return {
                            ...lesson,
                            obecnosci: updatedObecnosci
                        };
                    } else {
                        const newObecnosc = {
                            id_obecnosci: existingObecnosc?.id_obecnosci || `temp-${Date.now()}`,
                            id_ucznia: studentId,
                            id_zajec: zajecieId,
                            czyObecny: value ? 1 : 0
                        };

                        const updatedObecnosci = existingObecnosc
                            ? lesson.obecnosci?.map(o =>
                                o.id_ucznia === studentId ? newObecnosc : o
                            ) || []
                            : [...(lesson.obecnosci || []), newObecnosc];

                        return {
                            ...lesson,
                            obecnosci: updatedObecnosci
                        };
                    }
                }
                return lesson;
            })
        );
    };

    const choosePresence = async (value) => {
        if (updating) return;

        try {
            const { idObecnosci, idZajec, idStudenta } = presenceMenu;

            if (!idZajec || !idStudenta) {
                console.error("Brak wymaganych danych:", presenceMenu);
                return;
            }

           
            const zajecie = [
                ...courses.flatMap(c => c.grupy?.flatMap(g => g.zajecia) || []),
                ...substituteLessons
            ].find(z => z.id_zajec === idZajec);
            
            let originalPresence = null;
            if (zajecie) {
                const existingPresence = zajecie.obecnosci?.find(o => o.id_ucznia === idStudenta);
                originalPresence = existingPresence ? (existingPresence.czyObecny === 1) : null;
            }

           
            const changeKey = `${idZajec}_${idStudenta}`;
            setUnsavedPresences(prev => ({
                ...prev,
                [changeKey]: {
                    value: value,
                    original: originalPresence,
                    idObecnosci: idObecnosci,
                    idZajec: idZajec,
                    idStudenta: idStudenta
                }
            }));

           
            updatePresenceOptimistically(idZajec, idStudenta, value);

            setPresenceMenu({
                visible: false,
                x: 0,
                y: 0,
                idObecnosci: null,
                idZajec: null,
                idStudenta: null
            });

        } catch (err) {
            console.error("Błąd przy lokalnej zmianie obecności:", err);
        }
    };

    const saveAllPresences = async () => {
        if (Object.keys(unsavedPresences).length === 0) {
            alert("Brak zmian do zapisania");
            return;
        }

        if (!confirm(`Czy zapisać ${Object.keys(unsavedPresences).length} zmian obecności?`)) {
            return;
        }

        setSaving(true);
        const errors = [];
        let pointsChanges = [];

        try {
            for (const [changeKey, change] of Object.entries(unsavedPresences)) {
                const { value, original, idObecnosci, idZajec, idStudenta } = change;

                try {
                    let apiCall;
                    if (!idObecnosci && value !== null) {
                        await createPresence(idZajec, idStudenta, value);
                    } else if (idObecnosci && value !== null) {
                        await setPresence(idObecnosci, value);
                    } else if (idObecnosci && value === null) {
                        await deletePresence(idObecnosci);
                    }

                   
                    if (value === true && (original === false || original === null)) {
                        
                        pointsChanges.push({ studentId: idStudenta, action: 'add' });
                    } else if (value === false && original === true) {
                     
                        pointsChanges.push({ studentId: idStudenta, action: 'remove' });
                    } else if (value === null && original === true) {
                        
                        pointsChanges.push({ studentId: idStudenta, action: 'remove' });
                    }

                } catch (error) {
                    console.error(`Błąd zapisywania obecności ${changeKey}:`, error);
                    errors.push(changeKey);
                }
            }

        
            for (const pointChange of pointsChanges) {
                try {
                    if (pointChange.action === 'add') {
                        await awardAttendancePoint(pointChange.studentId);
                    } else {
                        await revokeAttendancePoint(pointChange.studentId);
                    }
                } catch (pointsError) {
                    console.error("Błąd przy zarządzaniu punktami:", pointsError);
                }
            }

            if (errors.length === 0) {
                setUnsavedPresences({});
                alert("✅ Wszystkie obecności zostały zapisane!");
            } else {
                alert(`⚠️ Zapisano z błędami. ${errors.length} zmian nie udało się zapisać.`);
            }

       
            await loadCourses(selectedDay);
            await loadSubstitutes();

        } catch (err) {
            console.error("Błąd przy zapisie obecności:", err);
            alert("Błąd przy zapisie obecności");
        } finally {
            setSaving(false);
        }
    };

    const cancelUnsavedChanges = () => {
        if (Object.keys(unsavedPresences).length === 0) return;

        if (!confirm("Czy anulować wszystkie niezapisane zmiany?")) return;

        setUnsavedPresences({});
       
        loadCourses(selectedDay);
        loadSubstitutes();
    };

    const saveGroupPresences = async (groupId) => {
        const groupChanges = Object.entries(unsavedPresences).filter(([key, change]) => {
           
            const zajecie = [
                ...courses.flatMap(c => c.grupy?.flatMap(g => g.zajecia) || []),
                ...substituteLessons
            ].find(z => z.id_zajec === change.idZajec);
            
            if (!zajecie) return false;
            
          
            const isInRegularGroup = courses.some(c => 
                c.grupy.some(g => g.id_grupa === groupId && 
                    g.zajecia.some(z => z.id_zajec === change.idZajec)
                )
            );
            
           
            const isInSubstituteGroup = substituteLessons.some(sub => 
                sub.id_zajec === change.idZajec && sub.id_grupy === groupId
            );
            
            return isInRegularGroup || isInSubstituteGroup;
        });

        if (groupChanges.length === 0) {
            alert("Brak zmian w tej grupie do zapisania");
            return;
        }

        if (!confirm(`Czy zapisać ${groupChanges.length} zmian obecności dla tej grupy?`)) {
            return;
        }

        setSaving(true);
        const errors = [];
        let pointsChanges = [];

        try {
            for (const [changeKey, change] of groupChanges) {
                const { value, original, idObecnosci, idZajec, idStudenta } = change;

                try {
                    if (!idObecnosci && value !== null) {
                        await createPresence(idZajec, idStudenta, value);
                    } else if (idObecnosci && value !== null) {
                        await setPresence(idObecnosci, value);
                    } else if (idObecnosci && value === null) {
                        await deletePresence(idObecnosci);
                    }

                   
                    if (value === true && (original === false || original === null)) {
                       
                        pointsChanges.push({ studentId: idStudenta, action: 'add' });
                    } else if (value === false && original === true) {
                   
                        pointsChanges.push({ studentId: idStudenta, action: 'remove' });
                    } else if (value === null && original === true) {
                       
                        pointsChanges.push({ studentId: idStudenta, action: 'remove' });
                    }
                    

                } catch (error) {
                    console.error(`Błąd zapisywania obecności ${changeKey}:`, error);
                    errors.push(changeKey);
                }
            }

           
            for (const pointChange of pointsChanges) {
                try {
                    if (pointChange.action === 'add') {
                        await awardAttendancePoint(pointChange.studentId);
                    } else {
                        await revokeAttendancePoint(pointChange.studentId);
                    }
                } catch (pointsError) {
                    console.error("Błąd przy zarządzaniu punktami:", pointsError);
                }
            }

            if (errors.length === 0) {
            
                const newUnsavedPresences = { ...unsavedPresences };
                groupChanges.forEach(([key]) => {
                    delete newUnsavedPresences[key];
                });
                setUnsavedPresences(newUnsavedPresences);
                
                alert("✅ Obecności dla grupy zostały zapisane!");
            } else {
                alert(`⚠️ Zapisano z błędami. ${errors.length} zmian nie udało się zapisać.`);
            }

          
            await loadCourses(selectedDay);
            await loadSubstitutes();

        } catch (err) {
            console.error("Błąd przy zapisie obecności:", err);
            alert("Błąd przy zapisie obecności");
        } finally {
            setSaving(false);
        }
    };

    const cancelGroupChanges = (groupId) => {
        const groupChanges = Object.entries(unsavedPresences).filter(([key, change]) => {
        
            const zajecie = [
                ...courses.flatMap(c => c.grupy?.flatMap(g => g.zajecia) || []),
                ...substituteLessons
            ].find(z => z.id_zajec === change.idZajec);
            
            if (!zajecie) return false;
            
       
            const isInRegularGroup = courses.some(c => 
                c.grupy.some(g => g.id_grupa === groupId && 
                    g.zajecia.some(z => z.id_zajec === change.idZajec)
                )
            );
            
            
            const isInSubstituteGroup = substituteLessons.some(sub => 
                sub.id_zajec === change.idZajec && sub.id_grupy === groupId
            );
            
            return isInRegularGroup || isInSubstituteGroup;
        });

        if (groupChanges.length === 0) return;

        if (!confirm(`Czy anulować ${groupChanges.length} niezapisanych zmian dla tej grupy?`)) return;

       
        const newUnsavedPresences = { ...unsavedPresences };
        groupChanges.forEach(([key]) => {
            delete newUnsavedPresences[key];
        });
        setUnsavedPresences(newUnsavedPresences);
        
      
        loadCourses(selectedDay);
        loadSubstitutes();
    };

    const getGroupUnsavedCount = (groupId) => {
        return Object.entries(unsavedPresences).filter(([key, change]) => {
          
            const zajecie = [
                ...courses.flatMap(c => c.grupy?.flatMap(g => g.zajecia) || []),
                ...substituteLessons
            ].find(z => z.id_zajec === change.idZajec);
            
            if (!zajecie) return false;
            
           
            const isInRegularGroup = courses.some(c => 
                c.grupy.some(g => g.id_grupa === groupId && 
                    g.zajecia.some(z => z.id_zajec === change.idZajec)
                )
            );
            
       
            const isInSubstituteGroup = substituteLessons.some(sub => 
                sub.id_zajec === change.idZajec && sub.id_grupy === groupId
            );
            
            return isInRegularGroup || isInSubstituteGroup;
        }).length;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie kursów...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 relative">
            <div className="max-w-full mx-auto">

                <header className="mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Moje kursy i grupy</h1>
                        <p className="text-gray-600 mt-2">Przeglądaj swoje kursy, grupy i obecności</p>
                    </div>
                </header>

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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Liczba kursów" value={courses.length} color="text-blue-600" />
                    <StatCard
                        title="Liczba grup"
                        value={courses.reduce((s, c) => s + countTotalGroups(c.grupy), 0)}
                        color="text-green-600"
                    />
                    <StatCard
                        title="Liczba zajęć"
                        value={courses.reduce((s, c) => s + countTotalLessons(c.grupy), 0)}
                        color="text-purple-600"
                    />
                    <StatCard
                        title="Wybrany dzień"
                        value={selectedDay || "Wszystkie dni"}
                        color="text-orange-600"
                    />
                </div>

                {updating && (
                    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                        Zapisuję zmiany...
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
                                        {course.grupy.length} {course.grupy.length === 1 ? 'grupa' : 'grup'}
                                    </span>
                                </div>

                                <div className="p-6 space-y-6">
                                    {course.grupy.map(grupa => (
                                        <GroupSection
                                            key={grupa.id_grupa}
                                            grupa={grupa}
                                            expanded={expandedGroups.has(grupa.id_grupa)}
                                            toggleGroup={() => toggleGroup(grupa.id_grupa)}
                                            formatDate={formatDate}
                                            formatTime={formatTime}
                                            getNazwaZajec={getNazwaZajec}
                                            getStudentPresence={getStudentPresence}
                                            getPresenceColor={getPresenceColor}
                                            getPresenceText={getPresenceText}
                                            getPresenceTextColor={getPresenceTextColor}
                                            openPresenceMenu={openPresenceMenu}
                                            openRemarkModal={openRemarkModal}
                                            openEquipmentRemarkModal={openEquipmentRemarkModal}
                                            getStudentFullName={getStudentFullName}
                                            router={router}
                                            openQuizModal={openQuizModal}
                                            unsavedPresences={unsavedPresences}
                                            mySubstitutesReporting={mySubstitutesReporting}
                                            mySubstitutesTaken={mySubstitutesTaken}
                                            saveGroupPresences={saveGroupPresences}
                                            cancelGroupChanges={cancelGroupChanges}
                                            getGroupUnsavedCount={getGroupUnsavedCount}
                                            saving={saving}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                
                {substituteLessons.length > 0 && (() => {
                    
                    const twoDaysAgo = new Date();
                    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                    twoDaysAgo.setHours(0, 0, 0, 0);
                    
                    const filteredLessons = substituteLessons.filter(lesson => {
                        const lessonDate = new Date(lesson.data);
                        return lessonDate >= twoDaysAgo;
                    });
                    
                    if (filteredLessons.length === 0) return null;
                    
                    return (
                        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-lg overflow-hidden border-2 border-green-200">
                            <div 
                                className="bg-green-100 px-6 py-4 border-b border-green-200 cursor-pointer hover:bg-green-150 transition-colors"
                                onClick={() => setSubstitutesExpanded(!substitutesExpanded)}
                            >
                                <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between">
                                    <div className="flex items-center gap-2 mb-2 min-[500px]:mb-0">
                                        <span className="text-2xl">✅</span>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            Twoje zastępstwa
                                        </h2>
                                        <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {filteredLessons.length} {filteredLessons.length === 1 ? 'zajęcia' : 'zajęć'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 min-[500px]:gap-4">
                                        <span className="text-gray-600 text-sm">
                                            Zajęcia, które prowadzisz jako zastępstwo
                                        </span>
                                        <svg 
                                            className={`w-6 h-6 text-gray-600 transition-transform ${substitutesExpanded ? 'rotate-180' : ''}`}
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {substitutesExpanded && (
                                <div className="p-6 space-y-6">
                                    {filteredLessons.map(lesson => (
                                <div key={lesson.id_zajec} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                                    <div className="mb-4 flex flex-col min-[500px]:flex-row min-[500px]:justify-between min-[500px]:items-start">
                                        <div className="mb-2 min-[500px]:mb-0">
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {lesson.tematZajec || 'Zajęcia'}
                                            </h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                Data: {formatDate(lesson.data)} | Godzina: {formatTime(lesson.godzina)} | Grupa {lesson.id_grupy}
                                            </p>
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium w-fit">
                                            ZASTĘPSTWO
                                        </span>
                                    </div>

                                    {lesson.uczniowie && lesson.uczniowie.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-2 px-1 min-[500px]:py-3 min-[500px]:px-4 font-semibold text-gray-700 text-xs min-[500px]:text-base w-auto max-[499px]:w-fit">
                                                            <span className="min-[500px]:hidden">U</span>
                                                            <span className="hidden min-[500px]:inline">Uczeń</span>
                                                        </th>
                                                        <th className="text-center py-2 px-2 min-[500px]:py-3 min-[500px]:px-4 font-semibold text-gray-700 text-xs min-[500px]:text-base">
                                                            <span className="min-[500px]:hidden">Ob</span>
                                                            <span className="hidden min-[500px]:inline">Obecność</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {lesson.uczniowie.map((student, idx) => {
                                                        const status = getStudentPresence(lesson, student.id_ucznia);
                                                        const obecnosc = lesson.obecnosci?.find(o => o.id_ucznia === student.id_ucznia);
                                                        
                                                        return (
                                                            <tr key={student.id_ucznia} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                                                                <td className="py-2 px-1 min-[500px]:py-3 min-[500px]:px-4 w-auto max-[499px]:w-fit">
                                                                    <div className="flex items-center gap-1 min-[500px]:gap-2 w-fit max-[499px]:max-w-[70px]">
                                                                        <div className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center hidden min-[500px]:flex">
                                                                            <span className="text-blue-600 text-sm font-medium">
                                                                                {student.uzytkownik?.imie?.charAt(0).toUpperCase() || '?'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="min-w-0 flex-1 overflow-hidden">
                                                                            <div className="font-medium text-gray-900 text-xs min-[500px]:text-base truncate whitespace-nowrap">
                                                                                <span className="min-[500px]:hidden">
                                                                                    {student.uzytkownik?.nazwisko?.substring(0, 6) || 'Brak'}
                                                                                </span>
                                                                                <span className="hidden min-[500px]:inline">
                                                                                    {getStudentFullName(student)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 hidden min-[400px]:block whitespace-nowrap">
                                                                                <span className="min-[500px]:hidden">P: {student.saldo_punktow}</span>
                                                                                <span className="hidden min-[500px]:inline">Punkty: {student.saldo_punktow}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 min-[500px]:py-3 min-[500px]:px-4 text-center">
                                                                    <div
                                                                        onClick={(e) => openPresenceMenu(e, obecnosc, lesson.id_zajec, student.id_ucznia)}
                                                                        className={`w-8 h-8 min-[500px]:w-10 min-[500px]:h-10 rounded border-2 flex items-center justify-center mx-auto cursor-pointer transition-all hover:scale-110 ${
                                                                            status === null
                                                                                ? "border-gray-300 bg-gray-100 hover:bg-gray-200"
                                                                                : status
                                                                                ? "border-green-500 bg-green-50 hover:bg-green-100"
                                                                                : "border-red-500 bg-red-50 hover:bg-red-100"
                                                                        }`}
                                                                        title={`Kliknij aby zmienić obecność dla ${getStudentFullName(student)}`}
                                                                    >
                                                                        <span className={`font-bold text-sm min-[500px]:text-lg ${getPresenceTextColor(status)}`}>
                                                                            {getPresenceText(status)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">Brak uczniów w grupie</p>
                                    )}
                                    
                                  
                                    {getGroupUnsavedCount(lesson.id_grupy) > 0 && (
                                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between">
                                                <div className="flex items-center gap-2 mb-3 min-[500px]:mb-0">
                                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                    <span className="text-sm text-yellow-800 font-medium">
                                                        📝 {getGroupUnsavedCount(lesson.id_grupy)} niezapisanych zmian obecności dla tej grupy
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 justify-center min-[500px]:justify-end">
                                                    <button
                                                        onClick={() => saveGroupPresences(lesson.id_grupy)}
                                                        disabled={saving}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {saving ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                Zapisywanie...
                                                            </>
                                                        ) : (
                                                            <>
                                                                💾 Zapisz zastępstwo
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => cancelGroupChanges(lesson.id_grupy)}
                                                        disabled={saving}
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        ❌ Anuluj
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                    );
                })()}

                {presenceMenu.visible && (
                    <div
                        style={{
                            position: "fixed",
                            top: presenceMenu.y,
                            left: presenceMenu.x,
                            transform: "translate(-50%, 10px)"
                        }}
                        className="bg-white shadow-lg border border-gray-300 rounded-lg p-2 z-50 min-w-[140px]"
                    >
                        <button
                            onClick={() => choosePresence(true)}
                            className="block w-full px-3 py-2 hover:bg-green-50 text-green-700 rounded text-left transition-colors"
                        >
                            ✓ Obecny
                        </button>
                        <button
                            onClick={() => choosePresence(false)}
                            className="block w-full px-3 py-2 hover:bg-red-50 text-red-700 rounded text-left transition-colors"
                        >
                            ✗ Nieobecny
                        </button>
                        <button
                            onClick={() => choosePresence(null)}
                            className="block w-full px-3 py-2 hover:bg-gray-50 text-gray-700 rounded text-left transition-colors"
                        >
                            ? Nieustalone
                        </button>
                        <div className="border-t border-gray-200 mt-1 pt-1">
                            <button
                                onClick={() => setPresenceMenu(p => ({ ...p, visible: false }))}
                                className="block w-full px-3 py-2 text-gray-500 hover:bg-gray-100 rounded text-left transition-colors"
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                )}

                {remarkModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Dodaj uwagę
                                </h3>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Zajęcia: <strong>{getNazwaZajec(remarkModal.zajecie)}</strong><br />
                                        Data: <strong>{formatDate(remarkModal.zajecie?.data)}</strong>
                                    </p>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Wybierz ucznia (tylko obecni):
                                    </label>
                                    <select
                                        value={remarkModal.selectedStudent?.id_ucznia || ""}
                                        onChange={(e) => {
                                            const studentId = e.target.value;
                                            const grupa = courses
                                                .flatMap(c => c.grupy)
                                                .find(g => g.zajecia?.some(z => z.id_zajec === remarkModal.zajecie?.id_zajec));
                                            const student = grupa?.uczniowie?.find(u => u.id_ucznia == studentId);
                                            setRemarkModal(prev => ({ ...prev, selectedStudent: student || null }));
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Wybierz ucznia...</option>
                                        {(() => {
                                            const grupa = courses
                                                .flatMap(c => c.grupy)
                                                .find(g => g.zajecia?.some(z => z.id_zajec === remarkModal.zajecie?.id_zajec));

                                           
                                            const obecniUczniowie = grupa?.uczniowie?.filter(student =>
                                                isStudentPresent(remarkModal.zajecie, student.id_ucznia)
                                            ) || [];

                                            return obecniUczniowie.map(student => (
                                                <option key={student.id_ucznia} value={student.id_ucznia}>
                                                    {getStudentFullName(student)}
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                    {(() => {
                                        const grupa = courses
                                            .flatMap(c => c.grupy)
                                            .find(g => g.zajecia?.some(z => z.id_zajec === remarkModal.zajecie?.id_zajec));
                                        const obecniUczniowie = grupa?.uczniowie?.filter(student =>
                                            isStudentPresent(remarkModal.zajecie, student.id_ucznia)
                                        ) || [];

                                        if (obecniUczniowie.length === 0) {
                                            return (
                                                <p className="text-sm text-red-600 mt-2">
                                                    Brak obecnych uczniów na tych zajęciach
                                                </p>
                                            );
                                        }
                                    })()}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Treść uwagi:
                                    </label>
                                    <textarea
                                        value={remarkModal.tresc}
                                        onChange={(e) => setRemarkModal(prev => ({ ...prev, tresc: e.target.value }))}
                                        placeholder="Wpisz treść uwagi..."
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={closeRemarkModal}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={handleRemarkSubmit}
                                        disabled={updating || !remarkModal.tresc.trim() || !remarkModal.selectedStudent}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {updating ? "Dodawanie..." : "Dodaj uwagę"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {equipmentRemarkModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Uwaga o sprzęcie
                                </h3>

                                <p className="text-sm text-gray-600 mb-2">
                                    Zajęcia: <strong>{getNazwaZajec(equipmentRemarkModal.zajecie)}</strong><br />
                                    Data: <strong>{formatDate(equipmentRemarkModal.zajecie?.data)}</strong>
                                </p>

                                <textarea
                                    value={equipmentRemarkModal.tresc}
                                    onChange={e => setEquipmentRemarkModal(prev => ({ ...prev, tresc: e.target.value }))}
                                    placeholder="Opisz problem ze sprzętem..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={closeEquipmentRemarkModal}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={handleEquipmentRemarkSubmit}
                                        disabled={updating || !equipmentRemarkModal.tresc.trim()}
                                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
                                    >
                                        {updating ? "Zapis..." : "Zapisz"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {quizModal.visible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    Przypisz quiz do zajęć
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Zajęcia: <strong>{getNazwaZajec(quizModal.zajecie)}</strong><br />
                                    Data: <strong>{formatDate(quizModal.zajecie?.data)}</strong>
                                </p>
                            </div>

                            <div className="p-6 border-b">
                                <input
                                    type="text"
                                    placeholder="🔍 Szukaj quizu po nazwie lub opisie..."
                                    value={quizModal.searchTerm}
                                    onChange={(e) => handleQuizSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {quizModal.loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                        <p className="mt-2 text-gray-600">Ładowanie quizów...</p>
                                    </div>
                                ) : quizModal.filteredQuizzes.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {quizModal.searchTerm 
                                            ? `Nie znaleziono quizów pasujących do "${quizModal.searchTerm}"`
                                            : "Brak dostępnych quizów. Utwórz pierwszy quiz!"}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {quizModal.filteredQuizzes.map((quiz) => (
                                            <div
                                                key={quiz.id_quizu}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-800">{quiz.nazwa}</h4>
                                                        {quiz.opis && (
                                                            <p className="text-sm text-gray-600 mt-1">{quiz.opis}</p>
                                                        )}
                                                        {quiz.Zajecia_id_zajec === quizModal.zajecie.id_zajec && (
                                                            <p className="text-xs text-green-600 mt-2">
                                                                ✓ Już przypisany do tych zajęć
                                                            </p>
                                                        )}
                                                    </div>
                                                    {quiz.Zajecia_id_zajec !== quizModal.zajecie.id_zajec && (
                                                        <button
                                                            onClick={() => handleAssignQuiz(quiz)}
                                                            disabled={updating}
                                                            className="ml-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-purple-300 transition-colors text-sm font-medium whitespace-nowrap"
                                                        >
                                                            {updating ? "..." : "Przypisz"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t bg-gray-50">
                                <button
                                    onClick={closeQuizModal}
                                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Zamknij
                                </button>
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
                          formatDate,
                          formatTime,
                          getNazwaZajec,
                          getStudentPresence,
                          getPresenceColor,
                          getPresenceText,
                          getPresenceTextColor,
                          openPresenceMenu,
                          openRemarkModal,
                          openEquipmentRemarkModal,
                          getStudentFullName,
                          router,
                          openQuizModal,
                          unsavedPresences,
                          mySubstitutesReporting,
                          mySubstitutesTaken,
                          saveGroupPresences,
                          cancelGroupChanges,
                          getGroupUnsavedCount,
                          saving
                      }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div
                className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center transition-colors"
                onClick={toggleGroup}
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-4 h-4 transition-transform text-gray-500 ${expanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                    <div>
                        <h3 className="font-semibold text-gray-800">Grupa #{grupa.id_grupa}</h3>
                        <p className="text-sm text-gray-600">
                            Dzień: <b>{grupa.dzien_tygodnia}</b> |
                            Godzina: <b>{formatTime(grupa.godzina)}</b> |
                            Uczniowie: <b>{grupa.uczniowie?.length || 0}</b>
                        </p>
                    </div>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {grupa.zajecia?.length || 0} {grupa.zajecia?.length === 1 ? 'zajęcie' : 'zajęć'}
                </span>
            </div>

            {expanded && (
                <div className="p-4">
                    {(!grupa.uczniowie?.length || !grupa.zajecia?.length) ? (
                        <p className="text-gray-500 text-center py-4">
                            {!grupa.uczniowie?.length
                                ? "Brak uczniów w grupie"
                                : "Brak zaplanowanych zajęć"}
                        </p>
                    ) : (
                        <>
                            <AttendanceMatrix
                                grupa={grupa}
                                formatDate={formatDate}
                                getNazwaZajec={getNazwaZajec}
                                getStudentPresence={getStudentPresence}
                                getPresenceColor={getPresenceColor}
                                getPresenceText={getPresenceText}
                                getPresenceTextColor={getPresenceTextColor}
                                openPresenceMenu={openPresenceMenu}
                                openRemarkModal={openRemarkModal}
                                openEquipmentRemarkModal={openEquipmentRemarkModal}
                                getStudentFullName={getStudentFullName}
                                router={router}
                                openQuizModal={openQuizModal}
                                unsavedPresences={unsavedPresences}
                                mySubstitutesReporting={mySubstitutesReporting}
                                mySubstitutesTaken={mySubstitutesTaken}
                            />
                            
                            {getGroupUnsavedCount(grupa.id_grupa) > 0 && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between">
                                        <div className="flex items-center gap-2 mb-3 min-[500px]:mb-0">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                            <span className="text-sm text-yellow-800 font-medium">
                                                📝 {getGroupUnsavedCount(grupa.id_grupa)} niezapisanych zmian obecności w tej grupie
                                            </span>
                                        </div>
                                        <div className="flex gap-2 justify-center min-[500px]:justify-end">
                                            <button
                                                onClick={() => saveGroupPresences(grupa.id_grupa)}
                                                disabled={saving}
                                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {saving ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Zapisywanie...
                                                    </>
                                                ) : (
                                                    <>
                                                        💾 Zapisz grupę
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => cancelGroupChanges(grupa.id_grupa)}
                                                disabled={saving}
                                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                            >
                                                ❌ Anuluj
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function AttendanceMatrix({
                              grupa,
                              formatDate,
                              getNazwaZajec,
                              getStudentPresence,
                              getPresenceColor,
                              getPresenceText,
                              getPresenceTextColor,
                              openPresenceMenu,
                              openRemarkModal,
                              openEquipmentRemarkModal,
                              getStudentFullName,
                              router,
                              openQuizModal,
                              unsavedPresences,
                              mySubstitutesReporting,
                              mySubstitutesTaken
                          }) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                    <tr className="bg-gray-50">
                        <th className="px-1 py-3 text-left text-xs min-[500px]:text-sm font-medium text-gray-700 sticky left-0 bg-gray-50 border-r w-auto max-[499px]:w-fit max-[499px]:max-w-[70px] min-[500px]:min-w-[200px] z-10">
                            <span className="min-[500px]:hidden">U</span>
                            <span className="hidden min-[500px]:inline">Uczeń</span>
                        </th>

                        {grupa.zajecia.map((zajecie, index) => {
                            const substitute = mySubstitutesReporting?.find(sub => 
                                sub.zajecia_id_zajec === zajecie.id_zajec || sub.zajecia?.id_zajec === zajecie.id_zajec
                            );
                            const isTakenByMe = zajecie.isSubstituteLesson || mySubstitutesTaken?.some(sub => 
                                sub.zajecia_id_zajec === zajecie.id_zajec || sub.zajecia?.id_zajec === zajecie.id_zajec
                            );
                            const hasSubstitute = substitute && substitute.id_nauczyciel_zastepujacy;
                            
                            return (
                            <th key={zajecie.id_zajec} className={`px-3 py-2 text-center border-b min-w-[120px] ${hasSubstitute ? 'bg-red-50' : isTakenByMe ? 'bg-green-50' : ''}`}>
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold text-sm">{index + 1}.</span>
                                    {hasSubstitute && (
                                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mb-1">
                                            🔄 ZASTĘPSTWO
                                        </span>
                                    )}
                                    {isTakenByMe && (
                                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded mb-1">
                                            ✅ TWOJE ZASTĘPSTWO
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500 mt-1">
                                        {formatDate(zajecie.data)}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1 truncate max-w-[100px]" title={getNazwaZajec(zajecie)}>
                                        {getNazwaZajec(zajecie)}
                                    </span>
                                    {!hasSubstitute && (
                                        <>
                                    <button
                                        onClick={() => openRemarkModal(zajecie)}
                                        className="text-xs text-blue-500 hover:text-blue-700 mt-1 underline"
                                        title="Dodaj uwagę do tych zajęć"
                                    >
                                        Dodaj uwagę
                                    </button>
                                    <button
                                        onClick={() => openEquipmentRemarkModal(zajecie)}
                                        className="text-xs text-orange-500 hover:text-orange-700 mt-1 underline"
                                        title="Dodaj uwagę do sprzętu"
                                    >
                                        Sprzęt
                                    </button>
                                    <button
                                        onClick={() => openQuizModal(zajecie)}
                                        className="text-xs text-purple-500 hover:text-purple-700 mt-1 underline font-medium"
                                        title="Przypisz quiz do tych zajęć"
                                    >
                                        + Dodaj quiz
                                    </button>
                                        </>
                                    )}
                                </div>
                            </th>
                            );
                        })}
                    </tr>
                    </thead>

                    <tbody>
                    {grupa.uczniowie.map((student, rowIndex) => {
                        return (
                            <tr key={student.id_ucznia} className={rowIndex % 2 ? "bg-gray-50" : "bg-white"}>
                                <td className="px-1 py-2 min-[500px]:px-4 min-[500px]:py-3 sticky left-0 bg-inherit border-r z-5 w-auto min-w-0 max-[499px]:w-fit">
                                    <div className="flex items-center gap-0 min-[500px]:gap-2 w-fit max-[499px]:max-w-[70px]">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center flex-shrink-0 hidden min-[500px]:flex">
                                            <span className="text-blue-600 text-sm font-medium">
                                                {student.uzytkownik?.imie?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <div className="font-medium truncate text-gray-900 text-xs min-[500px]:text-base whitespace-nowrap">
                                                <span className="min-[500px]:hidden">
                                                    {student.uzytkownik?.nazwisko?.substring(0, 6) || 'Brak'}
                                                </span>
                                                <span className="hidden min-[500px]:inline">
                                                    {getStudentFullName(student)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 hidden min-[400px]:block whitespace-nowrap">
                                                <span className="min-[500px]:hidden">P: {student.saldo_punktow}</span>
                                                <span className="hidden min-[500px]:inline">Punkty: {student.saldo_punktow}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {grupa.zajecia.map(zajecie => {
                                    const status = getStudentPresence(zajecie, student.id_ucznia);
                                    const obecnosc = zajecie.obecnosci?.find(o => o.id_ucznia === student.id_ucznia);
                                    const substitute = mySubstitutesReporting?.find(sub => 
                                        sub.zajecia_id_zajec === zajecie.id_zajec || sub.zajecia?.id_zajec === zajecie.id_zajec
                                    );
                                    const hasSubstitute = substitute && substitute.id_nauczyciel_zastepujacy;
                                    const isTakenByMe = zajecie.isSubstituteLesson || mySubstitutesTaken?.some(sub => 
                                        sub.zajecia_id_zajec === zajecie.id_zajec || sub.zajecia?.id_zajec === zajecie.id_zajec
                                    );
                                    const isBlocked = hasSubstitute && !isTakenByMe;

                                    return (
                                        <td key={`${student.id_ucznia}-${zajecie.id_zajec}`} className="px-2 py-2 text-center border-b">
                                            {isBlocked ? (
                                                <div className="w-8 h-8 rounded border-2 border-gray-300 bg-gray-100 flex items-center justify-center mx-auto"
                                                     title="Zajęcia mają zastępstwo - nie możesz edytować obecności">
                                                    <span className="text-gray-400 text-xs">🔒</span>
                                                </div>
                                            ) : (
                                            <div
                                                onClick={(e) => openPresenceMenu(e, obecnosc, zajecie.id_zajec, student.id_ucznia)}
                                                className={`w-8 h-8 rounded border-2 cursor-pointer flex items-center justify-center mx-auto transition-all hover:scale-110 relative ${getPresenceColor(status)} ${
                                                    unsavedPresences[`${zajecie.id_zajec}_${student.id_ucznia}`]
                                                        ? 'ring-2 ring-yellow-400 ring-offset-1 shadow-lg' 
                                                        : ''
                                                }`}
                                                title={`Kliknij aby zmienić obecność dla ${getStudentFullName(student)}${
                                                    unsavedPresences[`${zajecie.id_zajec}_${student.id_ucznia}`] ? ' (NIEZAPISANE)' : ''
                                                }`}
                                            >
                                                <span className={`font-bold text-sm ${getPresenceTextColor(status)}`}>
                                                    {getPresenceText(status)}
                                                </span>
                                                {unsavedPresences[`${zajecie.id_zajec}_${student.id_ucznia}`] && (
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white">
                                                        <span className="text-xs">!</span>
                                                    </span>
                                                )}
                                            </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="p-3 bg-gray-50 border-t text-xs flex justify-center gap-4 flex-wrap">
                <LegendItem color="green" text="Obecny" symbol="✓"/>
                <LegendItem color="red" text="Nieobecny" symbol="✗"/>
                <LegendItem color="gray" text="Nieustalone" symbol="?"/>
            </div>
        </div>
    );
}

function LegendItem({ color, text, symbol }) {
    const bg = {
        green: "bg-green-100 border-green-300 text-green-600",
        red: "bg-red-100 border-red-300 text-red-600",
        gray: "bg-gray-200 border-gray-300 text-gray-600"
    }[color];

    return (
        <div className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${bg}`}>
                <span className="font-bold text-xs">{symbol}</span>
            </div>
            <span className="text-gray-600">{text}</span>
        </div>
    );
}