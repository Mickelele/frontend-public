
import { apiFetch } from '../fetcher';

export async function getPresenceForStudent(idStudent) {
    return await apiFetch(
        `/obecnosc/obecnosciUcznia/${idStudent}`,
        { method: 'GET' },
        'course'
    );
}

export async function createPresence(lessonId, studentId, value) {
    const czyObecny = value === true ? 1 : 0;

    return await apiFetch(
        `/obecnosc/${lessonId}/obecnosci/dodaj`,
        {
            method: 'POST',
            body: {
                id_ucznia: studentId,
                czyObecny: czyObecny
            }
        },
        'course'
    );
}

export async function setPresence(idObecnosci, value) {
    console.log("SET PRESENCE:", { idObecnosci, value });

    return await apiFetch(
        `/obecnosc/obecnosci/${idObecnosci}/ustaw`,
        {
            method: 'PUT',
            body: {
                czyObecny: value
            }
        },
        'course'
    );
}

export async function deletePresence(idObecnosci) {
    return await apiFetch(
        `/obecnosc/obecnosci/${idObecnosci}`,
        { method: 'DELETE' },
        'course'
    );
}