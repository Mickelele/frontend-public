'use client';
import { registerUser } from '/lib/api/auth.api';
import { useRouter } from 'next/navigation';
import AuthForm from '/components/AuthForm';

export default function RegisterPage() {
    const router = useRouter();

    const onSubmit = async (values) => {
        await registerUser(values);
        alert('Konto utworzone! Zaloguj się.');
        router.push('/login');
    };

    const fields = [
        { name: 'imie', label: 'Imię' },
        { name: 'nazwisko', label: 'Nazwisko' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'haslo', label: 'Hasło', type: 'password' },
    ];

    return (
        <div>
            <h1 className="text-2xl mb-4">Rejestracja</h1>
            <AuthForm fields={fields} onSubmit={onSubmit} submitLabel="Zarejestruj" />
        </div>
    );
}
