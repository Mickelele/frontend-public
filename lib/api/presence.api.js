import { apiFetch } from '../fetcher';

export async function getPresenceForLesson(lessonId) {
    return await apiFetch(`/obecnosc/${lessonId}/obecnosci`, { method: 'GET' }, 'course');
}
