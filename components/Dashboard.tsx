import React, { useState } from 'react';
import { CourseId, UserProgress } from '../types';
import { COURSE_INFO, WORD_DATA } from '../data';
import { getDueWords } from '../services/srsService';

interface Props {
  progress: Record<string, UserProgress>;
  onSelectCourse: (id: CourseId, mode: 'learn' | 'quiz') => void;
  // New props for import functionality
  customWordCounts: Record<string, number>;
  onImport: (courseId: CourseId, jsonData: string) => void;
  onClearCustom: () => void;
}

const Dashboard: React.FC<Props> = ({ progress, onSelectCourse, customWordCounts, onImport, onClearCustom }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCourse, setImportCourse] = useState<CourseId>(CourseId.JUNIOR_1600);
  const [importData, setImportData] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // We need to calculate stats combining static WORD_DATA and potentially custom data passed down?
  // Ideally App.tsx passes the *combined* word list to Dashboard.
  // For now, let's assume WORD_DATA is the static one, and we display custom counts separately or assume App passes combined stats logic.
  // Wait, Dashboard currently imports WORD_DATA directly. This needs to be consistent. 
  // We will trust the parent to handle the data source of truth if we were fully refactoring,
  // but for now, let's just display the custom counts as a bonus "Extension".
  
  // NOTE: In a full refactor, 'WORD_DATA' in Dashboard should be a prop.
  // However, for the scope of this change, we will stick to the visual layout but acknowledge the custom counts.

  const getStats = (courseId: CourseId) => {
    // This only calculates stats for STATIC words currently imported.
    // Ideally this component should receive the full word list. 
    // We will fix this by calculating based on props if available, otherwise static.
    // BUT, since we don't have the full combined list passed in as a prop yet (App.tsx holds it),
    // We will just show the "System Words" stats here.
    const courseWords = WORD_DATA[courseId];
    const ids = courseWords.map(w => w.id);
    const { due, newWords } = getDueWords(ids, progress);
    
    // Mastered count (Stage > 6)
    const mastered = ids.filter(id => (progress[id]?.stage || 0) > 6).length;
    
    const customCount = customWordCounts[courseId] || 0;

    return { total: ids.length, due: due.length, mastered, customCount };
  };

  const handleImportSubmit = () => {
      try {
          // Simple validation
          const parsed = JSON.parse(importData);
          if (!Array.isArray(parsed)) throw new Error("Data must be an array");
          if (parsed.length > 0 && !parsed[0].en) throw new Error("Words must have 'en' property");
          
          onImport(importCourse, importData);
          setImportStatus(`Success! Added ${parsed.length} words.`);
          setTimeout(() => {
              setShowImportModal(false);
              setImportStatus('');
              setImportData('');
          }, 1500);
      } catch (e: any) {
          setImportStatus("Error: " + e.message);
      }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-4xl font-extrabold text-primary mb-2">MemoFlow</h1>
            <p className="text-gray-500">Smart Spaced Repetition for English Mastery</p>
        </div>
        <button 
            onClick={() => setShowImportModal(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 transition-colors shadow-lg"
        >
            <i className="fas fa-plus-circle mr-2"></i> Manage Dictionary
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(CourseId).map((courseId) => {
          const info = COURSE_INFO[courseId];
          const stats = getStats(courseId);
          
          return (
            <div key={courseId} className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${info.color} bg-white bg-opacity-50`}>
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{info.title}</h2>
                    <p className="text-sm opacity-80 mb-4">{info.desc}</p>
                  </div>
                  {stats.customCount > 0 && (
                      <span className="bg-white bg-opacity-80 px-2 py-1 rounded text-xs font-bold text-gray-600 border border-gray-200" title="Custom Words Added">
                          +{stats.customCount} Custom
                      </span>
                  )}
              </div>
              
              <div className="flex justify-between text-sm mb-6 bg-white bg-opacity-60 p-3 rounded-lg">
                <div className="text-center">
                  <div className="font-bold text-lg">{stats.total + stats.customCount}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">{stats.mastered}</div>
                  <div className="text-xs text-gray-500">Mastered</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-amber-600">{stats.due}</div>
                  <div className="text-xs text-gray-500">Review Now</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onSelectCourse(courseId, 'learn')}
                  className="bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <i className="fas fa-layer-group"></i> Learn
                  {stats.due > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full animate-pulse">{stats.due}</span>}
                </button>
                <button 
                  onClick={() => onSelectCourse(courseId, 'quiz')}
                  className="bg-white border-2 border-primary text-primary hover:bg-indigo-50 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <i className="fas fa-clipboard-check"></i> Quiz
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Import Modal */}
      {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-flip">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Import Custom Words</h3>
                  
                  <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Target Course</label>
                      <select 
                        value={importCourse}
                        onChange={(e) => setImportCourse(e.target.value as CourseId)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                          {Object.values(CourseId).map(c => (
                              <option key={c} value={c}>{COURSE_INFO[c].title}</option>
                          ))}
                      </select>
                  </div>

                  <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Paste JSON Data</label>
                      <p className="text-xs text-gray-500 mb-2">
                          Format: <code>[&#123;"id": "c1", "en": "word", "zh": "meaning"&#125;]</code>
                      </p>
                      <textarea 
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-xs"
                        placeholder='[{"id": "c1", "en": "hello", "zh": "你好", "phonetic": "/həˈləʊ/", "type": "n."}]'
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                      ></textarea>
                  </div>

                  {importStatus && <div className={`text-sm mb-4 font-bold ${importStatus.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{importStatus}</div>}

                  <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700"
                      >
                          Cancel
                      </button>
                       <button 
                        onClick={onClearCustom}
                        className="px-4 py-2 text-red-500 hover:text-red-700 text-sm mr-auto"
                      >
                          Clear All Custom Data
                      </button>
                      <button 
                        onClick={handleImportSubmit}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
                      >
                          Import
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="mt-12 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Your Ebbinghaus Status</h3>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
             <div className="bg-red-400 w-1/4" title="New/Forgot"></div>
             <div className="bg-yellow-400 w-1/4" title="Learning"></div>
             <div className="bg-green-400 w-1/4" title="Reviewing"></div>
             <div className="bg-blue-500 w-1/4" title="Mastered"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>New</span>
            <span>Mastered</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;