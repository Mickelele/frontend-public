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

export async function uploadPrizeImage(prizeId, imageFile) {
    const formData = new FormData();
    formData.append('zdjecie', imageFile);
    
    const API_URL = process.env.NEXT_PUBLIC_POINTS_API_URL || 'https://backend-kyys.onrender.com';
    
    const response = await fetch(`${API_URL}/nagrody/${prizeId}/zdjecie`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error:', errorText);
        throw new Error(`Nie udało się przesłać zdjęcia: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

export function getPrizeImageUrl(prizeId) {
    const API_URL = process.env.NEXT_PUBLIC_POINTS_API_URL || 'https://backend-kyys.onrender.com';
    return `${API_URL}/nagrody/${prizeId}/zdjecie`;
}

export async function deletePrizeImage(prizeId) {
    return await apiFetch(`/nagrody/${prizeId}/zdjecie`, {
        method: 'DELETE'
    }, 'points');
}
