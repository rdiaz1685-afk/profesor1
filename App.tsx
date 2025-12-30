import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, Course, TeacherProfile } from './types';
import { generateCourseSkeleton } from './geminiService';
import CourseForm from './components/CourseForm';
import CourseViewer from './components/CourseViewer';

// CONTROL DE VERSIÓN: Cambiar esto cuando hagamos actualizaciones grandes para limpiar caché
const APP_VERSION = '2.2-stable-fix';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 1. LIMPIADOR AUTOMÁTICO DE CACHÉ
  useEffect(() => {
    const storedVersion = localStorage.getItem('profesoria_version');
    if (storedVersion !== APP_VERSION) {
      console.log(`Actualizando de ${storedVersion} a ${APP_VERSION}`);
      // Solo limpiamos la sesión activa, NO las bibliotecas de cursos (para no borrar datos del usuario)
      localStorage.removeItem('profesoria_teacher_session');
      localStorage.setItem('profesoria_version', APP_VERSION);
      
      // Si había una versión previa (no es la primera visita), recargamos para asegurar limpieza
      if (storedVersion) {
        window.location.reload();
      }
    }
  }, []);

  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => {
    try {
      const session = localStorage.getItem('profesoria_teacher_session');
      return session ? JSON.parse(session) : null;
    } catch { return null; }
  });

  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Cargar cursos al iniciar o cambiar maestro
  useEffect(() => {
    if (teacher) {
      try {
        const teacherLibraryKey = `profesoria_library_${teacher.id}`;
        const library = localStorage.getItem(teacherLibraryKey);
        setSavedCourses(library ? JSON.parse(library) : []);
      } catch (e) {
        console.error("Error cargando biblioteca:", e);
        setSavedCourses([]);
      }
    } else {
      setSavedCourses([]);
    }
  }, [teacher]);

  // Guardar cursos cuando cambian
  useEffect(() => {
    if (teacher) {
      const teacherLibraryKey = `profesoria_library_${teacher.id}`;
      try {
        localStorage.setItem(teacherLibraryKey, JSON.stringify(savedCourses));
      } catch (e) {
        console.error("Storage Full or Error:", e);
      }
    }
  }, [savedCourses, teacher]);

  const handleLogin = (id: string) => {
    if (!id.trim()) return;
    const profile: TeacherProfile = { 
      id: id.toUpperCase().trim(), 
      name: id, 
      role: 'teacher', 
      joinedAt: Date.now() 
    };
    setTeacher(profile);
    localStorage.setItem('profesoria_teacher_session', JSON.stringify(profile));
  };

  const executeLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('profesoria_teacher_session');
    setTeacher(null);
    setCurrentCourse(null);
    setShowForm(false);
  };

  const deleteCourse = () => {
    if (courseToDelete) {
      setSavedCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      setCourseToDelete(null);
    }
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
    downloadJson(savedCourses, `Respaldo_Biblioteca_${teacher?.id || 'Docente'}`);
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
      alert("Error generando curso: " + err.message);
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleUpdateCourse = (updated: Course) => {
    setSavedCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
    setCurrentCourse(updated);
  };

  return (
    // FIX CRÍTICO: h-screen overflow-hidden para evitar que la app intente crecer infinitamente
    <div className="h-screen w-full bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[11000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">¿Cerrar Sesión?</h2>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700">Cancelar</button>
              <button onClick={executeLogout} className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 shadow-lg">Sí, Salir</button>
            </div>
          </div>
        </div>
      )}

      {courseToDelete && (
        <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/20 p-10 rounded-[40px] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center text-2xl mb-6 mx-auto">🗑️</div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">¿Eliminar Curso?</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">Esta acción borrará permanentemente el curso de tu biblioteca.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCourseToDelete(null)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={deleteCourse} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {!teacher ? (
        <div className="h-full flex items-center justify-center p-6 bg-[#020617] overflow-y-auto">
           <div className="bg-slate-900/50 p-12 rounded-[60px] border border-white/5 max-w-sm w-full shadow-2xl backdrop-blur-md my-auto">
              <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center text-3xl font-black mb-8 text-slate-950 mx-auto shadow-lg shadow-cyan-500/20">P</div>
              <h1 className="text-2xl font-black text-center text-white uppercase tracking-tighter mb-4">Profesor IA</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase text-center tracking-widest mb-10 leading-relaxed">Ingresa tu ID para cargar tu biblioteca personal</p>
              <div className="space-y-4">
                <input 
                  className="w-full p-5 rounded-2xl bg-black/50 border border-white/10 text-white outline-none focus:border-cyan-500 text-center font-bold tracking-widest" 
                  placeholder="ID DOCENTE (Ej: 057)" 
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginInput)}
                />
                <button 
                  onClick={() => handleLogin(loginInput)} 
                  className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-cyan-400 transition-all shadow-xl"
                >
                  Entrar al Nodo
                </button>
              </div>
           </div>
        </div>
      ) : currentCourse ? (
        // CourseViewer ya maneja su propio h-screen
        <CourseViewer course={currentCourse} onExit={() => setCurrentCourse(null)} onUpdateCourse={handleUpdateCourse} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Fijo */}
          <div className="px-6 py-8 md:py-12 shrink-0">
             <div className="max-w-6xl mx-auto w-full">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Maestro ID: {teacher.id}</span>
                      <button onClick={() => setShowLogoutConfirm(true)} className="text-[9px] font-black text-slate-600 hover:text-red-500 uppercase tracking-widest">Cambiar Maestro / Salir</button>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Mi Biblioteca</h1>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">TecNM Digital Campus</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-slate-800 text-slate-300 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest">📂 Importar</button>
                    <button onClick={handleExportLibrary} className="px-6 py-4 bg-slate-800 text-slate-300 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-widest">📥 Respaldar</button>
                    <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">+ Nueva Materia</button>
                  </div>
                </header>
             </div>
          </div>

          {/* Área de Scroll */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20">
            <div className="max-w-6xl mx-auto w-full">
              {showForm ? (
                <div className="animate-in fade-in slide-in-from-top-6 duration-700 pb-32">
                  <button onClick={() => setShowForm(false)} className="mb-10 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">← Volver a Biblioteca</button>
                  <CourseForm onSubmit={handleGenerate} isLoading={isGenerating} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                  {savedCourses.length === 0 ? (
                    <div className="col-span-full py-40 bg-slate-900/20 rounded-[60px] border border-dashed border-white/5 text-center">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Tu Biblioteca está Vacía</h3>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest">Crea una materia nueva para empezar a diseñar.</p>
                    </div>
                  ) : (
                    savedCourses.map((c, idx) => (
                      <div 
                        key={c.id} 
                        onClick={() => setCurrentCourse(c)} 
                        className="bg-slate-900/40 p-10 rounded-[50px] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all hover:scale-[1.03] group relative overflow-hidden animate-in fade-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">ID: {c.subjectCode || 'TEC-GEN'}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => handleExportCourse(e, c)}
                              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 transition-all"
                              title="Exportar Materia"
                            >📥</button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setCourseToDelete(c); }}
                              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500 text-slate-400 hover:text-white transition-all"
                              title="Borrar de mi lista"
                            >🗑️</button>
                          </div>
                        </div>
                        <h3 className="font-black text-white text-2xl mb-12 line-clamp-3 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors leading-none">{c.title}</h3>
                        <div className="flex justify-between items-center pt-8 border-t border-white/5">
                          <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Entrar a Diseñar</div>
                          <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-xs group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">→</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
