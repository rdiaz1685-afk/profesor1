
import { GoogleGenAI } from "@google/genai";
import { UserPreferences, Course, AuthorizedStudent, Lesson, Unit } from "./types";
import { SKELETON_PROMPT, SKELETON_SCHEMA, UNIT_CONTENT_PROMPT, UNIT_CONTENT_SCHEMA, GRADE_SCHEMA } from "./constants";

function cleanAndParseJson(text: string): any {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    try {
      let cleanText = trimmed.replace(/```json/gi, "").replace(/```/g, "").trim();
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleanText.substring(start, end + 1));
      }
      return null;
    } catch (err) {
      console.error("Fallo crítico parseando JSON de la IA:", text);
      return null;
    }
  }
}

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING: No has configurado la API_KEY en las variables de entorno de Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateCourseSkeleton(prefs: UserPreferences): Promise<Course> {
  const ai = getAiClient();
  try {
    // Construimos el contenido incluyendo imágenes si existen
    const contentParts: any[] = [{ text: SKELETON_PROMPT(prefs) }];

    if (prefs.syllabusImages && prefs.syllabusImages.length > 0) {
      prefs.syllabusImages.forEach((imgBase64) => {
        // Extraemos solo la parte base64 sin el encabezado data:image...
        const base64Data = imgBase64.split(',')[1]; 
        if (base64Data) {
          contentParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          });
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Usamos un modelo multimodal capaz de ver las imágenes del PDF
      contents: [{ parts: contentParts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: SKELETON_SCHEMA,
      },
    });

    const raw = cleanAndParseJson(response.text || "");
    return {
      id: `course_${Date.now()}`,
      createdAt: Date.now(),
      title: raw.title || prefs.topic,
      duration: "64 horas",
      subjectCode: raw.subjectCode || "TEC-GEN",
      description: raw.description || "",
      units: (raw.units || []).map((u: any, i: number) => ({
        id: `u${i}`,
        title: u.title || `Unidad ${i+1}`,
        summary: u.summary || "Contenido pendiente.",
        lessons: []
      })),
      finalProjects: [],
      studentList: []
    };
  } catch (err: any) {
    throw err;
  }
}

export async function generateUnitContent(unit: Unit, level: string): Promise<Lesson[]> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: UNIT_CONTENT_PROMPT(unit.title, unit.summary, level) }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: UNIT_CONTENT_SCHEMA,
    },
  });

  const rawData = cleanAndParseJson(response.text || "");
  return (rawData.lessons || []).map((l: any, i: number) => ({
    id: `l_${Date.now()}_${i}`,
    title: l.title || `Lección ${i + 1}`,
    blocks: (l.blocks || []).map((b: any) => ({
      type: (b.type || 'theory').toLowerCase() as any,
      title: b.title || 'Tema',
      content: b.content || 'Sin contenido.',
      rubric: b.rubric || [],
      testQuestions: b.testQuestions || []
    }))
  }));
}

export async function gradeSubmission(submission: any) {
  try {
    const ai = getAiClient();
    const prompt = `
      Actúa como un Sínodo Evaluador del TecNM experto en detección de fraude académico por IA.
      Evalúa la siguiente entrega de alumno:
      
      1. TÍTULO LECCIÓN: "${submission.lessonTitle}"
      2. ACTIVIDAD REALIZADA: "${submission.content}"
      3. REFLEXIÓN DE DEFENSA (ESTO ES LO MÁS IMPORTANTE): "${submission.reflection}"

      TAREAS:
      - Analiza si el lenguaje de la 'Actividad' es demasiado genérico/robótico.
      - Compara con la 'Reflexión'. Si la reflexión es pobre pero la actividad es perfecta, baja la 'authenticityScore'.
      - Proporciona retroalimentación constructiva.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: GRADE_SCHEMA 
      }
    });

    const parsed = cleanAndParseJson(response.text || "");
    if (!parsed) throw new Error("La IA no devolvió un JSON válido.");
    return parsed;
  } catch (err: any) {
    console.error("Error en gradeSubmission:", err);
    throw err;
  }
}
