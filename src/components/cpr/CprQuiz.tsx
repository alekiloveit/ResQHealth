import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, ShieldCheck, ArrowRight, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CPR_QUIZ_QUESTIONS } from '../../data/cprData';
import { saveCprQuizScore } from '../../utils/storage';

interface CprQuizProps {
  onOpenTrainer: () => void;
}

export const CprQuiz: React.FC<CprQuizProps> = ({ onOpenTrainer }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Alex Vance');

  const currentQ = CPR_QUIZ_QUESTIONS[currentIndex];
  const totalQuestions = CPR_QUIZ_QUESTIONS.length;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitted(true);
      calculateScore();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    CPR_QUIZ_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });

    if (correct >= 4) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Persist score for historical tracking
    saveCprQuizScore({
      id: `quiz-${Date.now()}`,
      timestamp: Date.now(),
      score: correct,
      totalQuestions: CPR_QUIZ_QUESTIONS.length,
      percent: Math.round((correct / CPR_QUIZ_QUESTIONS.length) * 100),
      passed: correct >= 4,
    });

    return correct;
  };

  const score = Object.keys(selectedAnswers).reduce((acc, idxStr) => {
    const idx = Number(idxStr);
    return selectedAnswers[idx] === CPR_QUIZ_QUESTIONS[idx].correctIndex ? acc + 1 : acc;
  }, 0);

  const passed = score >= 4;

  const resetQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setShowCertificate(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Emergency Preparedness Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            CPR & Life Support Knowledge Check
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Test your sudden cardiac arrest knowledge against American Heart Association standards. Score 80%+ to unlock your digital readiness certificate.
          </p>
        </div>

        <button
          onClick={resetQuiz}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Quiz</span>
        </button>
      </div>

      {!isSubmitted ? (
        /* Active Question Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
            <span className="font-semibold uppercase tracking-wider text-rose-600">
              Scenario {currentIndex + 1} of {totalQuestions} · {currentQ.category}
            </span>
            <span className="font-mono">
              Progress: {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 italic block mb-1">
              {currentQ.scenario}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
            >
              ← Previous
            </button>

            <button
              onClick={handleNext}
              disabled={selectedAnswers[currentIndex] === undefined}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span>{currentIndex === totalQuestions - 1 ? 'Submit & Grade' : 'Next Scenario'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Results & Certificate Screen */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg ${
              passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}>
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {passed ? 'Assessment Passed with Honors!' : 'Review & Practice Recommended'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                You scored <strong className="text-slate-900">{score} of {totalQuestions}</strong> correct (
                {Math.round((score / totalQuestions) * 100)}%).
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {passed && (
                <button
                  onClick={() => setShowCertificate(true)}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View Readiness Certificate</span>
                </button>
              )}
              <button
                onClick={onOpenTrainer}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Practice Cadence on Metronome
              </button>
              <button
                onClick={resetQuiz}
                className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Retake Assessment
              </button>
            </div>
          </div>

          {/* Printable / Display Certificate Modal */}
          {showCertificate && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
                  <ShieldCheck className="w-5 h-5" />
                  <span>ResQHealth Lifesaving Academy</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Certificate of CPR & First Aid Readiness
                </h3>
                <p className="text-xs text-slate-500">
                  Credential ID: RQ-{Date.now().toString().slice(-8)} · Issued {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="text-center py-4 border-y border-amber-200 space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">This verifies that</p>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-xl sm:text-2xl font-black text-slate-900 text-center border-b border-dashed border-slate-300 pb-1 focus:outline-none focus:border-rose-500"
                />
                <p className="text-xs text-slate-600 max-w-md mx-auto pt-1">
                  Has successfully mastered adult, child, and AED basic life support protocols including 100-120 BPM chest compression cadence, 30:2 rescue cycles, and emergency SOS dispatch protocols.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Verified by AHA / ERC Clinical Guidelines</span>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* Question Breakdown and Explanations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Scenario Review & Clinical Explanations</h3>

            <div className="space-y-4">
              {CPR_QUIZ_QUESTIONS.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCorrect
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {idx + 1}. {q.question}
                        </span>
                        <span className="text-slate-500 text-[11px] italic mt-0.5 block">
                          {q.scenario}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-semibold">
                        {isCorrect ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Correct
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 text-slate-700">
                      <p>
                        <strong>Your answer:</strong> {q.options[userAns]}
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-800 font-semibold mt-0.5">
                          <strong>Correct answer:</strong> {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200 text-slate-600 leading-relaxed mt-2">
                      <strong className="text-slate-900">Clinical Explanation: </strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
