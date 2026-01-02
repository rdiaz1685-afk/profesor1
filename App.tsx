
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, Course, TeacherProfile } from './types';
import { generateCourseSkeleton } from './geminiService';
import CourseForm from './components/CourseForm';
import CourseViewer from './components/CourseViewer';

const APP_VERSION = '2.9-chrome-fix';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [genTimer, setGenTimer] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => {
    try {
      const session = localStorage.getItem('profesoria_teacher_session');
      return session ? JSON.parse(session) : null;
    } catch { return null; }
  });

  const [savedCourses, setSavedCourses] = useState<Course[]>(() => {
    if (!teacher) return [];
    try {
      const library = localStorage.getItem(`profesoria_library_${teacher.id}`);
      return library ? JSON.parse(library) : [];
    } catch { return []; }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isGenerating) {
      setGenTimer(0);
      timerRef.current = setInterval(() => {
        setGenTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGenerating]);

  useEffect(() => {
    if (teacher) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const teacherLibraryKey = `profesoria_library_${teacher.id}`;
        try {
          localStorage.setItem(teacherLibraryKey, JSON.stringify(savedCourses));
        } catch (e: any) {
          if (e.name === 'QuotaExceededError') {
            alert("⚠️ Memoria llena. Exporta tus materias y limpia el caché.");
          }
        }
      }, 1000);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [savedCourses, teacher]);

  const handleLogin = (id: string) => {
    if (!id.trim()) return;
    const profile: TeacherProfile = { id: id.toUpperCase().trim(), name: id, role: 'teacher', joinedAt: Date.now() };
    setTeacher(profile);
    localStorage.setItem('profesoria_teacher_session', JSON.stringify(profile));
    const library = localStorage.getItem(`profesoria_library_${profile.id}`);
    setSavedCourses(library ? JSON.parse(library) : []);
  };

  const clearBrowserCache = () => {
    if (confirm("¿Limpiar optimizaciones temporales? Tus materias guardadas NO se borrarán, solo se refrescará el motor gráfico.")) {
      // Limpiamos claves que no sean la biblioteca principal
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('profesoria_library_') && key !== 'profesoria_teacher_session') {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  const handleGenerate = async (prefs: UserPreferences) => {
    setIsGenerating(true);
    setError(null);
    try {
      const skeleton = await generateCourseSkeleton(prefs);
      setSavedCourses(prev => [skeleton, ...prev]);
      setCurrentCourse(skeleton);
      setShowForm(false);
    } catch (err: any) { 
      console.error("Error IA:", err);
      alert("Error de conexión con la IA. Intenta de nuevo.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleUpdateCourse = (updated: Course) => {
    setSavedCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
    setCurrentCourse(updated);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) setSavedCourses(prev => [...imported, ...prev]);
        else if (imported.id) setSavedCourses(prev => [imported, ...prev]);
      } catch { alert("Archivo inválido."); }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = JSON.stringify(savedCourses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Biblioteca_TecNM_${teacher?.id}.json`;
    a.click();
  };

  return (
    <div className="h-screen w-full bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden selection:bg-cyan-500/30">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[11000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] max-w-sm w-full text-center">
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">¿Cerrar Sesión?</h2>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={() => { setTeacher(null); setCurrentCourse(null); setShowLogoutConfirm(false); localStorage.removeItem('profesoria_teacher_session'); }} className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Salir</button>
            </div>
          </div>
        </div>
      )}

      {courseToDelete && (
        <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/20 p-10 rounded-[40px] max-w-sm w-full text-center">
            <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tighter">¿Eliminar Materia?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCourseToDelete(null)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={() => { setSavedCourses(prev => prev.filter(c => c.id !== courseToDelete.id)); setCourseToDelete(null); }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {!teacher ? (
        <div className="h-full flex items-center justify-center p-6 bg-[#020617]">
           <div className="bg-slate-900/50 p-12 rounded-[60px] border border-white/5 max-w-sm w-full text-center backdrop-blur-xl">
              <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 text-slate-950 mx-auto shadow-xl">P</div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Profesor IA</h1>
              <input className="w-full p-5 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-cyan-500 text-center font-bold mb-4" placeholder="ID DOCENTE" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginInput)} />
              <button onClick={() => handleLogin(loginInput)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest">Entrar</button>
           </div>
        </div>
      ) : currentCourse ? (
        <CourseViewer key={currentCourse.id} course={currentCourse} onExit={() => setCurrentCourse(null)} onUpdateCourse={handleUpdateCourse} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-12 shrink-0 border-b border-white/5">
             <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">ID: {teacher.id}</span>
                    <button onClick={() => setShowLogoutConfirm(true)} className="text-[9px] font-black text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors">Cerrar Sesión ➔</button>
                  </div>
                  <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Mi Biblioteca</h1>
                </div>
                <div className="flex flex-wrap gap-4">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                  <button onClick={clearBrowserCache} className="px-6 py-4 bg-slate-900/40 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest text-slate-500 hover:text-cyan-400">🔧 Limpiar Caché</button>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest text-slate-400">Importar</button>
                  <button onClick={handleExport} className="px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest text-slate-400">Respaldar</button>
                  <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-500/20 transition-transform active:scale-95">+ Nueva Materia</button>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
            {isGenerating && (
              <div className="sticky top-10 z-[500] max-w-lg mx-auto mb-10">
                <div className="bg-[#1e293b] border border-cyan-500/30 text-white rounded-[30px] p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-lg">
                   <div className="spinner mb-6"></div>
                   <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse text-cyan-400">Sincronizando con Nodo IA...</p>
                   <p className="text-[9px] text-slate-500 font-bold mt-4 uppercase tracking-widest">Procesando: {genTimer}s</p>
                </div>
              </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
              {showForm ? (
                <div className="col-span-full pb-20">
                  <button onClick={() => setShowForm(false)} className="mb-6 px-4 py-2 bg-white/5 rounded-xl text-slate-500 font-black uppercase text-[10px]">← Volver</button>
                  <CourseForm onSubmit={handleGenerate} isLoading={isGenerating} />
                </div>
              ) : savedCourses.length === 0 ? (
                <div className="col-span-full py-40 bg-slate-900/10 rounded-[60px] border-2 border-dashed border-white/5 text-center">
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">No hay materias diseñadas aún</p>
                </div>
              ) : (
                savedCourses.map((c) => (
                  <div key={c.id} onClick={() => setCurrentCourse(c)} className="bg-slate-900/40 p-10 rounded-[50px] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-2 group shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                       <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/5 px-3 py-1 rounded-lg border border-cyan-500/10">{c.subjectCode || 'TEC'}</span>
                       <button onClick={(e) => { e.stopPropagation(); setCourseToDelete(c); }} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-500 text-slate-400 hover:text-white transition-all">🗑️</button>
                    </div>
                    <h3 className="font-black text-white text-2xl mb-12 line-clamp-2 uppercase tracking-tighter leading-tight group-hover:text-cyan-400">{c.title}</h3>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] text-slate-500 font-black uppercase">Activo</span>
                      </div>
                      <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-cyan-500 transition-all">➔</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <footer className="p-6 text-center border-t border-white/5 shrink-0">
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">ProfesorIA Engine v{APP_VERSION} • © 2025</p>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
