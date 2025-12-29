
import React, { useState, useRef } from 'react';
import { UserPreferences, CourseLevel, CourseFormat } from '../types';

interface CourseFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, isLoading }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    topic: '',
    level: CourseLevel.INTERMEDIO,
    profile: '',
    goal: '',
    time: '15 semanas, 1h diaria',
    format: CourseFormat.MIXTO,
    syllabusImages: []
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const processSyllabusPdf = async (file: File) => {
    setIsProcessingPdf(true);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageImages: string[] = [];
    const pagesToProcess = Math.min(pdf.numPages, 10);

    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    setPrefs(prev => ({ ...prev, syllabusImages: [...(prev.syllabusImages || []), ...pageImages] }));
    setPreviews(prev => [...prev, ...pageImages]);
    setIsProcessingPdf(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files) as File[];
    for (const file of fileArray) {
      if (file.type === 'application/pdf') await processSyllabusPdf(file);
      else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPrefs(prev => ({ ...prev, syllabusImages: [...(prev.syllabusImages || []), base64] }));
          setPreviews(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefs.topic && !prefs.syllabusImages?.length) {
      alert("Introduce un tema o carga el temario."); return;
    }
    onSubmit(prefs);
  };

  const inputClass = "w-full p-4 rounded-xl border border-white/10 bg-slate-950/50 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-sm font-medium";
  const labelClass = "block text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em] mb-2";

  return (
    <div className="max-w-5xl mx-auto glass-card rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
      <div className="p-8 bg-slate-900 border-b border-white/5">
        <h3 className="text-2xl font-black text-white tracking-tighter">Diseñar <span className="text-cyan-400">Nueva Materia</span></h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configuración Académica TecNM</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Nombre de la Materia</label>
              <input className={inputClass} placeholder="Ej: Mecánica de Suelos MSI-102" value={prefs.topic} onChange={e => setPrefs({...prefs, topic: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nivel</label>
                <select className={inputClass} value={prefs.level} onChange={e => setPrefs({...prefs, level: e.target.value as CourseLevel})}>
                  {Object.values(CourseLevel).map(v => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Carrera Destino</label>
                <input className={inputClass} placeholder="Ing. Civil" value={prefs.profile} onChange={e => setPrefs({...prefs, profile: e.target.value})} />
              </div>
            </div>
            <div>
               <label className={labelClass}>Duración Estimada</label>
               <input className={inputClass} value={prefs.time} onChange={e => setPrefs({...prefs, time: e.target.value})} />
            </div>
          </div>

          <div className="space-y-6">
            <label className={labelClass}>Programa o Temario (PDF o Foto)</label>
            <div className="p-10 border-2 border-dashed border-white/10 rounded-[35px] flex flex-col items-center justify-center text-center hover:border-cyan-500/30 transition-all bg-slate-950/20">
              <input type="file" id="syllabus" className="hidden" multiple accept="image/*,.pdf" onChange={handleFileChange} />
              <label htmlFor="syllabus" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-4 text-2xl">📄</div>
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Cargar Archivos del Programa</span>
                <p className="text-slate-500 text-[9px] mt-2 uppercase">Extraeremos las unidades automáticamente</p>
              </label>
            </div>
            {previews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {previews.map((img, i) => <img key={i} src={img} className="h-20 w-14 object-cover rounded-xl border border-white/10" />)}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isProcessingPdf}
          className="w-full py-6 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-cyan-400 hover:scale-[1.01] transition-all disabled:opacity-50"
        >
          {isLoading ? 'Sincronizando con Nodo IA...' : 'GENERAR ESTRUCTURA ACADÉMICA'}
        </button>
      </form>
    </div>
  );
};

export default CourseForm;
