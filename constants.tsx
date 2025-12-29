
import { Type } from "@google/genai";

export const SKELETON_PROMPT = (prefs: any) => `
Actúa como un Diseñador Instruccional Senior del TecNM.
Diseña el TEMARIO de un curso de nivel ${prefs.level} sobre: ${prefs.topic}.

REGLAS:
- Genera de 3 a 5 unidades.
- Unidad 1: Fundamentos.
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
          summary: { type: Type.STRING }
        }
      }
    }
  },
  required: ["title", "units"]
};

export const UNIT_CONTENT_PROMPT = (unitTitle: string, unitSummary: string, level: string) => `
Eres un experto en Pedagogía de Ingeniería del TecNM. 
Desarrolla el contenido de la unidad: "${unitTitle}" (${unitSummary}).

REGLAS DE ORO PARA EL FORMATO:
1. 'theory': Solo para lectura. Si pides que el alumno haga algo, ¡ESTÁ PROHIBIDO USAR ESTE TIPO!
2. 'activity': ÚSALO SIEMPRE que el bloque mencione: "El estudiante deberá", "Realizar", "Investigar", "Elaborar", "Cuadro", "Mapa", "Reporte".
   - TODO bloque de actividad DEBE tener una 'rubric'.
3. 'test': Solo para exámenes de opción múltiple.

Si el bloque es un "Cuadro Comparativo" o "Diagrama", CLASIFÍCALO COMO 'activity'. No ahorres tokens, genera la rúbrica.
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
