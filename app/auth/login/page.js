'use client';
import { useRouter } from 'next/navigation';
import { loginUser } from '/lib/api/auth.api';
import { setToken } from '/lib/auth';
import AuthForm from '/components/AuthForm';
import { useAuth } from '/context/AuthContext';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuth();
    const [error, setError] = useState('');

    const getDashboardPath = (userRole) => {
        const rolePaths = {
            'administrator': '/dashboard/administrator',
            'nauczyciel': '/dashboard/nauczyciel',
            'opiekun': '/dashboard/opiekun',
            'uczen': '/dashboard/uczen',
        };

        return rolePaths[userRole] || '/dashboard';
    };

    const onSubmit = async (values) => {
        try {
            setError('');
            const res = await loginUser(values);

            if (res.token) {
                setToken(res.token);
                setUser(res.user);

                const dashboardPath = getDashboardPath(res.user.role);
                router.push(dashboardPath);
            } else {
                setError('Błąd logowania: brak tokena');
            }
        } catch (error) {
            setError('Wprowadzone dane są nieprawidłowe. Sprawdź poprawność wpisanych danych.');
        }
    };

    const fields = [
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'haslo', label: 'Hasło', type: 'password' },
    ];

    return (
        <div>
            <AuthForm
                fields={fields}
                onSubmit={onSubmit}
                submitLabel="Zaloguj się"
                error={error}
                onErrorClear={() => setError('')}
                footer={
                    <div className="space-y-4">
                        <p className="text-center text-orange-200 text-lg">
                            Nie masz konta?{' '}
                            <Link href="/auth/register" className="text-purple-300 hover:text-purple-100 font-bold underline decoration-2 decoration-purple-400 hover:decoration-purple-200 transition-all duration-300">
                                Zarejestruj się
                            </Link>
                        </p>
                        <p className="text-center">
                            <Link href="/auth/forgot-password" className="text-orange-300 hover:text-orange-100 font-semibold underline decoration-2 decoration-orange-400 hover:decoration-orange-200 transition-all duration-300">
                                Zapomniałeś hasła?
                            </Link>
                        </p>
                    </div>
                }
            />
        </div>
    );
}