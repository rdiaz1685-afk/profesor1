import React from 'react';
import { Course } from '../types';

interface SidebarProps {
  course: Course;
  activeUnitId: string;
  activeLessonId: string;
  completedLessons: Set<string>;
  isFinalLocked: boolean;
  onSelectLesson: (unitId: string, lessonId: string) => void;
  onShowFinal: () => void;
  onShowGrades: () => void;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  course, 
  activeUnitId, 
  activeLessonId, 
  completedLessons, 
  isFinalLocked,
  onSelectLesson,
  onShowFinal,
  onShowGrades,
  onCloseMobile
}) => {
  return (
    <aside className="w-85 bg-slate-950 border-r border-white/5 h-screen flex flex-col overflow-hidden shadow-2xl relative z-40">
      <div className="p-8 border-b border-white/5 bg-gradient-to-br from-slate-900 to-slate-950 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cyan-500 text-slate-950 rounded-lg flex items-center justify-center font-black text-xs">T</div>
            <span className="text-[10px] font-black tracking-[0.3em] text-cyan-500/80 uppercase">TecNM Nodo</span>
          </div>
          {/* Indicador de Versión: Si ves esto en Vercel, es que YA se actualizó */}
          <div className="px-2 py-1 bg-white/5 rounded-md border border-white/5">
            <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">v2.1 Stable</span>
          </div>
        </div>
        <h2 className="font-black text-xl text-white leading-tight mb-4 tracking-tighter line-clamp-2">{course.title}</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-8 space-y-8 custom-scrollbar">
        <div className="px-4">
          <button 
            onClick={onShowGrades}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all group"
          >
            <span className="text-xl">📊</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Mi Expediente / Kardex</span>
          </button>
        </div>

        {course.units.map((unit, uIdx) => (
          <div key={unit.id} className="px-4">
            <div className="px-4 mb-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Módulo 0{uIdx + 1}</h3>
              <p className="text-xs font-black text-white/90 leading-snug">{unit.title}</p>
            </div>
            <ul className="space-y-1">
              {unit.lessons.map((lesson, lIdx) => (
                <li key={lesson.id}>
                  <button
                    onClick={() => onSelectLesson(unit.id, lesson.id)}
                    className={`group w-full text-left px-4 py-3 text-[11px] transition-all flex items-center justify-between rounded-xl ${
                      activeLessonId === lesson.id ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                        completedLessons.has(lesson.id) ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-900 border-white/10'
                      }`}>
                        {completedLessons.has(lesson.id) ? '✓' : `${uIdx + 1}.${lIdx + 1}`}
                      </div>
                      <span className="truncate tracking-tight uppercase">{lesson.title}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 bg-slate-900/50">
        <button 
          disabled={isFinalLocked}
          onClick={onShowFinal}
          className={`w-full py-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-3 tracking-widest uppercase transition-all ${
            isFinalLocked 
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
              : 'bg-white text-slate-950 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
          }`}
        >
          {isFinalLocked ? '🔒 Bloqueado' : '🏆 Evaluación Final'}
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;