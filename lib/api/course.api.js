import { apiFetch } from '../fetcher';

export async function getCourses() {
    return await apiFetch('/kursy/', { method: 'GET' }, 'course');
}

export async function getCourseById(id_kursu) {
    return await apiFetch(`/kursy/${id_kursu}`, { method: 'GET' }, 'course');
}

export async function getCourseGroups(id_kursu) {
    return await apiFetch(`/kursy/${id_kursu}/grupy`, { method: 'GET' }, 'course');
}
