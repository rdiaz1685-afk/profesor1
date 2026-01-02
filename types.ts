
export enum CourseLevel {
  PRINCIPIANTE = 'Principiante',
  INTERMEDIO = 'Intermedio',
  AVANZADO = 'Avanzado'
}

export enum CourseFormat {
  LECTURAS_BREVES = 'Lecturas breves',
  LECTURAS_EJERCICIOS = 'Lecturas + ejercicios',
  ESQUEMAS_PROBLEMAS = 'Esquemas + problemas',
  MIXTO = 'Mixto'
}

export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  feedback: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | string;
  joinedAt: number;
}

export interface AuthorizedStudent {
  id: string;
  name: string;
  controlNumber: string;
}

export interface StudentSubmission {
  studentName: string;
  studentControlNumber: string;
  lessonTitle: string;
  activityTitle: string;
  content: string;
  attachment?: string;
  timestamp: number;
  // Campos de calificación (auditados por IA)
  score?: number;
  aiFeedback?: string;
  authenticityScore?: number;
  aiDetectionReason?: string;
  strengths?: string[];
  improvementAreas?: string[];
}

export interface Grade {
  lessonId: string;
  type: 'practice' | 'test';
  score: number;
  maxScore: number;
  feedback?: string;
  date: number;
}

export interface LessonBlock {
  type: 'theory' | 'example' | 'activity' | 'test';
  title: string;
  content: string;
  competency?: string;
  weight?: number;
  testQuestions?: Question[];
  rubric?: { criterion: string; points: number; description: string; }[];
}

export interface Lesson {
  id: string;
  title: string;
  blocks: LessonBlock[];
}

export interface Unit {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
  competencyDescription?: string;
}

export interface DidacticInstrumentation {
  characterization: string;
  didacticIntent: string;
  subjectCompetency: string;
  analysisByUnit: {
    unitTitle: string;
    competencyDescription: string;
    indicatorsOfReach: string;
    hours: string;
  }[];
  evaluationMatrix: {
    evidence: string;
    percentage: number;
    indicators: string;
    evaluationType: string;
  }[];
  calendar: {
    week: number;
    planned: string;
  }[];
}

export interface Course {
  id: string;
  createdAt: number;
  title: string;
  duration: string;
  subjectCode?: string;
  description: string;
  units: Unit[];
  instrumentation?: DidacticInstrumentation;
  // Gestión de Alumnos y Calificaciones
  studentList: AuthorizedStudent[];
  masterGrades: StudentSubmission[];
}

export interface UserPreferences {
  topic: string;
  level: CourseLevel;
  profile: string;
  goal: string;
  time: string;
  format: CourseFormat;
  syllabusImages?: string[];
}
