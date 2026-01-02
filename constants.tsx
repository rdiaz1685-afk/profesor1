
import { Type } from "@google/genai";

export const SKELETON_PROMPT = (prefs: any) => `
Actúa como un Auditor de Programas Académicos del TecNM. 
Tu misión es TRANSCRIBIR con exactitud absoluta el temario de la materia: "${prefs.topic}".

REGLAS DE RIGOR INSTITUCIONAL (INCUMPLIMIENTO NO PERMITIDO):
1. UNIDADES INDEPENDIENTES: Si el Programa Nacional define 6 unidades, DEBES generar 6 unidades en el JSON. Está PROHIBIDO combinar unidades (ej. no juntar Unidad 1 y 2).
2. ORDEN NUMÉRICO ESTRICTO: Sigue la secuencia 1, 2, 3... del temario original.
3. TÍTULOS LITERALES: Los nombres de las unidades deben ser idénticos a los del documento cargado.
4. DETECCIÓN DE TABLA DE CONTENIDO: Prioriza las imágenes/PDF proporcionados. Identifica la lista de unidades y refléjala sin omisiones.

CONTEXTO DEL CURSO:
- Nivel: ${prefs.level}
- Carrera: ${prefs.profile}
- Objetivo: Cumplir con la instrumentación didáctica oficial.

SALIDA: JSON puro. Si no hay temario en las imágenes, usa el programa estándar vigente del TecNM para esa materia, pero manteniendo la estructura de unidades separadas.
`;

export const SKELETON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subjectCode: { type: Type.STRING },
    description: { type: Type.STRING },
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
            }
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
            }
          }
        },
        calendar: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.NUMBER },
              planned: { type: Type.STRING }
            }
          }
        }
      }
    },
    units: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING }
        }
      }
    }
  },
  required: ["title", "units"]
};

export const UNIT_CONTENT_PROMPT = (unitTitle: string, unitSummary: string, level: string) => `
Experto en Ingeniería TecNM. Desarrolla el contenido técnico para la unidad específica: "${unitTitle}".

REQUISITOS DE CONTENIDO:
1. Nivel de profundidad: ${level}.
2. Genera 2 lecciones por unidad.
3. Cada lección debe incluir: 
   - 'theory': Explicación técnica exhaustiva.
   - 'example': Ejercicio resuelto paso a paso.
   - 'activity': Actividad práctica (40 pts) con rúbrica detallada.
   - 'test': Evaluación rápida (10 pts).

No utilices lenguaje genérico. Usa terminología propia de la asignatura.
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
