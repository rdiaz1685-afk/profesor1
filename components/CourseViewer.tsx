
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Course, LessonBlock, AuthorizedStudent, StudentSubmission } from '../types';
import { generateUnitContent } from '../geminiService';
import LessonContent from './LessonContent';
import UnitPortfolio from './UnitPortfolio';
import DidacticInstrumentationView from './DidacticInstrumentationView';

interface CourseViewerProps {
  course: Course;
  onExit: () => void;
  onUpdateCourse: (updated: Course) => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onExit, onUpdateCourse }) => {
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'study' | 'portfolio' | 'instrumentation'>('study');
  const [isBuildingUnit, setIsBuildingUnit] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [loadTimer, setLoadTimer] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const timerRef = useRef<any>(null);

  const units = course.units || [];
  const currentUnit = units[activeUnitIdx] || units[0];
  const lessons = currentUnit?.lessons || [];
  const currentLesson = lessons[activeLessonIdx];

  const hasGenerationError = lessons.some(l => l.title === "Error de Generación");

  useEffect(() => {
    if (isBuildingUnit) {
      setLoadTimer(0);
      timerRef.current = setInterval(() => setLoadTimer(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isBuildingUnit]);

  const unitActivities = useMemo(() => {
    const activities: {lessonTitle: string, block: LessonBlock, blockIdx: number}[] = [];
    if (!currentUnit?.lessons) return [];
    currentUnit.lessons.forEach((lesson) => {
      lesson.blocks?.forEach((block, bIdx) => {
        if (block.type === 'activity') activities.push({ lessonTitle: lesson.title, block, blockIdx: bIdx });
      });
    });
    return activities;
  }, [currentUnit]);

  const handleBuildUnit = useCallback(async (idx: number) => {
    const unitToBuild = units[idx];
    if (!unitToBuild || isBuildingUnit) return;
    
    setIsBuildingUnit(true);
    setBuildStatus(`DISEÑANDO: ${unitToBuild.title.toUpperCase()}...`);
    setIsMobileMenuOpen(false);
    
    try {
      const generatedLessons = await generateUnitContent(unitToBuild, "Ingeniería Superior");
      const updatedUnits = [...units];
      updatedUnits[idx] = { ...unitToBuild, lessons: generatedLessons };
      
      setActiveLessonIdx(0);
      setViewMode('study');
      onUpdateCourse({ ...course, units: updatedUnits });
    } catch (e) {
      alert("Error de red o de la IA de Google. Reintenta por favor.");
    } finally {
      setIsBuildingUnit(false);
      setBuildStatus("");
    }
  }, [units, course, onUpdateCourse, isBuildingUnit]);

  const handleUpdateRoster = (roster: AuthorizedStudent[]) => {
    onUpdateCourse({ ...course, studentList: roster });
  };

  const handleUpdateGrades = (grades: StudentSubmission[]) => {
    onUpdateCourse({ ...course, masterGrades: grades });
  };

  const exportStudentHtml = () => {
    const hasContent = course.units.some(u => u.lessons?.length > 0 && u.lessons[0].title !== "Error de Generación");
    if (!hasContent) return alert("Diseña al menos una unidad para poder exportar.");

    const blob = new Blob([generateHtmlTemplate(course)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aula_Alumno_${course.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b border-white/5 bg-slate-900/40">
        <button onClick={onExit} className="text-[10px] font-black text-cyan-500 uppercase mb-4 hover:text-white transition-colors">← SALIR AL MENÚ</button>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2">{course.title}</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={() => { setViewMode('instrumentation'); setIsMobileMenuOpen(false); }} 
            className={`flex flex-col items-center justify-center py-5 px-2 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 ${
              viewMode === 'instrumentation' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-white/5 bg-slate-900'
            }`}
          >
            <span className="text-xl mb-2">📄</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${viewMode === 'instrumentation' ? 'text-amber-500' : 'text-slate-500'}`}>Instrumentación</span>
          </button>
          <button 
            onClick={() => { setViewMode('portfolio'); setIsMobileMenuOpen(false); }} 
            className={`flex flex-col items-center justify-center py-5 px-2 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 ${
              viewMode === 'portfolio' ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-white/5 bg-slate-900'
            }`}
          >
            <span className="text-xl mb-2">📥</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${viewMode === 'portfolio' ? 'text-cyan-400' : 'text-slate-500'}`}>Portafolio</span>
          </button>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <p className="px-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Contenido del Curso</p>
          {units.map((unit, uIdx) => (
            <div key={unit.id} className="space-y-1">
              <button 
                onClick={() => { setActiveUnitIdx(uIdx); setViewMode('study'); setActiveLessonIdx(0); setIsMobileMenuOpen(false); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  activeUnitIdx === uIdx && viewMode === 'study' ? 'bg-white/5 border-white/20' : 'border-transparent opacity-50 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter line-clamp-2">{unit.title}</p>
              </button>
              {activeUnitIdx === uIdx && viewMode === 'study' && unit.lessons?.length > 0 && unit.lessons[0].title !== "Error de Generación" && (
                <div className="ml-4 space-y-1 border-l border-white/10 pl-4 py-1 animate-in slide-in-from-left-2 duration-300">
                  {unit.lessons.map((l, lIdx) => (
                    <button key={l.id} onClick={() => { setActiveLessonIdx(lIdx); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2 rounded-lg text-[9px] font-black uppercase transition-colors ${activeLessonIdx === lIdx ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                      {l.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="p-6 bg-slate-950 border-t border-white/10 space-y-3">
        <button onClick={exportStudentHtml} className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg active:scale-95">
          GENERAR AULA ALUMNO
        </button>
        <button onClick={() => handleBuildUnit(activeUnitIdx)} disabled={isBuildingUnit}
          className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${hasGenerationError ? 'bg-amber-600 text-white' : 'bg-cyan-500 text-slate-950'} disabled:opacity-50`}>
          {isBuildingUnit ? 'DISEÑANDO...' : (hasGenerationError ? 'REINTENTAR DISEÑO' : 'DISEÑAR ESTA UNIDAD')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden animate-in fade-in duration-300 relative">
      
      {/* Sidebar de Escritorio (Visible solo en tablets y desktops) */}
      <aside className={`hidden md:flex w-80 bg-slate-950 border-r border-white/5 flex-col h-full z-30 shadow-2xl shrink-0 ${isBuildingUnit ? 'opacity-30 pointer-events-none' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Menú Lateral Móvil (Overlay) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-[85%] max-w-sm bg-slate-950 h-full flex flex-col shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-300">
             <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white font-bold z-50"
             >✕</button>
             <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950 custom-scrollbar relative">
        
        {/* Mobile Header / Navbar (Visible solo en móviles) */}
        <div className="md:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-cyan-500 font-black text-[10px] uppercase tracking-widest"
          >
            <span>☰</span> MENÚ
          </button>
          <div className="text-center truncate px-2">
             <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{course.subjectCode || 'TEC'}</p>
             <h2 className="text-[9px] font-black text-white uppercase truncate max-w-[100px]">{course.title}</h2>
          </div>
          <button onClick={onExit} className="text-slate-500 font-black text-[9px] uppercase px-2">SALIR</button>
        </div>

        <div className="p-6 md:p-10 lg:p-20 max-w-5xl mx-auto w-full">
          {viewMode === 'instrumentation' ? (
            <DidacticInstrumentationView course={course} />
          ) : isBuildingUnit ? (
            <div className="py-20 md:py-40 text-center animate-in fade-in duration-500">
               <div className="spinner mb-10"></div>
               <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">{buildStatus}</h2>
               <div className="space-y-4">
                 <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                   Procesando: {loadTimer}s
                 </p>
               </div>
            </div>
          ) : viewMode === 'portfolio' ? (
            <UnitPortfolio 
              unitTitle={currentUnit.title} 
              activities={unitActivities} 
              studentList={course.studentList || []}
              masterGrades={course.masterGrades || []}
              onUpdateRoster={handleUpdateRoster}
              onUpdateGrades={handleUpdateGrades}
            />
          ) : lessons.length > 0 ? (
            <LessonContent 
              key={`${currentUnit.id}-${activeLessonIdx}`}
              lesson={currentLesson || lessons[0]}
              unitTitle={currentUnit.title}
              totalActivitiesInUnit={unitActivities.length}
              isCompleted={completedLessons.has(currentLesson?.id || '')}
              onToggleComplete={() => {
                const newC = new Set(completedLessons);
                if (currentLesson) {
                  newC.has(currentLesson.id) ? newC.delete(currentLesson.id) : newC.add(currentLesson.id);
                  setCompletedLessons(newC);
                }
              }}
              onGradeUpdate={() => {}}
            />
          ) : (
            <div className="py-20 md:py-40 text-center bg-slate-900/20 rounded-[30px] md:rounded-[50px] border border-white/5 px-6">
               <div className="text-5xl mb-10 opacity-30">🏗️</div>
               <h2 className="text-xl md:text-2xl font-black text-white uppercase mb-4 tracking-tighter">Unidad Vacía</h2>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">Haz clic en "Diseñar esta unidad" para generar el contenido técnico.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function generateHtmlTemplate(course: Course) {
  return `
<!DOCTYPE html>
<html lang="es" translate="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google" content="notranslate">
    <title>AULA: ${course.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body { background: #020617; color: #f8fafc; font-family: 'Inter', sans-serif; height: 100vh; overflow: hidden; margin: 0; }
        .card { background: #1e293b; border-radius: 2rem; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden; }
        @media (min-width: 768px) { .card { padding: 2.5rem; border-radius: 2.5rem; } }
        .weight-badge { position: absolute; top: 0; right: 0; background: #06b6d4; color: #020617; padding: 0.5rem 1.2rem; font-size: 0.6rem; font-weight: 900; border-bottom-left-radius: 1.2rem; text-transform: uppercase; letter-spacing: 0.1rem; z-index: 10; }
        .weight-badge.test { background: #f59e0b; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        
        .option-btn { width: 100%; text-align: left; padding: 1rem; border-radius: 1rem; border: 2px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); transition: all 0.3s; font-weight: 700; margin-bottom: 0.6rem; color: #94a3b8; font-size: 0.8rem; }
        @media (min-width: 768px) { .option-btn { padding: 1.2rem; font-size: 0.9rem; } }
        .option-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .option-btn.correct { background: #064e3b; border-color: #10b981; color: #10b981; }
        .option-btn.wrong { background: #450a0a; border-color: #ef4444; color: #ef4444; }
        
        .input-field { width: 100%; background: #0f172a; border: 2px solid rgba(255,255,255,0.05); border-radius: 0.8rem; padding: 0.8rem; color: white; outline: none; transition: all 0.3s; font-size: 0.85rem; }
        .label-style { font-size: 0.55rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15rem; color: #64748b; margin-bottom: 0.5rem; display: block; }
        
        .final-btn { width: 100%; padding: 1.2rem; border-radius: 1.2rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2rem; font-size: 0.6rem; transition: all 0.4s; }
        @media (min-width: 768px) { .final-btn { padding: 1.8rem; font-size: 0.7rem; border-radius: 2rem; } }
        .final-btn.pending { background: white; color: #020617; shadow: 0 10px 30px rgba(255,255,255,0.1); }
        .final-btn.completed { background: #10b981; color: #020617; }
        
        .mobile-menu-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 100; display: none; }
        .mobile-menu-overlay.active { display: block; }
        .mobile-nav { position: fixed; left: 0; top: 0; height: 100%; width: 85%; max-width: 300px; background: #020617; z-index: 101; transform: translateX(-100%); transition: transform 0.3s; padding: 1.5rem; border-right: 1px solid rgba(255,255,255,0.05); }
        .mobile-nav.active { transform: translateX(0); }
        
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
    </style>
</head>
<body class="flex h-screen overflow-hidden">
    <div id="mobile-overlay" class="mobile-menu-overlay" onclick="toggleMenu()"></div>
    <aside id="mobile-nav" class="mobile-nav flex flex-col">
        <div class="mb-8 flex justify-between items-start">
            <div class="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm">A</div>
            <button onclick="toggleMenu()" class="text-white/50 text-xl">✕</button>
        </div>
        <h1 class="text-base font-black uppercase tracking-tighter leading-tight text-white mb-6 line-clamp-2">${course.title}</h1>
        <nav id="nav-mobile" class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar"></nav>
    </aside>

    <aside class="hidden md:flex w-72 border-r border-white/5 p-6 flex-col bg-slate-950 shrink-0 shadow-2xl z-50">
        <div class="mb-10">
          <div class="w-10 h-10 bg-cyan-500 rounded-xl mb-4 flex items-center justify-center font-black text-slate-950 text-sm">A</div>
          <h1 class="text-base font-black uppercase tracking-tighter leading-tight text-white line-clamp-2">${course.title}</h1>
          <p class="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-2">Plataforma Alumno TecNM</p>
        </div>
        <nav id="nav-desktop" class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar"></nav>
    </aside>
    
    <main id="content" class="flex-1 min-w-0 overflow-y-auto bg-slate-900/10 custom-scrollbar relative">
        <div class="md:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
            <button onclick="toggleMenu()" class="text-cyan-500 font-black text-[9px] uppercase tracking-widest">☰ MENÚ</button>
            <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[150px]">${course.subjectCode || 'TEC'}</span>
        </div>
        <div id="content-inner" class="max-w-3xl mx-auto p-5 md:p-10 lg:p-16"></div>
    </main>

    <script>
        const course = ${JSON.stringify(course)};
        const navD = document.getElementById('nav-desktop');
        const navM = document.getElementById('nav-mobile');
        const inner = document.getElementById('content-inner');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const attachedFiles = {};
        let lessonAnswers = {}; 
        let completedSet = new Set(JSON.parse(localStorage.getItem('completed_lessons') || '[]'));

        function toggleMenu() {
            mobileNav.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
        }

        function updateSidebar() {
            [navD, navM].forEach(nav => {
                if (!nav) return;
                nav.innerHTML = '';
                course.units.forEach((u, uIdx) => {
                    if (!u.lessons || u.lessons.length === 0) return;
                    const container = document.createElement('div');
                    container.className = "mb-6";
                    container.innerHTML = \`<p class="text-[8px] font-black text-cyan-500 uppercase mb-2 tracking-widest opacity-60">UNIDAD \${uIdx + 1}</p>
                                             <p class="text-[9px] font-black text-white uppercase mb-3 leading-tight truncate">\${u.title}</p>\`;
                    u.lessons.forEach((l, lIdx) => {
                        const isDone = completedSet.has(l.id);
                        const btn = document.createElement('button');
                        btn.className = "w-full text-left p-2 text-[9px] font-bold uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-lg mb-1 flex items-center";
                        btn.innerHTML = \`\${isDone ? '<span style="color:#10b981;margin-right:4px">✓</span>' : ''} \${l.title}\`;
                        btn.onclick = () => { showLesson(uIdx, lIdx); if (nav === navM) toggleMenu(); };
                        container.appendChild(btn);
                    });
                    nav.appendChild(container);
                });
            });
        }

        function showLesson(uIdx, lIdx) {
            const lesson = course.units[uIdx].lessons[lIdx];
            inner.innerHTML = \`
                <div class="mb-8 md:mb-12">
                  <span class="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-3 block opacity-60">\${course.units[uIdx].title}</span>
                  <h1 class="text-xl md:text-3xl font-black uppercase text-white tracking-tighter leading-tight">\${lesson.title}</h1>
                </div>
                <div id="lesson-blocks" class="space-y-6 md:space-y-10"></div>
                <div class="mt-12 md:mt-20 pt-10 border-t border-white/5 flex flex-col items-center pb-20">
                    <button id="final-btn" onclick="toggleComplete('\${lesson.id}')" class="final-btn pending">Finalizar Lección</button>
                </div>
            \`;
            
            const blocksContainer = document.getElementById('lesson-blocks');
            if (completedSet.has(lesson.id)) {
                const fb = document.getElementById('final-btn');
                fb.innerText = '✓ COMPLETADA'; fb.className = 'final-btn completed';
            }

            lesson.blocks.forEach((b, bIdx) => {
                const isTest = b.type === 'test';
                const isActivity = b.type === 'activity';
                let html = \`
                    <div class="card">
                        \${b.weight > 0 ? \`<div class="weight-badge \${isTest ? 'test' : ''}">\${b.weight} PTS</div>\` : ''}
                        <h3 class="text-white font-black mb-4 uppercase text-[8px] tracking-widest opacity-50">\${b.title}</h3>
                        <div class="whitespace-pre-line text-slate-300 leading-relaxed text-sm font-medium mb-6">\${b.content}</div>\`;
                if (isTest && b.testQuestions) {
                    b.testQuestions.forEach((q, qIdx) => {
                        html += \`<div class="mt-6 border-t border-white/5 pt-6">
                            <p class="text-white font-bold mb-4 text-sm">\${q.question}</p>
                            \${q.options.map((opt, oIdx) => \`<button class="option-btn" onclick="checkAns(this,\${uIdx},\${lIdx},\${bIdx},\${qIdx},\${oIdx},\${q.correctAnswerIndex},'\${q.feedback.replace(/'/g,"\\\\'")}')">\${opt}</button>\`).join('')}
                        </div>\`;
                    });
                }
                if (isActivity) {
                    html += \`<div class="mt-6 p-6 bg-black/40 rounded-2xl border border-cyan-500/10">
                        <label class="label-style">Respuesta Técnica</label>
                        <textarea id="ans-\${uIdx}-\${lIdx}-\${bIdx}" class="input-field min-h-[120px] mb-4" placeholder="Desarrolla aquí tu solución..."></textarea>
                        <button onclick="alert('Paquete de entrega generado (Simulado)')" class="w-full py-4 bg-cyan-500 text-slate-950 font-black uppercase text-[8px] tracking-widest rounded-xl">Descargar Entrega</button>
                    </div>\`;
                }
                html += '</div>';
                const div = document.createElement('div'); div.innerHTML = html;
                blocksContainer.appendChild(div);
            });
            document.getElementById('content').scrollTo({ top: 0, behavior: 'smooth' });
        }

        window.checkAns = (btn, uIdx, lIdx, bIdx, qIdx, oIdx, cIdx, feed) => {
            const btns = btn.parentNode.querySelectorAll('button');
            btns.forEach((b, i) => {
                b.disabled = true;
                if (i === cIdx) b.classList.add('correct');
                else if (i === oIdx) b.classList.add('wrong');
                else b.style.opacity = '0.3';
            });
        };

        window.toggleComplete = (id) => {
            if (completedSet.has(id)) completedSet.delete(id);
            else completedSet.add(id);
            localStorage.setItem('completed_lessons', JSON.stringify(Array.from(completedSet)));
            updateSidebar(); showLesson(course.units.findIndex(u=>u.lessons.some(l=>l.id===id)), 0);
        };

        updateSidebar();
        if (course.units.length > 0) showLesson(0, 0);
    </script>
</body>
</html>`;
}

export default CourseViewer;
