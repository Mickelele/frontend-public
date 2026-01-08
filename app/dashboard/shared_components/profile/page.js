'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '/context/AuthContext';
import { getToken, getUserIdFromToken } from '/lib/auth';
import { getMyProfile, updateMyProfile } from '/lib/api/users.api';
import { getStudentById, updateStudent } from '/lib/api/student.api';
import { getTeacherById, updateTeacher } from '/lib/api/teacher.api';
import { getGuardianById, updateGuardian } from '/lib/api/guardian.api';

const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL;

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(null);
    const [roleData, setRoleData] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const userData = await getMyProfile();
                const userId = getUserIdFromToken();
                
                setUser(userData);

                if (userData.zdjecie?.dane) {
                    setPreview(`data:image/jpeg;base64,${userData.zdjecie.dane}`);
                }

                if (userData.rola === 'uczen') {
                    const studentData = await getStudentById(userId);
                    setRoleData(studentData);
                    setFormData({ pseudonim: studentData.pseudonim || '' });
                } else if (userData.rola === 'nauczyciel') {
                    const teacherData = await getTeacherById(userId);
                    setRoleData(teacherData);
                    setFormData({ nr_konta_bankowego: teacherData.nr_konta_bankowego || '' });
                } else if (userData.rola === 'opiekun') {
                    const guardianData = await getGuardianById(userId);
                    setRoleData(guardianData);
                    setFormData({ nr_indy_konta_bankowego: guardianData.nr_indy_konta_bankowego || '' });
                }
            } catch (err) {
                console.error('Błąd ładowania profilu:', err);
                if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
                    router.push('/auth/login');
                }
            }
        };

        fetchUserData();
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

    const handleSaveChanges = async () => {
        try {
            const userId = getUserIdFromToken();
            
            if (user.rola === 'uczen') {
                await updateStudent(userId, { pseudonim: formData.pseudonim });
                alert('Pseudonim został zaktualizowany!');
            } else if (user.rola === 'nauczyciel') {
                await updateTeacher(userId, { nr_konta_bankowego: formData.nr_konta_bankowego });
                alert('Numer konta został zaktualizowany!');
            } else if (user.rola === 'opiekun') {
                await updateGuardian(userId, { nr_indy_konta_bankowego: formData.nr_indy_konta_bankowego });
                alert('Numer konta został zaktualizowany!');
            }
            setEditing(false);
            
            const userData = await getMyProfile();
            setUser(userData);
            
            if (userData.rola === 'uczen') {
                const studentData = await getStudentById(userId);
                setRoleData(studentData);
            } else if (userData.rola === 'nauczyciel') {
                const teacherData = await getTeacherById(userId);
                setRoleData(teacherData);
            } else if (userData.rola === 'opiekun') {
                const guardianData = await getGuardianById(userId);
                setRoleData(guardianData);
            }
        } catch (err) {
            console.error(err);
            alert('Nie udało się zapisać zmian');
        }
    };

    if (!user) return <p className="text-center text-gray-500 mt-10">Ładowanie profilu...</p>;

    const canEdit = user.rola !== 'administrator';

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

                <div className="mt-8 border-t pt-6 text-gray-700 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <p className="font-semibold">Imię:</p>
                        <p>{user.imie}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <p className="font-semibold">Nazwisko:</p>
                        <p>{user.nazwisko}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <p className="font-semibold">Email:</p>
                        <p>{user.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <p className="font-semibold">Rola:</p>
                        <p className="capitalize">{user.rola}</p>
                    </div>

                    {user.rola === 'uczen' && roleData && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <p className="font-semibold">Pseudonim:</p>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.pseudonim}
                                        onChange={(e) => setFormData({ ...formData, pseudonim: e.target.value })}
                                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <p>{roleData.pseudonim || 'Brak'}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <p className="font-semibold">Punkty:</p>
                                <p>{roleData.saldo_punktow || 0}</p>
                            </div>
                        </div>
                    )}

                    {user.rola === 'nauczyciel' && roleData && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <p className="font-semibold">Numer konta:</p>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.nr_konta_bankowego}
                                        onChange={(e) => setFormData({ ...formData, nr_konta_bankowego: e.target.value })}
                                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="00 0000 0000 0000 0000 0000 0000"
                                    />
                                ) : (
                                    <p>{roleData.nr_konta_bankowego || 'Brak'}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {user.rola === 'opiekun' && roleData && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <p className="font-semibold">Numer konta:</p>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.nr_indy_konta_bankowego}
                                        onChange={(e) => setFormData({ ...formData, nr_indy_konta_bankowego: e.target.value })}
                                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="00 0000 0000 0000 0000 0000 0000"
                                    />
                                ) : (
                                    <p>{roleData.nr_indy_konta_bankowego || 'Brak'}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {canEdit && (
                        <div className="flex gap-3 justify-center pt-4">
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                                >
                                    Edytuj dane
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveChanges}
                                        className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
                                    >
                                        Zapisz zmiany
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            if (user.rola === 'uczen') {
                                                setFormData({ pseudonim: roleData.pseudonim || '' });
                                            } else if (user.rola === 'nauczyciel') {
                                                setFormData({ nr_konta_bankowego: roleData.nr_konta_bankowego || '' });
                                            } else if (user.rola === 'opiekun') {
                                                setFormData({ nr_indy_konta_bankowego: roleData.nr_indy_konta_bankowego || '' });
                                            }
                                        }}
                                        className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                                    >
                                        Anuluj
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
