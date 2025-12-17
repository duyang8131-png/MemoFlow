import React, { useState, useEffect, useRef } from 'react';
import { Word, UserProgress } from '../types';
import { getWordInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Actually, we'll strip this dependency to keep it simple, just render text with basic breaks.

interface Props {
  words: Word[];
  onFinish: (results: { wordId: string; success: boolean }[]) => void;
  onExit: () => void;
}

const FlashcardMode: React.FC<Props> = ({ words, onFinish, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{ wordId: string; success: boolean }[]>([]);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // If no words to learn
  if (!words || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
        <p className="text-gray-500 mb-6">No words due for review in this category.</p>
        <button onClick={onExit} className="bg-primary text-white px-6 py-3 rounded-xl font-bold">Back to Dashboard</button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const isLast = currentIndex === words.length - 1;

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Reset state on new word
    setIsFlipped(false);
    setAiContent(null);
    // Auto-play audio when card appears (optional, maybe distracting, better on click or flip)
  }, [currentIndex]);

  const handleResult = (success: boolean) => {
    const newResults = [...results, { wordId: currentWord.id, success }];
    setResults(newResults);

    if (isLast) {
      onFinish(newResults);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const fetchAiInsight = async () => {
    setIsLoadingAi(true);
    const content = await getWordInsights(currentWord);
    setAiContent(content);
    setIsLoadingAi(false);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">
          <i className="fas fa-times text-xl"></i>
        </button>
        <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex) / words.length) * 100}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-500">{currentIndex + 1}/{words.length}</span>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex flex-col justify-center perspective-1000 mb-8">
        <div 
          className={`relative w-full aspect-[3/4] transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          {/* Front */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 backface-hidden z-10">
            <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-8">Word</span>
            <h2 className="text-5xl font-black text-gray-800 mb-4 text-center">{currentWord.en}</h2>
            {currentWord.phonetic && (
               <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                 <span>{currentWord.phonetic}</span>
                 <button 
                    onClick={(e) => { e.stopPropagation(); playAudio(currentWord.en); }}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-primary hover:text-indigo-700"
                 >
                   <i className="fas fa-volume-up text-xs"></i>
                 </button>
               </div>
            )}
            <p className="absolute bottom-8 text-gray-400 text-sm animate-bounce">Tap to flip</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col p-8 backface-hidden rotate-y-180 overflow-y-auto">
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">{currentWord.en}</h3>
                    <div className="text-gray-500 text-sm">{currentWord.type}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); playAudio(currentWord.en); }}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-primary hover:bg-gray-200"
                >
                  <i className="fas fa-volume-up"></i>
                </button>
             </div>

             <div className="mb-6">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Meaning</h4>
               <p className="text-xl text-gray-800 font-medium">{currentWord.zh}</p>
             </div>

             {currentWord.example && (
                <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <h4 className="text-xs font-bold text-yellow-600 uppercase mb-2">Example</h4>
                  <p className="text-gray-700 italic">"{currentWord.example}"</p>
                </div>
             )}

             {/* AI Section */}
             <div className="mt-auto pt-4 border-t border-gray-100">
               {!aiContent ? (
                 <button 
                    onClick={(e) => { e.stopPropagation(); fetchAiInsight(); }}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-100"
                    disabled={isLoadingAi}
                 >
                   {isLoadingAi ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-robot"></i>}
                   Ask AI Deep Dive
                 </button>
               ) : (
                 <div className="bg-indigo-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-line">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-indigo-600"><i className="fas fa-robot"></i> AI Insights</span>
                   </div>
                   {aiContent.replace(/[*#]/g, '')}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`grid grid-cols-2 gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={() => handleResult(false)}
          className="bg-red-50 text-red-600 border border-red-200 py-4 rounded-2xl font-bold text-lg hover:bg-red-100 active:scale-95 transition-transform"
        >
          <i className="fas fa-times-circle mr-2"></i> Forgot
        </button>
        <button 
          onClick={() => handleResult(true)}
          className="bg-green-500 text-white shadow-lg shadow-green-200 py-4 rounded-2xl font-bold text-lg hover:bg-green-600 active:scale-95 transition-transform"
        >
          <i className="fas fa-check-circle mr-2"></i> Knew it
        </button>
      </div>
    </div>
  );
};

export default FlashcardMode;