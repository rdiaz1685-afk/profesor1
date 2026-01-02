
import React, { useState, useEffect, useMemo } from 'react';
import { LessonBlock, StudentSubmission, AuthorizedStudent } from '../types';
import { gradeSubmission } from '../geminiService';

interface UnitPortfolioProps {
  unitTitle: string;
  activities: {lessonTitle: string, block: LessonBlock, blockIdx: number}[];
  studentList: AuthorizedStudent[];
  masterGrades: StudentSubmission[];
  onUpdateRoster: (roster: AuthorizedStudent[]) => void;
  onUpdateGrades: (grades: StudentSubmission[]) => void;
}

const UnitPortfolio: React.FC<UnitPortfolioProps> = ({ 
  unitTitle, 
  activities, 
  studentList, 
  masterGrades, 
  onUpdateRoster, 
  onUpdateGrades 
}) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'roster' | 'rubrics'>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [localSubmissions, setLocalSubmissions] = useState<StudentSubmission[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [rosterInput, setRosterInput] = useState("");
  const [selectedRubricIdx, setSelectedRubricIdx] = useState(0);

  // Al cargar, sincronizamos las entregas locales con las calificaciones maestras
  useEffect(() => {
    if (masterGrades.length > 0) {
      setLocalSubmissions(prev => {
        const combined = [...prev];
        masterGrades.forEach(mg => {
          const index = combined.findIndex(s => s.studentControlNumber === mg.studentControlNumber && s.activityTitle === mg.activityTitle);
          if (index !== -1) combined[index] = mg;
          else combined.push(mg);
        });
        return combined;
      });
    }
  }, [masterGrades]);

  const handleImportRoster = () => {
    const lines = rosterInput.split('\n').filter(l => l.trim() !== "");
    const newStudents: AuthorizedStudent[] = lines.map((line, i) => {
      const parts = line.split(/[,\t]/);
      return {
        id: `std_${Date.now()}_${i}`,
        controlNumber: parts[0]?.trim() || `S${i+1}`,
        name: parts[1]?.trim() || parts[0]?.trim() || "Alumno Desconocido"
      };
    });
    onUpdateRoster(newStudents);
    setRosterInput("");
    setActiveTab('submissions');
  };

  const handleProcessSubmissions = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.studentControlNumber) {
            setLocalSubmissions(prev => {
              const exists = prev.find(s => s.studentControlNumber === data.studentControlNumber && s.activityTitle === data.activityTitle);
              if (exists) return prev;
              return [...prev, data];
            });
          }
        } catch (err) { alert("Archivo de entrega inválido."); }
      };
      reader.readAsText(file);
    });
  };

  const handleAudit = async (sub: StudentSubmission) => {
    setIsGrading(true);
    try {
      const result = await gradeSubmission(sub);
      const graded = { ...sub, ...result };
      
      // Actualizamos localmente
      setLocalSubmissions(prev => prev.map(s => 
        (s.studentControlNumber === sub.studentControlNumber && s.activityTitle === sub.activityTitle) ? graded : s
      ));
      setSelectedSubmission(graded);

      // Guardamos en el registro maestro del curso
      const newMaster = [...masterGrades];
      const mIdx = newMaster.findIndex(m => m.studentControlNumber === graded.studentControlNumber && m.activityTitle === graded.activityTitle);
      if (mIdx !== -1) newMaster[mIdx] = graded;
      else newMaster.push(graded);
      onUpdateGrades(newMaster);

    } catch (e) {
      alert("Error en la auditoría IA.");
    } finally {
      setIsGrading(false);
    }
  };

  const exportGradesBackup = () => {
    const data = JSON.stringify(masterGrades, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Calificaciones_${unitTitle.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const importGradesBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) onUpdateGrades(imported);
      } catch { alert("Archivo de respaldo inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Portafolio <span className="text-cyan-400">Técnico</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{unitTitle}</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('submissions')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Entregas</button>
          <button onClick={() => setActiveTab('roster')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Lista Nominal</button>
          <button onClick={() => setActiveTab('rubrics')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'rubrics' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Rúbricas</button>
        </div>
      </div>

      {activeTab === 'roster' && (
        <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-500">
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Importar Alumnos</h3>
            <p className="text-slate-500 text-[10px] leading-relaxed">Pega la lista de alumnos desde Excel o texto plano. <br/>Formato: <code className="text-cyan-500">Número de Control, Nombre Completo</code></p>
            <textarea 
              value={rosterInput}
              onChange={(e) => setRosterInput(e.target.value)}
              placeholder="21010001, GARCIA PEREZ JUAN&#10;21010002, LOPEZ DIAZ MARIA"
              className="w-full h-64 bg-slate-950 border border-white/10 rounded-3xl p-6 text-xs text-white outline-none focus:border-cyan-500 transition-all font-mono"
            />
            <button onClick={handleImportRoster} className="w-full py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all">Sincronizar Lista</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Lista Actual ({studentList.length})</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {studentList.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-white uppercase">{s.name}</p>
                    <p className="text-[8px] text-slate-500 font-bold">{s.controlNumber}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                </div>
              ))}
              {studentList.length === 0 && <p className="text-center py-20 text-slate-600 text-[9px] font-black uppercase tracking-widest">No hay alumnos registrados</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          {/* Dashboard de Acciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" multiple accept=".json" onChange={(e) => e.target.files && handleProcessSubmissions(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <span className="text-2xl mb-4">📥</span>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Cargar Entregas</h4>
                <p className="text-[8px] text-slate-500 mt-1">Arrastra archivos .json de los alumnos</p>
             </div>
             <div onClick={exportGradesBackup} className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-all cursor-pointer">
                <span className="text-2xl mb-4">💾</span>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Respaldar Notas</h4>
                <p className="text-[8px] text-slate-500 mt-1">Exporta el Libro de Calificaciones actual</p>
             </div>
             <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" accept=".json" onChange={importGradesBackup} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <span className="text-2xl mb-4">🔄</span>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Cargar Respaldo</h4>
                <p className="text-[8px] text-slate-500 mt-1">Recupera calificaciones previas</p>
             </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Lista de Entregas / Alumnos */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Panel de Seguimiento</h3>
              {localSubmissions.length === 0 ? (
                <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center">
                  <p className="text-slate-700 font-black uppercase text-[8px] tracking-widest">Esperando archivos...</p>
                </div>
              ) : (
                localSubmissions.map((sub, i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`w-full text-left p-5 rounded-3xl border transition-all relative overflow-hidden ${selectedSubmission === sub ? 'bg-white border-white' : 'bg-slate-900 border-white/5'}`}
                  >
                    <div className="relative z-10">
                       <p className={`text-[8px] font-black uppercase ${selectedSubmission === sub ? 'text-slate-500' : 'text-cyan-500'}`}>{sub.studentControlNumber}</p>
                       <h4 className={`text-xs font-black uppercase truncate ${selectedSubmission === sub ? 'text-slate-950' : 'text-white'}`}>{sub.studentName}</h4>
                       <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[7px] font-black uppercase ${sub.score !== undefined ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {sub.score !== undefined ? `CALIFICADO: ${sub.score}` : 'PENDIENTE'}
                          </span>
                       </div>
                    </div>
                    {sub.score !== undefined && (
                      <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 flex items-center justify-center rounded-bl-3xl">
                        <span className="text-[10px]">✅</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Visualizador de Entrega y Calificación */}
            <div className="lg:col-span-8">
              {selectedSubmission ? (
                <div className="bg-slate-900 border border-white/5 rounded-[50px] p-10 space-y-10 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-8">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedSubmission.studentName}</h3>
                      <p className="text-cyan-500 text-[9px] font-black uppercase mt-1 tracking-widest">{selectedSubmission.activityTitle}</p>
                    </div>
                    {selectedSubmission.score !== undefined ? (
                      <div className="text-right">
                        <div className="text-5xl font-black text-emerald-400 tracking-tighter">{selectedSubmission.score}</div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Puntos Obtenidos</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAudit(selectedSubmission)}
                        disabled={isGrading}
                        className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all shadow-xl disabled:opacity-50"
                      >
                        {isGrading ? 'AUDITANDO...' : 'AUDITAR CON IA'}
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Respuesta del Alumno</label>
                       <div className="p-6 bg-black/40 rounded-3xl text-slate-300 text-sm italic border border-white/5 h-64 overflow-y-auto custom-scrollbar leading-relaxed">
                         {selectedSubmission.content}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Evidencia Adjunta</label>
                       <div className="bg-slate-950 rounded-3xl border border-white/5 h-64 flex items-center justify-center overflow-hidden">
                          {selectedSubmission.attachment ? (
                            <img src={selectedSubmission.attachment} className="max-w-full max-h-full object-contain cursor-zoom-in" onClick={() => window.open(selectedSubmission.attachment)} />
                          ) : (
                            <div className="text-center opacity-20">
                               <span className="text-4xl mb-2 block">📷</span>
                               <p className="text-[8px] font-black uppercase">Sin Imagen</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  {selectedSubmission.aiFeedback && (
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cyan-500 rounded-2xl flex items-center justify-center text-xl">🤖</div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Retroalimentación del Nodo IA</h4>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed font-medium">{selectedSubmission.aiFeedback}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                         <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <p className="text-[8px] font-black text-emerald-500 uppercase mb-3">Fortalezas</p>
                            <ul className="space-y-2">
                               {selectedSubmission.strengths?.map((s, i) => <li key={i} className="text-[10px] text-emerald-100 font-bold">• {s}</li>)}
                            </ul>
                         </div>
                         <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                            <p className="text-[8px] font-black text-amber-500 uppercase mb-3">Áreas de Mejora</p>
                            <ul className="space-y-2">
                               {selectedSubmission.improvementAreas?.map((s, i) => <li key={i} className="text-[10px] text-amber-100 font-bold">• {s}</li>)}
                            </ul>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[60px] py-40 bg-slate-900/10">
                  <div className="text-5xl mb-6 opacity-10">🎓</div>
                  <h3 className="text-lg font-black text-slate-700 uppercase tracking-tighter">Visor de Auditoría</h3>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-2">Selecciona un alumno para evaluar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rubrics' && (
        <div className="grid md:grid-cols-3 gap-8 animate-in fade-in duration-500">
           <div className="space-y-2">
              {activities.map((act, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedRubricIdx(i)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedRubricIdx === i ? 'bg-white border-white text-slate-950' : 'bg-slate-900 border-white/5 text-slate-400'}`}
                >
                  <p className="text-[8px] font-black uppercase mb-1">Unidad: {unitTitle}</p>
                  <h4 className="text-[11px] font-black uppercase leading-tight truncate">{act.block.title}</h4>
                </button>
              ))}
           </div>
           <div className="md:col-span-2 bg-slate-900 border border-white/5 rounded-[40px] p-10">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8">{activities[selectedRubricIdx].block.title}</h3>
              <div className="space-y-4">
                 {activities[selectedRubricIdx].block.rubric?.map((r, i) => (
                    <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center group hover:border-cyan-500/30">
                       <div className="pr-6">
                          <p className="text-[10px] font-black text-white uppercase">{r.criterion}</p>
                          <p className="text-[8px] text-slate-500 mt-1">{r.description}</p>
                       </div>
                       <div className="text-right shrink-0">
                          <span className="text-xl font-black text-cyan-400">{r.points}</span>
                          <p className="text-[7px] text-slate-600 font-black uppercase">Pts</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UnitPortfolio;
