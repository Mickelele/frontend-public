import { apiFetch } from '../fetcher';

export async function getLessonsForGroup(groupId) {
    return await apiFetch(`/zajecia/${groupId}/zajecia`, { method: 'GET' }, 'course');
}

export async function getTeacherLessonsForMonth(teacherId, year, month) {
    return await apiFetch(
        `/zajecia/teacher/${teacherId}/lessons/month`,
        {
            method: 'POST',
            body: { year: year, month: month }
        },
        'course'
    );
}


export async function updateEquipmentRemark(id_zajec, tresc) {
    return await apiFetch(
        `/zajecia/zajecia/${id_zajec}`,
        {
            method: 'PUT',
            body: { uwaga_do_sprzetu: tresc }
        },
        'course'
    );
}

