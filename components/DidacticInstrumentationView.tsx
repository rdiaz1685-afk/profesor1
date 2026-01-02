
import React, { useRef } from 'react';
import { Course } from '../types';

interface Props {
  course: Course;
}

const DidacticInstrumentationView: React.FC<Props> = ({ course }) => {
  const instr = course?.instrumentation;
  const printRef = useRef<HTMLDivElement>(null);

  if (!instr) {
    return (
      <div className="max-w-4xl mx-auto py-40 text-center">
        <div className="text-5xl mb-10 animate-bounce">📄</div>
        <h2 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter leading-none">Instrumentación No Disponible</h2>
        <p className="text-slate-500 text-xs font-bold">Genera la estructura de la materia para ver este documento.</p>
      </div>
    );
  }

  const creationDate = new Date(course.createdAt).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleExportWord = () => {
    if (!printRef.current) return;

    const css = `
      <style>
        @page Section1 {
          size: 841.9pt 595.3pt; 
          mso-page-orientation: landscape;
          margin: 0.5in 0.5in 0.5in 0.5in;
        }
        div.Section1 { page: Section1; }
        
        table { border-collapse: collapse; width: 100%; font-family: 'Arial', sans-serif; table-layout: fixed; margin-bottom: 10pt; }
        th, td { border: 0.5pt solid black; padding: 4pt; font-size: 8pt; color: black; word-wrap: break-word; }
        .bg-gray { background-color: #f2f2f2; font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .font-black { font-weight: 900; }
        
        .calendar-table td, .calendar-table th { font-size: 8pt; padding: 4pt; text-align: center; }
        
        .header-box { border: 1.5pt solid black; margin-bottom: 10pt; }
        .section-title { background-color: #e6e6e6; font-weight: bold; padding: 5pt; border: 1pt solid black; margin-top: 15pt; text-transform: uppercase; font-size: 9pt; }
      </style>
    `;

    const htmlContent = printRef.current.innerHTML;
    
    const blobContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          ${css}
        </head>
        <body>
          <div class="Section1">
            ${htmlContent}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', blobContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Instrumentacion_TecNM_${course.subjectCode || 'Materia'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCalendarPart = (start: number, end: number) => (
    <div className="mb-6">
      <p className="text-[9px] font-black text-black uppercase mb-2">Semanas {start} a {end}</p>
      <table className="w-full border-collapse border-2 border-black text-black text-[9px] calendar-table">
        <thead>
          <tr className="bg-gray-100 font-black">
            <th className="border-2 border-black p-2 w-20">Semana</th>
            {Array.from({ length: end - start + 1 }).map((_, i) => (
              <th key={i} className="border-2 border-black p-2 text-center">{start + i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="font-black">
            <td className="border-2 border-black p-2 bg-gray-50 text-left">Planeado (TP)</td>
            {Array.from({ length: end - start + 1 }).map((_, i) => (
              <td key={i} className="border-2 border-black p-2 text-center text-blue-900 bg-white font-black text-xs">
                {instr.calendar?.[start + i - 1]?.planned || 'X'}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-2 border-black p-2 font-black bg-gray-50 text-left">Real (TR)</td>
            {Array.from({ length: end - start + 1 }).map((_, i) => (
              <td key={i} className="border-2 border-black p-2 bg-white"></td>
            ))}
          </tr>
          <tr>
            <td className="border-2 border-black p-2 font-black bg-gray-50 text-left">Seguimiento (SD)</td>
            {Array.from({ length: end - start + 1 }).map((_, i) => (
              <td key={i} className="border-2 border-black p-2 bg-white"></td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      <div 
        ref={printRef}
        className="bg-white text-black p-0 border-[3px] border-black overflow-hidden shadow-2xl print:shadow-none print:border-2"
      >
        <div className="grid grid-cols-12 border-b-[3px] border-black text-black">
          <div className="col-span-3 p-4 flex items-center justify-center border-r-[3px] border-black font-black text-xl uppercase">TecNM</div>
          <div className="col-span-6 p-4 border-r-[3px] border-black text-center flex flex-col justify-center">
            <h1 className="text-[10px] font-black uppercase leading-tight">Instrumentación Didáctica para la formación y desarrollo de competencias profesionales</h1>
            <p className="text-[8px] font-bold mt-1">Referencia a la Norma ISO 9001:2015: 8.1, 8.2.2, 8.5.1</p>
          </div>
          <div className="col-span-3 p-4 text-[8px] font-black flex flex-col justify-center gap-1">
            <p>Código: TecNM-AC-PO-003-02</p>
            <p>Revisión: O</p>
            <p>Materia: {course.subjectCode || 'TEC-GEN'}</p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          <section>
            <h3 className="bg-gray-200 p-2 text-[11px] font-black border-2 border-black uppercase mb-3 text-black">1. Caracterización de la asignatura</h3>
            <div className="text-[10px] leading-relaxed text-justify px-3 font-bold text-black whitespace-pre-line">
              {instr.characterization}
            </div>
          </section>

          <section>
            <h3 className="bg-gray-200 p-2 text-[11px] font-black border-2 border-black uppercase mb-3 text-black">2. Intención didáctica</h3>
            <div className="text-[10px] leading-relaxed text-justify px-3 font-bold text-black whitespace-pre-line">
              {instr.didacticIntent}
            </div>
          </section>

          <section>
            <h3 className="bg-gray-200 p-2 text-[11px] font-black border-2 border-black uppercase mb-3 text-black">3. Competencia de la asignatura</h3>
            <div className="text-[11px] leading-snug px-4 font-black text-black border-l-[6px] border-black py-2 bg-gray-50 italic">
              {instr.subjectCompetency}
            </div>
          </section>

          <section>
            <h3 className="bg-gray-200 p-2 text-[11px] font-black border-2 border-black uppercase mb-3 text-black">4. Análisis por competencias específicas e indicadores</h3>
            <table className="w-full border-collapse border-2 border-black text-black">
              <thead>
                <tr className="bg-gray-100 text-[10px] font-black uppercase">
                  <th className="border-2 border-black p-3 w-1/4">Unidad / Competencia</th>
                  <th className="border-2 border-black p-3">Descripción e Indicadores</th>
                  <th className="border-2 border-black p-3 w-24 text-center">Horas (T/P)</th>
                </tr>
              </thead>
              <tbody>
                {instr.analysisByUnit?.map((u, idx) => (
                  <tr key={idx} className="text-[10px] font-bold">
                    <td className="border-2 border-black p-3 uppercase bg-gray-50 font-black">{u.unitTitle}</td>
                    <td className="border-2 border-black p-3">
                      <p className="mb-3 text-black leading-tight">{u.competencyDescription}</p>
                      <div className="p-3 border border-black text-[9px] font-black bg-white uppercase leading-tight">
                        INDICADORES DE ALCANCE: {u.indicatorsOfReach}
                      </div>
                    </td>
                    <td className="border-2 border-black p-3 text-center font-black text-black text-lg">{u.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="bg-gray-200 p-2 text-[11px] font-black border-2 border-black uppercase mb-3 text-black">5. Matriz de Evaluación</h3>
            <table className="w-full border-collapse border-2 border-black text-black text-[10px]">
              <thead className="bg-gray-100 font-black uppercase">
                <tr>
                  <th className="border-2 border-black p-3">Evidencia de aprendizaje</th>
                  <th className="border-2 border-black p-3 w-16 text-center">%</th>
                  <th className="border-2 border-black p-3 text-center">Indicadores</th>
                  <th className="border-2 border-black p-3">Evaluación formativa</th>
                </tr>
              </thead>
              <tbody>
                {instr.evaluationMatrix?.map((row, idx) => (
                  <tr key={idx} className="font-bold">
                    <td className="border-2 border-black p-3 text-black uppercase">{row.evidence}</td>
                    <td className="border-2 border-black p-3 text-center font-black text-black text-lg">{row.percentage}%</td>
                    <td className="border-2 border-black p-3 text-center text-black font-black">{row.indicators}</td>
                    <td className="border-2 border-black p-3 uppercase text-black font-black">{row.evaluationType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="bg-gray-200 p-2 text-[11px] font-black border-2 border-black uppercase mb-3 text-black">6. Calendarización Semanal (Planeado vs Real)</h3>
            <div className="space-y-4">
              {/* Primera parte: 1 a 10 */}
              {renderCalendarPart(1, 10)}
              {/* Segunda parte: 11 a 16 */}
              {renderCalendarPart(11, 16)}
            </div>
            
            <div className="mt-4 text-[8px] font-black uppercase text-black flex flex-wrap gap-6 bg-gray-50 p-3 border-2 border-black">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-black rounded-full"></div> ED: Evaluación Diagnóstica</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-black rounded-full"></div> EF: Evaluación Formativa</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-black rounded-full"></div> ES: Evaluación Sumativa</span>
              <span className="ml-auto font-black text-xs">Fecha de Elaboración: {creationDate}</span>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-32 mt-40 text-black pb-20">
             <div className="text-center flex flex-col justify-end min-h-[160px]">
               <div className="border-t-[3px] border-black pt-6 font-black uppercase text-[11px] tracking-tight">
                 Nombre y Firma del Docente
               </div>
               <div className="mt-2 text-[8px] italic">(Firma Autógrafa)</div>
             </div>
             <div className="text-center flex flex-col justify-end min-h-[160px]">
               <div className="border-t-[3px] border-black pt-6 font-black uppercase text-[11px] tracking-tight">
                 Vo. Bo. Jefe del Departamento de {course.profile || 'Ingeniería'}
               </div>
               <div className="mt-2 text-[8px] italic">(Sello Oficial)</div>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-6 rounded-[35px] border border-white/10 shadow-2xl no-print z-[10000] scale-110">
        <button 
          onClick={handleExportWord} 
          className="px-14 py-5 bg-cyan-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-cyan-500 transition-all flex items-center gap-3 shadow-xl active:scale-95 group"
        >
          <span className="text-lg group-hover:scale-125 transition-transform">📘</span> 
          Exportar a Word (Horizontal)
        </button>
      </div>
    </div>
  );
};

export default DidacticInstrumentationView;
