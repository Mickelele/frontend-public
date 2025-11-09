import { apiFetch } from '../fetcher';

export async function enrollStudentToGroup(studentData) {
    return await apiFetch('/uczniowie/zapiszNaGrupe', {
        method: 'POST',
        body: JSON.stringify(studentData),
    }, 'student');
}

export async function getStudents() {
    return await apiFetch('/uczniowie', { method: 'GET' }, 'student');
}

export async function getStudentById(id) {
    return await apiFetch(`/uczniowie/${id}`, { method: 'GET' }, 'student');
}
