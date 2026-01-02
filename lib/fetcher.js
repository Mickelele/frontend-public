import Cookies from 'js-cookie';

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

    const token = Cookies.get('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || res.statusText);
    }

    return data;
}
