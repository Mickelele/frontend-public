import { apiFetch } from '../fetcher';

export async function getOpiekunStudents(opiekunId) {
    return await apiFetch(`/opiekunowie/${opiekunId}/uczniowie`, { method: 'GET' }, 'user');
}
