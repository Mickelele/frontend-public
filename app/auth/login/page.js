'use client';
import { useRouter } from 'next/navigation';
import { loginUser } from '/lib/api/auth.api';
import { setToken } from '/lib/auth';
import AuthForm from '/components/AuthForm';
import { useAuth } from '/context/AuthContext';
import Link from 'next/link';
import Cookies from "js-cookie";

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuth();

    const onSubmit = async (values) => {
        const res = await loginUser(values);
        setToken(res.token);
        setUser(res.user);
        router.push('/dashboard');
    };

    const fields = [
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'haslo', label: 'Hasło', type: 'password' },
    ];

    return (
        <AuthForm
            fields={fields}
            onSubmit={onSubmit}
            submitLabel="Zaloguj się"
            footer={
                <p className="text-gray-600">
                    Nie masz konta?{' '}
                    <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                        Zarejestruj się
                    </Link>
                </p>
            }
        />
    );
}
