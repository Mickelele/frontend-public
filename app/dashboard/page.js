'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) router.push('/auth/login');
    }, [user]);

    if (!user) return <p>Ładowanie...</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Witaj, {user.imie || user.email}!</h1>
            <p>To Twój dashboard.</p>
        </div>
    );
}
