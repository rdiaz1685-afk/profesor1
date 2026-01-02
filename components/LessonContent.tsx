
import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, Grade } from '../types';

interface LessonContentProps {
  lesson: Lesson;
  unitTitle: string;
  totalActivitiesInUnit: number;
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

  useEffect(() => {
    setAnswers({}); 
    setShowFeedback({}); 
    // Asegurar que volvemos al inicio al cambiar de lección
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lesson.id]);

  const handleTestAnswer = (qIdx: number, bIdx: number, oIdx: number) => {
    const key = `${bIdx}-${qIdx}`;
    if (showFeedback[key]) return;
    setAnswers(prev => ({ ...prev, [key]: oIdx }));
    setShowFeedback(prev => ({ ...prev, [key]: true }));
  };

  // Cálculo de puntuación
  const { correctCount, totalQuestions, answeredCount } = useMemo(() => {
    let correct = 0;
    let total = 0;
    let answered = 0;

    lesson.blocks.forEach((block, bIdx) => {
      if (block.type === 'test' && block.testQuestions) {
        block.testQuestions.forEach((q, qIdx) => {
          total++;
          const key = `${bIdx}-${qIdx}`;
          if (showFeedback[key]) {
            answered++;
            if (answers[key] === q.correctAnswerIndex) {
              correct++;
            }
          }
        });
      }
    });

    return { correctCount: correct, totalQuestions: total, answeredCount: answered };
  }, [lesson.blocks, answers, showFeedback]);

  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in fade-in zoom-in-95 duration-500">
      {/* Header de Lección */}
      <div className="mb-12">
        <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-400/20 mb-6 inline-block">
          {unitTitle}
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight break-words hyphens-auto">
          {lesson.title}
        </h1>
      </div>

      {/* Bloques de Contenido */}
      <div className="space-y-10">
        {lesson.blocks.map((block, bIdx) => {
          const isTest = block.type === 'test';
          const isActivity = block.type === 'activity';
          const shouldShowWeight = (isActivity || isTest) && block.weight && block.weight > 0;

          return (
            <div key={bIdx} className={`rounded-[40px] border transition-all duration-500 shadow-2xl relative group overflow-hidden ${
              isActivity ? 'border-cyan-500/30 bg-slate-900' : isTest ? 'border-amber-500/30 bg-slate-900/60' : 'border-white/5 bg-slate-900/40'
            }`}>
              
              {shouldShowWeight && (
                <div className="absolute top-0 right-0 z-20 pointer-events-none">
                    <div className={`px-5 py-2 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest border-l border-b shadow-lg ${
                    isTest 
                        ? 'bg-amber-500 text-slate-950 border-amber-600' 
                        : 'bg-cyan-500 text-slate-950 border-cyan-600'
                    }`}>
                    {isTest ? `Examen: ${block.weight} Pts` : `Valor: ${block.weight} Pts`}
                    </div>
                </div>
              )}

              <div className={`px-8 py-5 border-b border-white/5 flex items-center justify-between relative z-10 ${isActivity ? 'bg-cyan-500/5' : isTest ? 'bg-amber-500/5' : 'bg-slate-950/50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{isActivity ? '🛠️' : isTest ? '⚡' : '📖'}</span>
                  <h3 className={`font-black uppercase tracking-widest text-[10px] ${isActivity ? 'text-cyan-400' : isTest ? 'text-amber-500' : 'text-slate-400'} truncate`}>
                    {block.title}
                  </h3>
                </div>
              </div>
              
              <div className="p-8 md:p-12">
                <div className="text-slate-300 leading-relaxed text-base mb-8 whitespace-pre-line font-medium break-words">
                  {block.content}
                </div>

                {/* Sección de Preguntas (si es Test) */}
                {isTest && block.testQuestions && block.testQuestions.length > 0 && (
                  <div className="space-y-12 mt-8 border-t border-white/5 pt-10">
                    {block.testQuestions.map((q, qIdx) => {
                      const key = `${bIdx}-${qIdx}`;
                      const answeredIdx = answers[key];
                      const isShowingFeedback = showFeedback[key];
                      const isCorrect = answeredIdx === q.correctAnswerIndex;

                      return (
                        <div key={qIdx} className="space-y-6">
                          <h4 className="text-lg font-black text-white tracking-tight leading-tight">{q.question}</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = answeredIdx === oIdx;
                              const isThisCorrect = oIdx === q.correctAnswerIndex;
                              let btnStyle = "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10";
                              if (isShowingFeedback) {
                                if (isThisCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                                else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                                else btnStyle = "bg-slate-900/50 border-white/5 opacity-30";
                              }
                              return (
                                <button key={oIdx} disabled={isShowingFeedback} onClick={() => handleTestAnswer(qIdx, bIdx, oIdx)} className={`text-left p-6 rounded-[25px] border-2 transition-all font-bold text-xs ${btnStyle} break-words`}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isShowingFeedback && (
                            <div className={`mt-2 p-5 rounded-2xl border flex gap-3 animate-in slide-in-from-top-2 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                               <p className="text-slate-400 text-[10px] italic font-medium">"{q.feedback}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Rúbrica (si es Actividad) */}
                {isActivity && block.rubric && block.rubric.length > 0 && (
                   <div className="mt-8 p-6 bg-black/40 rounded-[30px] border border-white/5">
                      <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-6">Matriz de Evaluación</p>
                      <div className="space-y-3">
                         {block.rubric.map((r, ri) => (
                           <div key={ri} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-3 last:border-0">
                             <span className="text-slate-400 font-bold">{r.criterion}</span>
                             <span className="text-cyan-400 font-black tracking-widest">{r.points} PTS</span>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel de Resultados Detallado */}
      {totalQuestions > 0 && answeredCount > 0 && (
        <div className="mt-20 p-10 bg-slate-900 border border-white/10 rounded-[50px] shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-2">Retroalimentación Directa</p>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Tu Puntuación</h2>
              <p className="text-slate-500 text-xs font-medium mt-2">Respuestas: {answeredCount} de {totalQuestions}</p>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className={`text-6xl font-black tracking-tighter ${scorePercentage >= 70 ? 'text-emerald-400' : scorePercentage >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {scorePercentage}%
                </div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Nivel de Logro</p>
              </div>
              <div className="h-16 w-px bg-white/10 hidden md:block"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">
                  {correctCount}<span className="text-slate-600 text-xl mx-2">/</span>{totalQuestions}
                </div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Aciertos Reales</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 p-1">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${scorePercentage >= 70 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : scorePercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${scorePercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* ÁREA DE FINALIZACIÓN (Corregida para máxima visibilidad) */}
      <div className="mt-32 pt-20 border-t border-white/5 flex flex-col items-center">
        <div className="text-center mb-10">
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em] mb-2">Sección Final</p>
          <h3 className="text-white text-xl font-black uppercase tracking-tighter">¿Has terminado de estudiar?</h3>
        </div>
        
        <button 
          onClick={onToggleComplete}
          className={`group relative px-20 py-8 rounded-[35px] font-black transition-all active:scale-95 text-[11px] tracking-[0.4em] uppercase shadow-2xl overflow-hidden ${
            isCompleted 
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' 
              : 'bg-white text-slate-950 hover:bg-cyan-400'
          }`}
        >
          <span className="relative z-10 flex items-center gap-4">
            {isCompleted ? '✓ LECCIÓN COMPLETADA' : 'FINALIZAR ESTA LECCIÓN'}
          </span>
          {/* Efecto de brillo al pasar el mouse */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
        
        <p className="mt-8 text-slate-600 text-[8px] font-bold uppercase tracking-widest">
          Al finalizar, podrás avanzar a la siguiente lección en el menú lateral.
        </p>
      </div>
    </div>
  );
};

export default LessonContent;
