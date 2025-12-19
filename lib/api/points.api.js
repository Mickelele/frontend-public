import { apiFetch } from '../fetcher';

export async function getAllStudents() {
    return await apiFetch('/punkty/uczniowie', { method: 'GET' }, 'points');
}

export async function getStudentById(id) {
    return await apiFetch(`/punkty/uczen/${id}`, { method: 'GET' }, 'points');
}

export async function getStudentPoints(id) {
    return await apiFetch(`/punkty/uczen/${id}/saldo`, { method: 'GET' }, 'points');
}

export async function addPoints(data) {
    return await apiFetch('/punkty/add', {
        method: 'POST',
        body: data
    }, 'points');
}

export async function subtractPoints(data) {
    return await apiFetch('/punkty/subtract', {
        method: 'POST',
        body: data
    }, 'points');
}

export async function setPoints(data) {
    return await apiFetch('/punkty/set', {
        method: 'POST',
        body: data
    }, 'points');
}

export async function updateStudent(id, data) {
    return await apiFetch(`/punkty/uczen/${id}`, {
        method: 'PUT',
        body: data
    }, 'points');
}

export async function getRanking() {
    return await apiFetch('/punkty/ranking', { method: 'GET' }, 'points');
}

export async function getRankingByGroup(groupId) {
    return await apiFetch(`/punkty/ranking/grupa/${groupId}`, { method: 'GET' }, 'points');
}
