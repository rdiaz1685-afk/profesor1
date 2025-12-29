
import React, { useState, useMemo } from 'react';
import { Course, Grade, LessonBlock } from '../types';
import { generateUnitContent } from '../geminiService';
import LessonContent from './LessonContent';
import UnitPortfolio from './UnitPortfolio';

interface CourseViewerProps {
  course: Course;
  onExit: () => void;
  onUpdateCourse: (updated: Course) => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onExit, onUpdateCourse }) => {
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'study' | 'portfolio'>('study');
  const [isBuildingUnit, setIsBuildingUnit] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [grades, setGrades] = useState<Grade[]>([]);

  const units = course.units || [];
  const currentUnit = units[activeUnitIdx] || units[0];
  const lessons = currentUnit?.lessons || [];
  const currentLesson = lessons[activeLessonIdx];

  const unitActivities = useMemo(() => {
    const activities: {lessonTitle: string, block: LessonBlock, blockIdx: number}[] = [];
    if (!currentUnit?.lessons) return [];
    
    currentUnit.lessons.forEach((lesson) => {
      lesson.blocks.forEach((block, bIdx) => {
        const type = (block.type || '').toLowerCase();
        const title = (block.title || "").toLowerCase();
        if (type === 'activity' || title.includes('actividad') || title.includes('cuadro')) {
          activities.push({ lessonTitle: lesson.title, block, blockIdx: bIdx });
        }
      });
    });
    return activities;
  }, [currentUnit]);

  const handleBuildUnit = async (idx: number) => {
    const unitToBuild = units[idx];
    if (!unitToBuild || isBuildingUnit) return;
    
    setIsBuildingUnit(true);
    setBuildStatus(`Sincronizando con Nodo: ${unitToBuild.title}...`);
    
    try {
      const generatedLessons = await generateUnitContent(unitToBuild, "Ingeniería Superior");
      const updatedUnits = [...units];
      updatedUnits[idx] = { ...unitToBuild, lessons: generatedLessons };
      onUpdateCourse({ ...course, units: updatedUnits });
      setActiveLessonIdx(0);
      setViewMode('study');
    } catch (e: any) {
      alert(`Error de Conexión: ${e.message}`);
    } finally {
      setIsBuildingUnit(false);
    }
  };

  const handleExportHTML = () => {
    const courseData = JSON.stringify(course);
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aula Virtual - ${course.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { background-color: #020617; color: white; font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #020617; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .animate-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="h-screen overflow-hidden flex flex-col md:flex-row">
    <div id="player-root" class="w-full h-full flex"></div>

    <script type="module">
        import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
        import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';

        const COURSE_DATA = ${courseData};

        function StudentPlayer() {
            const [activeUnitIdx, setActiveUnitIdx] = useState(0);
            const [activeLessonIdx, setActiveLessonIdx] = useState(0);
            const [responses, setResponses] = useState({});
            const [testAnswers, setTestAnswers] = useState({});
            const [testFeedback, setTestFeedback] = useState({});
            const [completedLessons, setCompletedLessons] = useState(new Set());

            const currentUnit = COURSE_DATA.units[activeUnitIdx];
            const currentLesson = currentUnit?.lessons[activeLessonIdx];

            const toggleComplete = (lessonId) => {
                const newSet = new Set(completedLessons);
                if (newSet.has(lessonId)) newSet.delete(lessonId);
                else newSet.add(lessonId);
                setCompletedLessons(newSet);
            };

            const downloadEvidence = (lesson, block, text) => {
                const studentName = prompt("Introduce tu nombre completo para la evidencia:") || "Alumno_Anonimo";
                const evidence = {
                    studentName,
                    lessonTitle: lesson.title,
                    activityTitle: block.title,
                    content: text,
                    timestamp: new Date().toLocaleString()
                };
                const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`Evidencia_\${studentName.replace(/\\s+/g, '_')}_\${block.title.substring(0,10)}.json\`;
                a.click();
            };

            return React.createElement('div', { className: 'flex w-full h-screen overflow-hidden bg-[#020617]' }, [
                // Sidebar Alumno
                React.createElement('aside', { className: 'w-80 bg-slate-950 border-r border-white/5 flex flex-col h-full shrink-0 shadow-2xl' }, [
                    React.createElement('div', { className: 'p-8 border-b border-white/5 bg-slate-900/40' }, [
                        React.createElement('p', { className: 'text-[9px] font-black text-cyan-500 uppercase mb-2 tracking-widest' }, 'Plataforma del Alumno'),
                        React.createElement('h1', { className: 'text-lg font-black uppercase tracking-tighter leading-tight' }, COURSE_DATA.title)
                    ]),
                    React.createElement('nav', { className: 'flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar' }, 
                        COURSE_DATA.units.map((unit, uIdx) => 
                            React.createElement('div', { key: uIdx, className: 'space-y-2' }, [
                                React.createElement('button', { 
                                    onClick: () => { setActiveUnitIdx(uIdx); setActiveLessonIdx(0); },
                                    className: \`w-full text-left p-4 rounded-2xl transition-all \${activeUnitIdx === uIdx ? 'bg-white/5 border border-white/10' : 'opacity-40 hover:opacity-100'}\`
                                }, React.createElement('p', { className: 'text-xs font-bold' }, unit.title)),
                                activeUnitIdx === uIdx && unit.lessons && unit.lessons.map((l, lIdx) => 
                                    React.createElement('button', {
                                        key: lIdx,
                                        onClick: () => setActiveLessonIdx(lIdx),
                                        className: \`w-full text-left p-3 ml-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between \${activeLessonIdx === lIdx ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-white'}\`
                                    }, [
                                        l.title,
                                        completedLessons.has(l.id) && React.createElement('span', { className: 'text-[10px]' }, '✓')
                                    ])
                                )
                            ])
                        )
                    )
                ]),
                // Contenido Alumno
                React.createElement('main', { className: 'flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-20' }, [
                    currentLesson ? React.createElement('div', { key: currentLesson.id, className: 'max-w-4xl mx-auto space-y-12 pb-40 animate-in' }, [
                        React.createElement('div', { className: 'mb-16' }, [
                            React.createElement('span', { className: 'text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full uppercase border border-cyan-400/20' }, currentUnit.title),
                            React.createElement('h2', { className: 'text-5xl font-black mt-6 uppercase tracking-tighter leading-tight' }, currentLesson.title)
                        ]),
                        currentLesson.blocks.map((block, bIdx) => {
                            const isActivity = block.type === 'activity' || block.title.toLowerCase().includes('actividad');
                            const isTest = block.type === 'test';

                            return React.createElement('div', { key: bIdx, className: \`rounded-[40px] border overflow-hidden transition-all shadow-xl \${isActivity ? 'border-cyan-500/30 bg-slate-900/50' : isTest ? 'border-amber-500/30 bg-slate-900/40' : 'border-white/5 bg-slate-900/20'}\` }, [
                                React.createElement('div', { className: 'px-10 py-5 border-b border-white/5 bg-slate-950/50 flex justify-between items-center' }, [
                                    React.createElement('h3', { className: 'text-[10px] font-black uppercase text-slate-500 tracking-widest' }, block.title),
                                    isActivity ? React.createElement('span', { className: 'text-[9px] text-cyan-400 font-black' }, '● ACTIVIDAD') : 
                                    isTest ? React.createElement('span', { className: 'text-[9px] text-amber-500 font-black' }, '● EVALUACIÓN') : null
                                ]),
                                React.createElement('div', { className: 'p-10 md:p-14' }, [
                                    React.createElement('p', { className: 'text-lg text-slate-300 leading-relaxed whitespace-pre-line mb-8 font-medium' }, block.content),
                                    
                                    // Bloque de Actividad
                                    isActivity && React.createElement('div', { className: 'mt-8 space-y-4' }, [
                                        React.createElement('textarea', { 
                                            placeholder: 'Escribe tu respuesta o reporte aquí...',
                                            className: 'w-full h-48 bg-black/40 border border-white/5 rounded-3xl p-8 text-white outline-none focus:border-cyan-500 transition-all font-medium text-md',
                                            onChange: (e) => setResponses({...responses, [\`\${activeLessonIdx}-\${bIdx}\`]: e.target.value})
                                        }),
                                        React.createElement('button', {
                                            onClick: () => downloadEvidence(currentLesson, block, responses[\`\${activeLessonIdx}-\${bIdx}\`]),
                                            className: 'px-8 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20'
                                        }, 'Descargar Evidencia para Maestro')
                                    ]),

                                    // Bloque de Examen
                                    isTest && block.testQuestions && React.createElement('div', { className: 'mt-10 space-y-12 border-t border-white/5 pt-10' }, 
                                        block.testQuestions.map((q, qIdx) => {
                                            const key = \`\${currentLesson.id}-\${bIdx}-\${qIdx}\`;
                                            const answeredIdx = testAnswers[key];
                                            const isShowingFeedback = testFeedback[key];
                                            const isCorrect = answeredIdx === q.correctAnswerIndex;

                                            return React.createElement('div', { key: qIdx, className: 'space-y-6' }, [
                                                React.createElement('p', { className: 'text-xl font-black text-white uppercase tracking-tighter' }, q.question),
                                                React.createElement('div', { className: 'grid md:grid-cols-2 gap-4' }, 
                                                    q.options.map((opt, oIdx) => {
                                                        const isSelected = answeredIdx === oIdx;
                                                        const isThisCorrect = oIdx === q.correctAnswerIndex;
                                                        let btnClass = "w-full text-left p-6 rounded-3xl border-2 transition-all text-xs font-bold ";
                                                        
                                                        if (isShowingFeedback) {
                                                            if (isThisCorrect) btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                                                            else if (isSelected) btnClass += "bg-red-500/20 border-red-500 text-red-400";
                                                            else btnClass += "bg-slate-900 border-white/5 opacity-30";
                                                        } else {
                                                            btnClass += "bg-white/5 border-white/5 text-slate-400 hover:border-amber-500/50 hover:bg-white/10";
                                                        }

                                                        return React.createElement('button', {
                                                            key: oIdx,
                                                            disabled: isShowingFeedback,
                                                            className: btnClass,
                                                            onClick: () => {
                                                                setTestAnswers(prev => ({...prev, [key]: oIdx}));
                                                                setTestFeedback(prev => ({...prev, [key]: true}));
                                                            }
                                                        }, opt);
                                                    })
                                                ),
                                                isShowingFeedback && React.createElement('div', { 
                                                    className: \`p-6 rounded-2xl border flex gap-4 \${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}\` 
                                                }, React.createElement('p', { className: 'text-[11px] text-slate-300 italic font-medium' }, \`"\${q.feedback}"\`))
                                            ]);
                                        })
                                    )
                                ])
                            ]);
                        }),

                        // Botón de Progreso Final
                        React.createElement('div', { className: 'mt-32 flex flex-col items-center pb-20' }, [
                            React.createElement('button', {
                                onClick: () => toggleComplete(currentLesson.id),
                                className: \`px-20 py-8 rounded-[40px] font-black transition-all active:scale-95 text-[11px] tracking-[0.4em] uppercase shadow-2xl \${
                                    completedLessons.has(currentLesson.id) ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' : 'bg-white text-slate-950 hover:bg-cyan-400'
                                }\`
                            }, completedLessons.has(currentLesson.id) ? '✓ Lección Finalizada' : 'Marcar como Completada')
                        ])
                    ]) : React.createElement('div', { className: 'text-center py-40' }, [
                        React.createElement('div', { className: 'text-5xl mb-6 opacity-20' }, '📖'),
                        React.createElement('p', { className: 'text-slate-500 font-black uppercase text-[10px] tracking-widest' }, 'Selecciona una lección para comenzar.')
                    ])
                ])
            ]);
        }

        const root = ReactDOM.createRoot(document.getElementById('player-root'));
        root.render(React.createElement(StudentPlayer));
    <\/script>
</body>
</html>
    `;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `Aula_${course.title.replace(/\s+/g, '_')}.html`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      {/* SIDEBAR DOCENTE */}
      <aside className="w-80 bg-slate-950 border-r border-white/5 flex flex-col h-full z-30 shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-slate-900/40">
          <button onClick={onExit} className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4 hover:text-white transition-colors">← Salir a Biblioteca</button>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2">{course.title}</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {lessons.length > 0 && (
            <button 
              onClick={() => setViewMode('portfolio')}
              className={`w-full p-5 rounded-[25px] border-2 flex items-center gap-4 transition-all ${
                viewMode === 'portfolio' ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'border-white/5 bg-slate-900'
              }`}
            >
              <span className="text-2xl">📥</span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-cyan-500 mb-1">Evidencias</p>
                <p className="text-xs font-black text-white uppercase">Revisión de Alumnos</p>
              </div>
            </button>
          )}

          <div className="space-y-4 pt-4">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Unidades del Curso</p>
            {units.map((unit, uIdx) => (
              <div key={uIdx} className="space-y-1">
                <button 
                  onClick={() => { setActiveUnitIdx(uIdx); setViewMode('study'); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    activeUnitIdx === uIdx && viewMode === 'study' ? 'bg-white/5 border-white/20' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200">{unit.title}</p>
                </button>
                
                {activeUnitIdx === uIdx && viewMode === 'study' && unit.lessons.length > 0 && (
                  <div className="ml-4 space-y-1 border-l border-white/10 pl-4 py-1">
                    {unit.lessons.map((l, lIdx) => (
                      <button 
                        key={lIdx} 
                        onClick={() => setActiveLessonIdx(lIdx)} 
                        className={`w-full text-left p-3 rounded-xl text-[10px] font-black uppercase transition-all flex justify-between items-center ${
                          activeLessonIdx === lIdx ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{l.title}</span>
                        {completedLessons.has(l.id) && <span className="text-[9px]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="p-6 bg-slate-950 border-t border-white/10 space-y-2">
          <button 
            onClick={() => handleBuildUnit(activeUnitIdx)} 
            disabled={isBuildingUnit} 
            className="w-full py-5 bg-cyan-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-50"
          >
            {isBuildingUnit ? '🔨 SINCRONIZANDO...' : '🔨 CONSTRUIR UNIDAD'}
          </button>
          <button onClick={handleExportHTML} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-200 transition-all shadow-xl">EXPORTAR AULA (HTML)</button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-slate-950 custom-scrollbar">
        <div className="p-10 lg:p-20">
          {isBuildingUnit ? (
            <div className="max-w-xl mx-auto py-40 text-center animate-pulse">
               <div className="spinner mb-10"></div>
               <h2 className="text-3xl font-black text-white uppercase mb-4 tracking-tighter">Conectando con Nodo IA</h2>
               <p className="text-cyan-500 uppercase text-[10px] font-black tracking-[0.3em]">{buildStatus}</p>
            </div>
          ) : viewMode === 'portfolio' ? (
            <UnitPortfolio 
              unitTitle={currentUnit.title} 
              activities={unitActivities} 
              onGradeUpdate={(g) => setGrades([...grades, g])}
              grades={grades}
            />
          ) : currentLesson ? (
            <LessonContent 
              lesson={currentLesson}
              unitTitle={currentUnit.title}
              isCompleted={completedLessons.has(currentLesson.id)}
              onToggleComplete={() => {
                const newC = new Set(completedLessons);
                newC.has(currentLesson.id) ? newC.delete(currentLesson.id) : newC.add(currentLesson.id);
                setCompletedLessons(newC);
              }}
              onGradeUpdate={(g) => setGrades([...grades, g])}
            />
          ) : (
            <div className="max-w-xl mx-auto py-40 text-center bg-slate-900/20 rounded-[50px] border border-white/5">
               <div className="text-5xl mb-10">🏗️</div>
               <h2 className="text-2xl font-black text-white uppercase mb-4">Unidad Vacía</h2>
               <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Utiliza el botón para generar el contenido académico.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseViewer;
