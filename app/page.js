'use client';

import CourseList from '../components/CourseList';
import TeacherList from '../components/TeacherList';
import CourseCalendar from '../components/CourseCalendar';


export default function HomePage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Lista kursów</h1>
            <CourseList />

            <h1 className="text-3xl font-bold mb-6 mt-10 text-center">Lista nauczycieli</h1>
            <TeacherList />

            <h1 className="text-3xl font-bold mb-6 text-center">Kalendarz kursów</h1>
            <CourseCalendar />
        </div>
    );
}
