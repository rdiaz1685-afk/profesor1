import React, { useState, useEffect } from 'react';
import { LessonBlock, Grade, StudentSubmission } from '../types';
import { gradeSubmission } from '../geminiService';

interface UnitPortfolioProps {
  unitTitle: string;
  activities: {lessonTitle: string, block: LessonBlock, blockIdx: number}[];
  onGradeUpdate: (grade: Grade) => void;
  grades: Grade[];
}

const UnitPortfolio: React.FC<UnitPortfolioProps> = ({ unitTitle, activities, onGradeUpdate, grades }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'submissions'>('submissions');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    // FIX ANTI-LOOP: Solo establece el índice si es null y hay actividades.
    // Si selectedIdx ya tiene valor (ej: 0), NO hace nada, evitando el re-render infinito.
    if (activities.length > 0 && selectedIdx === null) {
      setSelectedIdx(0);
    }
  }, [activities, selectedIdx]);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.studentControlNumber) {
            setSubmissions(prev => {
              const exists = prev.some(s => s.studentControlNumber === data.studentControlNumber && s.activityTitle === data.activityTitle);
              return exists ? prev : [...prev, data];
            });
          }
        } catch (err) { alert("Archivo no válido. Asegúrate de que sea un JSON de entrega."); }
      };
      reader.readAsText(file);
    });
  };

  const handleGradeAI = async (sub: StudentSubmission) => {
    setIsGrading(true);
    try {
      const result = await gradeSubmission(sub);
      const updated = { ...sub, ...result };
      setSubmissions(prev => prev.map(s => 
        (s.studentControlNumber === sub.studentControlNumber && s.activityTitle === sub.activityTitle) ? updated : s
      ));
      setSelectedSubmission(updated);
    } catch (e: any) {
      console.error(e);
      let msg = "Error al conectar con la IA.";
      if (e.message.includes("API_KEY_MISSING")) {
        msg = "ERROR CRÍTICO: No se detectó la API_KEY. Por favor, agrégala en las Environment Variables de Vercel como 'API_KEY'.";
      } else if (e.message.includes("403") || e.message.includes("API key")) {
        msg = "La API_KEY parece ser inválida o no tiene permisos.";
      }
      alert(msg);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-16">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Buzón de <span className="text-cyan-400">Evidencias</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{unitTitle}</p>
        </div>
        
        <div className="bg-slate-900 p-1 rounded-2xl border border-white/5 flex">
          <button onClick={() => setActiveTab('submissions')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'submissions' ? 'bg-white text-slate-950' : 'text-slate-500'}`}>Entregas</button>
          <button onClick={() => setActiveTab('template')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'template' ? 'bg-cyan-500 text-slate-950' : 'text-slate-500'}`}>Rúbricas</button>
        </div>
      </div>

      {activeTab === 'submissions' ? (
        <div className="space-y-10">
          <div className="bg-slate-900 border-2 border-dashed border-white/10 rounded-[50px] p-16 text-center relative group hover:border-cyan-500/30">
            <input type="file" multiple accept=".json" onChange={(e) => e.target.files && processFiles(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="text-4xl mb-4">📥</div>
            <h3 className="text-lg font-black text-white uppercase">Soltar Archivos de Alumnos</h3>
            <p className="text-slate-500 text-[8px] font-black uppercase mt-2">Formatos .json generados en el aula</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-3">
              {submissions.length === 0 && (
                <div className="p-10 text-center opacity-20 border border-white/5 rounded-3xl">
                  <p className="text-[10px] font-black uppercase">Sin entregas</p>
                </div>
              )}
              {submissions.map((sub, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedSubmission === sub ? 'bg-white' : 'bg-slate-900 border-white/5'}`}
                >
                  <p className={`text-[8px] font-black uppercase ${selectedSubmission === sub ? 'text-slate-900' : 'text-slate-500'}`}>{sub.studentControlNumber}</p>
                  <h4 className={`text-xs font-black uppercase ${selectedSubmission === sub ? 'text-slate-950' : 'text-white'} truncate`}>{sub.studentName}</h4>
                  <p className={`text-[7px] mt-1 truncate ${selectedSubmission === sub ? 'text-slate-500' : 'text-slate-600'}`}>{sub.activityTitle}</p>
                  {sub.authenticityScore !== undefined && sub.authenticityScore > 0 && (
                    <div className="mt-3 flex gap-2">
                       <span className={`text-[7px] px-2 py-1 rounded-full font-black ${sub.authenticityScore < 60 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
                         AUDITADO: {sub.authenticityScore}% HUMANO
                       </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="lg:col-span-8">
              {selectedSubmission ? (
                <div className="bg-slate-900 border border-white/5 rounded-[45px] p-12 space-y-10 animate-in fade-in duration-300">
                  <div className="flex justify-between items-start border-b border-white/5 pb-8">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase">{selectedSubmission.studentName}</h3>
                      <p className="text-cyan-500 text-[10px] font-black uppercase mt-2">Control: {selectedSubmission.studentControlNumber}</p>
                    </div>
                    {selectedSubmission.score !== undefined && selectedSubmission.score > 0 ? (
                      <div className="text-right">
                        <div className="text-4xl font-black text-white">{selectedSubmission.score}</div>
                        <div className="text-[8px] font-black text-slate-500 uppercase">Puntos</div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleGradeAI(selectedSubmission)} 
                        disabled={isGrading}
                        className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-50"
                      >
                        {isGrading ? 'AUDITANDO...' : 'AUDITAR CON IA'}
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Actividad: {selectedSubmission.activityTitle}</p>
                      <div className="p-6 bg-black/40 rounded-2xl text-slate-300 text-sm italic border border-white/5 h-64 overflow-y-auto custom-scrollbar leading-relaxed">
                        {selectedSubmission.content}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Defensa del Alumno (Meta-cognición)</p>
                      <div className="p-6 bg-amber-500/5 rounded-2xl text-amber-200 text-sm italic border border-amber-500/10 h-64 overflow-y-auto custom-scrollbar leading-relaxed">
                        {selectedSubmission.reflection}
                      </div>
                    </div>
                  </div>

                  {selectedSubmission.aiDetectionReason && (
                    <div className="p-8 bg-slate-950/50 border border-white/5 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${selectedSubmission.authenticityScore && selectedSubmission.authenticityScore > 70 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Análisis de Integridad</h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{selectedSubmission.aiDetectionReason}</p>
                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <div>
                          <p className="text-[8px] font-black text-emerald-500 uppercase mb-2">Fortalezas</p>
                          <ul className="text-[11px] text-slate-400 space-y-1">
                            {selectedSubmission.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-amber-500 uppercase mb-2">Áreas de Mejora</p>
                          <ul className="text-[11px] text-slate-400 space-y-1">
                            {selectedSubmission.improvementAreas?.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[45px] py-40">
                  <div className="text-4xl mb-6 opacity-20">👤</div>
                  <p className="text-slate-600 font-black uppercase text-[9px] tracking-widest">Selecciona una entrega de la lista lateral</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
             {activities.map((act, i) => (
               <button key={i} onClick={() => setSelectedIdx(i)} className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedIdx === i ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-900 border-white/5'}`}>
                 <p className={`text-[8px] font-black uppercase mb-1 ${selectedIdx === i ? 'text-slate-900' : 'text-slate-500'}`}>{act.lessonTitle}</p>
                 <h4 className={`text-xs font-black uppercase ${selectedIdx === i ? 'text-slate-950' : 'text-white'}`}>{act.block.title}</h4>
               </button>
             ))}
          </div>
          <div className="lg:col-span-8">
             {selectedIdx !== null && (
               <div className="bg-slate-900/50 border border-white/5 rounded-[45px] p-12 min-h-[400px]">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{activities[selectedIdx].block.title}</h2>
                  <div className="text-slate-400 text-lg leading-relaxed mt-8 pt-8 border-t border-white/5 whitespace-pre-line font-medium">
                    {activities[selectedIdx].block.content}
                  </div>
                  {activities[selectedIdx].block.rubric && activities[selectedIdx].block.rubric.length > 0 && (
                    <div className="mt-12 space-y-6">
                      <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Rúbrica de Evaluación</h4>
                      <div className="space-y-3">
                        {activities[selectedIdx].block.rubric.map((r, ri) => (
                          <div key={ri} className="p-5 bg-black/30 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-black text-white uppercase">{r.criterion}</p>
                              <p className="text-[10px] text-slate-500 mt-1">{r.description}</p>
                            </div>
                            <div className="text-cyan-400 font-black text-xs">{r.points} pts</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitPortfolio;
