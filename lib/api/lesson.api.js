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

export async function getAllLessons() {
    return await apiFetch('/zajecia/', { method: 'GET' }, 'course');
}

export async function createLesson(lessonData) {
    return await apiFetch(`/zajecia/${lessonData.id_grupy}/zajecia/dodaj`, {
        method: 'POST',
        body: lessonData
    }, 'course');
}

export async function updateLesson(id_zajec, lessonData) {
    return await apiFetch(`/zajecia/zajecia/${id_zajec}`, {
        method: 'PUT',
        body: lessonData
    }, 'course');
}

export async function deleteLesson(id_zajec) {
    return await apiFetch(`/zajecia/zajecia/${id_zajec}`, {
        method: 'DELETE'
    }, 'course');
}

export async function getTechnicalReports() {
    return await apiFetch('/zajecia/technical-reports', {
        method: 'GET'
    }, 'course');
}

export async function clearTechnicalReport(id_zajec) {
    return await apiFetch(`/zajecia/technical-reports/${id_zajec}`, {
        method: 'DELETE'
    }, 'course');
}

export async function createLessonsForGroup(groupId) {
    return await apiFetch(`/zajecia/${groupId}/zajecia/auto-create`, {
        method: 'POST'
    }, 'course');
}
