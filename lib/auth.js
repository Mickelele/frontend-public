import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const setToken = (token) => {
    Cookies.set('token', token, { expires: 7 });
};

export const getToken = () => {
    return Cookies.get('token');
};

export const setUserId = (userId) => {
    Cookies.set('userId', userId, { expires: 7 });
};

export const logout = () => {
    Cookies.remove('token');
    Cookies.remove('userId');
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

export const getUserIdFromToken = () => {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        console.log("Zdekodowany token:", decoded);
        return decoded.id;
    } catch (error) {
        console.error("Błąd dekodowania tokena:", error);
        return null;
    }
};