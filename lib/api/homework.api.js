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
