'use client';

export default function PresenceCard({ student, presence }) {
    const studentPresence = presence || [];
    const sortedPresence = [...studentPresence].sort((a, b) =>
        new Date(b.zajecia?.data || 0) - new Date(a.zajecia?.data || 0)
    );

    const attendanceCount = studentPresence.filter(p => p.czyObecny).length;
    const totalCount = studentPresence.length;
    const attendancePercentage = totalCount > 0 ? ((attendanceCount / totalCount) * 100).toFixed(1) : 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
           
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">
                            {student.user?.imie} {student.user?.nazwisko}
                        </h3>
                        {student.pseudonim && (
                            <span className="inline-block bg-blue-700 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">
                                {student.pseudonim}
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{attendancePercentage}%</div>
                        <div className="text-sm opacity-90">Frekwencja</div>
                    </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-blue-700 bg-opacity-40 rounded-lg p-3 text-center backdrop-blur-sm">
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <div className="text-xs font-medium">Zajęć</div>
                    </div>
                    <div className="bg-green-600 bg-opacity-50 rounded-lg p-3 text-center backdrop-blur-sm">
                        <div className="text-2xl font-bold">{attendanceCount}</div>
                        <div className="text-xs font-medium">Obecny</div>
                    </div>
                    <div className="bg-red-600 bg-opacity-50 rounded-lg p-3 text-center backdrop-blur-sm">
                        <div className="text-2xl font-bold">{totalCount - attendanceCount}</div>
                        <div className="text-xs font-medium">Nieobecny</div>
                    </div>
                </div>
            </div>

        
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">Historia obecności</h4>
                    <span className="text-sm text-gray-500">{totalCount} {totalCount === 1 ? 'zajęcie' : 'zajęć'}</span>
                </div>

                {sortedPresence.length ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {sortedPresence.map((obecnosc) => {
                            const isPresent = obecnosc.czyObecny;
                            return (
                                <div
                                    key={obecnosc.id_obecnosci}
                                    className={`relative rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                                        isPresent 
                                            ? 'bg-gradient-to-r from-green-50 to-white border-l-4 border-green-500' 
                                            : 'bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">
                                                    {isPresent ? '✅' : '❌'}
                                                </span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                    isPresent 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {isPresent ? 'OBECNY' : 'NIEOBECNY'}
                                                </span>
                                            </div>
                                            <h5 className="font-semibold text-gray-800 mb-1">
                                                {obecnosc.zajecia?.tematZajec || `Zajęcia #${obecnosc.id_zajec}`}
                                            </h5>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    📅 {obecnosc.zajecia?.data ?
                                                        new Date(obecnosc.zajecia.data).toLocaleDateString('pl-PL', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        }) :
                                                        'Brak daty'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <div className="text-6xl mb-3">📋</div>
                        <div className="text-gray-500 font-medium">Brak danych o obecnościach</div>
                        <div className="text-sm text-gray-400 mt-1">Historia pojawi się po dodaniu zajęć</div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}