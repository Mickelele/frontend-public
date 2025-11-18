'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '/lib/auth';
const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL;


export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch(`${USER_API_URL}/user/me`, {
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
            const res = await fetch(`${USER_API_URL}/user/uploadImage`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Błąd wysyłania zdjęcia');
            const data = await res.json();
            alert('Zdjęcie zostało zapisane!');
            console.log('Odpowiedź serwera:', data);
            setShowUploader(false);
            setFile(null);
        } catch (err) {
            console.error(err);
            alert('Nie udało się przesłać zdjęcia');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <p className="text-center text-gray-500 mt-10">Ładowanie profilu...</p>;

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-gray-50 to-gray-200 p-6">
            <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Twój profil</h1>

                <div className="flex flex-col items-center">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Zdjęcie profilowe"
                            className="w-40 h-40 object-cover rounded-full border-4 border-blue-500 shadow-lg mb-4"
                        />
                    ) : (
                        <div className="w-40 h-40 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full border-4 border-gray-200 mb-4 shadow-inner">
                            Brak zdjęcia
                        </div>
                    )}

                    {!showUploader ? (
                        <button
                            onClick={() => setShowUploader(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                        >
                            Zmień zdjęcie profilowe
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3 mt-3 items-center w-full">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition disabled:bg-gray-400"
                                >
                                    {uploading ? 'Wysyłanie...' : 'Zapisz'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUploader(false);
                                        setFile(null);
                                    }}
                                    className="bg-gray-500 text-white px-5 py-2 rounded-full hover:bg-gray-600 transition"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 border-t pt-6 text-gray-700 space-y-2">
                    <p><strong>Imię:</strong> {user.imie}</p>
                    <p><strong>Nazwisko:</strong> {user.nazwisko}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Rola:</strong> {user.rola}</p>
                </div>
            </div>
        </div>
    );
}
