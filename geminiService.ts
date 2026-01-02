import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserPreferences, Course, Lesson, Unit } from "./types";
import { SKELETON_PROMPT, SKELETON_SCHEMA, UNIT_CONTENT_PROMPT, UNIT_CONTENT_SCHEMA, GRADE_SCHEMA } from "./constants";

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

function cleanAndParseJson(text: string): any {
  if (!text) return null;
  let trimmed = text.trim();
  if (trimmed.startsWith("```json")) trimmed = trimmed.replace(/^```json/, "");
  if (trimmed.endsWith("```")) trimmed = trimmed.replace(/```$/, "");
  
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  
  let start = -1, end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace; end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket; end = lastBracket;
  }
  
  if (start !== -1 && end !== -1) trimmed = trimmed.substring(start, end + 1);
  
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    console.error("Error parseando JSON de la IA:", e);
    return null;
  }
}

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function generateCourseSkeleton(prefs: UserPreferences): Promise<Course> {
  const ai = getAiClient();
  const parts: any[] = [{ text: SKELETON_PROMPT(prefs) }];
  
  if (prefs.syllabusImages && prefs.syllabusImages.length > 0) {
    prefs.syllabusImages.forEach((imgBase64) => {
      const mimeTypeMatch = imgBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
      if (mimeTypeMatch) {
        const mimeType = mimeTypeMatch[1];
        const data = imgBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
        parts.push({
          inlineData: { mimeType: mimeType, data: data }
        });
      }
    });
  }

  try {
    const response = await withTimeout<GenerateContentResponse>(
      ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: { parts: parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: SKELETON_SCHEMA,
          temperature: 0.0 
        },
      }),
      120000,
      "TIMEOUT_SKELETON"
    );
    
    const raw = cleanAndParseJson(response.text || "");
    if (!raw) throw new Error("JSON_INVALID");
    const courseId = `course_${Date.now()}`;
    
    return {
      id: courseId,
      createdAt: Date.now(),
      title: raw.title || prefs.topic,
      duration: raw.duration || "64 horas",
      subjectCode: raw.subjectCode || "TEC-GEN",
      description: raw.description || "",
      instrumentation: raw.instrumentation,
      units: (raw.units || []).map((u: any, i: number) => ({
        id: `${courseId}_u${i}`,
        title: u.title || `Unidad ${i+1}`,
        summary: u.summary || "",
        lessons: [],
      })),
      studentList: [],
      masterGrades: []
    };
  } catch (error) { 
    console.error("Error en generateCourseSkeleton:", error);
    throw error; 
  }
}

export async function generateUnitContent(unit: Unit, level: string, retryCount = 0): Promise<Lesson[]> {
  const ai = getAiClient();
  const enhancedPrompt = UNIT_CONTENT_PROMPT(unit.title, unit.summary, level);

  try {
    const response = await withTimeout<GenerateContentResponse>(
      ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: enhancedPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: UNIT_CONTENT_SCHEMA,
          temperature: 0.1
        },
      }),
      60000,
      "TIMEOUT_UNIT"
    );

    const rawData = cleanAndParseJson(response.text || "");
    if (!rawData || !rawData.lessons) throw new Error("JSON_PARSE_FAILED");

    return rawData.lessons.map((l: any, i: number) => ({
      id: `${unit.id}_l${i}_${Date.now()}`,
      title: l.title || `Lección ${i + 1}`,
      blocks: (l.blocks || []).map((b: any) => ({
        type: b.type || 'theory',
        title: b.title || 'Contenido',
        content: b.content || 'Sin contenido disponible.',
        weight: b.weight || 0,
        testQuestions: b.testQuestions || [],
        rubric: b.rubric || [] 
      }))
    }));
  } catch (error: any) {
    if (retryCount < 1 && error.message === "TIMEOUT_UNIT") {
      return generateUnitContent(unit, level, retryCount + 1);
    }
    return [{
      id: `${unit.id}_err`,
      title: "Error de Generación",
      blocks: [{
        type: 'theory',
        title: "Nota del Sistema",
        content: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}.`,
        weight: 0
      }]
    }];
  }
}

export async function gradeSubmission(submission: any) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Evalúa técnicamente la siguiente entrega basada en los criterios de ingeniería del TecNM.
    Actividad: ${submission.activityTitle}
    Contenido del alumno: ${submission.content}`,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: GRADE_SCHEMA,
      temperature: 0.0
    }
  });
  return cleanAndParseJson(response.text || "") || { score: 0 };
}