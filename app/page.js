"use client";

import CourseList from '../components/CourseList';
import TeacherList from '../components/TeacherList';
import CourseCalendar from '../components/CourseCalendar';

export default function HomePage() {
    return (
        <main className="w-full bg-gradient-to-br from-orange-50 via-white to-purple-50 min-h-screen overflow-x-hidden">

      
            <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/grafiki/zdj-main-page.jpg"
                        alt="Kursy programowania i matematyki"
                        className="w-full h-full object-cover blur-md brightness-75 scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600/50 via-black/40 to-purple-700/40" />
                </div>

                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-xl">
                        Kursy programowania i{" "}
                        <span className="text-orange-400">matematyki</span>
                        <br className="hidden md:block" />
                        <span className="block min-[800px]:inline">dla </span><span className="text-orange-400">dzieci i młodzieży</span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/90 mb-8 font-medium">
                        Nauka przez praktykę • Zajęcia online i stacjonarne •
                        Od podstaw do zaawansowanych projektów
                    </p>

                    <a
                        href="#courses"
                        className="inline-block px-10 py-4 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-full shadow-2xl font-semibold text-lg hover:scale-105 transition"
                    >
                        Zobacz kursy
                    </a>
                </div>
            </section>

            
            <section className="w-full bg-black py-20">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-14 text-center">
                    {[
                        ['45', 'kursów dla dzieci i młodzieży'],
                        ['14', 'państw na świecie'],
                        ['130 000', 'uczniów'],
                        ['98%', 'zadowolonych uczniów'],
                    ].map(([value, label]) => (
                        <div key={label}>
                            <div className="text-5xl font-extrabold text-orange-400 mb-3">
                                {value}
                            </div>
                            <p className="text-white text-lg">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

           
            <section
                id="teachers"
                className="max-w-6xl mx-auto px-6 py-20"
            >
                <h2 className="text-4xl font-extrabold text-center mb-14 text-orange-600">
                    Poznaj naszą kadrę
                </h2>
                <TeacherList renderCarousel />
            </section>

           
            <section id="courses" className="w-full bg-black py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-extrabold text-center mb-14 text-orange-400">Nasze kursy</h2>
                    <CourseList />
                </div>
            </section>

           
            <section
                id="course-calendar"
                className="max-w-6xl mx-auto px-6 py-20 hidden min-[500px]:block"
            >
                <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-3xl shadow-2xl border border-orange-100">
                    <h3 className="text-4xl font-extrabold mb-12 text-center text-orange-600">
                        Kalendarz kursów
                    </h3>
                    <CourseCalendar />
                </div>
            </section>

            
            <footer className="w-full py-10 bg-gradient-to-r from-orange-600 to-purple-600 text-white text-center">
                <p className="text-sm">
                    © {new Date().getFullYear()} Akademia Programowania. Wszelkie prawa zastrzeżone.
                </p>
            </footer>
        </main>
    );
}
