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
        default:
            throw new Error(`Nieznana baza API: ${base}`);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
