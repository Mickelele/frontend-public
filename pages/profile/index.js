import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/router';

const ProfilePage = () => {
    const { user, token } = useContext(AuthContext);
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updateData, setUpdateData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (!token) {
            router.push('/auth/login');
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch('http://localhost:3000/user/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) {
                    setProfile(data);
                    setUpdateData({
                        imie: data.imie,
                        nazwisko: data.nazwisko,
                        email: data.email
                    });
                } else {
                    setError(data.error || 'Błąd pobierania profilu');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/user/updateProfile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                setSuccessMsg('Profil zaktualizowany!');
            } else {
                setError(data.error || 'Błąd aktualizacji');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/user/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(passwordData),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessMsg('Hasło zmienione!');
                setPasswordData({ currentPassword: '', newPassword: '' });
            } else {
                setError(data.error || 'Błąd zmiany hasła');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Ładowanie profilu...</p>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
            <h2 className="text-2xl mb-4">Profil użytkownika</h2>
            {error && <p className="text-red-500">{error}</p>}
            {successMsg && <p className="text-green-500">{successMsg}</p>}

            <form onSubmit={handleProfileUpdate} className="mb-6">
                <h3 className="text-xl mb-2">Edytuj profil</h3>
                <input
                    type="text"
                    placeholder="Imię"
                    value={updateData.imie || ''}
                    onChange={(e) => setUpdateData({ ...updateData, imie: e.target.value })}
                    className="w-full mb-2 p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="Nazwisko"
                    value={updateData.nazwisko || ''}
                    onChange={(e) => setUpdateData({ ...updateData, nazwisko: e.target.value })}
                    className="w-full mb-2 p-2 border rounded"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={updateData.email || ''}
                    onChange={(e) => setUpdateData({ ...updateData, email: e.target.value })}
                    className="w-full mb-2 p-2 border rounded"
                />
                <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Zaktualizuj profil</button>
            </form>

            {/* Formularz zmiany hasła */}
            <form onSubmit={handlePasswordChange}>
                <h3 className="text-xl mb-2">Zmień hasło</h3>
                <input
                    type="password"
                    placeholder="Aktualne hasło"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full mb-2 p-2 border rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Nowe hasło"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full mb-2 p-2 border rounded"
                    required
                />
                <button type="submit" className="w-full p-2 bg-green-600 text-white rounded">Zmień hasło</button>
            </form>
        </div>
    );
};

export default ProfilePage;
