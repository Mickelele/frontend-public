'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '/context/AuthContext';
import '/styles/todolist.css';
import {
    getStudentTaskLists,
    getStudentTasks,
    createTaskList,
    updateTaskList,
    deleteTaskList,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    TASK_STATUS,
    TASK_STATUS_LABELS,
    TASK_PRIORITY,
    TASK_PRIORITY_LABELS,
    TASK_PRIORITY_COLORS
} from '/lib/api/todo.api';

export default function TodoListPage() {
    const { user } = useAuth();
    
    const [taskLists, setTaskLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showListModal, setShowListModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingList, setEditingList] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    
    const [listForm, setListForm] = useState({ nazwa: '', opis: '' });
    
    const [taskForm, setTaskForm] = useState({
        tytul: '',
        opis: '',
        termin: '',
        priorytet: 3,
        id_statusu: TASK_STATUS.DO_ZROBIENIA
    });

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            loadTasks();
        }
    }, [selectedList, filterStatus, user]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const lists = await getStudentTaskLists(user.id);
            setTaskLists(lists || []);
        } catch (err) {
            console.error('Błąd ładowania danych:', err);
            setError('Nie udało się załadować list zadań');
        } finally {
            setLoading(false);
        }
    };

    const loadTasks = async () => {
        if (!user?.id) return;
        
        try {
            const filters = {};
            if (selectedList) filters.id_lista = selectedList;
            if (filterStatus) filters.id_statusu = filterStatus;
            
            const fetchedTasks = await getStudentTasks(user.id, filters);
            setTasks(fetchedTasks || []);
        } catch (err) {
            console.error('Błąd ładowania zadań:', err);
            setError('Nie udało się załadować zadań');
        }
    };

    const handleCreateList = () => {
        setEditingList(null);
        setListForm({ nazwa: '', opis: '' });
        setShowListModal(true);
    };

    const handleEditList = (list) => {
        setEditingList(list);
        setListForm({ nazwa: list.nazwa, opis: list.opis || '' });
        setShowListModal(true);
    };

    const handleSaveList = async (e) => {
        e.preventDefault();
        
        try {
            if (editingList) {
                await updateTaskList(editingList.id_lista, listForm);
            } else {
                await createTaskList({
                    ...listForm,
                    id_ucznia: user.id
                });
            }
            
            await loadData();
            setShowListModal(false);
            setListForm({ nazwa: '', opis: '' });
        } catch (err) {
            console.error('Błąd zapisywania listy:', err);
            alert('Nie udało się zapisać listy');
        }
    };

    const handleDeleteList = async (listId) => {
        if (!confirm('Czy na pewno chcesz usunąć tę listę? Wszystkie zadania z niej zostaną usunięte.')) {
            return;
        }
        
        try {
            await deleteTaskList(listId);
            if (selectedList === listId) {
                setSelectedList(null);
            }
            await loadData();
        } catch (err) {
            console.error('Błąd usuwania listy:', err);
            alert('Nie udało się usunąć listy');
        }
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setTaskForm({
            tytul: '',
            opis: '',
            termin: '',
            priorytet: 3,
            id_statusu: TASK_STATUS.DO_ZROBIENIA
        });
        setShowTaskModal(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskForm({
            tytul: task.tytul,
            opis: task.opis || '',
            termin: task.termin ? new Date(task.termin).toISOString().slice(0, 16) : '',
            priorytet: task.priorytet,
            id_statusu: task.id_statusu
        });
        setShowTaskModal(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        
        if (!selectedList && !editingTask) {
            alert('Wybierz listę, do której chcesz dodać zadanie');
            return;
        }
        
        try {
            const taskData = {
                ...taskForm,
                termin: taskForm.termin || null,
                id_ucznia: user.id,
                id_lista: editingTask ? editingTask.id_lista : selectedList
            };
            
            if (editingTask) {
                await updateTask(editingTask.id_zadania, taskData);
            } else {
                await createTask(taskData);
            }
            
            await loadTasks();
            setShowTaskModal(false);
            setTaskForm({
                tytul: '',
                opis: '',
                termin: '',
                priorytet: 3,
                id_statusu: TASK_STATUS.DO_ZROBIENIA
            });
        } catch (err) {
            console.error('Błąd zapisywania zadania:', err);
            alert('Nie udało się zapisać zadania');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
            return;
        }
        
        try {
            await deleteTask(taskId);
            await loadTasks();
        } catch (err) {
            console.error('Błąd usuwania zadania:', err);
            alert('Nie udało się usunąć zadania');
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await completeTask(taskId);
            await loadTasks();
        } catch (err) {
            console.error('Błąd oznaczania zadania jako wykonane:', err);
            alert('Nie udało się oznaczyć zadania jako wykonane');
        }
    };

    const handleToggleTaskStatus = async (task) => {
        try {
            const newStatus = task.id_statusu === TASK_STATUS.WYKONANE 
                ? TASK_STATUS.DO_ZROBIENIA 
                : TASK_STATUS.WYKONANE;
            
            await updateTask(task.id_zadania, {
                ...task,
                id_statusu: newStatus
            });
            await loadTasks();
        } catch (err) {
            console.error('Błąd zmiany statusu zadania:', err);
            alert('Nie udało się zmienić statusu zadania');
        }
    };

    const getTasksByStatus = (statusId) => {
        return tasks.filter(task => task.id_statusu === statusId && !task.deleted);
    };

    const getPriorityColor = (priority) => {
        return TASK_PRIORITY_COLORS[priority] || TASK_PRIORITY_COLORS[3];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isOverdue = (termin) => {
        if (!termin) return false;
        return new Date(termin) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Ładowanie...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Moja Lista ToDo</h1>
                    <p className="text-gray-600">Organizuj swoje zadania i bądź produktywny!</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Moje Listy</h2>
                                <button
                                    onClick={handleCreateList}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    title="Dodaj nową listę"
                                >
                                    ➕
                                </button>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedList(null)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                        selectedList === null
                                            ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                                    }`}
                                >
                                    <div className="font-medium">📋 Wszystkie zadania</div>
                                    <div className="text-sm opacity-75">
                                        {tasks.filter(t => !t.deleted).length} zadań
                                    </div>
                                </button>

                                {taskLists.map(list => (
                                    <div
                                        key={list.id_lista}
                                        className={`rounded-lg border-2 transition-colors ${
                                            selectedList === list.id_lista
                                                ? 'bg-blue-100 border-blue-300'
                                                : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                        }`}
                                    >
                                        <button
                                            onClick={() => setSelectedList(list.id_lista)}
                                            className="w-full text-left px-4 py-3"
                                        >
                                            <div className="font-medium text-gray-900">{list.nazwa}</div>
                                            {list.opis && (
                                                <div className="text-sm text-gray-600 mt-1">{list.opis}</div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-2">
                                                {tasks.filter(t => t.id_lista === list.id_lista && !t.deleted).length} zadań
                                            </div>
                                        </button>
                                        <div className="flex gap-2 px-4 pb-3">
                                            <button
                                                onClick={() => handleEditList(list)}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                ✏️ Edytuj
                                            </button>
                                            <button
                                                onClick={() => handleDeleteList(list.id_lista)}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                🗑️ Usuń
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilterStatus(null)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            filterStatus === null
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Wszystkie
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus(TASK_STATUS.DO_ZROBIENIA)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            filterStatus === TASK_STATUS.DO_ZROBIENIA
                                                ? 'bg-yellow-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Do zrobienia
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus(TASK_STATUS.W_TRAKCIE)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            filterStatus === TASK_STATUS.W_TRAKCIE
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        W trakcie
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus(TASK_STATUS.WYKONANE)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            filterStatus === TASK_STATUS.WYKONANE
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Wykonane
                                    </button>
                                </div>

                                <button
                                    onClick={handleCreateTask}
                                    disabled={!selectedList && taskLists.length === 0}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                                >
                                    ➕ Nowe zadanie
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {tasks.filter(t => !t.deleted).length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                    <div className="text-6xl mb-4">📝</div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        Brak zadań
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        {selectedList 
                                            ? 'Ta lista jest pusta. Dodaj pierwsze zadanie!'
                                            : 'Nie masz jeszcze żadnych zadań. Utwórz listę i dodaj zadania!'}
                                    </p>
                                    {taskLists.length === 0 ? (
                                        <button
                                            onClick={handleCreateList}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            Utwórz pierwszą listę
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCreateTask}
                                            disabled={!selectedList}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                                        >
                                            Dodaj zadanie
                                        </button>
                                    )}
                                </div>
                            ) : (
                                tasks
                                    .filter(t => !t.deleted)
                                    .sort((a, b) => {
                                        if (a.priorytet !== b.priorytet) {
                                            return a.priorytet - b.priorytet;
                                        }
                                        if (a.termin && b.termin) {
                                            return new Date(a.termin) - new Date(b.termin);
                                        }
                                        if (a.termin) return -1;
                                        if (b.termin) return 1;
                                        return 0;
                                    })
                                    .map(task => (
                                        <div
                                            key={task.id_zadania}
                                            className={`bg-white rounded-lg shadow-sm p-5 border-l-4 transition-all hover:shadow-md ${
                                                task.id_statusu === TASK_STATUS.WYKONANE
                                                    ? 'border-green-500 bg-green-50'
                                                    : isOverdue(task.termin)
                                                    ? 'border-red-500'
                                                    : 'border-blue-500'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => handleToggleTaskStatus(task)}
                                                    className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                        task.id_statusu === TASK_STATUS.WYKONANE
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-gray-300 hover:border-green-500'
                                                    }`}
                                                >
                                                    {task.id_statusu === TASK_STATUS.WYKONANE && (
                                                        <span className="text-white font-bold">✓</span>
                                                    )}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h3 className={`text-lg font-semibold ${
                                                            task.id_statusu === TASK_STATUS.WYKONANE
                                                                ? 'text-gray-500 line-through'
                                                                : 'text-gray-900'
                                                        }`}>
                                                            {task.tytul}
                                                        </h3>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditTask(task)}
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="Edytuj"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(task.id_zadania)}
                                                                className="text-red-600 hover:text-red-800 p-1"
                                                                title="Usuń"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {task.opis && (
                                                        <p className="text-gray-600 mb-3 whitespace-pre-wrap">
                                                            {task.opis}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            task.id_statusu === TASK_STATUS.WYKONANE
                                                                ? 'bg-green-100 text-green-800'
                                                                : task.id_statusu === TASK_STATUS.W_TRAKCIE
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {TASK_STATUS_LABELS[task.id_statusu]}
                                                        </span>

                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priorytet)}`}>
                                                            {TASK_PRIORITY_LABELS[task.priorytet]}
                                                        </span>

                                                        {task.termin && (
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                isOverdue(task.termin)
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                🕒 {formatDate(task.termin)}
                                                                {isOverdue(task.termin) && ' (Zaległe!)'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showListModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {editingList ? 'Edytuj listę' : 'Nowa lista'}
                        </h2>

                        <form onSubmit={handleSaveList}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nazwa listy *
                                </label>
                                <input
                                    type="text"
                                    value={listForm.nazwa}
                                    onChange={(e) => setListForm({ ...listForm, nazwa: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="np. Zadania domowe"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Opis (opcjonalny)
                                </label>
                                <textarea
                                    value={listForm.opis}
                                    onChange={(e) => setListForm({ ...listForm, opis: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Dodaj opis..."
                                    rows="3"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowListModal(false);
                                        setListForm({ nazwa: '', opis: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingList ? 'Zapisz' : 'Utwórz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {editingTask ? 'Edytuj zadanie' : 'Nowe zadanie'}
                        </h2>

                        <form onSubmit={handleSaveTask}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tytuł zadania *
                                </label>
                                <input
                                    type="text"
                                    value={taskForm.tytul}
                                    onChange={(e) => setTaskForm({ ...taskForm, tytul: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="np. Zrobić pracę domową z matematyki"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Opis (opcjonalny)
                                </label>
                                <textarea
                                    value={taskForm.opis}
                                    onChange={(e) => setTaskForm({ ...taskForm, opis: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Dodaj szczegóły zadania..."
                                    rows="4"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priorytet
                                    </label>
                                    <select
                                        value={taskForm.priorytet}
                                        onChange={(e) => setTaskForm({ ...taskForm, priorytet: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={taskForm.id_statusu}
                                        onChange={(e) => setTaskForm({ ...taskForm, id_statusu: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {Object.entries(TASK_STATUS_LABELS)
                                            .filter(([value]) => parseInt(value) !== TASK_STATUS.ARCHIWALNE)
                                            .map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Termin wykonania (opcjonalny)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={taskForm.termin}
                                    onChange={(e) => setTaskForm({ ...taskForm, termin: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTaskModal(false);
                                        setTaskForm({
                                            tytul: '',
                                            opis: '',
                                            termin: '',
                                            priorytet: 3,
                                            id_statusu: TASK_STATUS.DO_ZROBIENIA
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingTask ? 'Zapisz zmiany' : 'Dodaj zadanie'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
