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

export async function enrollStudentToGroup(studentId, groupId) {
    return await apiFetch(`/uczniowie/${studentId}`, {
        method: 'PUT',
        body: { id_grupa: groupId }
    }, 'user');
}

export async function assignGuardianToStudent(uczenId, opiekunId) {
    return await apiFetch(`/uczniowie/${uczenId}/assign-guardian`, {
        method: 'PATCH',
        body: { opiekunId }
    }, 'user');
}

export async function getStudentsByGroup(groupId) {
    return await apiFetch(`/grupy/${groupId}/uczniowie`, {
        method: 'GET'
    }, 'course');
}
