import { apiFetch } from '../fetcher';



export async function getAllQuizzes() {
    return await apiFetch('/quizy', { method: 'GET' }, 'quiz');
}

export async function getQuizById(id) {
    return await apiFetch(`/quizy/${id}`, { method: 'GET' }, 'quiz');
}

export async function getQuizzesByLesson(lessonId) {
    return await apiFetch(`/quizy/zajecia/${lessonId}`, { method: 'GET' }, 'quiz');
}

export async function getQuizzesByGroup(groupId) {
    return await apiFetch(`/quizy/grupa/${groupId}`, { method: 'GET' }, 'quiz');
}

export async function createQuiz(quizData) {
    return await apiFetch('/quizy', {
        method: 'POST',
        body: quizData
    }, 'quiz');
}

export async function updateQuiz(id, quizData) {
    return await apiFetch(`/quizy/${id}`, {
        method: 'PUT',
        body: quizData
    }, 'quiz');
}

export async function deleteQuiz(id) {
    return await apiFetch(`/quizy/${id}`, { method: 'DELETE' }, 'quiz');
}


export async function getAllQuestions() {
    return await apiFetch('/pytania', { method: 'GET' }, 'quiz');
}

export async function getQuestionById(id) {
    return await apiFetch(`/pytania/${id}`, { method: 'GET' }, 'quiz');
}

export async function getQuestionsByQuiz(quizId) {
    return await apiFetch(`/pytania/quiz/${quizId}`, { method: 'GET' }, 'quiz');
}

export async function createQuestion(questionData) {
    return await apiFetch('/pytania', {
        method: 'POST',
        body: questionData
    }, 'quiz');
}

export async function updateQuestion(id, questionData) {
    return await apiFetch(`/pytania/${id}`, {
        method: 'PUT',
        body: questionData
    }, 'quiz');
}

export async function deleteQuestion(id) {
    return await apiFetch(`/pytania/${id}`, { method: 'DELETE' }, 'quiz');
}


export async function getAllAnswers() {
    return await apiFetch('/odpowiedzi', { method: 'GET' }, 'quiz');
}

export async function getAnswerById(id) {
    return await apiFetch(`/odpowiedzi/${id}`, { method: 'GET' }, 'quiz');
}

export async function getAnswersByQuestion(questionId) {
    return await apiFetch(`/odpowiedzi/pytanie/${questionId}`, { method: 'GET' }, 'quiz');
}

export async function createAnswer(answerData) {
    return await apiFetch('/odpowiedzi', {
        method: 'POST',
        body: answerData
    }, 'quiz');
}

export async function updateAnswer(id, answerData) {
    return await apiFetch(`/odpowiedzi/${id}`, {
        method: 'PUT',
        body: answerData
    }, 'quiz');
}

export async function deleteAnswer(id) {
    return await apiFetch(`/odpowiedzi/${id}`, { method: 'DELETE' }, 'quiz');
}


export async function getAllQuizResults() {
    return await apiFetch('/wyniki-quizu', { method: 'GET' }, 'quiz');
}

export async function getQuizResultById(id) {
    return await apiFetch(`/wyniki-quizu/${id}`, { method: 'GET' }, 'quiz');
}

export async function getQuizResultsByStudent(studentId) {
    return await apiFetch(`/wyniki-quizu/uczen/${studentId}`, { method: 'GET' }, 'quiz');
}

export async function getQuizResultsByQuiz(quizId) {
    return await apiFetch(`/wyniki-quizu/quiz/${quizId}`, { method: 'GET' }, 'quiz');
}

export async function createQuizResult(resultData) {
    return await apiFetch('/wyniki-quizu', {
        method: 'POST',
        body: resultData
    }, 'quiz');
}

export async function updateQuizResult(id, resultData) {
    return await apiFetch(`/wyniki-quizu/${id}`, {
        method: 'PUT',
        body: resultData
    }, 'quiz');
}

export async function deleteQuizResult(id) {
    return await apiFetch(`/wyniki-quizu/${id}`, { method: 'DELETE' }, 'quiz');
}
