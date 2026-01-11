import { apiFetch } from '../fetcher';

/**
 * Pobiera szczegółowy raport zawierający dane o obecnościach, zadaniach domowych, quizach i nagrodach
 * @param {Object} params - Parametry zapytania
 * @param {number} params.groupId - ID grupy (opcjonalne)
 * @param {number} params.studentId - ID ucznia (opcjonalne)
 * @returns {Promise} Kompleksowy raport z sekcjami: summary, attendance, homework, quiz, prizes
 */
export async function getDetailedReport(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.groupId) {
        queryParams.append('groupId', params.groupId);
    }
    
    if (params.studentId) {
        queryParams.append('studentId', params.studentId);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/raporty/detailed?${queryString}` : '/raporty/detailed';
    
    return await apiFetch(endpoint, { method: 'GET' }, 'course');
}
