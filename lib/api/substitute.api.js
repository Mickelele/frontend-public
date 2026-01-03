import { apiFetch } from '../fetcher';

export async function getAllSubstitutes() {
    return await apiFetch('/zastepstwa/', { method: 'GET' }, 'course');
}

export async function getSubstituteById(id) {
    return await apiFetch(`/zastepstwa/${id}`, { method: 'GET' }, 'course');
}

export async function createSubstitute(data) {
    return await apiFetch('/zastepstwa/', {
        method: 'POST',
        body: data
    }, 'course');
}

export async function updateSubstitute(id, data) {
    return await apiFetch(`/zastepstwa/${id}`, {
        method: 'PUT',
        body: data
    }, 'course');
}

export async function deleteSubstitute(id) {
    return await apiFetch(`/zastepstwa/${id}`, {
        method: 'DELETE'
    }, 'course');
}

export async function getAvailableSubstitutes() {
    return await apiFetch('/zastepstwa/available', { method: 'GET' }, 'course');
}

export async function getSubstitutesByTeacherReporting(teacherId) {
    return await apiFetch(`/zastepstwa/teacher/${teacherId}/reporting`, { method: 'GET' }, 'course');
}

export async function getSubstitutesByTeacherSubstituting(teacherId) {
    return await apiFetch(`/zastepstwa/teacher/${teacherId}/substituting`, { method: 'GET' }, 'course');
}

export async function assignTeacherToSubstitute(substituteId, teacherId) {
    return await apiFetch(`/zastepstwa/${substituteId}/assign`, {
        method: 'PATCH',
        body: { id_nauczyciel_zastepujacy: teacherId }
    }, 'course');
}

export async function unassignTeacherFromSubstitute(substituteId) {
    return await apiFetch(`/zastepstwa/${substituteId}/unassign`, {
        method: 'PATCH'
    }, 'course');
}
