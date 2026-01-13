'use client';
import { registerUser } from '/lib/api/auth.api';
import { useRouter } from 'next/navigation';
import AuthForm from '/components/AuthForm';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();

    const onSubmit = async (values) => {
        await registerUser(values);
        alert('Konto utworzone! Teraz możesz się zalogować.');
        router.push('/auth/login');
    };

    const fields = [
        { name: 'imie', label: 'Imię' },
        { name: 'nazwisko', label: 'Nazwisko' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'haslo', label: 'Hasło', type: 'password' },
    ];

    return (
        <AuthForm
            fields={fields}
            onSubmit={onSubmit}
            submitLabel="Zarejestruj"
            footer={
                <p className="text-orange-200 text-center text-lg">
                    Masz już konto?{' '}
                    <Link href="/auth/login" className="text-purple-300 hover:text-purple-100 font-bold underline decoration-2 decoration-purple-400 hover:decoration-purple-200 transition-all duration-300">
                        Zaloguj się
                    </Link>
                </p>
            }
        />
    );
}
