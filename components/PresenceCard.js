'use client';

export default function PresenceCard({ student, presence }) {
    const studentPresence = presence || [];
    const sortedPresence = [...studentPresence].sort((a, b) =>
        new Date(b.zajecia?.data || 0) - new Date(a.zajecia?.data || 0)
    );

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500">
            {/* Nagłówek */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {student.user?.imie} {student.user?.nazwisko}
                    {student.pseudonim && (
                        <span className="text-sm text-gray-500 ml-2">({student.pseudonim})</span>
                    )}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>ID: {student.id_ucznia}</span>
                    <span>Punkty: {student.saldo_punktow}</span>
                    <span>Email: {student.user?.email}</span>
                    <span>Zajęć: {studentPresence.length}</span>
                </div>
            </div>

            {/* Tabela obecności */}
            <div>
                <h4 className="text-lg font-medium text-gray-700 mb-4">Obecności</h4>

                {sortedPresence.length ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data zajęć
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Temat zajęć
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {sortedPresence.map((obecnosc) => (
                                <tr
                                    key={obecnosc.id_obecnosci}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {obecnosc.zajecia?.data ?
                                            new Date(obecnosc.zajecia.data).toLocaleDateString('pl-PL') :
                                            'Brak daty'
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {obecnosc.zajecia?.tematZajec || `Zajęcia ${obecnosc.id_zajec}`}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                obecnosc.czyObecny
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {obecnosc.czyObecny ? 'Obecny' : 'Nieobecny'}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <div className="text-3xl mb-2">📋</div>
                        <div>Brak danych o obecnościach</div>
                    </div>
                )}
            </div>
        </div>
    );
}