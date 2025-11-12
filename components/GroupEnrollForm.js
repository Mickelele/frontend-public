'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { enrollStudentToGroup } from '../lib/api/student.api';

export default function GroupEnrollForm() {
    const { id_kursu, id_grupa } = useParams();
    const router = useRouter();
    const [form, setForm] = useState({
        imie: '',
        nazwisko: '',
        email: '',
        pseudonim: '',
        haslo: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await enrollStudentToGroup({ ...form, id_grupa });
            alert('Uczeń został zapisany!');
            router.push('/courses');
        } catch (err) {
            console.error(err);
            alert('Błąd podczas zapisu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h1 className="text-2xl font-bold mb-4 text-center">Zapisz ucznia do grupy {id_grupa}</h1>
            <p className="text-gray-600 mb-6 text-center">Kurs ID: {id_kursu}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    name="imie"
                    placeholder="Imię"
                    value={form.imie}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                />
                <input
                    type="text"
                    name="nazwisko"
                    placeholder="Nazwisko"
                    value={form.nazwisko}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                />
                <input
                    type="text"
                    name="pseudonim"
                    placeholder="Pseudonim"
                    value={form.pseudonim}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                />
                <input
                    type="password"
                    name="haslo"
                    placeholder="Hasło"
                    value={form.haslo}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
                >
                    {loading ? 'Zapisywanie...' : 'Zapisz ucznia'}
                </button>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded transition"
                >
                    Wróć
                </button>
            </form>
        </div>
    );
}
