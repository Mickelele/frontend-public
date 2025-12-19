import { apiFetch } from '../fetcher';

export async function enrollStudentToGroup(studentData) {
    return await apiFetch('/uczniowie/zapiszNaGrupe', {
        method: 'POST',
        body: studentData,
    }, 'user');
}

export async function getStudents() {
    return await apiFetch('/uczniowie', { method: 'GET' }, 'user');
}

// Pobieranie danych ucznia z user-service (zawiera id_grupa)
export async function getStudentById(id) {
    return await apiFetch(`/uczniowie/${id}`, { method: 'GET' }, 'user');
}
