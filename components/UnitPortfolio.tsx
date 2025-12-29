
import React, { useState, useEffect } from 'react';
import { LessonBlock, Grade, StudentSubmission } from '../types';

interface UnitPortfolioProps {
  unitTitle: string;
  activities: {lessonTitle: string, block: LessonBlock, blockIdx: number}[];
  onGradeUpdate: (grade: Grade) => void;
  grades: Grade[];
}

const UnitPortfolio: React.FC<UnitPortfolioProps> = ({ unitTitle, activities, onGradeUpdate, grades }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'submissions'>('template');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (activities.length > 0 && selectedIdx === null) setSelectedIdx(0);
  }, [activities]);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.studentName && data.aiScore !== undefined) {
            setSubmissions(prev => [...prev, data]);
          }
        } catch (err) { alert("Archivo no válido."); }
      };
      reader.readAsText(file);
    });
  };

  const generateMockSubmission = () => {
    const names = ["Carlos Mendoza", "Lucía Vaca", "Roberto Sánchez", "Diana Prince"];
    const name = names[Math.floor(Math.random() * names.length)];
    const mock: StudentSubmission = {
      studentName: name,
      studentId: `TEC-${Math.floor(1000 + Math.random() * 9000)}`,
      lessonTitle: activities[0]?.lessonTitle || "Lección 1",
      activityTitle: activities[0]?.block.title || "Tarea",
      content: "Entrega de prueba generada automáticamente por el sistema para verificar el buzón.",
      aiScore: Math.floor(70 + Math.random() * 30),
      aiFeedback: "Buen análisis de los conceptos. Se recomienda mejorar la presentación de diagramas.",
      timestamp: Date.now()
    };
    
    setSubmissions(prev => [mock, ...prev]);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setActiveTab('submissions');
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      {showNotification && (
        <div className="fixed top-10 right-10 bg-emerald-500 text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl z-[100] animate-bounce">
          ✓ Nueva evidencia recibida
        </div>
      )}

      <div className="flex justify-between items-center mb-16">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Centro de Evidencias</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{unitTitle}</p>
        </div>
        
        <div className="bg-slate-900 p-1 rounded-2xl border border-white/5 flex">
          <button 
            onClick={() => setActiveTab('template')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'template' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500'
            }`}
          >
            Tareas Diseño
          </button>
          <button 
            onClick={() => setActiveTab('submissions')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'submissions' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500'
            }`}
          >
            Buzón ({submissions.length})
          </button>
        </div>
      </div>

      {activeTab === 'template' ? (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
             <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl mb-4">
               <p className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-4 leading-relaxed">¿Quieres probar el buzón ahora?</p>
               <button onClick={generateMockSubmission} className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-all">Generar Entrega Demo</button>
             </div>
             {activities.map((act, i) => (
               <button 
                 key={i}
                 onClick={() => setSelectedIdx(i)}
                 className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedIdx === i ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-900 border-white/5 opacity-60'}`}
               >
                 <p className={`text-[8px] font-black uppercase mb-1 ${selectedIdx === i ? 'text-slate-900' : 'text-slate-500'}`}>{act.lessonTitle}</p>
                 <h4 className={`text-xs font-black uppercase ${selectedIdx === i ? 'text-slate-950' : 'text-white'}`}>{act.block.title}</h4>
               </button>
             ))}
          </div>
          <div className="lg:col-span-8">
             {selectedIdx !== null && (
               <div className="bg-slate-900/50 border border-white/5 rounded-[45px] p-12 space-y-8 min-h-[400px]">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{activities[selectedIdx].block.title}</h2>
                  <div className="text-slate-400 text-lg leading-relaxed whitespace-pre-line border-t border-white/5 pt-8">
                    {activities[selectedIdx].block.content}
                  </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="bg-slate-900 border-2 border-dashed border-white/10 rounded-[50px] p-20 text-center relative group hover:border-cyan-500/30 transition-all">
            <input type="file" multiple accept=".json" onChange={(e) => e.target.files && processFiles(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="text-5xl mb-6">📥</div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Cargar Evidencias JSON</h3>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Suelta aquí los archivos de tus alumnos</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {submissions.length === 0 ? (
                <div className="text-center py-20 opacity-20 italic">No hay entregas.</div>
              ) : (
                submissions.map((sub, i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`w-full text-left p-6 rounded-3xl border mb-3 transition-all flex justify-between items-center ${selectedSubmission === sub ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-white/5'}`}
                  >
                    <div>
                      <p className={`text-[8px] font-black uppercase ${selectedSubmission === sub ? 'text-slate-900' : 'text-slate-500'}`}>{sub.studentId}</p>
                      <h4 className={`text-xs font-black uppercase ${selectedSubmission === sub ? 'text-slate-950' : 'text-white'}`}>{sub.studentName}</h4>
                    </div>
                    <span className={`text-lg font-black ${selectedSubmission === sub ? 'text-slate-950' : 'text-emerald-500'}`}>{sub.aiScore}</span>
                  </button>
                ))
              )}
            </div>
            <div className="lg:col-span-8">
              {selectedSubmission ? (
                <div className="bg-slate-900 border border-white/5 rounded-[45px] p-12 space-y-10 shadow-2xl">
                  <div className="flex justify-between items-start border-b border-white/5 pb-8">
                    <div>
                      <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{selectedSubmission.studentName}</h3>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-4">{selectedSubmission.activityTitle}</p>
                    </div>
                    <div className="bg-emerald-500 text-slate-950 p-6 rounded-3xl text-center shadow-lg">
                      <p className="text-3xl font-black">{selectedSubmission.aiScore}</p>
                      <p className="text-[8px] font-black uppercase">Nota IA</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Respuesta:</p>
                    <div className="p-8 bg-black/40 rounded-3xl text-slate-300 italic text-md leading-relaxed">
                      "{selectedSubmission.content}"
                    </div>
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <p className="text-[9px] font-black text-emerald-500 uppercase mb-2">Comentario Sínodo:</p>
                      <p className="text-slate-400 text-sm font-medium">{selectedSubmission.aiFeedback}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[45px] py-40 bg-slate-900/10">
                  <p className="text-slate-600 font-black uppercase text-[9px] tracking-widest">Selecciona un alumno para revisar su trabajo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitPortfolio;
