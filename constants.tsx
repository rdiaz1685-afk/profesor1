import { Type } from "@google/genai";

// PROMPTS Y ESQUEMAS CONSTANTES

export const SKELETON_PROMPT = (prefs: any) => `
Actúa como un Diseñador Instruccional Senior del TecNM.

OBJETIVO:
Diseñar la estructura completa para la materia: "${prefs.topic}".
Nivel: ${prefs.level}.

INSTRUCCIONES CRÍTICAS:
1. Si hay imágenes de temario, EXTRAE las unidades exactamente.
2. Genera un temario de ingeniería profesional.
3. DISEÑA UN "PROYECTO INTEGRADOR FINAL" (finalProject) que evalúe todas las competencias del curso. Debe ser un reto técnico real.

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
          summary: { type: Type.STRING, description: "Breve lista de subtemas" }
        }
      }
    },
    finalProjects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          instructions: { type: Type.STRING },
          rubric: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterion: { type: Type.STRING },
                points: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  },
  required: ["title", "units", "finalProjects"]
};

export const UNIT_CONTENT_PROMPT = (unitTitle: string, unitSummary: string, level: string) => `
Eres un experto en Pedagogía de Ingeniería del TecNM. 
Desarrolla el contenido de la unidad: "${unitTitle}" (${unitSummary}).

REGLAS DE ORO DE EVALUACIÓN (90/10):
1. **MÍNIMO 4 ACTIVIDADES PRÁCTICAS:** Distribuye al menos 4 bloques tipo 'activity' (Mapas, Cuadros, Problemas). 
   - Estas actividades sumarán en total 90 puntos de la unidad. El sistema dividirá 90/N automáticamente.
2. **BLOQUE TEST OBLIGATORIO:** Cada lección termina con un 'test' de opción múltiple. El promedio de tests vale 10 puntos.

TIPOS DE BLOQUE:
- 'theory': Teoría profunda y técnica.
- 'activity': Práctica entregable. DEBE incluir 'rubric'.
- 'test': Evaluación rápida de comprensión.
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
    score: { type: Type.NUMBER },
    authenticityScore: { type: Type.NUMBER },
    generalFeedback: { type: Type.STRING },
    aiDetectionReason: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["score", "authenticityScore", "generalFeedback", "aiDetectionReason", "strengths", "improvementAreas"]
};
