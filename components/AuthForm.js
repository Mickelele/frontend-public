'use client';
import { useState } from 'react';

export default function AuthForm({ fields, onSubmit, submitLabel }) {
    const [values, setValues] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await onSubmit(values);
        } catch (err) {
            setError(err.message || 'Wystąpił błąd podczas przetwarzania żądania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 animate-fade-in">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        {submitLabel}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Wypełnij poniższe pola, aby kontynuować
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="card animate-slide-up"
                >
                    <div className="space-y-6">
                        {fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <label
                                    htmlFor={field.name}
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    {field.label}
                                </label>
                                <input
                                    id={field.name}
                                    type={field.type || 'text'}
                                    name={field.name}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                    placeholder={`Wprowadź ${field.label.toLowerCase()}`}
                                    disabled={isLoading}
                                />
                            </div>
                        ))}

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Błąd
                                        </h3>
                                        <p className="text-sm text-red-700 mt-1">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Przetwarzanie...</span>
                                </>
                            ) : (
                                <span>{submitLabel}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}