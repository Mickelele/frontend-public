import { apiFetch } from '../fetcher';
import { getUserIdFromToken } from '../auth';

export async function getGuardianHomeworks() {
    const opiekunId = getUserIdFromToken();
    if (!opiekunId) return [];

    try {
        return await apiFetch(
            `/odpowiedzi/opiekun/${opiekunId}/praceUcznia`,
            { method: 'GET' },
            'course'
        );
    } catch (err) {
        console.error('Błąd pobierania prac domowych:', err);
        return [];
    }
}

export async function getHomeworksForGroup(groupId) {
    return await apiFetch(
        `/zadania/prace-domowe-grupy/${groupId}`,
        { method: 'GET' },
        'course'
    );
}

export async function getHomeworksForGroupWithAnswers(groupId) {
    return await apiFetch(
        `/zadania/prace-domowe-grupy/${groupId}/wszystkie`,
        { method: 'GET' },
        'course'
    );
}

export async function createHomework(homeworkData) {
    return await apiFetch('/zadania/dodaj', {
        method: 'POST',
        body: homeworkData
    }, 'course');
}


export async function getHomeworkAnswers(id_zadania) {
    return await apiFetch(
        `/odpowiedzi/zadanie/${id_zadania}`,
        { method: 'GET' },
        'course'
    );
}


export async function getGroupHomeworks(id_grupy) {
    return await apiFetch(
        `/grupy/${id_grupy}/zadania`,
        { method: 'GET' },
        'course'
    );
}


export async function gradeHomeworkAnswer(gradeData) {
    const formattedData = {
        ocena: Number(gradeData.ocena)
    };

    return await apiFetch(`/odpowiedzi/ocen/${gradeData.id_odpowiedzi}`, {
        method: 'PUT',
        body: formattedData
    }, 'course');
}

export async function submitHomeworkAnswer(answerData) {
    return await apiFetch('/odpowiedzi/dodaj', {
        method: 'POST',
        body: answerData
    }, 'course');
}

export async function updateHomework(id_zadania, homeworkData) {
    return await apiFetch(`/zadania/${id_zadania}`, {
        method: 'PUT',
        body: homeworkData
    }, 'course');
}

export async function deleteHomework(id_zadania) {
    return await apiFetch(`/zadania/${id_zadania}`, {
        method: 'DELETE'
    }, 'course');
}
