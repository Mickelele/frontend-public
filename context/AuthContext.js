'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as authLogout } from '/lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await getCurrentUser();

            if (userData && (userData.id || userData.id_uzytkownika)) {

                const normalizedUser = {
                    id: userData.id || userData.id_uzytkownika,
                    imie: userData.imie,
                    nazwisko: userData.nazwisko,
                    email: userData.email,
                    role: userData.rola || userData.role
                };

                setUser(normalizedUser);
            } else {
                authLogout();
            }
        } catch (error) {
            authLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        console.log('🚪 AuthContext: Wylogowywanie użytkownika');
        authLogout();
        setUser(null);
    };

    const login = (userData) => {
        console.log('🔐 AuthContext: Logowanie użytkownika:', userData);
        const normalizedUser = {
            id: userData.id || userData.id_uzytkownika,
            imie: userData.imie,
            nazwisko: userData.nazwisko,
            email: userData.email,
            role: userData.rola || userData.role
        };
        setUser(normalizedUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            logout: handleLogout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}