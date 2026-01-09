import { apiFetch } from '../fetcher';

export async function getAllRooms() {
    return await apiFetch('/sale/', { method: 'GET' }, 'course');
}

export async function getRoomById(roomId) {
    return await apiFetch(`/sale/${roomId}`, { method: 'GET' }, 'course');
}

export async function createRoom(roomData) {
    return await apiFetch('/sale/dodaj', {
        method: 'POST',
        body: roomData
    }, 'course');
}

export async function updateRoom(roomId, roomData) {
    return await apiFetch(`/sale/${roomId}`, {
        method: 'PUT',
        body: roomData
    }, 'course');
}

export async function deleteRoom(roomId) {
    return await apiFetch(`/sale/${roomId}`, {
        method: 'DELETE'
    }, 'course');
}
