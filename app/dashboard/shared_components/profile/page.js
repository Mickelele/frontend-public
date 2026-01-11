'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '/context/AuthContext';
import { getToken, getUserIdFromToken } from '/lib/auth';
import { getMyProfile, updateMyProfile, changePassword } from '/lib/api/users.api';
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
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
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
                    setFormData({ email: userData.email || '', pseudonim: studentData.pseudonim || '' });
                } else if (userData.rola === 'nauczyciel') {
                    const teacherData = await getTeacherById(userId);
                    setRoleData(teacherData);
                    setFormData({ email: userData.email || '', nr_konta_bankowego: teacherData.nr_konta_bankowego || '' });
                } else if (userData.rola === 'opiekun') {
                    const guardianData = await getGuardianById(userId);
                    setRoleData(guardianData);
                    setFormData({ email: userData.email || '', nr_indy_konta_bankowego: guardianData.nr_indy_konta_bankowego || '' });
                } else {
                    setFormData({ email: userData.email || '' });
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

    const generatePassword = () => {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPasswordData({
            ...passwordData,
            newPassword: password,
            confirmPassword: password
        });
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword) {
            alert('Podaj aktualne hasło');
            return;
        }
        if (!passwordData.newPassword) {
            alert('Podaj nowe hasło');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Nowe hasła nie są identyczne');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert('Nowe hasło musi mieć co najmniej 6 znaków');
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            alert('Hasło zostało zmienione!');
            setChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            alert('Nie udało się zmienić hasła. Sprawdź aktualne hasło.');
        }
    };

    const handleSaveChanges = async () => {
        try {
            const userId = getUserIdFromToken();
            
            // Aktualizuj email jeśli się zmienił
            if (formData.email !== user.email) {
                await updateMyProfile({ email: formData.email });
            }
            
            if (user.rola === 'uczen') {
                await updateStudent(userId, { pseudonim: formData.pseudonim });
                alert('Dane zostały zaktualizowane!');
            } else if (user.rola === 'nauczyciel') {
                await updateTeacher(userId, { nr_konta_bankowego: formData.nr_konta_bankowego });
                alert('Dane zostały zaktualizowane!');
            } else if (user.rola === 'opiekun') {
                await updateGuardian(userId, { nr_indy_konta_bankowego: formData.nr_indy_konta_bankowego });
                alert('Dane zostały zaktualizowane!');
            } else {
                alert('Email został zaktualizowany!');
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

    const canEdit = true; // Każdy może edytować swoje dane

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
                    
                    <div className="grid grid-cols-2 gap-2 items-center">
                        <p className="font-semibold">Email:</p>
                        {editing ? (
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="email@example.com"
                            />
                        ) : (
                            <p>{user.email}</p>
                        )}
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
                                                setFormData({ email: user.email || '', pseudonim: roleData.pseudonim || '' });
                                            } else if (user.rola === 'nauczyciel') {
                                                setFormData({ email: user.email || '', nr_konta_bankowego: roleData.nr_konta_bankowego || '' });
                                            } else if (user.rola === 'opiekun') {
                                                setFormData({ email: user.email || '', nr_indy_konta_bankowego: roleData.nr_indy_konta_bankowego || '' });
                                            } else {
                                                setFormData({ email: user.email || '' });
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

                    {/* Password Change Section */}
                    <div className="border-t pt-6 mt-6">
                        {!changingPassword ? (
                            <button
                                onClick={() => setChangingPassword(true)}
                                className="w-full bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
                            >
                                Zmień hasło
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 text-center">Zmiana hasła</h3>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Aktualne hasło:
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Wprowadź aktualne hasło"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Nowe hasło:
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="Wprowadź nowe hasło"
                                        />
                                        <button
                                            onClick={generatePassword}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition whitespace-nowrap"
                                            title="Wygeneruj hasło"
                                        >
                                            🎲 Generuj
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Min. 6 znaków</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Potwierdź nowe hasło:
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Wprowadź ponownie nowe hasło"
                                    />
                                </div>

                                <div className="flex gap-3 justify-center pt-2">
                                    <button
                                        onClick={handlePasswordChange}
                                        className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
                                    >
                                        Zmień hasło
                                    </button>
                                    <button
                                        onClick={() => {
                                            setChangingPassword(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }}
                                        className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
