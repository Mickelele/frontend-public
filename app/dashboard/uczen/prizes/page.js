'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '/context/AuthContext';
import { getAllPrizes, getStudentPrizes, claimPrize } from '/lib/api/prize.api';
import { getStudentPoints } from '/lib/api/points.api';

export default function PrizesPage() {
    const { user } = useAuth();
    const [availablePrizes, setAvailablePrizes] = useState([]);
    const [myPrizes, setMyPrizes] = useState([]);
    const [studentPoints, setStudentPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [claimingPrize, setClaimingPrize] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('available'); 

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

        
            const prizes = await getAllPrizes();
            console.log('Dostępne nagrody:', prizes);
            setAvailablePrizes(prizes || []);

 
            const studentPrizesData = await getStudentPrizes(user.id);
            console.log('Nagrody ucznia:', studentPrizesData);
            setMyPrizes(studentPrizesData || []);

           
            const pointsData = await getStudentPoints(user.id);
            console.log('Dane punktów z API:', pointsData);
            
     
            let points = 0;
            if (typeof pointsData === 'number') {
                points = pointsData;
            } else if (pointsData?.saldo_punktow !== undefined) {
                points = Number(pointsData.saldo_punktow);
            } else if (pointsData?.punkty !== undefined) {
                points = Number(pointsData.punkty);
            } else if (pointsData?.points !== undefined) {
                points = Number(pointsData.points);
            }
            
           
            points = isNaN(points) ? 0 : points;
            console.log('Finalne punkty ucznia:', points);
            setStudentPoints(points);

        } catch (err) {
            console.error('Błąd ładowania danych:', err);
            setError('Nie udało się załadować danych. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimPrize = async (prizeId, prizeCost) => {

        if (studentPoints < prizeCost) {
            alert('Nie masz wystarczająco punktów, aby odebrać tę nagrodę!');
            return;
        }

        if (!confirm('Czy na pewno chcesz odebrać tę nagrodę?')) {
            return;
        }

        try {
            setClaimingPrize(prizeId);
            await claimPrize(user.id, prizeId);
            
            alert('Nagroda została odebrana! Gratulacje! 🎉');
            
         
            await loadData();
        } catch (err) {
            console.error('Błąd przy odbieraniu nagrody:', err);
            alert('Nie udało się odebrać nagrody. Spróbuj ponownie.');
        } finally {
            setClaimingPrize(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Ładowanie nagród...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
         
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">⭐ Sklep z nagrodami</h1>
                            <p className="text-blue-100">Wymień swoje punkty na fantastyczne nagrody!</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center min-w-[150px]">
                            <p className="text-sm text-blue-100 mb-1">Twoje punkty</p>
                            <p className="text-4xl font-bold">{studentPoints}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

         
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'available'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🎁 Dostępne nagrody ({availablePrizes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'my'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🏆 Moje nagrody ({myPrizes.length})
                    </button>
                </div>

                {activeTab === 'available' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Dostępne nagrody</h2>
                        
                        {availablePrizes.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🎁</div>
                                <p className="text-gray-600 text-lg">Brak dostępnych nagród w tym momencie</p>
                                <p className="text-gray-500 text-sm mt-2">Wróć później, aby sprawdzić nowe nagrody!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availablePrizes.map((prize) => {
                                    const prizeCost = Number(prize.koszt_punktow || prize.koszt || prize.price || prize.points || 0);
                                    const currentPoints = Number(studentPoints) || 0;
                                    const canAfford = currentPoints >= prizeCost;
                                    const isAlreadyClaimed = myPrizes.some(mp => mp.id_nagrody === prize.id_nagrody);
                                    
                                    console.log('Nagroda:', prize.nazwa, 'Koszt:', prizeCost, 'Obiekt nagrody:', prize);
                                    
                                    return (
                                        <div
                                            key={prize.id_nagrody}
                                            className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl ${
                                                !canAfford ? 'opacity-75' : ''
                                            }`}
                                        >
                                            <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-6 text-center">
                                                <div className="text-6xl mb-2">🎁</div>
                                                <h3 className="text-xl font-bold text-white">{prize.nazwa}</h3>
                                            </div>
                                            
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm text-gray-500">Koszt:</span>
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        {prizeCost || '?'} ⭐
                                                    </span>
                                                </div>

                                                {isAlreadyClaimed ? (
                                                    <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">
                                                        ✓ Już posiadasz
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleClaimPrize(prize.id_nagrody, prizeCost)}
                                                        disabled={!canAfford || claimingPrize === prize.id_nagrody}
                                                        className={`w-full py-3 rounded-lg font-semibold transition ${
                                                            canAfford
                                                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {claimingPrize === prize.id_nagrody ? (
                                                            <span className="flex items-center justify-center">
                                                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Odbieranie...
                                                            </span>
                                                        ) : canAfford ? (
                                                            '🎁 Odbierz nagrodę'
                                                        ) : (
                                                            `Brakuje ${Math.max(0, prizeCost - currentPoints)} punktów`
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'my' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Moje nagrody</h2>
                        
                        {myPrizes.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🏆</div>
                                <p className="text-gray-600 text-lg">Nie posiadasz jeszcze żadnych nagród</p>
                                <p className="text-gray-500 text-sm mt-2">Zbieraj punkty i odbieraj nagrody!</p>
                                <button
                                    onClick={() => setActiveTab('available')}
                                    className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                                >
                                    Zobacz dostępne nagrody
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myPrizes.map((myPrize) => (
                                    <div
                                        key={myPrize.id_nagrody_ucznia}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all"
                                    >
                                        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-6 text-center">
                                            <div className="text-6xl mb-2">🏆</div>
                                            <h3 className="text-xl font-bold text-white">
                                                {myPrize.nagroda?.nazwa || 'Nagroda'}
                                            </h3>
                                        </div>
                                        
                                        <div className="p-6">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Wartość:</span>
                                                    <span className="font-semibold text-blue-600">
                                                        {myPrize.nagroda?.koszt_punktow || myPrize.nagroda?.koszt || myPrize.nagroda?.price || '?'} ⭐
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Data odebrania:</span>
                                                    <span className="font-semibold text-gray-700">
                                                        {myPrize.data_odebrania 
                                                            ? new Date(myPrize.data_odebrania).toLocaleDateString('pl-PL')
                                                            : 'Nieznana'
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-center py-2 rounded-lg">
                                                <span className="font-semibold">✓ Odebrano</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
