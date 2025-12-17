import React, { useState, useMemo } from 'react';
import { Word } from '../types';

interface Props {
  words: Word[];
  allWords: Word[]; // Needed for distractors
  onFinish: (results: { wordId: string; success: boolean }[]) => void;
  onExit: () => void;
}

const QuizMode: React.FC<Props> = ({ words, allWords, onFinish, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<{ wordId: string; success: boolean }[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // If no words
  if (!words || words.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">No Words to Quiz</h2>
        <button onClick={onExit} className="bg-primary text-white px-6 py-3 rounded-xl font-bold mt-4">Back</button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Generate options (1 correct, 3 distractors)
  const options = useMemo(() => {
    const distractors = allWords
      .filter(w => w.id !== currentWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    const combined = [...distractors, currentWord].sort(() => 0.5 - Math.random());
    return combined;
  }, [currentWord, allWords]);

  const handleSelect = (index: number) => {
    if (selectedOption !== null) return; // Prevent double click

    const selected = options[index];
    const correct = selected.id === currentWord.id;
    
    setSelectedOption(index);
    setIsCorrect(correct);
    
    // Auto advance after short delay
    setTimeout(() => {
        const newResults = [...results, { wordId: currentWord.id, success: correct }];
        setResults(newResults);
        
        if (currentIndex === words.length - 1) {
            setShowSummary(true);
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        }
    }, 1500);
  };

  if (showSummary) {
      const correctCount = results.filter(r => r.success).length;
      return (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-flip">
              <div className="bg-white p-10 rounded-3xl shadow-xl border-2 border-primary max-w-sm w-full">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">Quiz Complete!</h2>
                  <p className="text-gray-500 mb-8">Here is how you performed</p>
                  
                  <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                      <div className="absolute inset-0 border-8 border-gray-100 rounded-full"></div>
                      <div 
                        className="absolute inset-0 border-8 border-primary rounded-full" 
                        style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)` }} // Simple visual approximation
                      ></div>
                      <div className="text-4xl font-bold text-primary">
                          {Math.round((correctCount / words.length) * 100)}%
                      </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 mb-8 px-4">
                      <div className="text-center">
                          <div className="text-green-500 font-bold text-xl">{correctCount}</div>
                          <div>Correct</div>
                      </div>
                      <div className="text-center">
                          <div className="text-red-500 font-bold text-xl">{words.length - correctCount}</div>
                          <div>Wrong</div>
                      </div>
                  </div>

                  <button 
                    onClick={() => onFinish(results)} 
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                      Finish & Save
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">Stop</button>
        <span className="font-bold text-gray-500">Quiz {currentIndex + 1}/{words.length}</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-12">
            <h2 
                onClick={() => playAudio(currentWord.en)}
                className="text-4xl font-black text-gray-800 mb-4 cursor-pointer hover:text-primary transition-colors flex items-center justify-center gap-3"
            >
                {currentWord.en} 
                <i className="fas fa-volume-up text-xl text-gray-300"></i>
            </h2>
            {currentWord.phonetic && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{currentWord.phonetic}</span>}
        </div>

        <div className="space-y-3">
            {options.map((opt, idx) => {
                let btnClass = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium text-gray-700 ";
                
                if (selectedOption !== null) {
                    if (opt.id === currentWord.id) {
                        btnClass += "bg-green-100 border-green-500 text-green-800"; // Always show correct
                    } else if (selectedOption === idx) {
                        btnClass += "bg-red-100 border-red-500 text-red-800"; // Show wrong if selected
                    } else {
                        btnClass += "bg-gray-50 border-gray-100 opacity-50";
                    }
                } else {
                    btnClass += "bg-white border-gray-200 hover:border-primary hover:bg-indigo-50";
                }

                return (
                    <button 
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={btnClass}
                        disabled={selectedOption !== null}
                    >
                        <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                        {opt.zh}
                    </button>
                )
            })}
        </div>

        {selectedOption !== null && (
             <div className={`mt-6 text-center font-bold text-lg animate-bounce ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                 {isCorrect ? "Correct! 🎉" : "Oops! The correct meaning is highlighted."}
             </div>
        )}
      </div>
    </div>
  );
};

export default QuizMode;