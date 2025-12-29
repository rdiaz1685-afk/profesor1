
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
      // Intento de limpieza profunda si el modelo devuelve markdown
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

function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function parseStudentList(raw: string): AuthorizedStudent[] {
  if (!raw) return [];
  return raw.split('\n')
    .map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        return { id: parts[0], name: parts.slice(1).join(" "), pin: generateRandomPin() };
      }
      return null;
    })
    .filter((s): s is AuthorizedStudent => s !== null);
}

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("API_KEY no detectada. Por favor, asegúrese de que la clave de API esté configurada.");
  }
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
    if (!raw || !raw.units) throw new Error("La IA no devolvió una estructura válida.");

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
      studentList: parseStudentList(prefs.studentListRaw || "")
    };
  } catch (err: any) {
    throw new Error(`Error generando temario: ${err.message}`);
  }
}

export async function generateUnitContent(unit: Unit, level: string): Promise<Lesson[]> {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: UNIT_CONTENT_PROMPT(unit.title, unit.summary, level) }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: UNIT_CONTENT_SCHEMA,
      },
    });

    const rawData = cleanAndParseJson(response.text || "");
    if (!rawData || !rawData.lessons) throw new Error("Respuesta de lecciones vacía.");

    return (rawData.lessons || []).map((l: any, i: number) => ({
      id: `l_${Date.now()}_${i}`,
      title: l.title || `Lección ${i + 1}`,
      blocks: (l.blocks || []).map((b: any) => ({
        // Normalizamos el tipo a minúsculas para asegurar coincidencia en UI
        type: (b.type || 'theory').toLowerCase() as any,
        title: b.title || 'Tema',
        content: b.content || 'Sin contenido.',
        competency: b.competency || '',
        weight: b.weight || 0,
        rubric: b.rubric || [],
        testQuestions: b.testQuestions || []
      }))
    }));
  } catch (err: any) {
    throw new Error(`Error generando contenido de unidad: ${err.message}`);
  }
}

export async function gradeSubmission(submission: string, rubric: any[], lessonTitle: string, context: string) {
  const ai = getAiClient();
  const prompt = `
    Actúa como un Sínodo Evaluador de Ingeniería del TecNM. 
    Tu objetivo es revisar la entrega del alumno de forma crítica y pedagógica.

    CONTEXTO DE LA LECCIÓN: "${lessonTitle}"
    CONTENIDO TEÓRICO: "${context}"
    ENTREGA DEL ALUMNO: "${submission}"
    RÚBRICA: ${JSON.stringify(rubric)}

    INSTRUCCIONES DE EVALUACIÓN:
    1. Analiza si la respuesta demuestra comprensión profunda.
    2. Asigna puntaje criterio por criterio según la rúbrica.
    3. Detecta errores técnicos.

    RESPONDE ÚNICAMENTE UN JSON:
    {
      "score": número,
      "maxScore": número,
      "breakdown": [ { "criterion": "string", "score": número, "feedback": "string" } ],
      "generalFeedback": "string",
      "strengths": ["string"],
      "improvementAreas": ["string"],
      "academicIntegrity": "string"
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
    return { score: 0, maxScore: 100, generalFeedback: "Error de conexión con el sínodo evaluador." };
  }
}
