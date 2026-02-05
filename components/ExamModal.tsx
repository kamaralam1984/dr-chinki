
import React, { useState, useEffect } from 'react';
import { getQuizQuestions } from '../services/geminiService';
import { ExamQuestion } from '../types';

interface ExamModalProps {
  topic: string;
  onClose: () => void;
}

const ExamModal: React.FC<ExamModalProps> = ({ topic, onClose }) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      const data = await getQuizQuestions(topic);
      setQuestions(data);
      setLoading(false);
    };
    loadQuiz();
  }, [topic]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      onClose();
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-800 border-b border-slate-700 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold glow-text">NEET Practice: {topic}</h2>
            <p className="text-xs text-sky-400 font-bold uppercase tracking-widest opacity-80">Revision Module Active</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-slate-800 border-t-sky-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Preparing Evaluation Stream...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500">System failure: Unable to fetch evaluation data.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-sky-400 bg-sky-900/40 border border-sky-500/20 px-3 py-1 rounded-full uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
                <h3 className="text-xl font-semibold text-slate-100 leading-snug">{currentQ.question}</h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={showExplanation}
                    onClick={() => {
                        setSelectedOption(idx);
                        setShowExplanation(true);
                    }}
                    className={`p-5 text-left rounded-2xl border-2 transition-all duration-300 font-medium ${
                      showExplanation
                        ? idx === currentQ.correctIndex
                          ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                          : idx === selectedOption
                          ? 'bg-red-900/30 border-red-500 text-red-400'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                        : 'border-slate-800 bg-slate-800/40 hover:border-sky-500/50 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-black mr-4 text-sky-500 opacity-60">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </button>
                ))}
              </div>

              {showExplanation && (
                <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="font-black text-[10px] text-sky-400 uppercase tracking-widest mb-3">Diagnostic Explanation:</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {!loading && (
          <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!showExplanation}
              className="bg-sky-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-sky-500 disabled:opacity-30 transition-all flex items-center gap-3 glow-cyan"
            >
              {currentIndex === questions.length - 1 ? 'Terminate Revision' : 'Proceed to next phase'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamModal;
