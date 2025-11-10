import { apiFetch } from '../fetcher';

export async function enrollStudentToGroup(studentData) {
    return await apiFetch('/uczniowie/zapiszNaGrupe', {
        method: 'POST',
        body: studentData,
    }, 'course');
}

export async function getStudents() {
    return await apiFetch('/uczniowie', { method: 'GET' }, 'course');
}

export async function getStudentById(id) {
    return await apiFetch(`/uczniowie/${id}`, { method: 'GET' }, 'course');
}
