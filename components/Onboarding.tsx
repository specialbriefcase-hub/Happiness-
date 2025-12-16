import React, { useState } from 'react';
import { analyzePurpose } from '../services/gemini';
import { useAppContext } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

const Onboarding = () => {
  const { completeOnboarding } = useAppContext();
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
      const result = await analyzePurpose(answers);
      completeOnboarding(result.detailedAnalysis, result.shortStatement);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Emociones (Positive Emotions)",
      question: "¿Qué actividades te hacen sentir verdadera alegría, gratitud o asombro?",
      field: 'emotions',
    },
    {
      title: "Pasatiempos (Engagement)",
      question: "¿Cuándo pierdes la noción del tiempo? ¿En qué pasatiempos te sumerges completamente?",
      field: 'hobbies',
    },
    {
      title: "Valores (Meaning)",
      question: "¿Qué es lo más importante en tu vida? ¿Qué causas o personas te mueven?",
      field: 'importantValues',
    },
    {
      title: "Profesional (Accomplishment)",
      question: "¿Cómo describirías tu éxito profesional ideal? ¿Qué te gustaría lograr?",
      field: 'professionalGoals',
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Buscando tu Sentido...</h2>
        <p className="text-gray-500">La IA está analizando tus respuestas para encontrar tu propósito basado en el modelo PERMA.</p>
      </div>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="max-w-lg mx-auto p-6 h-screen flex flex-col justify-center">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold uppercase text-primary-600">Paso {step + 1} de {steps.length}</span>
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
          placeholder="Escribe tu reflexión aquí..."
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
          Atrás
        </button>
        
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!(answers as any)[currentStep.field]}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!(answers as any)[currentStep.field]}
            className="px-6 py-2 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 disabled:opacity-50 shadow-lg shadow-secondary-500/30"
          >
            Descubrir mi Propósito
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;