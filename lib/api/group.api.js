import { apiFetch } from '../fetcher';

export async function getGroupStudents(groupId) {
    return await apiFetch(`/grupy/${groupId}/uczniowie`, { method: 'GET' }, 'course');
}