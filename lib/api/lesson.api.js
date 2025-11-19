import { apiFetch } from '../fetcher';

export async function getLessonsForGroup(groupId) {
    return await apiFetch(`/zajecia/${groupId}/zajecia`, { method: 'GET' }, 'course');
}