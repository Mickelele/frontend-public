'use client';
import { loginUser } from '/lib/api/auth.api';
import { setToken } from '/lib/auth';
import { useRouter } from 'next/navigation';
import AuthForm from '/components/AuthForm';
import { useAuth } from '/context/AuthContext';
import '../../../styles/global.css';

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuth();

    const onSubmit = async (values) => {
        const res = await loginUser(values);
        setToken(res.token);
        setUser(res.user);
        router.push('/dashboard/profile');
    };

    const fields = [
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'haslo', label: 'Hasło', type: 'password' },
    ];

    return (
        <div>
            <h1 className="text-2xl mb-4">Logowanie</h1>
            <AuthForm fields={fields} onSubmit={onSubmit} submitLabel="Zaloguj się" />
        </div>
    );
}
