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

export async function requestPasswordReset(email) {
    return await apiFetch('/auth/request-password-reset', { method: 'POST', body: { email } }, 'auth');
}

export async function resetPassword(token, newPassword) {
    return await apiFetch('/auth/reset-password', { method: 'POST', body: { token, newPassword } }, 'auth');
}