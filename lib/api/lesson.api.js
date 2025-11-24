import { apiFetch } from '../fetcher';

export async function getLessonsForGroup(groupId) {
    return await apiFetch(`/zajecia/${groupId}/zajecia`, { method: 'GET' }, 'course');
}

export async function getTeacherLessonsForMonth(teacherId, year, month) {
    return await apiFetch(
        `/zajecia/teacher/${teacherId}/lessons/month`,
        {
            method: 'POST',
            body: { year, month }
        },
        'course'
    );
}