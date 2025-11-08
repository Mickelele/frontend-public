'use client';
import CourseList from '../components/CourseList';

export default function HomePage() {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Lista kursów</h1>
            <CourseList />
        </div>
    );
}
