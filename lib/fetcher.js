export async function apiFetch(path, options = {}, base = 'auth') {
    const API_URL =
        base === 'auth'
            ? process.env.NEXT_PUBLIC_AUTH_API_URL
            : process.env.NEXT_PUBLIC_USER_API_URL;

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
