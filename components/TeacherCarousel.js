import React, { useState } from 'react';

export default function TeacherCarousel({ teachers = [] }) {
    const [start, setStart] = useState(0);
    const visibleCount = 3;
    const centerIdx = Math.floor(visibleCount / 2);
    const teachersCount = teachers.length;
    
    const visibleTeachers = Array.from({ length: visibleCount }, (_, i) => teachers[(start + i) % teachersCount]);

    function handlePrev() {
        setStart((prev) => (prev - 1 + teachersCount) % teachersCount);
    }
    function handleNext() {
        setStart((prev) => (prev + 1) % teachersCount);
    }

    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 w-full">
                <button
                    onClick={handlePrev}
                    className="p-2 rounded-full bg-orange-300 text-orange-700 shadow-xl transition hover:bg-orange-400 text-xl"
                    aria-label="Poprzedni nauczyciel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex justify-center items-center w-full overflow-x-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-2 w-full justify-center items-center transition-all duration-500" style={{ overflow: 'visible' }}>
                        {visibleTeachers.map((teacher, idx) => {
                            const isCenter = idx === centerIdx;
                            return (
                                <div
                                    key={teacher.id_nauczyciela || idx}
                                    className={`flex flex-col items-center shadow-xl ${isCenter ? 'p-4 sm:p-10' : 'p-2 sm:p-4'} rounded-xl sm:rounded-2xl bg-white ${isCenter ? 'scale-110 z-10 border-4 border-orange-400 min-w-[9rem] sm:min-w-[20rem] md:min-w-[24rem]' : 'scale-95 opacity-80 min-w-[6rem] sm:min-w-[14rem] md:min-w-[16rem]'} transition-all duration-500 h-56 sm:h-80 md:h-96 mx-1`}
                                    style={{ boxShadow: isCenter ? '0 8px 32px rgba(255,140,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)' }}
                                >
                                    {teacher.user?.zdjecie && teacher.user.zdjecie.dane ? (
                                        <img
                                            src={`data:image/png;base64,${teacher.user.zdjecie.dane}`}
                                            alt={`${teacher.user.imie} ${teacher.user.nazwisko}`}
                                            className={`rounded-full object-cover ${isCenter ? 'mb-4 sm:mb-6 p-2 sm:p-3 w-24 h-24 sm:w-40 sm:h-40 md:w-48 md:h-48 border-4 border-orange-400' : 'mb-2 sm:mb-4 w-16 h-16 sm:w-24 sm:h-24 border-2 border-orange-200'}`}
                                        />
                                    ) : (
                                        <div className={`rounded-full bg-gray-100 flex items-center justify-center ${isCenter ? 'mb-4 sm:mb-6 p-2 sm:p-3 w-24 h-24 sm:w-40 sm:h-40 md:w-48 md:h-48 border-4 border-orange-400' : 'mb-2 sm:mb-4 w-16 h-16 sm:w-24 sm:h-24 border-2 border-orange-200'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={isCenter ? 'h-12 w-12 sm:h-20 sm:w-20' : 'h-8 w-8 sm:h-12 sm:w-12 text-gray-400'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.61 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className={`text-base sm:text-xl md:text-2xl font-bold text-orange-700 mb-1 ${isCenter ? 'font-extrabold' : ''}`}>{teacher.user?.imie} {teacher.user?.nazwisko}</div>
                                    <div className={`text-xs sm:text-base text-purple-600 font-semibold ${isCenter ? 'mt-1' : ''}`}>{teacher.przedmiot || ''}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <button
                    onClick={handleNext}
                    className="p-2 rounded-full bg-purple-300 text-purple-700 shadow-xl transition hover:bg-purple-400 text-xl"
                    aria-label="Następny nauczyciel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
}
