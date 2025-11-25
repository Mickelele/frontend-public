import { apiFetch } from '../fetcher';

export async function getCourses() {
    return await apiFetch('/kursy/', { method: 'GET' }, 'course');
}

export async function getCourseById(id_kursu) {
    return await apiFetch(`/kursy/${id_kursu}`, { method: 'GET' }, 'course');
}

export async function getCourseGroups(id_kursu) {
    return await apiFetch(`/kursy/${id_kursu}/grupy`, { method: 'GET' }, 'course');
}


export async function getMyCourses(dzienTygodnia = null) {
    let url = `/kursy/nauczyciel/moje-kursy`;
    if (dzienTygodnia) {
        url += `?dzien=${encodeURIComponent(dzienTygodnia)}`;
    }
    return await apiFetch(url, { method: 'GET' }, 'course');
}


export async function addComment(remarkData) {
    console.log('Wysyłane dane uwagi (przed wysłaniem):', remarkData);

    const formattedData = {
        "id_ucznia": Number(remarkData.id_ucznia),
        "id_zajec": Number(remarkData.id_zajec),
        "tresc": String(remarkData.tresc),
        "id_nauczyciela": Number(remarkData.id_nauczyciela)
    };

    console.log('Sformatowane dane:', formattedData);

    try {
        const result = await apiFetch('/uwagi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: formattedData
        }, 'course');
        console.log('Odpowiedź z API:', result);
        return result;
    } catch (error) {
        console.error('Błąd w addComment:', error);
        throw error;
    }
}