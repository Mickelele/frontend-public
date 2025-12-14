'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getQuizById, updateQuiz } from '../../../../../../lib/api/quiz.api';

export default function EditQuizPage() {
    const router = useRouter();
    const params = useParams();
    const [formData, setFormData] = useState({
        nazwa: '',
        opis: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (params.id) {
            loadData();
        }
    }, [params.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const quizData = await getQuizById(params.id);
            
            setFormData({
                nazwa: quizData.nazwa || '',
                opis: quizData.opis || ''
            });
            setError(null);
        } catch (err) {
            setError('Nie udało się załadować danych');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nazwa.trim()) {
            setError('Nazwa quizu jest wymagana');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            
            const quizData = {
                nazwa: formData.nazwa,
                opis: formData.opis,
                Zajecia_id_zajec: null
            };

            await updateQuiz(params.id, quizData);
            router.push('/dashboard/nauczyciel/quiz');
        } catch (err) {
            setError('Nie udało się zaktualizować quizu');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold mb-6">Edytuj Quiz</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="nazwa" className="block text-gray-700 font-semibold mb-2">
                            Nazwa Quizu *
                        </label>
                        <input
                            type="text"
                            id="nazwa"
                            name="nazwa"
                            value={formData.nazwa}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Np. Quiz z matematyki - Rozdział 1"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="opis" className="block text-gray-700 font-semibold mb-2">
                            Opis
                        </label>
                        <textarea
                            id="opis"
                            name="opis"
                            value={formData.opis}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Opcjonalny opis quizu..."
                            rows="4"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400"
                        >
                            {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition"
                        >
                            Anuluj
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
