import { apiFetch } from '../fetcher';

export async function getAllPrizes() {
    return await apiFetch('/nagrody/', { method: 'GET' }, 'points');
}

export async function getPrizeById(id) {
    return await apiFetch(`/nagrody/${id}`, { method: 'GET' }, 'points');
}

export async function createPrize(prizeData) {
    return await apiFetch('/nagrody/', {
        method: 'POST',
        body: prizeData
    }, 'points');
}

export async function updatePrize(id, prizeData) {
    return await apiFetch(`/nagrody/${id}`, {
        method: 'PUT',
        body: prizeData
    }, 'points');
}

export async function deletePrize(id) {
    return await apiFetch(`/nagrody/${id}`, {
        method: 'DELETE'
    }, 'points');
}

export async function getStudentPrizes(studentId) {
    return await apiFetch(`/nagrody/uczen/${studentId}`, { method: 'GET' }, 'points');
}

export async function claimPrize(studentId, prizeId) {
    return await apiFetch('/nagrody/redeem', {
        method: 'POST',
        body: {
            id_ucznia: studentId,
            id_nagrody: prizeId
        }
    }, 'points');
}

export async function getPrizeHistory() {
    return await apiFetch('/nagrody/history/all', { method: 'GET' }, 'points');
}
