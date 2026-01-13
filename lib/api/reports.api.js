import { apiFetch } from '../fetcher';


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
