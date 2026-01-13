import { apiFetch } from '../fetcher';

// Funkcja do dodawania lub odejmowania punktów uczniowi
export async function updateStudentPoints(studentId, delta) {
    return await apiFetch(`/uczniowie/${studentId}/punkty`, {
        method: 'PATCH',
        body: { delta: Number(delta) }
    }, 'user');
}

// Dodaj punkty uczniowi
export async function addStudentPoints(studentId, points) {
    return await updateStudentPoints(studentId, Math.abs(points));
}

// Odejmij punkty uczniowi
export async function subtractStudentPoints(studentId, points) {
    return await updateStudentPoints(studentId, -Math.abs(points));
}

// Pobierz saldo punktów ucznia
export async function getStudentPoints(studentId) {
    return await apiFetch(`/uczniowie/${studentId}/punkty`, {
        method: 'GET'
    }, 'user');
}

// Punkty za obecność
export async function awardAttendancePoint(studentId) {
    return await addStudentPoints(studentId, 1);
}

// Cofnij punkt za obecność
export async function revokeAttendancePoint(studentId) {
    return await subtractStudentPoints(studentId, 1);
}

// Punkty za uwagi (odejmowanie 5)
export async function penalizeForRemark(studentId) {
    return await subtractStudentPoints(studentId, 5);
}