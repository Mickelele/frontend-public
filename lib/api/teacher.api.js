import { apiFetch } from '../fetcher';

export async function getTeachers() {
    return await apiFetch('/nauczyciele', { method: 'GET' }, 'user');
}

export async function getTeacherById(id) {
    return await apiFetch(`/nauczyciele/${id}`, { method: 'GET' }, 'user');
}
