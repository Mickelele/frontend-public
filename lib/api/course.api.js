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

export async function createCourse(courseData) {
    return await apiFetch('/kursy/dodajKurs', {
        method: 'POST',
        body: courseData
    }, 'course');
}

export async function updateCourse(id_kursu, courseData) {
    return await apiFetch(`/kursy/aktualizujKurs/${id_kursu}`, {
        method: 'PUT',
        body: courseData
    }, 'course');
}

export async function deleteCourse(id_kursu) {
    return await apiFetch(`/kursy/usunKurs/${id_kursu}`, {
        method: 'DELETE'
    }, 'course');
}


export async function getMyCourses(dzienTygodnia = null, nauczycielId = null) {
    let url = `/kursy/nauczyciel/moje-kursy`;
    const params = [];
    
    if (dzienTygodnia) {
        params.push(`dzien=${encodeURIComponent(dzienTygodnia)}`);
    }
    if (nauczycielId) {
        params.push(`nauczyciel_id=${encodeURIComponent(nauczycielId)}`);
    }
    
    if (params.length > 0) {
        url += `?${params.join('&')}`;
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

export async function getStudentRemarks(studentId) {
    return await apiFetch(`/uwagi/student/${studentId}`, { method: 'GET' }, 'course');
}



export async function addHomework(homeworkData) {
    console.log('Wysyłane dane zadania (RAW):', homeworkData);

    const formattedData = {
        id_grupy: Number(homeworkData.id_grupy),
        tytul: String(homeworkData.tytul),
        opis: String(homeworkData.opis),
        termin: homeworkData.termin,
    };

    console.log('Sformatowane dane do wysłania (JSON):', formattedData);

    try {
        const result = await apiFetch('/zadania/dodaj', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: formattedData
        }, 'course');

        console.log('Odpowiedź z API:', result);
        return result;
    } catch (error) {
        console.error('Błąd w addHomework:', error);
        console.error('Szczegóły błędu:', error.message);
        throw error;
    }
}


export async function getHomeworkAnswers(id_zadania) {
    return await apiFetch(`/odpowiedzi/zadanie/${id_zadania}`, {
        method: 'GET'
    }, 'course');
}



export async function getGroupHomeworks(id_grupy) {
    return await apiFetch(`/grupy/${id_grupy}/zadania`, {
        method: 'GET'
    }, 'course');
}


export async function gradeHomeworkAnswer(gradeData) {
    console.log('Wysyłane dane oceny (RAW):', gradeData);
    console.log('Typ id_odpowiedzi:', typeof gradeData.id_odpowiedzi, 'Wartość:', gradeData.id_odpowiedzi);
    console.log('Typ ocena:', typeof gradeData.ocena, 'Wartość:', gradeData.ocena);

    const formattedData = {
        ocena: Number(gradeData.ocena)
    };

    console.log('Sformatowane dane do wysłania:', formattedData);
    console.log('JSON stringify:', JSON.stringify(formattedData));

    try {
        const result = await apiFetch(`/odpowiedzi/ocen/${gradeData.id_odpowiedzi}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: formattedData
        }, 'course');

        console.log('Odpowiedź z API:', result);
        return result;
    } catch (error) {
        console.error('Błąd w gradeHomeworkAnswer:', error);
        console.error('Szczegóły błędu:', error.message);
        throw error;
    }
}


export async function updateHomework(homeworkId, homeworkData) {
    console.log('Aktualizowanie zadania:', homeworkId, homeworkData);
    
    const formattedData = {
        tytul: String(homeworkData.tytul),
        opis: String(homeworkData.opis),
        termin: homeworkData.termin
    };

    try {
        const result = await apiFetch(`/zadania/${homeworkId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: formattedData
        }, 'course');

        console.log('Zadanie zaktualizowane:', result);
        return result;
    } catch (error) {
        console.error('Błąd aktualizacji zadania:', error);
        throw error;
    }
}


export async function deleteHomework(homeworkId) {
    console.log('Usuwanie zadania:', homeworkId);
    
    try {
        const result = await apiFetch(`/zadania/${homeworkId}`, {
            method: 'DELETE'
        }, 'course');

        console.log('Zadanie usunięte:', result);
        return result;
    } catch (error) {
        console.error('Błąd usuwania zadania:', error);
        throw error;
    }
}




