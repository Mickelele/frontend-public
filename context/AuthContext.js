'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout } from '/lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const u = await getCurrentUser();
            setUser(u);
            setLoading(false);
        })();
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            logout: handleLogout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}