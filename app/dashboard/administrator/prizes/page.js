'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { 
    getAllPrizes, 
    createPrize, 
    updatePrize, 
    deletePrize,
    uploadPrizeImage,
    getPrizeImageUrl,
    deletePrizeImage,
    getPrizeHistory
} from '../../../../lib/api/prize.api';
import { getUserById } from '../../../../lib/api/users.api';

export default function AdminPrizesPage() {
    const { user } = useAuth();
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPrize, setEditingPrize] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [filterStudent, setFilterStudent] = useState('');
    const [filterPrize, setFilterPrize] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    
    const [formData, setFormData] = useState({
        nazwa: '',
        koszt: ''
    });

    useEffect(() => {
        loadPrizes();
    }, []);

    const loadPrizes = async () => {
        try {
            setLoading(true);
            const data = await getAllPrizes();
            setPrizes(data || []);
        } catch (err) {
            console.error('Błąd ładowania nagród:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await getPrizeHistory();
            
            const historyWithUsers = await Promise.all(
                (data || []).map(async (item) => {
                    if (!item.uczen?.imie && item.id_ucznia) {
                        try {
                            const user = await getUserById(item.id_ucznia);
                            return {
                                ...item,
                                uczen: {
                                    imie: user.imie,
                                    nazwisko: user.nazwisko
                                }
                            };
                        } catch (err) {
                            console.error(`Błąd pobierania użytkownika ${item.id_ucznia}:`, err);
                            return item;
                        }
                    }
                    return item;
                })
            );
            
            setHistory(historyWithUsers);
            setShowHistoryModal(true);
            setFilterStudent('');
            setFilterPrize('');
            setSortOrder('desc');
        } catch (err) {
            console.error('Błąd ładowania historii:', err);
        }
    };

    const handleOpenModal = (prize = null) => {
        if (prize) {
            setEditingPrize(prize);
            setFormData({
                nazwa: prize.nazwa,
                koszt: prize.koszt
            });
            if (prize.zdjecie) {
                setImagePreview(getPrizeImageUrl(prize.id_nagrody));
            }
        } else {
            setEditingPrize(null);
            setFormData({ nazwa: '', koszt: '' });
            setImagePreview(null);
        }
        setImageFile(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPrize(null);
        setFormData({ nazwa: '', koszt: '' });
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Plik jest za duży. Maksymalny rozmiar to 5MB.');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let savedPrize;
            
            if (editingPrize) {
                savedPrize = await updatePrize(editingPrize.id_nagrody, {
                    nazwa: formData.nazwa,
                    koszt: parseInt(formData.koszt)
                });
                console.log('Updated prize:', savedPrize);
            } else {
                savedPrize = await createPrize({
                    nazwa: formData.nazwa,
                    koszt: parseInt(formData.koszt)
                });
                console.log('Created prize:', savedPrize);
            }

            if (imageFile) {
                const prizeId = editingPrize 
                    ? editingPrize.id_nagrody 
                    : (savedPrize?.id_nagrody || savedPrize?.id);
                
                console.log('Uploading image for prize ID:', prizeId);
                
                if (!prizeId) {
                    console.error('Brak ID nagrody:', savedPrize);
                    throw new Error('Nie można przesłać zdjęcia - brak ID nagrody');
                }
                
                await uploadPrizeImage(prizeId, imageFile);
            }

            await loadPrizes();
            handleCloseModal();
        } catch (err) {
            console.error('Błąd zapisu nagrody:', err);
            alert(`Nie udało się zapisać nagrody: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć tę nagrodę?')) return;
        
        try {
            await deletePrize(id);
            await loadPrizes();
        } catch (err) {
            console.error('Błąd usuwania nagrody:', err);
            alert('Nie udało się usunąć nagrody');
        }
    };

    const handleDeleteImage = async (prizeId) => {
        if (!confirm('Czy na pewno chcesz usunąć zdjęcie?')) return;
        
        try {
            await deletePrizeImage(prizeId);
            await loadPrizes();
            if (editingPrize?.id_nagrody === prizeId) {
                setImagePreview(null);
            }
        } catch (err) {
            console.error('Błąd usuwania zdjęcia:', err);
            alert('Nie udało się usunąć zdjęcia');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie nagród...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Zarządzanie nagrodami</h1>
                        <p className="text-gray-600 mt-1">Dodawaj, edytuj i usuwaj nagrody dla uczniów</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={loadHistory}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition w-full sm:w-auto"
                        >
                            📜 Historia odbiorów
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition w-full sm:w-auto"
                        >
                            ➕ Dodaj nagrodę
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {prizes.map((prize) => (
                        <div key={prize.id_nagrody} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                            <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                                {prize.zdjecie ? (
                                    <img 
                                        src={getPrizeImageUrl(prize.id_nagrody)} 
                                        alt={prize.nazwa}
                                        className="w-full h-full object-contain p-2"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="text-6xl">🎁</div>';
                                        }}
                                    />
                                ) : (
                                    <div className="text-6xl">🎁</div>
                                )}
                            </div>
                            
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{prize.nazwa}</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-2xl font-bold text-blue-600">{prize.koszt}</span>
                                    <span className="text-sm text-gray-600">punktów</span>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(prize)}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded font-medium transition"
                                    >
                                        ✏️ Edytuj
                                    </button>
                                    <button
                                        onClick={() => handleDelete(prize.id_nagrody)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-medium transition"
                                    >
                                        🗑️ Usuń
                                    </button>
                                </div>
                                
                                {prize.zdjecie && (
                                    <button
                                        onClick={() => handleDeleteImage(prize.id_nagrody)}
                                        className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded font-medium transition text-sm"
                                    >
                                        🖼️ Usuń zdjęcie
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {prizes.length === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-6xl mb-4">🎁</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Brak nagród</h2>
                        <p className="text-gray-600 mb-6">Dodaj pierwszą nagrodę, aby uczniowie mogli wymieniać punkty</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                        >
                            Dodaj nagrodę
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">
                                {editingPrize ? '✏️ Edytuj nagrodę' : '➕ Nowa nagroda'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Nazwa nagrody
                                </label>
                                <input
                                    type="text"
                                    value={formData.nazwa}
                                    onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    placeholder="np. Voucher do kina"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Koszt w punktach
                                </label>
                                <input
                                    type="number"
                                    value={formData.koszt}
                                    onChange={(e) => setFormData({ ...formData, koszt: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    min="1"
                                    placeholder="100"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Zdjęcie nagrody
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-sm text-gray-500 mt-1">Maksymalny rozmiar: 5MB</p>
                            </div>

                            {imagePreview && (
                                <div className="mb-4">
                                    <p className="text-gray-700 font-medium mb-2">Podgląd:</p>
                                    <img 
                                        src={imagePreview} 
                                        alt="Podgląd" 
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    {editingPrize ? 'Zapisz zmiany' : 'Dodaj'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">📜 Historia odbiorów nagród</h2>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🔍 Szukaj ucznia
                                        </label>
                                        <input
                                            type="text"
                                            value={filterStudent}
                                            onChange={(e) => setFilterStudent(e.target.value)}
                                            placeholder="Imię lub nazwisko..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🎁 Szukaj nagrody
                                        </label>
                                        <input
                                            type="text"
                                            value={filterPrize}
                                            onChange={(e) => setFilterPrize(e.target.value)}
                                            placeholder="Nazwa nagrody..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            📅 Sortowanie
                                        </label>
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="desc">Najnowsze pierwsze</option>
                                            <option value="asc">Najstarsze pierwsze</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {(filterStudent || filterPrize) && (
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            Znaleziono: <span className="font-bold">{
                                                history.filter(item => {
                                                    const studentMatch = !filterStudent || 
                                                        `${item.uczen?.imie} ${item.uczen?.nazwisko}`.toLowerCase().includes(filterStudent.toLowerCase());
                                                    const prizeMatch = !filterPrize || 
                                                        item.nagroda?.nazwa?.toLowerCase().includes(filterPrize.toLowerCase());
                                                    return studentMatch && prizeMatch;
                                                }).length
                                            }</span> wyników
                                        </p>
                                        <button
                                            onClick={() => {
                                                setFilterStudent('');
                                                setFilterPrize('');
                                            }}
                                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                        >
                                            ✕ Wyczyść filtry
                                        </button>
                                    </div>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-gray-600">Brak historii odbiorów</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history
                                        .filter(item => {
                                            const studentMatch = !filterStudent || 
                                                `${item.uczen?.imie} ${item.uczen?.nazwisko}`.toLowerCase().includes(filterStudent.toLowerCase()) ||
                                                `ID: ${item.id_ucznia}`.toLowerCase().includes(filterStudent.toLowerCase());
                                            const prizeMatch = !filterPrize || 
                                                item.nagroda?.nazwa?.toLowerCase().includes(filterPrize.toLowerCase());
                                            return studentMatch && prizeMatch;
                                        })
                                        .sort((a, b) => {
                                            const dateA = new Date(a.data);
                                            const dateB = new Date(b.data);
                                            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                                        })
                                        .map((item, index) => {
                                        console.log('Historia item:', item);
                                        return (
                                            <div key={item.id_relacji || index} className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-purple-300 transition">
                                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-2xl">🎁</span>
                                                            <h3 className="font-bold text-lg text-gray-800">
                                                                {item.nagroda?.nazwa || 'Nagroda usunięta'}
                                                            </h3>
                                                        </div>
                                                        
                                                        <div className="space-y-1 ml-8">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-purple-600">👤</span>
                                                                <p className="text-sm font-medium text-gray-700">
                                                                    {item.uczen?.imie && item.uczen?.nazwisko 
                                                                        ? `${item.uczen.imie} ${item.uczen.nazwisko}` 
                                                                        : `ID ucznia: ${item.id_ucznia}`}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-blue-600">💰</span>
                                                                <p className="text-sm text-gray-600">
                                                                    Koszt: <span className="font-semibold">{item.nagroda?.koszt || '?'} punktów</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-white rounded-lg p-3 border border-gray-200 w-full lg:w-auto lg:min-w-[140px] lg:text-right">
                                                        <p className="text-xs text-gray-500 mb-1">Data odbioru</p>
                                                        <p className="text-sm font-bold text-gray-800">
                                                            {item.data ? new Date(item.data).toLocaleDateString('pl-PL', {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            }) : 'Brak daty'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {history.filter(item => {
                                        const studentMatch = !filterStudent || 
                                            `${item.uczen?.imie} ${item.uczen?.nazwisko}`.toLowerCase().includes(filterStudent.toLowerCase()) ||
                                            `ID: ${item.id_ucznia}`.toLowerCase().includes(filterStudent.toLowerCase());
                                        const prizeMatch = !filterPrize || 
                                            item.nagroda?.nazwa?.toLowerCase().includes(filterPrize.toLowerCase());
                                        return studentMatch && prizeMatch;
                                    }).length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">🔍</div>
                                            <p className="text-gray-600">Brak wyników dla wybranych filtrów</p>
                                            <button
                                                onClick={() => {
                                                    setFilterStudent('');
                                                    setFilterPrize('');
                                                }}
                                                className="mt-4 text-purple-600 hover:text-purple-800 font-medium"
                                            >
                                                Wyczyść filtry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
