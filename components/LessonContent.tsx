
import React, { useState, useEffect } from 'react';
import { Lesson, Grade } from '../types';

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

  useEffect(() => {
    setAnswers({}); 
    setShowFeedback({}); 
  }, [lesson.id]);

  const handleTestAnswer = (qIdx: number, bIdx: number, oIdx: number) => {
    const key = `${bIdx}-${qIdx}`;
    if (showFeedback[key]) return;
    setAnswers(prev => ({ ...prev, [key]: oIdx }));
    setShowFeedback(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-40 animate-in">
      <div className="mb-16">
        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-400/20 mb-6 inline-block">{unitTitle}</span>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter uppercase">{lesson.title}</h1>
      </div>

      <div className="space-y-12">
        {lesson.blocks.map((block, bIdx) => {
          const isTest = block.type === 'test';
          const titleLower = (block.title || "").toLowerCase();
          const isActivity = block.type === 'activity' || titleLower.includes('actividad') || titleLower.includes('cuadro');

          return (
            <div key={bIdx} className={`rounded-[40px] overflow-hidden border transition-all duration-500 shadow-2xl ${
              isActivity ? 'border-cyan-500/40 bg-slate-900' : isTest ? 'border-amber-500/30 bg-slate-900/50' : 'border-white/5 bg-slate-900/40'
            }`}>
              <div className={`px-10 py-5 border-b border-white/5 flex items-center justify-between ${isActivity ? 'bg-cyan-500/5' : 'bg-slate-950/50'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-xl">{isActivity ? '🛠️' : isTest ? '⚡' : '📖'}</span>
                  <h3 className={`font-black uppercase tracking-widest text-[11px] ${isActivity ? 'text-cyan-400' : isTest ? 'text-amber-500' : 'text-slate-400'}`}>
                    {block.title}
                  </h3>
                </div>
              </div>
              
              <div className="p-10 md:p-14">
                <div className="text-slate-300 leading-relaxed text-lg mb-10 whitespace-pre-line font-medium">
                  {block.content}
                </div>

                {isTest && block.testQuestions && (
                  <div className="space-y-16 mt-10 border-t border-white/5 pt-10">
                    {block.testQuestions.map((q, qIdx) => {
                      const key = `${bIdx}-${qIdx}`;
                      const answeredIdx = answers[key];
                      const isShowingFeedback = showFeedback[key];
                      const isCorrect = answeredIdx === q.correctAnswerIndex;

                      return (
                        <div key={qIdx} className="space-y-8">
                          <h4 className="text-xl font-black text-white tracking-tight leading-tight">{q.question}</h4>
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
                                <button key={oIdx} disabled={isShowingFeedback} onClick={() => handleTestAnswer(qIdx, bIdx, oIdx)} className={`text-left p-6 rounded-[24px] border-2 transition-all font-bold text-xs ${btnStyle}`}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isShowingFeedback && (
                            <div className={`mt-4 p-6 rounded-3xl border flex gap-4 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                               <p className="text-slate-300 text-[11px] italic font-medium">"{q.feedback}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-32 flex flex-col items-center">
        <button 
          onClick={onToggleComplete}
          className={`px-20 py-8 rounded-[40px] font-black transition-all active:scale-95 text-[11px] tracking-[0.4em] uppercase shadow-2xl ${
            isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-white text-slate-950 hover:bg-cyan-400'
          }`}
        >
          {isCompleted ? '✓ Lección Finalizada' : 'Marcar como Completada'}
        </button>
      </div>
    </div>
  );
};

export default LessonContent;
