import { apiFetch } from '../fetcher';

export async function getPresenceForStudent(userId) {
    return await apiFetch(`/obecnosc/obecnosciUcznia/${userId}`, { method: 'GET' }, 'course');
}
