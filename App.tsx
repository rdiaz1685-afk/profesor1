
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, Course, TeacherProfile } from './types';
import { generateCourseSkeleton } from './geminiService';
import CourseForm from './components/CourseForm';
import CourseViewer from './components/CourseViewer';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [appKey, setAppKey] = useState(0); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => {
    try {
      const session = localStorage.getItem('profesoria_teacher_session');
      return session ? JSON.parse(session) : null;
    } catch { return null; }
  });

  const [savedCourses, setSavedCourses] = useState<Course[]>(() => {
    try {
      const library = localStorage.getItem('profesoria_library');
      return library ? JSON.parse(library) : [];
    } catch { return []; }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (teacher) {
      localStorage.setItem('profesoria_library', JSON.stringify(savedCourses));
    }
  }, [savedCourses, teacher]);

  const handleLogin = (id: string) => {
    if (!id.trim()) return;
    const profile: TeacherProfile = { 
      id: id.toUpperCase(), 
      name: id, 
      role: 'admin', 
      joinedAt: Date.now() 
    };
    setTeacher(profile);
    localStorage.setItem('profesoria_teacher_session', JSON.stringify(profile));
  };

  const executeLogout = () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    localStorage.removeItem('profesoria_teacher_session');
    setTimeout(() => {
      setTeacher(null);
      setCurrentCourse(null);
      setShowForm(false);
      setIsLoggingOut(false);
      setAppKey(prev => prev + 1);
    }, 1500);
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCourse = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    downloadJson(course, `Curso_${course.title.replace(/\s+/g, '_')}`);
  };

  const handleExportLibrary = () => {
    downloadJson(savedCourses, `Biblioteca_ProfesorIA_${teacher?.id || 'Docente'}`);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setSavedCourses(prev => [...imported, ...prev]);
        } else if (imported.title && imported.units) {
          const newCourse = { ...imported, id: `imported_${Date.now()}` };
          setSavedCourses(prev => [newCourse, ...prev]);
        } else {
          throw new Error("Formato incompatible.");
        }
        
        const toast = document.createElement('div');
        toast.className = "fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest z-[10000] animate-bounce shadow-2xl";
        toast.innerText = "✓ Datos recuperados con éxito";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } catch (err: any) {
        setError("Error al leer el respaldo: " + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
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
      setError(err.message);
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleUpdateCourse = (updated: Course) => {
    setSavedCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
    setCurrentCourse(updated);
  };

  return (
    <div key={appKey} className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[11000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center text-2xl mb-6 mx-auto">⚠️</div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">¿Cerrar Sesión?</h2>
            <p className="text-slate-400 text-xs mb-8 leading-relaxed">Se cerrará la conexión con el nodo y volverás a la pantalla de acceso.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={executeLogout} className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Sí, Salir</button>
            </div>
          </div>
        </div>
      )}

      {isLoggingOut && (
        <div className="fixed inset-0 z-[12000] bg-[#020617] flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
           <h2 className="text-white font-black text-xl uppercase tracking-widest">Desconectando</h2>
           <p className="text-slate-500 font-bold uppercase text-[9px] mt-2 tracking-[0.3em]">Cerrando canales de datos...</p>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/30 p-10 rounded-[40px] max-w-md w-full text-center shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4 uppercase tracking-tighter">Fallo de Nodo</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
            <button onClick={() => setError(null)} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Continuar</button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[8888] bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Diseñando Aula Virtual</h2>
          <p className="text-cyan-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Consultando Red Neuronal TecNM...</p>
        </div>
      )}

      {!teacher ? (
        <div className="h-screen flex items-center justify-center p-6 bg-[#020617] animate-in fade-in duration-500">
           <div className="bg-slate-900/50 p-12 rounded-[60px] border border-white/5 max-w-sm w-full shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 text-slate-950 mx-auto shadow-lg shadow-cyan-500/20">P</div>
              <h1 className="text-2xl font-black text-center text-white uppercase tracking-tighter mb-10">Profesor IA</h1>
              <div className="space-y-4">
                <input 
                  className="w-full p-5 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-cyan-500 text-center font-bold tracking-widest transition-all" 
                  placeholder="ID DOCENTE" 
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginInput)}
                />
                <button 
                  onClick={() => handleLogin(loginInput)} 
                  className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-cyan-400 transition-all shadow-xl active:scale-95"
                >
                  Entrar al Nodo
                </button>
              </div>
           </div>
        </div>
      ) : currentCourse ? (
        <CourseViewer course={currentCourse} onExit={() => setCurrentCourse(null)} onUpdateCourse={handleUpdateCourse} />
      ) : (
        <div className="max-w-6xl mx-auto w-full px-6 py-16 flex-1 overflow-y-auto animate-in fade-in duration-500">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
            <div className="animate-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                  <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">Online: {teacher.id}</span>
                </div>
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-[9px] font-black text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-all">[</span> Cerrar Sesión <span className="opacity-0 group-hover:opacity-100 transition-all">]</span>
                </button>
              </div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Biblioteca</h1>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">TecNM Digital Campus</p>
            </div>
            
            <div className="flex flex-wrap gap-4 animate-in slide-in-from-right-4 duration-500">
               <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
               <button 
                 onClick={() => fileInputRef.current?.click()} 
                 className="px-6 py-4 bg-slate-800 text-slate-300 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-700 transition-all"
               >
                 📂 Cargar
               </button>
               <button 
                 onClick={handleExportLibrary}
                 className="px-6 py-4 bg-slate-800 text-slate-300 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-700 transition-all"
               >
                 📥 Exportar Todo
               </button>
               <button 
                 onClick={() => setShowForm(true)} 
                 className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-cyan-500/10"
               >
                 + Nuevo Curso
               </button>
            </div>
          </header>

          {showForm ? (
            <div className="animate-in fade-in slide-in-from-top-6 duration-700 pb-32">
              <button onClick={() => setShowForm(false)} className="mb-10 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors flex items-center gap-2">
                <span className="text-xl">←</span> Volver a Biblioteca
              </button>
              <CourseForm onSubmit={handleGenerate} isLoading={isGenerating} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {savedCourses.length === 0 ? (
                <div className="col-span-full py-40 bg-slate-900/20 rounded-[60px] border border-dashed border-white/5 flex flex-col items-center justify-center text-center animate-pulse">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-3xl mb-8 opacity-20">📚</div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Tu Biblioteca está Vacía</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">Crea un curso nuevo o carga un respaldo .json</p>
                </div>
              ) : (
                savedCourses.map((c, idx) => (
                  <div 
                    key={c.id} 
                    onClick={() => setCurrentCourse(c)} 
                    className="bg-slate-900/40 p-10 rounded-[50px] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all hover:scale-[1.03] group shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl rounded-full"></div>
                    <div className="flex justify-between items-start mb-4">
                       <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">ID: {c.subjectCode || 'TEC-GEN'}</p>
                       <button 
                         onClick={(e) => handleExportCourse(e, c)}
                         className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 transition-all"
                         title="Exportar Curso"
                       >
                         📥
                       </button>
                    </div>
                    <h3 className="font-black text-white text-2xl mb-8 line-clamp-3 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors leading-none">{c.title}</h3>
                    <div className="flex justify-between items-center pt-8 border-t border-white/5">
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Entrar al Aula</div>
                      <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-xs group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">→</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
