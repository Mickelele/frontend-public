import { apiFetch } from '../fetcher';

export async function getStudentTaskLists(uczenId) {
    return await apiFetch(`/todo/listy/uczen/${uczenId}`, {
        method: 'GET'
    }, 'user');
}

export async function getTaskListById(listaId) {
    return await apiFetch(`/todo/listy/${listaId}`, {
        method: 'GET'
    }, 'user');
}

export async function createTaskList(data) {
    return await apiFetch('/todo/listy', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateTaskList(listaId, data) {
    return await apiFetch(`/todo/listy/${listaId}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteTaskList(listaId) {
    return await apiFetch(`/todo/listy/${listaId}`, {
        method: 'DELETE'
    }, 'user');
}

export async function getStudentTasks(uczenId, filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.id_statusu) {
        queryParams.append('id_statusu', filters.id_statusu);
    }
    if (filters.id_lista) {
        queryParams.append('id_lista', filters.id_lista);
    }
    
    const queryString = queryParams.toString();
    const url = `/todo/zadania/uczen/${uczenId}${queryString ? `?${queryString}` : ''}`;
    
    return await apiFetch(url, {
        method: 'GET'
    }, 'user');
}

export async function getTaskById(zadanieId) {
    return await apiFetch(`/todo/zadania/${zadanieId}`, {
        method: 'GET'
    }, 'user');
}

export async function createTask(data) {
    return await apiFetch('/todo/zadania', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateTask(zadanieId, data) {
    return await apiFetch(`/todo/zadania/${zadanieId}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteTask(zadanieId) {
    return await apiFetch(`/todo/zadania/${zadanieId}`, {
        method: 'DELETE'
    }, 'user');
}

export async function completeTask(zadanieId) {
    return await apiFetch(`/todo/zadania/${zadanieId}/complete`, {
        method: 'PATCH'
    }, 'user');
}

export const TASK_STATUS = {
    DO_ZROBIENIA: 1,
    W_TRAKCIE: 2,
    WYKONANE: 3,
    ARCHIWALNE: 4
};

export const TASK_STATUS_LABELS = {
    1: 'Do zrobienia',
    2: 'W trakcie',
    3: 'Wykonane',
    4: 'Archiwalne'
};

export const TASK_PRIORITY = {
    BARDZO_WYSOKI: 1,
    WYSOKI: 2,
    ŚREDNI: 3,
    NISKI: 4,
    BARDZO_NISKI: 5
};

export const TASK_PRIORITY_LABELS = {
    1: 'Bardzo wysoki',
    2: 'Wysoki',
    3: 'Średni',
    4: 'Niski',
    5: 'Bardzo niski'
};

export const TASK_PRIORITY_COLORS = {
    1: 'bg-red-100 text-red-800 border-red-300',
    2: 'bg-orange-100 text-orange-800 border-orange-300',
    3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    4: 'bg-green-100 text-green-800 border-green-300',
    5: 'bg-gray-100 text-gray-800 border-gray-300'
};
