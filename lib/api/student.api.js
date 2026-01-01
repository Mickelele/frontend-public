import { apiFetch } from '../fetcher';

export async function getStudents() {
    return await apiFetch('/uczniowie', { method: 'GET' }, 'user');
}

export async function getStudentById(id) {
    return await apiFetch(`/uczniowie/${id}`, { method: 'GET' }, 'user');
}

export async function createStudent(data) {
    return await apiFetch('/uczniowie', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateStudent(id, data) {
    return await apiFetch(`/uczniowie/${id}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteStudent(id) {
    return await apiFetch(`/uczniowie/${id}`, {
        method: 'DELETE'
    }, 'user');
}

export async function enrollStudentToGroup(studentData) {
    return await apiFetch('/uczniowie/zapiszNaGrupe', {
        method: 'POST',
        body: studentData,
    }, 'user');
}
