'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '/lib/auth';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch('https://user-service-hg4z.onrender.com/user/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error('Błąd pobierania danych');
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error(err);
                router.push('/auth/login');
            }
        };

        fetchUser();
    }, [router]);

    if (!user) return <p>Ładowanie profilu...</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Twój profil</h1>
            <p><strong>Imię:</strong> {user.imie}</p>
            <p><strong>Nazwisko:</strong> {user.nazwisko}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rola:</strong> {user.rola}</p>
        </div>
    );
}
