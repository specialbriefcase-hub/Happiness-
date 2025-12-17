
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Target, CheckCircle2, XCircle, BrainCircuit, Sparkles, Calendar, Briefcase, User, Home as HomeIcon, Loader2, ArrowRight, BarChart2, ChevronDown, ChevronUp, Lightbulb, X, Quote } from 'lucide-react';
import { generateGoalSuggestions, generatePermaTips } from '../services/gemini';
import { Goal, GoalDomain } from '../types';
import { translations } from '../services/translations';

const Goals = () => {
  const { user, entries, goals, addGoalSuggestions, approveGoal, discardGoal, toggleGoalCompletion, settings } = useAppContext();
  const t = translations[settings.language].goals;
  const [activeTab, setActiveTab] = useState<'planner' | 'archive'>('planner');
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // AI Tips State
  const [isGettingTips, setIsGettingTips] = useState(false);
  const [aiTips, setAiTips] = useState<{ tips: string[], motivation: string } | null>(null);
  const [showTipsPanel, setShowTipsPanel] = useState(false);

  const suggestedGoals = goals.filter(g => g.status === 'suggested');
  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'completed');

  const handleGenerate = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const suggestions = await generateGoalSuggestions(user, entries);
        addGoalSuggestions(suggestions);
    } catch (e) {
        console.error("Error generating goals", e);
        alert("Error al generar metas.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGetTips = async () => {
    if (!user) return;
    setIsGettingTips(true);
    setShowTipsPanel(true);
    try {
        // We pass the current language code to the prompt logic in gemini.ts implicitly if we want, 
        // but here we just handle the UI.
        const result = await generatePermaTips(user.purposeAnalysis || '', activeGoals.filter(g => g.status === 'active'));
        setAiTips(result);
    } catch (e) {
        console.error("Error getting tips", e);
        setShowTipsPanel(false);
        alert("Error de conexión.");
    } finally {
        setIsGettingTips(false);
    }
  };

  const DomainIcon = ({ domain }: { domain: GoalDomain }) => {
    switch (domain) {
        case 'personal': return <User size={16} />;
        case 'family': return <HomeIcon size={16} />;
        case 'professional': return <Briefcase size={16} />;
        default: return <Target size={16} />;
    }
  };

  const DomainBadge = ({ domain }: { domain: GoalDomain }) => {
    const styles = {
        personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        family: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        professional: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    };
    
    return (
        <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${styles[domain]}`}>
            <DomainIcon domain={domain} />
            <span>{domain === 'family' ? t.family : domain === 'professional' ? t.professional : t.personal}</span>
        </span>
    );
  };

  const TermBadge = ({ term }: { term: string }) => {
      const isShort = term === 'short-term';
      return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isShort ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20' : 'border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:bg-indigo-900/20'}`}>
              {isShort ? t.shortTerm : t.longTerm}
          </span>
      );
  };

  // --- Statistics Logic ---
  const totalGoals = activeGoals.length;
  const completedGoals = activeGoals.filter(g => g.status === 'completed').length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const getDomainStats = (domain: GoalDomain) => {
      const domainGoals = activeGoals.filter(g => g.domain === domain);
      const completed = domainGoals.filter(g => g.status === 'completed').length;
      return {
          total: domainGoals.length,
          completed,
          percent: domainGoals.length > 0 ? Math.round((completed / domainGoals.length) * 100) : 0
      };
  };

  const CircularProgress = ({ percent, color, label }: { percent: number, color: string, label: string }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 mb-1">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth="4" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        strokeLinecap="round"
                        className={`${color} transition-all duration-1000 ease-out`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold dark:text-white">
                    {percent}%
                </div>
            </div>
            <span className="text-[10px] font-medium text-gray-500 uppercase">{label}</span>
        </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
        {activeTab === 'planner' && (
             <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-70"
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                <span>{t.iaButton}</span>
            </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('planner')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'planner' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {t.discover}
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'archive' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {t.myProgress} ({activeGoals.length})
          </button>
      </div>

      {/* AI Tips Modal/Overlay */}
      {showTipsPanel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-yellow-100 dark:border-yellow-900/20">
                  <div className="bg-yellow-400 p-4 flex justify-between items-center text-white">
                      <div className="flex items-center space-x-2">
                          <Lightbulb size={24} className="fill-white" />
                          <h3 className="font-bold">{t.tipsTitle}</h3>
                      </div>
                      <button onClick={() => setShowTipsPanel(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      {isGettingTips ? (
                          <div className="flex flex-col items-center py-8">
                              <Loader2 size={32} className="text-yellow-500 animate-spin mb-3" />
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t.consulting}</p>
                          </div>
                      ) : aiTips ? (
                          <div className="space-y-6">
                              <div className="space-y-3">
                                  {aiTips.tips.map((tip, i) => (
                                      <div key={i} className="flex items-start space-x-3 group">
                                          <div className="mt-1 w-2 h-2 rounded-full bg-yellow-400 group-hover:scale-125 transition-transform" />
                                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
                                      </div>
                                  ))}
                              </div>
                              
                              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 mb-2">
                                      <Quote size={16} className="fill-current" />
                                      <span className="text-xs font-bold uppercase tracking-wider">{t.mantra}</span>
                                  </div>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white italic leading-tight">
                                      "{aiTips.motivation}"
                                  </p>
                              </div>

                              <button 
                                onClick={() => setShowTipsPanel(false)}
                                className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                              >
                                {t.gotIt}
                              </button>
                          </div>
                      ) : null}
                  </div>
              </div>
          </div>
      )}

      {/* --- PLANNER VIEW --- */}
      {activeTab === 'planner' && (
        <div className="space-y-4">
            {suggestedGoals.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Sparkles className="mx-auto h-12 w-12 text-yellow-400 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.emptyPlanner}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto mb-6">
                        {t.emptyPlannerSub}
                    </p>
                    <button onClick={handleGenerate} className="text-primary-600 font-bold hover:underline">
                        ¡Comenzar ahora!
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-1">AI suggestions:</p>
                    {suggestedGoals.map(goal => (
                        <div key={goal.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-start mb-2">
                                <DomainBadge domain={goal.domain} />
                                <TermBadge term={goal.term} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{goal.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{goal.description}</p>
                            
                            <div className="flex space-x-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button 
                                    onClick={() => approveGoal(goal.id)}
                                    className="flex-1 flex items-center justify-center space-x-2 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg font-bold text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                                >
                                    <CheckCircle2 size={16} />
                                    <span>Aceptar</span>
                                </button>
                                <button 
                                    onClick={() => discardGoal(goal.id)}
                                    className="px-4 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* --- ARCHIVE / ACTIVE VIEW --- */}
      {activeTab === 'archive' && (
        <div className="pb-20">
            {/* Progress Stats Toggle */}
            {activeGoals.length > 0 && (
                <div className="mb-6">
                    <button 
                        onClick={() => setShowStats(!showStats)}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                                <BarChart2 size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t.statsTitle}</h3>
                                <p className="text-xs text-gray-500">
                                    {completedGoals} {t.of} {totalGoals} {t.completed} ({overallProgress}%)
                                </p>
                            </div>
                        </div>
                        {showStats ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>

                    {/* Expanded Stats */}
                    {showStats && (
                        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 fade-in">
                            <div className="mb-6">
                                <div className="flex justify-between text-xs mb-1 font-medium dark:text-gray-300">
                                    <span>Progreso General</span>
                                    <span>{overallProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${overallProgress}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <CircularProgress 
                                    label={t.personal} 
                                    percent={getDomainStats('personal').percent} 
                                    color="text-purple-500"
                                />
                                <CircularProgress 
                                    label={t.family} 
                                    percent={getDomainStats('family').percent} 
                                    color="text-blue-500"
                                />
                                <CircularProgress 
                                    label={t.professional} 
                                    percent={getDomainStats('professional').percent} 
                                    color="text-orange-500"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Active Goals List */}
            {activeGoals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p>No active goals.</p>
                    <button onClick={() => setActiveTab('planner')} className="text-primary-600 font-bold hover:underline text-sm mt-2">
                        {t.discover}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeGoals.map(goal => (
                        <div 
                            key={goal.id} 
                            className={`group relative p-4 rounded-xl border transition-all duration-200 ${goal.status === 'completed' ? 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800 opacity-75' : 'bg-white border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700'}`}
                        >
                            <div className="flex items-start gap-3">
                                <button 
                                    onClick={() => toggleGoalCompletion(goal.id)}
                                    className={`mt-1 flex-shrink-0 transition-colors ${goal.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                                >
                                    <CheckCircle2 size={24} className={goal.status === 'completed' ? 'fill-current' : ''} />
                                </button>
                                
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase ${goal.domain === 'personal' ? 'text-purple-600' : goal.domain === 'family' ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {goal.domain === 'family' ? t.family : goal.domain === 'professional' ? t.professional : t.personal}
                                        </span>
                                        <span className="text-[10px] text-gray-400">•</span>
                                        <span className="text-[10px] text-gray-400">{goal.term === 'short-term' ? t.shortTerm : t.longTerm}</span>
                                    </div>
                                    <h4 className={`font-bold text-gray-900 dark:text-white ${goal.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                                        {goal.title}
                                    </h4>
                                    <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${goal.status === 'completed' ? 'hidden' : ''}`}>
                                        {goal.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* Floating Action Button (Lightbulb) */}
      <button 
        onClick={handleGetTips}
        className="fixed bottom-28 right-6 w-14 h-14 bg-yellow-400 text-white rounded-full shadow-lg shadow-yellow-400/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border-4 border-white dark:border-gray-900"
        title="Tips"
      >
          <Lightbulb size={28} className="group-hover:fill-current" />
          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20 pointer-events-none group-hover:opacity-40" />
      </button>
    </div>
  );
};

export default Goals;
