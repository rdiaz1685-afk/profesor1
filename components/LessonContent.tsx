
import React, { useState, useEffect } from 'react';
import { Lesson, RubricCriterion, Grade } from '../types';
import { gradeSubmission } from '../geminiService';

interface LessonContentProps {
  lesson: Lesson;
  unitTitle: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onGradeUpdate: (grade: Grade) => void;
}

const LessonContent: React.FC<LessonContentProps> = ({ 
  lesson, 
  unitTitle, 
  isCompleted, 
  onToggleComplete,
  onGradeUpdate
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});
  const [practiceInput, setPracticeInput] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<{score: number, feedback: string, aiLikelihood?: string} | null>(null);

  useEffect(() => {
    setAnswers({}); setShowFeedback({}); setPracticeInput(""); setGradingResult(null);
  }, [lesson.id]);

  const handleGradePractice = async (rubric: RubricCriterion[], blockContent: string) => {
    if (!practiceInput.trim()) return;
    setIsGrading(true);
    try {
      // Pasamos el contenido de la lección para que la IA sepa si el alumno está "copiando" de fuera o usando el material
      const result = await gradeSubmission(practiceInput, rubric, lesson.title, blockContent);
      setGradingResult(result);
      onGradeUpdate({
        lessonId: lesson.title,
        type: 'practice',
        score: result.score,
        maxScore: rubric.reduce((a, b) => a + b.points, 0),
        feedback: result.feedback,
        date: Date.now()
      });
    } catch (e) {
      alert("Error en el sínodo evaluador IA. Reintenta.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleTestAnswer = (qIdx: number, bIdx: number, oIdx: number, correct: number) => {
    const key = `${bIdx}-${qIdx}`;
    if (showFeedback[key]) return;
    setAnswers(prev => ({ ...prev, [key]: oIdx }));
    setShowFeedback(prev => ({ ...prev, [key]: true }));
    
    onGradeUpdate({
      lessonId: `${lesson.title} (Q${qIdx+1})`,
      type: 'test',
      score: oIdx === correct ? 10 : 0,
      maxScore: 10,
      date: Date.now()
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-700 pb-32">
      <div className="mb-16">
        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-400/20 mb-6 inline-block">{unitTitle}</span>
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">{lesson.title}</h1>
      </div>

      <div className="space-y-10">
        {lesson.blocks.map((block, bIdx) => (
          <div key={bIdx} className="glass-card rounded-[40px] overflow-hidden border border-white/5 group hover:border-white/10 transition-all">
            <div className={`px-10 py-6 border-b border-white/5 bg-slate-950/50 flex items-center justify-between`}>
              <h3 className="font-black text-white uppercase tracking-widest text-[11px]">{block.title}</h3>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${
                block.type === 'test' ? 'text-violet-400' : 
                block.type === 'activity' ? 'text-emerald-400' : 'text-slate-500'
              }`}>{block.type}</span>
            </div>
            <div className="p-10 md:p-14">
              <div className="text-slate-300 leading-relaxed text-lg mb-8">
                {block.content.split('\n').map((p, i) => p ? <p key={i} className="mb-4">{p}</p> : <div key={i} className="h-4"/>)}
              </div>

              {block.type === 'activity' && (
                <div className="mt-10 p-8 bg-cyan-500/5 rounded-[32px] border border-cyan-500/20">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Entrega de Práctica Institucional</h4>
                    <span className="text-[8px] font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-lg uppercase tracking-tighter">Código de Ética: Honestidad Académica</span>
                  </div>
                  
                  {block.rubric ? (
                    <div className="grid lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Criterios del Sínodo:</p>
                          <ul className="space-y-4">
                            {block.rubric.map((r, i) => (
                              <li key={i} className="flex gap-3">
                                <span className="text-cyan-500 font-black text-[10px] shrink-0 mt-0.5">{r.points}pts</span>
                                <div>
                                  <p className="text-[11px] font-black text-white uppercase leading-none mb-1">{r.criterion}</p>
                                  <p className="text-[10px] text-slate-500 leading-tight">{r.description}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl">
                          <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Aviso del Maestro</p>
                          <p className="text-[10px] text-slate-400">Las respuestas que no demuestren aplicación directa de la teoría expuesta en esta lección serán penalizadas.</p>
                        </div>
                      </div>

                      <div className="flex flex-col h-full">
                        <textarea 
                          className="flex-1 w-full min-h-[250px] p-6 rounded-[24px] bg-slate-950 border border-white/10 text-white text-base outline-none focus:border-cyan-500 transition-all resize-none shadow-inner"
                          placeholder="Desarrolla tu solución aquí. Evita respuestas genéricas y utiliza los conceptos de la unidad..."
                          value={practiceInput}
                          onChange={e => setPracticeInput(e.target.value)}
                          disabled={isGrading || !!gradingResult}
                        />
                        {!gradingResult ? (
                          <button 
                            onClick={() => handleGradePractice(block.rubric!, block.content)}
                            disabled={isGrading || !practiceInput}
                            className="mt-4 w-full py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                          >
                            {isGrading ? 'Consultando al Sínodo Evaluador...' : '⚡ Firmar y Enviar Acta de Calificación'}
                          </button>
                        ) : (
                          <div className="mt-4 animate-in slide-in-from-top-2 duration-500">
                             <div className="p-6 bg-slate-900 border-2 border-emerald-500/30 rounded-[32px]">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-xs font-black text-emerald-400 uppercase">Resultado Oficial</span>
                                  <span className="text-3xl font-black text-white">{gradingResult.score} <span className="text-sm text-slate-500">/ {block.rubric.reduce((a,b)=>a+b.points,0)}</span></span>
                                </div>
                                <p className="text-[12px] text-slate-300 leading-relaxed mb-4 p-4 bg-black/20 rounded-xl italic">"{gradingResult.feedback}"</p>
                                {gradingResult.aiLikelihood && (
                                  <div className="pt-4 border-t border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Nota de Originalidad del Sínodo:</p>
                                    <p className="text-[10px] text-cyan-500/80 font-medium italic">{gradingResult.aiLikelihood}</p>
                                  </div>
                                )}
                             </div>
                             <button onClick={() => setGradingResult(null)} className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white mx-auto block">Reintentar Entrega</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 italic text-xs">No se ha definido rúbrica para esta actividad.</div>
                  )}
                </div>
              )}

              {block.type === 'test' && (
                <div className="space-y-10 mt-10">
                  {block.testQuestions ? block.testQuestions.map((q, qIdx) => {
                    const key = `${bIdx}-${qIdx}`;
                    const answered = showFeedback[key];
                    return (
                      <div key={qIdx} className="space-y-6">
                        <p className="font-black text-white text-xl tracking-tight leading-snug"><span className="text-cyan-500 mr-4">0{qIdx+1}</span> {q.question}</p>
                        <div className="grid gap-3">
                          {q.options.map((opt, oIdx) => (
                            <button 
                              key={oIdx}
                              disabled={answered}
                              onClick={() => handleTestAnswer(qIdx, bIdx, oIdx, q.correctAnswerIndex)}
                              className={`text-left px-8 py-5 rounded-3xl border transition-all text-sm font-bold ${
                                answered 
                                  ? oIdx === q.correctAnswerIndex ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : oIdx === answers[key] ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-900/50 border-white/5 opacity-50'
                                  : 'bg-white/5 border-white/5 text-slate-300 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 text-slate-500 italic text-xs">Este test no contiene preguntas configuradas.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 flex justify-center">
        <button 
          onClick={onToggleComplete}
          className={`px-14 py-6 rounded-[32px] font-black transition-all active:scale-95 text-xs tracking-widest uppercase shadow-xl ${
            isCompleted ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/10' : 'bg-white text-slate-950 hover:bg-cyan-400'
          }`}
        >
          {isCompleted ? 'Lección Finalizada ✓' : 'Marcar como Completada'}
        </button>
      </div>
    </div>
  );
};

export default LessonContent;
