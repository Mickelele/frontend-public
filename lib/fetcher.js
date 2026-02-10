import { getToken, setToken, refreshAccessToken, removeToken } from './auth';

export async function apiFetch(path, options = {}, base = 'auth') {
    let API_URL;

    switch (base) {
        case 'auth':
            API_URL = process.env.NEXT_PUBLIC_AUTO_API_URL;
            break;
        case 'user':
            API_URL = process.env.NEXT_PUBLIC_USER_API_URL;
            break;
        case 'course':
            API_URL = process.env.NEXT_PUBLIC_COURSE_API_URL;
            break;
        case 'quiz':
            API_URL = process.env.NEXT_PUBLIC_QUIZ_API_URL;
            break;
        case 'points':
            API_URL = process.env.NEXT_PUBLIC_POINTS_API_URL;
            break;
        default:
            throw new Error(`Nieznana baza API: ${base}`);
    }

    if (!API_URL) {
        throw new Error(`API URL dla '${base}' nie jest ustawiony. Sprawdź zmienne środowiskowe NEXT_PUBLIC_${base.toUpperCase()}_API_URL`);
    }

    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fetchOptions = {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    };


    if (base === 'auth' || options.credentials === 'include') {
        fetchOptions.credentials = 'include';
    }

    let res = await fetch(`${API_URL}${path}`, fetchOptions);

    
    if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register') && !path.includes('/auth/refresh')) {
        try {
            const refreshData = await refreshAccessToken();
            
            headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
            fetchOptions.headers = headers;
            res = await fetch(`${API_URL}${path}`, fetchOptions);
        } catch (refreshErr) {
            
            removeToken();
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
            }
            const error = new Error('Sesja wygasła. Zaloguj się ponownie.');
            error.status = 401;
            throw error;
        }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(data.error || res.statusText);
        error.status = res.status;
        error.statusText = res.statusText;
        throw error;
    }

    return data;
}
