
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
}

export interface RubricCriterion {
  criterion: string;
  points: number;
  description: string;
}

export interface AuthorizedStudent {
  id: string;
  name: string;
  pin: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  role: 'admin' | 'editor';
  joinedAt: number;
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
  weight?: number; // Valor porcentual de la actividad en la unidad (ej: 20)
  rubric?: RubricCriterion[];
  testQuestions?: Question[];
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
}

export interface Course {
  id: string;
  createdAt: number;
  title: string;
  duration: string;
  subjectCode?: string;
  description: string;
  units: Unit[];
  finalProjects: string[];
  studentList: AuthorizedStudent[];
}

export interface UserPreferences {
  topic: string;
  level: CourseLevel;
  profile: string;
  goal: string;
  time: string;
  format: CourseFormat;
  syllabusImages?: string[];
  studentListRaw?: string;
}
