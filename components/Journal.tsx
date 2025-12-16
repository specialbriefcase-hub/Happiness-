import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Camera, Save, X, Loader2, Sparkles, Sun, Heart, Cloud, Zap, Star, Smile, Eye, CloudRain, Frown, Meh, Anchor, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { JournalEntry } from '../types';
import { analyzeSentiment, generateJournalPrompt } from '../services/gemini';

const SimpleUUID = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Emotion Mapper
const getEmotionConfig = (sentiment: string) => {
  const s = sentiment || 'Neutral';
  switch (s) {
    case 'Joy': return { color: 'bg-yellow-100 text-yellow-700', icon: Sun, label: 'Alegría' };
    case 'Gratitude': return { color: 'bg-pink-100 text-pink-700', icon: Heart, label: 'Gratitud' };
    case 'Serenity': return { color: 'bg-blue-100 text-blue-700', icon: Cloud, label: 'Serenidad' };
    case 'Interest': return { color: 'bg-orange-100 text-orange-700', icon: Zap, label: 'Interés' };
    case 'Hope': return { color: 'bg-green-100 text-green-700', icon: Anchor, label: 'Esperanza' };
    case 'Pride': return { color: 'bg-purple-100 text-purple-700', icon: Star, label: 'Orgullo' };
    case 'Amusement': return { color: 'bg-teal-100 text-teal-700', icon: Smile, label: 'Diversión' };
    case 'Inspiration': return { color: 'bg-indigo-100 text-indigo-700', icon: Sparkles, label: 'Inspiración' };
    case 'Awe': return { color: 'bg-violet-100 text-violet-700', icon: Eye, label: 'Asombro' };
    case 'Love': return { color: 'bg-red-100 text-red-700', icon: Heart, label: 'Amor' };
    case 'Sadness': return { color: 'bg-gray-200 text-gray-700', icon: CloudRain, label: 'Tristeza' };
    case 'Anger': return { color: 'bg-red-200 text-red-800', icon: Frown, label: 'Enojo' };
    case 'Anxiety': return { color: 'bg-orange-200 text-orange-800', icon: Frown, label: 'Ansiedad' };
    default: return { color: 'bg-gray-100 text-gray-600', icon: Meh, label: s };
  }
};

const Journal = () => {
  const { addEntry, user, entries } = useAppContext();
  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'professional'>('personal');
  const [form, setForm] = useState({
    personal: '',
    family: '',
    professional: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSentiment, setLastSentiment] = useState<{ sentiment: string, summary: string } | null>(null);
  
  // Prompt Generation State
  const [suggestedPrompt, setSuggestedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  // Camera Logic
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
        if (isCameraOpen) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
                setIsCameraOpen(false);
            }
        }
    };

    startCamera();

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isCameraOpen]);

  const capturePhoto = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
            setImages(prev => [...prev, imageSrc]);
            setIsCameraOpen(false);
        }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetPrompt = async () => {
    if (!user) return;
    setIsGeneratingPrompt(true);
    setSuggestedPrompt('');
    try {
        const purpose = user.purposeAnalysis || "User seeks meaning and happiness.";
        const recentThemes = entries.slice(0, 3).map(e => e.sentimentSummary).join(', ') || "No recent entries.";
        
        const prompt = await generateJournalPrompt(purpose, recentThemes);
        setSuggestedPrompt(prompt);
    } catch (error) {
        console.error("Failed to generate prompt", error);
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setLastSentiment(null);
    try {
      // Combine text for analysis
      const fullText = `${form.personal} ${form.family} ${form.professional}`.trim();
      
      let sentimentData = { sentiment: 'Neutral', summary: '' };
      if (fullText.length > 5) {
        const result = await analyzeSentiment(fullText);
        sentimentData = { sentiment: result.sentiment, summary: result.summary };
        setLastSentiment(sentimentData);
      }

      const entry: JournalEntry = {
        id: SimpleUUID(),
        date: new Date().toISOString(),
        timestamp: Date.now(),
        personal: form.personal,
        family: form.family,
        professional: form.professional,
        images: images,
        sentiment: sentimentData.sentiment,
        sentimentSummary: sentimentData.summary
      };

      addEntry(entry);
      setIsSaved(true);
      
      setTimeout(() => {
        setForm({ personal: '', family: '', professional: '' });
        setImages([]);
        setIsSaved(false);
        setLastSentiment(null);
        setSuggestedPrompt('');
      }, 5000); 
    } catch (error) {
      console.error("Error saving entry", error);
      alert("Error al guardar la entrada.");
    } finally {
      setIsSaving(false);
    }
  };

  const emotionConfig = lastSentiment ? getEmotionConfig(lastSentiment.sentiment) : null;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between animate-in fade-in duration-200">
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover" 
                 />
                 <button 
                    onClick={() => setIsCameraOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                 >
                    <X size={24} />
                 </button>
            </div>
            <div className="h-24 bg-black flex items-center justify-center pb-4">
                 <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-colors"
                 >
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                 </button>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nueva Entrada</h1>
        <button
            onClick={handleGetPrompt}
            disabled={isGeneratingPrompt}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
            {isGeneratingPrompt ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Sparkles size={16} />
            )}
            <span>Inspírame</span>
        </button>
      </div>

      {suggestedPrompt && (
        <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 p-4 rounded-xl relative animate-fade-in">
            <div className="flex items-start gap-3">
                <Lightbulb className="text-purple-500 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-1">Pregunta del día</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic">{suggestedPrompt}</p>
                </div>
                <button onClick={() => setSuggestedPrompt('')} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                </button>
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {(['personal', 'family', 'professional'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Text Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ¿Cómo te fue en el ámbito {activeTab === 'family' ? 'familiar' : activeTab}?
        </label>
        <textarea
          value={form[activeTab]}
          onChange={(e) => setForm(prev => ({ ...prev, [activeTab]: e.target.value }))}
          className="w-full h-40 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none shadow-sm bg-white text-gray-900"
          placeholder={`Hoy en mi vida ${activeTab === 'family' ? 'familiar' : activeTab}...`}
        />
      </div>

      {/* Images Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Momentos (Fotos)</h3>
          
          <div className="flex space-x-2">
            <button 
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-primary-600 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <Camera size={16} />
                <span>Cámara</span>
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <ImageIcon size={16} />
                <span>Galería</span>
            </button>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
            ref={fileInputRef}
          />
        </div>
        
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={img} alt="Moment" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sentiment Feedback Visual */}
      {isSaved && lastSentiment && emotionConfig && (
        <div className={`mb-6 p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 animate-bounce-in shadow-sm ${emotionConfig.color.replace('text-', 'border-').replace('100', '200')}`}>
           <div className={`p-3 rounded-full bg-white shadow-sm`}>
             <emotionConfig.icon size={32} className={emotionConfig.color.match(/text-\w+-\d+/)?.[0] || 'text-gray-600'} />
           </div>
           <div className="text-center">
             <h4 className="font-bold text-lg dark:text-gray-900">
               {emotionConfig.label}
             </h4>
             <p className="text-sm opacity-80 dark:text-gray-800">{lastSentiment.summary}</p>
           </div>
        </div>
      )}

      {/* Save Action */}
      <button
        onClick={handleSave}
        disabled={isSaving || isSaved || (!form.personal && !form.family && !form.professional)}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
          isSaved 
            ? 'bg-green-500 text-white'
            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30 disabled:opacity-50'
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Analizando emociones...</span>
          </>
        ) : isSaved ? (
          <span>¡Guardado!</span>
        ) : (
          <>
            <Save size={20} />
            <span>Guardar Entrada</span>
          </>
        )}
      </button>
    </div>
  );
};

export default Journal;