export enum CourseId {
  JUNIOR_1600 = 'junior_1600',
  JUNIOR_PHRASES = 'junior_phrases',
  SENIOR_3500 = 'senior_3500',
  SENIOR_PHRASES = 'senior_phrases',
}

export interface Word {
  id: string;
  en: string; // English word or phrase
  zh: string; // Chinese meaning
  phonetic?: string;
  type?: string; // n., v., adj., etc.
  example?: string;
}

// Spaced Repetition Stage (0-7)
// 0: New
// 1: 5 mins
// 2: 30 mins
// 3: 12 hours
// 4: 1 day
// 5: 3 days
// 6: 7 days
// 7: 15 days (Mastered)
export interface UserProgress {
  wordId: string;
  stage: number;
  nextReview: number; // Timestamp
  lastReviewed: number; // Timestamp
}

export interface AppState {
  currentView: 'dashboard' | 'learn' | 'quiz';
  selectedCourse: CourseId;
  progress: Record<string, UserProgress>; // Map wordId to progress
}