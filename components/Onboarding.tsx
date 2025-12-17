
import React, { useState } from 'react';
import { analyzePurpose } from '../services/gemini';
import { useAppContext } from '../context/AppContext';
import { Loader2 } from 'lucide-react';
import { translations } from '../services/translations';

const Onboarding = () => {
  const { completeOnboarding, settings } = useAppContext();
  const t = translations[settings.language].onboarding;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    emotions: '',
    hobbies: '',
    importantValues: '',
    professionalGoals: '',
  });

  const handleChange = (field: string, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await analyzePurpose(answers, settings.language);
      completeOnboarding(result.detailedAnalysis, result.shortStatement);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = t.steps.map((s: any, i: number) => ({
    ...s,
    field: i === 0 ? 'emotions' : i === 1 ? 'hobbies' : i === 2 ? 'importantValues' : 'professionalGoals'
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t.loadingTitle}</h2>
        <p className="text-gray-500">{t.loadingSub}</p>
      </div>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="max-w-lg mx-auto p-6 h-screen flex flex-col justify-center">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold uppercase text-primary-600">{t.step} {step + 1} {t.of} {steps.length}</span>
          <span className="text-xs font-semibold text-gray-400">{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{currentStep.title}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">{currentStep.question}</p>
        
        <textarea
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all h-40 resize-none bg-white text-gray-900"
          placeholder={t.placeholder}
          value={(answers as any)[currentStep.field]}
          onChange={(e) => handleChange(currentStep.field, e.target.value)}
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className={`px-6 py-2 rounded-lg font-medium ${step === 0 ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
        >
          {t.back}
        </button>
        
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!(answers as any)[currentStep.field]}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
          >
            {t.next}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!(answers as any)[currentStep.field]}
            className="px-6 py-2 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 disabled:opacity-50 shadow-lg shadow-secondary-500/30"
          >
            {t.finish}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
