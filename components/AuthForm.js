'use client';
import { useState } from 'react';

export default function AuthForm({ fields, onSubmit, submitLabel }) {
    const [values, setValues] = useState({});
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await onSubmit(values);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-3">
            {fields.map((f) => (
                <div key={f.name}>
                    <label className="block mb-1 font-medium">{f.label}</label>
                    <input
                        type={f.type || 'text'}
                        name={f.name}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full rounded"
                    />
                </div>
            ))}
            {error && <p className="text-red-600">{error}</p>}
            <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                {submitLabel}
            </button>
        </form>
    );
}
