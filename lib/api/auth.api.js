import { apiFetch } from '../fetcher';

export async function registerUser(data) {
    return await apiFetch('/auth/register', { method: 'POST', body: data }, 'auth');
}

export async function loginUser(data) {
    return await apiFetch('/auth/login', { method: 'POST', body: data }, 'auth');
}

export async function verifyToken(token) {
    return await apiFetch('/auth/verify', { method: 'POST', body: { token } }, 'auth');
}