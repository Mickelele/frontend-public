'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function AuthForm({ fields, onSubmit, submitLabel, footer }) {
    const [values, setValues] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const firstInputRef = useRef(null);

    // Autofocus na pierwsze pole
    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

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

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.name} className="space-y-1">
                            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                                {field.label}
                            </label>
                            <input
                                id={field.name}
                                name={field.name}
                                type={field.type || 'text'}
                                placeholder={`Wprowadź ${field.label.toLowerCase()}`}
                                value={values[field.name] || ''}
                                onChange={handleChange}
                                disabled={isLoading}
                                ref={index === 0 ? firstInputRef : null}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                required
                            />
                        </div>
                    ))}

                    {error && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isLoading ? (
                            <svg
                                className="animate-spin h-5 w-5 text-white mr-2"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : null}
                        {isLoading ? 'Przetwarzanie...' : submitLabel}
                    </button>

                    {footer && <div className="mt-4 text-center">{footer}</div>}
                </form>
            </div>
        </div>
    );
}
