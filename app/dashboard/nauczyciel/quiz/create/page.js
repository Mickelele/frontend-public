'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createQuiz } from '../../../../../lib/api/quiz.api';

export default function CreateQuizPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        nazwa: '',
        opis: '',
        Zajecia_id_zajec: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const zajeciaId = searchParams.get('zajecia_id');
        if (zajeciaId) {
            setFormData(prev => ({
                ...prev,
                Zajecia_id_zajec: zajeciaId
            }));
        }
    }, [searchParams]);

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
            setLoading(true);
            setError(null);
            
            const quizData = {
                nazwa: formData.nazwa,
                opis: formData.opis,
                Zajecia_id_zajec: formData.Zajecia_id_zajec ? parseInt(formData.Zajecia_id_zajec) : null
            };

            await createQuiz(quizData);
            router.push('/dashboard/nauczyciel/quiz');
        } catch (err) {
            setError('Nie udało się utworzyć quizu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold mb-6">Utwórz Nowy Quiz</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {formData.Zajecia_id_zajec && (
                        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-sm text-purple-800">
                                📝 Quiz zostanie przypisany do zajęć (ID: {formData.Zajecia_id_zajec})
                            </p>
                        </div>
                    )}

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

                    <div className="mb-6">
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
                            disabled={loading}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400"
                        >
                            {loading ? 'Tworzenie...' : 'Utwórz Quiz'}
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
