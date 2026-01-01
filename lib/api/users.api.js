import { apiFetch } from '../fetcher';

export async function getAllUsers() {
    return await apiFetch('/user', { method: 'GET' }, 'user');
}

export async function getMyProfile() {
    return await apiFetch('/user/me', { method: 'GET' }, 'user');
}

export async function getUserById(id) {
    return await apiFetch(`/user/${id}`, { method: 'GET' }, 'user');
}

export async function getUserByEmail(email) {
    return await apiFetch(`/user/email/${email}`, { method: 'GET' }, 'user');
}

export async function createUser(data) {
    return await apiFetch('/user', {
        method: 'POST',
        body: data
    }, 'user');
}

export async function updateUser(id, data) {
    return await apiFetch(`/user/${id}`, {
        method: 'PUT',
        body: data
    }, 'user');
}

export async function deleteUser(id) {
    return await apiFetch(`/user/${id}`, {
        method: 'DELETE'
    }, 'user');
}

export async function updateMyProfile(data) {
    return await apiFetch('/user/updateProfile', { method: 'PUT', body: data }, 'user');
}

export async function changePassword(data) {
    return await apiFetch('/user/profile/password', { method: 'PUT', body: data }, 'user');
}
