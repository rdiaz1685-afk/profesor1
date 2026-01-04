import { Type } from "@google/genai";

export const SKELETON_PROMPT = (prefs: any) => `
Actúa como un Auditor de Programas Académicos del TecNM de alto nivel. 
Tu misión es diseñar la estructura completa de la materia: "${prefs.topic}".

REGLAS DE RIGOR INSTITUCIONAL (ESTRICTO):
1. PROHIBIDO USAR "N/A": Todos los campos deben contener información técnica real y coherente.
2. DISTRIBUCIÓN DE HORAS: Calcula y asigna horas reales (Teóricas/Prácticas) para cada unidad basándote en un total de 64 horas semestrales.
3. MATRIZ DE EVALUACIÓN: Debe sumar exactamente 100%. Incluye evidencias como: Examen escrito, Prácticas de laboratorio, Proyecto integrador y Portafolio.
4. CALENDARIZACIÓN: Planea actividades para las 16 semanas. Usa "ED" (Evaluación Diagnóstica) en la semana 1, y "EF/ES" en los cierres de unidad.
5. INSTRUMENTACIÓN: La Caracterización e Intención Didáctica deben tener al menos 3 párrafos de profundidad técnica.

CONTEXTO:
- Nivel: ${prefs.level}
- Carrera: ${prefs.profile}
- Formato: ${prefs.format}

SALIDA: JSON puro siguiendo el esquema. No añadas texto fuera del JSON.
`;

export const SKELETON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subjectCode: { type: Type.STRING },
    description: { type: Type.STRING },
    duration: { type: Type.STRING },
    instrumentation: {
      type: Type.OBJECT,
      properties: {
        characterization: { type: Type.STRING },
        didacticIntent: { type: Type.STRING },
        subjectCompetency: { type: Type.STRING },
        analysisByUnit: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              unitTitle: { type: Type.STRING },
              competencyDescription: { type: Type.STRING },
              indicatorsOfReach: { type: Type.STRING },
              hours: { type: Type.STRING }
            },
            required: ["unitTitle", "competencyDescription", "indicatorsOfReach", "hours"]
          }
        },
        evaluationMatrix: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              evidence: { type: Type.STRING },
              percentage: { type: Type.NUMBER },
              indicators: { type: Type.STRING },
              evaluationType: { type: Type.STRING }
            },
            required: ["evidence", "percentage", "indicators", "evaluationType"]
          }
        },
        calendar: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.NUMBER },
              planned: { type: Type.STRING }
            },
            required: ["week", "planned"]
          }
        }
      },
      required: ["characterization", "didacticIntent", "subjectCompetency", "analysisByUnit", "evaluationMatrix", "calendar"]
    },
    units: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["title", "summary"]
      }
    }
  },
  required: ["title", "subjectCode", "description", "instrumentation", "units"]
};

export const UNIT_CONTENT_PROMPT = (unitTitle: string, unitSummary: string, level: string) => `
Como experto en Ingeniería Superior, desarrolla el contenido técnico exhaustivo para: "${unitTitle}".

ESTRUCTURA REQUERIDA:
- Genera 2 lecciones profundas.
- Incluye bloques de teoría técnica, ejemplos matemáticos o de diseño, y una actividad práctica de alta exigencia (40 pts).
- El examen (test) debe evaluar razonamiento crítico, no solo memoria.
- Usa terminología avanzada acorde al nivel ${level}.

Evita introducciones innecesarias. Ve directo al contenido técnico.
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
                weight: { type: Type.NUMBER },
                rubric: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterion: { type: Type.STRING },
                      points: { type: Type.NUMBER },
                      description: { type: Type.STRING }
                    }
                  }
                },
                testQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswerIndex: { type: Type.INTEGER },
                      feedback: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const GRADE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    authenticityScore: { type: Type.NUMBER },
    generalFeedback: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};
