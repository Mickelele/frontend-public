import { apiFetch } from '../fetcher';

export async function getTeachers() {
    return await apiFetch('/nauczyciele', { method: 'GET' }, 'user');
}

export async function getTeacherById(id) {
    return await apiFetch(`/nauczyciele/${id}`, { method: 'GET' }, 'user');
}

export async function createTeacher(data) {
    return await apiFetch('/nauczyciele', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateTeacher(id, data) {
    return await apiFetch(`/nauczyciele/${id}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteTeacher(id) {
    return await apiFetch(`/nauczyciele/${id}`, {
        method: 'DELETE'
    }, 'user');
}
