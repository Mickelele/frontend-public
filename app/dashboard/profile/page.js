'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '/lib/auth';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
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
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Błąd pobierania danych');
                const data = await res.json();

                if (data.zdjecie?.dane) {
                    setPreview(`data:image/jpeg;base64,${data.zdjecie.dane}`);
                }
                setUser(data);
            } catch (err) {
                console.error(err);
                router.push('/auth/login');
            }
        };

        fetchUser();
    }, [router]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile) {
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) return alert('Wybierz zdjęcie!');
        setUploading(true);

        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('https://user-service-hg4z.onrender.com/user/uploadImage', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Błąd wysyłania zdjęcia');
            const data = await res.json();
            alert('Zdjęcie zostało zapisane!');
            console.log('Odpowiedź serwera:', data);
        } catch (err) {
            console.error(err);
            alert('Nie udało się przesłać zdjęcia');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <p>Ładowanie profilu...</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Twój profil</h1>
            <p><strong>Imię:</strong> {user.imie}</p>
            <p><strong>Nazwisko:</strong> {user.nazwisko}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rola:</strong> {user.rola}</p>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Zdjęcie profilowe</h2>

                {preview ? (
                    <img
                        src={preview}
                        alt="Podgląd zdjęcia"
                        className="w-40 h-40 object-cover rounded-full mb-3 border"
                    />
                ) : (
                    <p>Brak zdjęcia profilowego</p>
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block mt-2"
                />

                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {uploading ? 'Wysyłanie...' : 'Zapisz zdjęcie'}
                </button>
            </div>
        </div>
    );
}
