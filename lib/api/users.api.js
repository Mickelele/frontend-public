import { apiFetch } from '../fetcher';

export async function getMyProfile() {
    return await apiFetch('/users/me', { method: 'GET' });
}

export async function updateMyProfile(data) {
    return await apiFetch('/users/updateProfile', { method: 'PUT', body: data });
}

export async function changePassword(data) {
    return await apiFetch('/users/profile/password', { method: 'PUT', body: data });
}
