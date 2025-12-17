import { CourseId, Word } from '../types';

const CUSTOM_DATA_KEY = 'memoflow_custom_words_v1';

export const loadCustomWords = (): Record<CourseId, Word[]> => {
  try {
    const data = localStorage.getItem(CUSTOM_DATA_KEY);
    // Cast to expected type to handle case where some keys might be missing initially
    return data ? JSON.parse(data) : {} as Record<CourseId, Word[]>;
  } catch (e) {
    console.error("Failed to load custom words", e);
    return {} as Record<CourseId, Word[]>;
  }
};

export const saveCustomWords = (courseId: CourseId, newWords: Word[]) => {
  const current = loadCustomWords();
  const existingForCourse = current[courseId] || [];
  
  // Merge strategies: Avoid duplicates by ID
  const existingIds = new Set(existingForCourse.map(w => w.id));
  const uniqueNewWords = newWords.filter(w => !existingIds.has(w.id));
  
  current[courseId] = [...existingForCourse, ...uniqueNewWords];
  
  try {
    localStorage.setItem(CUSTOM_DATA_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    console.error("Failed to save custom words", e);
    return current;
  }
};

export const clearCustomWords = () => {
  localStorage.removeItem(CUSTOM_DATA_KEY);
};