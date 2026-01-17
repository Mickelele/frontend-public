import { apiFetch } from '../fetcher';

export async function getGroupStudents(groupId) {
    return await apiFetch(`/grupy/${groupId}/uczniowie`, { method: 'GET' }, 'course');
}

export async function getGroupById(groupId) {
    return await apiFetch(`/grupy/${groupId}`, { method: 'GET' }, 'course');
}

export async function getAllGroups() {
    return await apiFetch('/grupy/', { method: 'GET' }, 'course');
}

export async function createGroup(groupData, options = {}) {
    const body = {
        ...groupData,
        autoCreateLessons: options.autoCreateLessons !== false 
    };
    
    return await apiFetch('/grupy/dodajGrupe', {
        method: 'POST',
        body: body
    }, 'course');
}

export async function updateGroup(groupId, groupData) {
    return await apiFetch(`/grupy/aktualizujGrupe/${groupId}`, {
        method: 'PUT',
        body: groupData
    }, 'course');
}

export async function deleteGroup(groupId) {
    return await apiFetch(`/grupy/usunGrupe/${groupId}`, {
        method: 'DELETE'
    }, 'course');
}

export async function adjustStudentCount(groupId, delta) {
    return await apiFetch(`/grupy/${groupId}/adjust`, {
        method: 'PATCH',
        body: { delta }
    }, 'course');
}

export async function assignStudentToGroup(groupId, studentId) {
    return await apiFetch(`/grupy/${groupId}/uczniowie`, {
        method: 'POST',
        body: { id_ucznia: studentId }
    }, 'course');
}

export async function removeStudentFromGroup(groupId, studentId) {
    return await apiFetch(`/grupy/${groupId}/uczniowie/${studentId}`, {
        method: 'DELETE'
    }, 'course');
}