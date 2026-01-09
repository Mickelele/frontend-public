import { apiFetch } from '../fetcher';

export async function getAdministrators() {
    return await apiFetch('/administratorzy', { method: 'GET' }, 'user');
}

export async function getAdministratorById(id) {
    return await apiFetch(`/administratorzy/${id}`, { method: 'GET' }, 'user');
}

export async function createAdministrator(data) {
    return await apiFetch('/administratorzy', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateAdministrator(id, data) {
    return await apiFetch(`/administratorzy/${id}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteAdministrator(id) {
    return await apiFetch(`/administratorzy/${id}`, {
        method: 'DELETE'
    }, 'user');
}
