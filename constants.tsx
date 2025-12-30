import { Type } from "@google/genai";

// PROMPTS Y ESQUEMAS CONSTANTES
// Aseguramos que todas las constantes se exporten correctamente para evitar errores de build.

export const SKELETON_PROMPT = (prefs: any) => `
Actúa como un Diseñador Instruccional Senior del TecNM.

OBJETIVO:
Diseñar el TEMARIO ESTRUCTURAL para la materia: "${prefs.topic}".
Nivel: ${prefs.level}.

INSTRUCCIONES CRÍTICAS (LEER CUIDADOSAMENTE):
1. Si te he proporcionado IMÁGENES adjuntas, esas imágenes son el "Temario Oficial/Programa de Estudios".
2. **DEBES EXTRAER** los nombres de las unidades y temas EXACTAMENTE como aparecen en las imágenes.
3. NO INVENTES temas si están en las imágenes. Prioridad absoluta al contenido visual.
4. Si las imágenes muestran "Unidad 1: Sistemas Numéricos", TU DEBES generar "Unidad 1: Sistemas Numéricos", no otra cosa.
5. Si NO hay imágenes, propón un temario estándar de ingeniería.

REGLAS DE SALIDA:
- Genera la estructura en JSON.
- Idioma: Español.
`;

export const SKELETON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subjectCode: { type: Type.STRING },
    description: { type: Type.STRING },
    units: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Breve lista de subtemas copiados del temario oficial" }
        }
      }
    }
  },
  required: ["title", "units"]
};

export const UNIT_CONTENT_PROMPT = (unitTitle: string, unitSummary: string, level: string) => `
Eres un experto en Pedagogía de Ingeniería del TecNM. 
Desarrolla el contenido de la unidad: "${unitTitle}" (${unitSummary}).

REGLAS DE ORO DE ESTRUCTURA (OBLIGATORIO):
1. **MÍNIMO 4 ACTIVIDADES:** Debes generar AL MENOS 4 bloques de tipo 'activity' distribuidos en las lecciones.
   - Si la unidad es corta, divide las prácticas en partes más pequeñas para cumplir con el mínimo de 4.
   - RECUERDA: Las actividades valen el 90% de la calificación, necesitamos varias para promediar.
2. **TEST EN CADA LECCIÓN:** CADA lección debe finalizar OBLIGATORIAMENTE con un bloque tipo 'test' (Examen rápido).
   - Los tests valen el 10% de la calificación.

TIPOS DE BLOQUE:
- 'theory': Teoría explicativa.
- 'activity': Práctica, Cuadro Comparativo, Mapa Mental, Resolución de Problemas. SIEMPRE incluye 'rubric'.
- 'test': Preguntas de opción múltiple con retroalimentación.

No seas perezoso. El alumno necesita práctica constante.
`;

export const UNIT_CONTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    lessons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['theory', 'example', 'activity', 'test'] },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                testQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswerIndex: { type: Type.INTEGER },
                      feedback: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctAnswerIndex", "feedback"]
                  }
                },
                rubric: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterion: { type: Type.STRING },
                      points: { type: Type.NUMBER },
                      description: { type: Type.STRING }
                    },
                    required: ["criterion", "points", "description"]
                  }
                }
              },
              required: ["type", "title", "content"]
            }
          }
        },
        required: ["title", "blocks"]
      }
    }
  },
  required: ["lessons"]
};

export const GRADE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Calificación del 0 al 100" },
    authenticityScore: { type: Type.NUMBER, description: "Probabilidad de ser humano vs IA (0-100)" },
    generalFeedback: { type: Type.STRING, description: "Retroalimentación general" },
    aiDetectionReason: { type: Type.STRING, description: "Explicación técnica de sospecha de IA o validación humana" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["score", "authenticityScore", "generalFeedback", "aiDetectionReason", "strengths", "improvementAreas"]
};
