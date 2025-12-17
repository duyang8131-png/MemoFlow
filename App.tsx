import React, { useState, useEffect } from 'react';
import { CourseId, AppState, UserProgress, Word } from './types';
import { WORD_DATA } from './data';
import { loadProgress, saveProgress, calculateNextReview, getDueWords } from './services/srsService';
import { loadCustomWords, saveCustomWords, clearCustomWords } from './services/customDataService';
import Dashboard from './components/Dashboard';
import FlashcardMode from './components/FlashcardMode';
import QuizMode from './components/QuizMode';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    selectedCourse: CourseId.JUNIOR_1600,
    progress: {},
  });

  const [customWords, setCustomWords] = useState<Record<CourseId, Word[]>>({} as any);

  // Load progress and custom words on mount
  useEffect(() => {
    const loadedProgress = loadProgress();
    const loadedCustom = loadCustomWords();
    setState(prev => ({ ...prev, progress: loadedProgress }));
    setCustomWords(loadedCustom);
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    if (Object.keys(state.progress).length > 0) {
      saveProgress(state.progress);
    }
  }, [state.progress]);

  const handleSelectCourse = (courseId: CourseId, mode: 'learn' | 'quiz') => {
    setState(prev => ({ ...prev, selectedCourse: courseId, currentView: mode }));
  };

  const handleFinishSession = (results: { wordId: string; success: boolean }[]) => {
    setState(prev => {
      const newProgress = { ...prev.progress };
      
      results.forEach(r => {
        const current = newProgress[r.wordId] || { wordId: r.wordId, stage: 0, nextReview: 0, lastReviewed: 0 };
        const { stage, nextReview } = calculateNextReview(current.stage, r.success);
        
        newProgress[r.wordId] = {
          ...current,
          stage,
          nextReview,
          lastReviewed: Date.now()
        };
      });

      return {
        ...prev,
        progress: newProgress,
        currentView: 'dashboard'
      };
    });
  };

  const handleImport = (courseId: CourseId, json: string) => {
      try {
          const words = JSON.parse(json);
          const updated = saveCustomWords(courseId, words);
          setCustomWords(updated);
      } catch (e) {
          console.error(e);
      }
  };

  const handleClearCustom = () => {
      if(confirm("Are you sure you want to delete all custom imported words?")) {
        clearCustomWords();
        setCustomWords({} as any);
      }
  };

  const getAllWordsForCourse = (courseId: CourseId) => {
      const staticWords = WORD_DATA[courseId] || [];
      const custom = customWords[courseId] || [];
      return [...staticWords, ...custom];
  };

  const getSessionWords = () => {
    const allWords = getAllWordsForCourse(state.selectedCourse);
    const allIds = allWords.map(w => w.id);
    const { due, newWords } = getDueWords(allIds, state.progress);
    
    // Prioritize due reviews, then new words. Limit session to 15 items for bite-sized learning.
    const sessionIds = [...due, ...newWords].slice(0, 15);
    
    return allWords.filter(w => sessionIds.includes(w.id));
  };

  const renderContent = () => {
    const sessionWords = getSessionWords();
    const allCourseWords = getAllWordsForCourse(state.selectedCourse);

    switch (state.currentView) {
      case 'dashboard':
        // Calculate custom counts for dashboard
        const customCounts: Record<string, number> = {};
        Object.keys(customWords).forEach(k => {
            customCounts[k] = customWords[k as CourseId].length;
        });

        return (
            <Dashboard 
                progress={state.progress} 
                onSelectCourse={handleSelectCourse} 
                customWordCounts={customCounts}
                onImport={handleImport}
                onClearCustom={handleClearCustom}
            />
        );
      case 'learn':
        return (
          <FlashcardMode 
            words={sessionWords} 
            onFinish={handleFinishSession} 
            onExit={() => setState(prev => ({ ...prev, currentView: 'dashboard' }))} 
          />
        );
      case 'quiz':
        return (
          <QuizMode 
            words={sessionWords}
            allWords={allCourseWords}
            onFinish={handleFinishSession}
            onExit={() => setState(prev => ({ ...prev, currentView: 'dashboard' }))}
          />
        );
      default:
        return <div>Error</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
       {renderContent()}
    </div>
  );
};

export default App;