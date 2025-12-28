import React, { useState } from 'react';
import { Course, Unit, Lesson } from '../types';
import { generateUnitContent } from '../geminiService';

interface CourseViewerProps {
  course: Course;
  onExit: () => void;
  onUpdateCourse: (updated: Course) => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onExit, onUpdateCourse }) => {
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [isBuildingUnit, setIsBuildingUnit] = useState(false);

  const units = course.units || [];
  const currentUnit = units[activeUnitIdx];
  const lessons = currentUnit?.lessons || [];
  const currentLesson = lessons[activeLessonIdx];

  const handleBuildUnit = async (idx: number) => {
    const unitToBuild = units[idx];
    if (!unitToBuild || isBuildingUnit) return;
    setIsBuildingUnit(true);
    try {
      const generatedLessons = await generateUnitContent(unitToBuild, "Ingeniería Superior");
      const updatedUnits = [...units];
      updatedUnits[idx] = { ...unitToBuild, lessons: generatedLessons };
      onUpdateCourse({ ...course, units: updatedUnits });
      setActiveLessonIdx(0);
    } catch (e: any) {
      alert(`Error de Conexión IA:\n${e.message || "Ocurrió un error inesperado."}`);
    } finally {
      setIsBuildingUnit(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(course, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Respaldo_${course.title}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const html = generateExportHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Aula_${course.title}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const generateExportHtml = () => {
    const courseData = JSON.stringify(course);
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aula Virtual: ${course.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; }
        .glass { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
    </style>
</head>
<body class="flex flex-col lg:flex-row h-screen overflow-hidden">
    <aside class="w-full lg:w-80 bg-slate-950 border-r border-white/5 flex flex-col h-screen shrink-0">
        <div class="p-6 bg-slate-900 border-b border-white/10">
            <h1 class="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">TecNM Nodo</h1>
            <h2 class="text-sm font-black text-white leading-tight uppercase tracking-tighter truncate">${course.title}</h2>
        </div>
        <nav id="nav" class="flex-1 overflow-y-auto p-4 space-y-4"></nav>
        <div class="p-6 bg-slate-950 border-t border-white/10">
            <div class="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <p class="text-[9px] font-black text-cyan-500 uppercase">Puntaje Acumulado</p>
                <p id="total-score" class="text-xl font-black text-white mt-1">0 / 100 pts</p>
            </div>
        </div>
    </aside>

    <main class="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-950">
        <div id="content" class="max-w-3xl mx-auto pb-20"></div>
    </main>

    <script>
        const course = ${courseData};
        let activeU = 0; let activeL = 0;
        let grades = {}; 

        function renderNav() {
            const nav = document.getElementById('nav');
            nav.innerHTML = course.units.map((u, ui) => \`
                <div class="space-y-1">
                    <p class="text-[8px] font-black text-slate-500 uppercase px-2 tracking-widest">Unidad 0\${ui+1}</p>
                    \${u.lessons.map((l, li) => \`
                        <button onclick="navTo(\${ui},\${li})" class="w-full text-left p-3 rounded-xl text-[10px] font-bold transition-all \${activeU==ui && activeL==li ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-white/5'}">
                            \${grades[\`\${ui}-\${li}\`] ? '✓ ' : ''}\${l.title}
                        </button>
                    \`).join('')}
                </div>
            \`).join('');
        }

        function renderContent() {
            const unit = course.units[activeU];
            const lesson = unit ? unit.lessons[activeL] : null;
            const content = document.getElementById('content');
            
            if(!lesson) { 
              content.innerHTML = '<div class="text-center py-20 text-slate-500 uppercase font-black text-[10px]">Sin contenido disponible</div>'; 
              return; 
            }

            content.innerHTML = \`
                <div class="animate-in fade-in duration-500">
                    <header class="mb-12 border-b border-white/5 pb-8">
                        <span class="text-cyan-500 font-black text-[9px] uppercase mb-2 block tracking-widest">Lección Académica</span>
                        <h2 class="text-3xl font-black text-white mb-6">\${lesson.title}</h2>
                    </header>
                    <div class="space-y-8">
                        \${lesson.blocks.map(b => \`
                            <div class="glass p-8 rounded-[32px]">
                                <div class="flex justify-between items-center mb-6">
                                    <h4 class="text-[10px] font-black text-cyan-400 uppercase tracking-widest">\${b.title}</h4>
                                    \${b.weight ? \`<span class="bg-violet-500/20 text-violet-400 px-3 py-1 rounded-lg text-[8px] font-black uppercase">Valor: \${b.weight}%</span>\` : ''}
                                </div>
                                <div class="text-slate-300 leading-relaxed mb-8 text-sm whitespace-pre-line">\${b.content}</div>
                                
                                \${b.type === 'activity' ? \`
                                    <div class="p-6 bg-slate-950/50 rounded-2xl border border-white/5 mt-8">
                                        <p class="text-[9px] font-black text-slate-500 uppercase mb-4">Rúbrica de Evaluación</p>
                                        <div class="space-y-3 mb-6">
                                            \${b.rubric.map(r => \`
                                                <div class="flex gap-4 border-b border-white/5 pb-2">
                                                    <span class="text-cyan-500 font-black text-[10px]">\${r.points}pts</span>
                                                    <div><p class="text-[10px] font-bold text-white uppercase">\${r.criterion}</p><p class="text-[9px] text-slate-500">\${r.description}</p></div>
                                                </div>
                                            \`).join('')}
                                        </div>
                                        <textarea id="task-\${activeU}-\${activeL}" class="w-full p-4 bg-slate-900 border border-white/5 rounded-xl text-white text-xs min-h-[100px] mb-4 outline-none focus:border-cyan-500" placeholder="Escribe tu respuesta aquí..."></textarea>
                                        <button onclick="submitTask(\${b.weight})" class="w-full py-4 bg-cyan-500 text-slate-950 rounded-xl font-black uppercase text-[10px]">Entregar Actividad</button>
                                    </div>
                                \` : ''}
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
        }

        function navTo(u, l) { activeU = u; activeL = l; renderNav(); renderContent(); }
        
        function submitTask(w) { 
            const key = \`\${activeU}-\${activeL}\`;
            grades[key] = w; 
            alert('¡Actividad entregada con éxito!');
            renderNav(); 
            updateScore();
        }

        function updateScore() {
            let total = 0;
            for(let key in grades) total += grades[key];
            document.getElementById('total-score').innerText = total + ' / 100 pts';
        }

        renderNav();
        renderContent();
    </script>
</body>
</html>`;
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col lg:flex-row h-screen overflow-hidden">
      <aside className="w-full lg:w-96 bg-slate-950 border-r border-white/5 flex flex-col h-screen shrink-0 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-slate-900/50">
          <button onClick={onExit} className="text-[9px] font-black text-cyan-500 uppercase mb-4 hover:text-white transition-colors">← Salir a Biblioteca</button>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter truncate">{course.title}</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {units.map((unit, uIdx) => (
            <div key={uIdx} className={`rounded-2xl border p-3 transition-all ${activeUnitIdx === uIdx ? 'bg-white/5 border-white/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <button onClick={() => { setActiveUnitIdx(uIdx); setActiveLessonIdx(0); }} className="w-full text-left">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Unidad 0{uIdx + 1}</p>
                    {unit.lessons.length === 0 && <span className="text-[7px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">VACÍA</span>}
                </div>
                <p className={`text-[11px] font-bold leading-tight ${activeUnitIdx === uIdx ? 'text-cyan-400' : 'text-slate-400'}`}>{unit.title}</p>
              </button>
              
              {activeUnitIdx === uIdx && (
                <div className="mt-3 space-y-1">
                  {unit.lessons.length > 0 ? (
                    unit.lessons.map((l, lIdx) => (
                      <button key={lIdx} onClick={() => setActiveLessonIdx(lIdx)} className={`w-full text-left p-2 rounded-lg text-[10px] font-medium transition-all ${activeLessonIdx === lIdx ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                        {l.title}
                      </button>
                    ))
                  ) : (
                    <p className="text-[9px] text-slate-600 italic px-2">Haz clic en "Construir Unidad" abajo.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-white/10 space-y-2">
          <button 
            onClick={() => handleBuildUnit(activeUnitIdx)} 
            disabled={isBuildingUnit} 
            className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                isBuildingUnit ? 'bg-slate-900 border-white/5 text-slate-600' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
            }`}
          >
            {isBuildingUnit ? '⚙️ Generando Contenido...' : '🔨 Construir Unidad Seleccionada'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleExportJson} className="py-4 bg-slate-900 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] hover:bg-slate-800">Guardar .JSON</button>
            <button onClick={handleDownload} className="py-4 bg-white text-slate-950 rounded-xl font-black uppercase text-[10px] hover:shadow-lg transition-all">Exportar Aula</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 h-full custom-scrollbar bg-slate-950">
        <div className="max-w-3xl mx-auto">
          {currentLesson ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-12 border-b border-white/5 pb-10">
                <span className="text-cyan-500 font-black text-[9px] uppercase tracking-[0.3em] mb-2 block">Lección Académica</span>
                <h1 className="text-4xl font-black text-white mb-6 leading-tight">{currentLesson.title}</h1>
                <div className="p-5 bg-cyan-500/5 border border-cyan-500/10 rounded-[32px]">
                    <p className="text-[10px] font-black text-cyan-500 uppercase mb-1">Competencia de la Unidad:</p>
                    <p className="text-sm text-slate-300 font-medium italic leading-relaxed">{currentUnit.summary}</p>
                </div>
              </header>

              <div className="space-y-10">
                {currentLesson.blocks.map((block, bIdx) => (
                  <div key={bIdx} className="p-8 bg-slate-900/40 border border-white/5 rounded-[40px] hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{block.title}</h4>
                      {block.weight ? <span className="bg-violet-500/20 text-violet-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Valor: {block.weight}% de la Unidad</span> : null}
                    </div>
                    <div className="text-slate-300 leading-relaxed text-sm mb-6 whitespace-pre-line">{block.content}</div>
                    
                    {block.rubric && block.rubric.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Rúbrica de Evaluación:</p>
                        <div className="space-y-3">
                          {block.rubric.map((r, i) => (
                            <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all">
                              <span className="text-cyan-500 font-black text-xs shrink-0">{r.points}pts</span>
                              <div>
                                <p className="font-bold text-white text-[11px] uppercase mb-1">{r.criterion}</p>
                                <p className="text-slate-500 text-[10px] leading-tight">{r.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 bg-slate-900/40 rounded-[60px] border border-white/5 text-center px-10">
              <div className="w-20 h-20 bg-cyan-500/10 text-cyan-500 rounded-3xl flex items-center justify-center text-3xl mb-8">🛠️</div>
              <h2 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter">Módulo en Preparación</h2>
              <p className="text-slate-400 text-sm max-w-sm mb-10 leading-relaxed">
                Esta unidad aún no tiene lecciones desarrolladas. Haz clic en el botón azul de la izquierda para que la IA diseñe el contenido, actividades y rúbricas.
              </p>
              {isBuildingUnit && (
                 <div className="flex items-center gap-3 text-cyan-500 font-black text-[10px] uppercase animate-pulse">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    Procesando con Ingeniería Instruccional...
                 </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseViewer;