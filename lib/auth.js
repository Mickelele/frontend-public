import Cookies from 'js-cookie';

export const setToken = (token) => {
    Cookies.set('token', token, { expires: 7 });
};

export const getToken = () => {
    return Cookies.get('token');
};

export const logout = () => {
    Cookies.remove('token');
};

export const getCurrentUser = async () => {
    const token = getToken();
    if (!token) return null;

    try {
        const res = await fetch('https://user-service-hg4z.onrender.com/user/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};
