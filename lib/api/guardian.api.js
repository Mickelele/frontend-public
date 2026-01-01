import { apiFetch } from '../fetcher';

export async function getAllGuardians() {
    return await apiFetch('/opiekunowie', { method: 'GET' }, 'user');
}

export async function getGuardianById(id) {
    return await apiFetch(`/opiekunowie/${id}`, { method: 'GET' }, 'user');
}

export async function createGuardian(data) {
    return await apiFetch('/opiekunowie', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateGuardian(id, data) {
    return await apiFetch(`/opiekunowie/${id}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteGuardian(id) {
    return await apiFetch(`/opiekunowie/${id}`, {
        method: 'DELETE'
    }, 'user');
}

export async function getOpiekunStudents(opiekunId) {
    return await apiFetch(`/opiekunowie/${opiekunId}/uczniowie`, { method: 'GET' }, 'user');
}
