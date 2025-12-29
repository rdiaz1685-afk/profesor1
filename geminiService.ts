
import { GoogleGenAI } from "@google/genai";
import { UserPreferences, Course, AuthorizedStudent, Lesson, Unit } from "./types";
import { SKELETON_PROMPT, SKELETON_SCHEMA, UNIT_CONTENT_PROMPT, UNIT_CONTENT_SCHEMA } from "./constants";

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
  if (!apiKey) throw new Error("API_KEY no configurada.");
  return new GoogleGenAI({ apiKey });
};

export async function generateCourseSkeleton(prefs: UserPreferences): Promise<Course> {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: SKELETON_PROMPT(prefs) }] }],
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
    throw new Error(`Error: ${err.message}`);
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
  const ai = getAiClient();
  const prompt = `
    Actúa como un Sínodo Evaluador del TecNM experto en detección de fraude académico por IA.
    Evalúa la siguiente entrega de alumno que consta de:
    1. ACTIVIDAD: "${submission.content}"
    2. REFLEXIÓN PERSONAL (BAJO PRESIÓN DE TIEMPO): "${submission.reflection}"

    TAREAS:
    - Compara el estilo de redacción entre la Actividad y la Reflexión.
    - Si la Actividad parece perfecta (estilo GPT) pero la Reflexión es vaga, incoherente o usa un lenguaje muy distinto, penaliza la "authenticityScore".
    - Evalúa según la rúbrica general de ingeniería.

    RESPONDE ÚNICAMENTE ESTE JSON:
    {
      "score": número (0-100),
      "authenticityScore": número (0-100, donde 100 es humano total),
      "generalFeedback": "string",
      "aiDetectionReason": "string (por qué crees que usó o no IA)",
      "strengths": ["string"],
      "improvementAreas": ["string"]
    }
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJson(response.text || "");
  } catch {
    return { score: 0, authenticityScore: 0, generalFeedback: "Error de conexión." };
  }
}
