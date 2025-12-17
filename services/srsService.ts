import { UserProgress } from "../types";

// Stage intervals in milliseconds
const INTERVALS = [
  0,                  // Stage 0: Immediate (New)
  5 * 60 * 1000,      // Stage 1: 5 minutes
  30 * 60 * 1000,     // Stage 2: 30 minutes
  12 * 60 * 60 * 1000,// Stage 3: 12 hours
  24 * 60 * 60 * 1000,// Stage 4: 1 day
  2 * 24 * 60 * 60 * 1000,// Stage 5: 2 days
  4 * 24 * 60 * 60 * 1000,// Stage 6: 4 days
  7 * 24 * 60 * 60 * 1000,// Stage 7: 7 days
  15 * 24 * 60 * 60 * 1000 // Stage 8: 15 days
];

const STORAGE_KEY = 'memoflow_progress_v1';

export const loadProgress = (): Record<string, UserProgress> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load progress", e);
    return {};
  }
};

export const saveProgress = (progress: Record<string, UserProgress>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
};

export const calculateNextReview = (currentStage: number, isCorrect: boolean): { stage: number, nextReview: number } => {
  let newStage = currentStage;
  
  if (isCorrect) {
    newStage = Math.min(currentStage + 1, INTERVALS.length - 1);
  } else {
    // If wrong, punish heavily but not all the way to 0 to avoid frustration, unless it was already low
    newStage = Math.max(1, Math.floor(currentStage / 2)); 
  }

  const interval = INTERVALS[newStage];
  const nextReview = Date.now() + interval;

  return { stage: newStage, nextReview };
};

export const getDueWords = (allWordIds: string[], progress: Record<string, UserProgress>) => {
  const now = Date.now();
  const due: string[] = [];
  const newWords: string[] = [];

  allWordIds.forEach(id => {
    const p = progress[id];
    if (!p) {
      newWords.push(id);
    } else if (p.nextReview <= now) {
      due.push(id);
    }
  });

  return { due, newWords };
};