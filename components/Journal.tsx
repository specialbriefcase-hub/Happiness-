
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Camera, Save, X, Loader2, Sparkles, Sun, Heart, Cloud, Zap, Star, Smile, Eye, CloudRain, Frown, Meh, Anchor, Lightbulb, Image as ImageIcon, ArrowDownCircle } from 'lucide-react';
import { JournalEntry } from '../types';
import { analyzeSentiment, generateJournalPrompt } from '../services/gemini';
import { translations } from '../services/translations';

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
  const { addEntry, user, entries, settings } = useAppContext();
  const t = translations[settings.language].journal;
  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'professional'>('personal');
  const [form, setForm] = useState({
    personal: '',
    family: '',
    professional: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSentiment, setLastSentiment] = useState<{ sentiment: string, summary: string, breakdown?: Record<string, number> } | null>(null);
  
  const [suggestedPrompt, setSuggestedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
        const savedDraft = localStorage.getItem(`draft_${user.email}`);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setForm(parsed);
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        localStorage.setItem(`draft_${user.email}`, JSON.stringify(form));
    }
  }, [form, user]);

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
                alert("Camera error. Please check permissions.");
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
        setIsFlashing(true);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
            setTimeout(() => {
                setImages(prev => [...prev, imageSrc]);
                setIsFlashing(false);
                setIsCameraOpen(false);
            }, 150);
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
        const prompt = await generateJournalPrompt(purpose, recentThemes, settings.language);
        setSuggestedPrompt(prompt);
    } catch (error) {
        console.error("Failed to generate prompt", error);
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const handleUsePrompt = () => {
    if (suggestedPrompt) {
        setForm(prev => ({
            ...prev,
            [activeTab]: prev[activeTab] ? `${prev[activeTab]}\n\n${suggestedPrompt}\n` : `${suggestedPrompt}\n`
        }));
        setSuggestedPrompt('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setLastSentiment(null);
    try {
      const fullText = `${form.personal} ${form.family} ${form.professional}`.trim();
      let sentimentData = { sentiment: 'Neutral', summary: '', breakdown: {} as Record<string, number> };
      if (fullText.length > 5) {
        const result = await analyzeSentiment(fullText, settings.language);
        const breakdownRecord: Record<string, number> = {};
        if (result.breakdown && Array.isArray(result.breakdown)) {
            result.breakdown.forEach((item) => {
                breakdownRecord[item.emotion] = item.percentage;
            });
        }
        sentimentData = { 
            sentiment: result.sentiment, 
            summary: result.summary,
            breakdown: breakdownRecord
        };
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
        sentimentSummary: sentimentData.summary,
        emotionalProfile: sentimentData.breakdown
      };
      addEntry(entry);
      setIsSaved(true);
      if (user) {
          localStorage.removeItem(`draft_${user.email}`);
      }
      setTimeout(() => {
        setForm({ personal: '', family: '', professional: '' });
        setImages([]);
        setIsSaved(false);
        setLastSentiment(null);
        setSuggestedPrompt('');
      }, 7000);
    } catch (error) {
      console.error("Error saving entry", error);
    } finally {
      setIsSaving(false);
    }
  };

  const emotionConfig = lastSentiment ? getEmotionConfig(lastSentiment.sentiment) : null;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col justify-between animate-in fade-in duration-200">
            <div className={`absolute inset-0 bg-white z-[110] pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
                    <div className="w-64 h-64 border border-white/30 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -mt-0.5 -ml-0.5 rounded-tl-sm"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white -mt-0.5 -mr-0.5 rounded-tr-sm"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -mb-0.5 -ml-0.5 rounded-bl-sm"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white -mb-0.5 -mr-0.5 rounded-br-sm"></div>
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/80 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                 </div>
                 <button onClick={() => setIsCameraOpen(false)} className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-md z-50">
                    <X size={28} />
                 </button>
            </div>
            <div className="h-36 bg-black flex items-center justify-center pb-8 pt-4">
                 <button onClick={capturePhoto} className="group relative">
                    <div className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center transition-transform duration-100 group-active:scale-95">
                        <div className="w-[68px] h-[68px] bg-white rounded-full group-active:bg-gray-300 transition-colors border-2 border-black"></div>
                    </div>
                 </button>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
        <button onClick={handleGetPrompt} disabled={isGeneratingPrompt} className="flex items-center space-x-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium">
            {isGeneratingPrompt ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>{t.inspire}</span>
        </button>
      </div>

      {suggestedPrompt && (
        <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 p-4 rounded-xl relative animate-fade-in">
            <div className="flex items-start gap-3">
                <Lightbulb className="text-purple-500 mt-1 flex-shrink-0" size={20} />
                <div className="flex-1">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-1">{t.preguntaDia}</h4>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-3">{suggestedPrompt}</p>
                    <button onClick={handleUsePrompt} className="flex items-center space-x-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors bg-purple-100 dark:bg-purple-800/30 px-2 py-1 rounded-lg">
                      <ArrowDownCircle size={14} />
                      <span>{t.usarDiario}</span>
                    </button>
                </div>
                <button onClick={() => setSuggestedPrompt('')} className="absolute top-2 right-2 text-gray-400">
                    <X size={14} />
                </button>
            </div>
        </div>
      )}

      <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {(['personal', 'family', 'professional'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {tab === 'personal' ? t.personal : tab === 'family' ? t.family : t.professional}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.questionLabel.replace('{scope}', activeTab === 'personal' ? t.personal : activeTab === 'family' ? t.family : t.professional)}
        </label>
        <textarea
          value={form[activeTab]}
          onChange={(e) => setForm(prev => ({ ...prev, [activeTab]: e.target.value }))}
          className="w-full h-40 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          placeholder={t.placeholder.replace('{scope}', activeTab === 'personal' ? t.personal : activeTab === 'family' ? t.family : t.professional)}
        />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.moments}</h3>
          <div className="flex space-x-2">
            <button onClick={() => setIsCameraOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-primary-600 rounded-lg text-sm">
                <Camera size={16} />
                <span>{t.camera}</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-lg text-sm">
                <ImageIcon size={16} />
                <span>{t.gallery}</span>
            </button>
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={img} alt="Moment" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isSaved && lastSentiment && emotionConfig && (
        <div className={`mb-6 p-4 rounded-xl border flex flex-col space-y-4 animate-bounce-in shadow-sm ${emotionConfig.color.replace('text-', 'border-').replace('100', '200')}`}>
           <div className="flex items-center justify-center space-x-3">
             <div className="p-3 rounded-full bg-white shadow-sm">
               <emotionConfig.icon size={32} className={emotionConfig.color.match(/text-\w+-\d+/)?.[0] || 'text-gray-600'} />
             </div>
             <div className="text-left">
               <h4 className="font-bold text-lg dark:text-gray-900">{emotionConfig.label}</h4>
               <p className="text-sm opacity-80 dark:text-gray-800">{lastSentiment.summary}</p>
             </div>
           </div>
           {lastSentiment.breakdown && (
               <div className="bg-white/50 dark:bg-black/10 rounded-lg p-3 w-full">
                   <p className="text-xs font-bold uppercase opacity-70 mb-2 dark:text-gray-900">{t.desglose}</p>
                   <div className="space-y-2">
                       {Object.entries(lastSentiment.breakdown).sort(([,a], [,b]) => (b as number) - (a as number)).map(([emotion, percent]) => (
                           <div key={emotion} className="flex items-center text-sm">
                               <span className="w-24 truncate font-medium dark:text-gray-800">{emotion}</span>
                               <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mx-2">
                                   <div className="h-full bg-primary-500" style={{ width: `${percent}%` }}></div>
                               </div>
                               <span className="text-xs font-bold w-8 text-right dark:text-gray-800">{percent}%</span>
                           </div>
                       ))}
                   </div>
               </div>
           )}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || isSaved || (!form.personal && !form.family && !form.professional)}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
          isSaved ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>{t.processing}</span>
          </>
        ) : isSaved ? (
          <span>{t.saved}</span>
        ) : (
          <>
            <Save size={20} />
            <span>{t.save}</span>
          </>
        )}
      </button>

      {isSaving && (
        <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
             <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md mb-2">
                <Loader2 size={24} className="text-primary-600 animate-spin" />
             </div>
             <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.analysis}</p>
        </div>
      )}
    </div>
  );
};

export default Journal;
