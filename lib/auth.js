import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const AUTH_API_URL = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_AUTO_API_URL
    : '';


export const setToken = (accessToken) => {
    Cookies.set('accessToken', accessToken, { expires: 1 });
};

export const getToken = () => {
    return Cookies.get('accessToken');
};

export const removeToken = () => {
    Cookies.remove('accessToken');
};


let isRefreshing = false;
let refreshPromise = null;

export const refreshAccessToken = async () => {
    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${AUTH_API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', 
            });

            if (!res.ok) {
                throw new Error('Nie udało się odświeżyć tokena');
            }

            const data = await res.json();
            setToken(data.accessToken);
            return data;
        } catch (err) {
            removeToken();
            throw err;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};


export const logout = async () => {
    try {
        await fetch(`${AUTH_API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
    } catch (err) {
        console.error('Błąd przy wylogowywaniu:', err);
    } finally {
        removeToken();
    }
};


export const getCurrentUser = async () => {
 
    const token = getToken();
    if (token) {
        try {
            const decoded = jwtDecode(token);
            
            if (decoded.exp && decoded.exp * 1000 > Date.now()) {
                return {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                };
            }
        } catch {
            
        }
    }

    
    try {
        const data = await refreshAccessToken();
        return data.user;
    } catch {
        return null;
    }
};



export const getUserIdFromToken = () => {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.id;
    } catch (error) {
        return null;
    }
};