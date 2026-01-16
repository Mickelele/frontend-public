import { apiFetch } from '../fetcher';


export async function updateStudentPoints(studentId, delta) {
    return await apiFetch(`/uczniowie/${studentId}/punkty`, {
        method: 'PATCH',
        body: { delta: Number(delta) }
    }, 'user');
}


export async function addStudentPoints(studentId, points) {
    return await updateStudentPoints(studentId, Math.abs(points));
}


export async function subtractStudentPoints(studentId, points) {
    return await updateStudentPoints(studentId, -Math.abs(points));
}

export async function getStudentPoints(studentId) {
    return await apiFetch(`/uczniowie/${studentId}/punkty`, {
        method: 'GET'
    }, 'user');
}


export async function awardAttendancePoint(studentId) {
    return await addStudentPoints(studentId, 1);
}


export async function revokeAttendancePoint(studentId) {
    return await subtractStudentPoints(studentId, 1);
}


export async function penalizeForRemark(studentId) {
    return await subtractStudentPoints(studentId, 5);
}


export async function awardHomeworkPoints(studentId, points) {
    return await addStudentPoints(studentId, points);
}


export async function revokeHomeworkPoints(studentId, points) {
    return await subtractStudentPoints(studentId, points);
}