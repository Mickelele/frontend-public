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
                    <p className="text-gray-600">
                        Nie masz konta?{' '}
                        <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                            Zarejestruj się
                        </Link>
                    </p>
                }
            />
        </div>
    );
}