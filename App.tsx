
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Onboarding from './components/Onboarding';
import Journal from './components/Journal';
import LiveCoach from './components/LiveCoach';
import ChatAssistant from './components/ChatAssistant';
import Goals from './components/Goals';
import { Home, Book, MessageCircle, Settings as SettingsIcon, LogOut, Sun, Moon, Smile, Meh, Frown, Heart, Cloud, Zap, Star, Eye, Anchor, CloudRain, Sparkles, Loader2, Lock, User, Mail, ArrowRight, Target, CheckCircle2 } from 'lucide-react';
import { AppTheme, Language } from './types';
import { translations } from './services/translations';

const LoginScreen = () => {
  const { login, register, settings } = useAppContext();
  const t = translations[settings.language].auth;
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (isRegistering && !username)) {
        setError(t.errorFields);
        return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    let success = false;
    if (isRegistering) {
        success = await register(username, email, password);
        if (!success) setError(t.errorExists);
    } else {
        success = await login(email, password);
        if (!success) setError(t.errorCreds);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
             <Anchor size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isRegistering ? t.createAccount : t.welcome}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isRegistering ? t.subtitleRegister : t.subtitleLogin}
          </p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {isRegistering && (
                <div className="animate-in slide-in-from-top-4 fade-in">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{t.username}</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User size={18} /></div>
                    <input type="text" className="w-full pl-10 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} />
                </div>
                </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{t.email}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                <input type="email" required className="w-full pl-10 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{t.password}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                <input type="password" required className="w-full pl-10 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg disabled:opacity-70">
            {isLoading ? <><Loader2 className="animate-spin" size={20} /><span>{t.processing}</span></> : <>{isRegistering ? t.register : t.login}<ArrowRight size={18} /></>}
          </button>
        </form>
        <div className="mt-6 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-primary-600 font-medium" disabled={isLoading}>
                {isRegistering ? t.hasAccount : t.noAccount}
            </button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
    const { settings, updateSettings, logout, user } = useAppContext();
    const t = translations[settings.language].settings;
    const languages: { code: Language; name: string }[] = [
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'it', name: 'Italiano' }
    ];
    return (
        <div className="p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">{t.title}</h2>
            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">{t.profile}</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                     <p className="font-bold dark:text-white">{user?.username}</p>
                     <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
            </div>
            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">{t.appearance}</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <span className="dark:text-white">{t.theme}</span>
                    <button onClick={() => updateSettings({ theme: settings.theme === AppTheme.LIGHT ? AppTheme.DARK : AppTheme.LIGHT })} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                        {settings.theme === AppTheme.LIGHT ? <Sun size={20} className="text-orange-500" /> : <Moon size={20} className="text-blue-300" />}
                    </button>
                </div>
            </div>
            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">{t.language}</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-2">
                    {languages.map((lang) => (
                        <button key={lang.code} onClick={() => updateSettings({ language: lang.code })} className={`flex-1 min-w-[100px] py-2 rounded-lg border text-sm font-medium transition-all ${settings.language === lang.code ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
                            {lang.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">{t.accessibility}</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex gap-2">
                    {['small', 'medium', 'large'].map((size) => (
                        <button key={size} onClick={() => updateSettings({ fontSize: size as any })} className={`flex-1 py-2 rounded-lg border ${settings.fontSize === size ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
                            {size === 'small' ? 'A' : size === 'medium' ? 'AA' : 'AAA'}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center space-x-2 p-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100">
                <LogOut size={20} /><span>{t.logout}</span>
            </button>
        </div>
    )
}

const getEmotionIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'Joy': return <Sun size={16} className="text-yellow-600" />;
    case 'Gratitude': return <Heart size={16} className="text-pink-600" />;
    case 'Serenity': return <Cloud size={16} className="text-blue-600" />;
    case 'Interest': return <Zap size={16} className="text-orange-600" />;
    case 'Hope': return <Anchor size={16} className="text-green-600" />;
    case 'Pride': return <Star size={16} className="text-purple-600" />;
    case 'Amusement': return <Smile size={16} className="text-teal-600" />;
    case 'Inspiration': return <Sparkles size={16} className="text-indigo-600" />;
    case 'Awe': return <Eye size={16} className="text-violet-600" />;
    case 'Love': return <Heart size={16} className="text-red-600" />;
    case 'Sadness': return <CloudRain size={16} className="text-gray-600" />;
    case 'Anger': return <Frown size={16} className="text-red-800" />;
    default: return <Meh size={16} className="text-gray-500" />;
  }
};

const Dashboard = () => {
    const { user, entries, goals, toggleGoalCompletion, settings } = useAppContext();
    const t = translations[settings.language].dashboard;
    const sentimentEntries = entries.filter(e => e.sentiment).slice(0, 5);
    const recentGoals = goals.filter(g => g.status === 'active').slice(0, 2);
    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
             <div className="mb-6">
                 <h1 className="text-2xl font-bold dark:text-white">{t.welcome}, {user?.username}</h1>
                 <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
             </div>
             {user?.purposeStatement && (
                 <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 rounded-2xl shadow-lg text-white mb-8">
                     <p className="text-xs uppercase opacity-75 mb-2 font-bold tracking-wider">{t.purpose}</p>
                     <p className="text-xl font-medium italic">"{user.purposeStatement}"</p>
                 </div>
             )}
             {recentGoals.length > 0 && (
                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4">
                       <h2 className="text-lg font-bold dark:text-white">{t.goalsFocus}</h2>
                       <Link to="/goals" className="text-sm text-primary-600 font-medium hover:underline">{t.viewAll}</Link>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                       {recentGoals.map(goal => (
                           <div key={goal.id} className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl flex justify-between items-center">
                               <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{goal.title}</h3>
                               </div>
                               <button onClick={() => toggleGoalCompletion(goal.id)} className="text-gray-300 hover:text-green-500 transition-colors"><CheckCircle2 size={24} /></button>
                           </div>
                       ))}
                   </div>
                </div>
             )}
             <LiveCoach />
             {sentimentEntries.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">{t.emotions}</h2>
                    <div className="space-y-3">
                        {sentimentEntries.map((entry) => (
                            <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString(settings.language)}</span>
                                     <div className="flex items-center space-x-2">
                                        <div className="p-1.5 rounded-full bg-gray-50 dark:bg-gray-700">{getEmotionIcon(entry.sentiment || '')}</div>
                                        <span className="text-sm font-semibold dark:text-white">{entry.sentiment}</span>
                                     </div>
                                </div>
                                {entry.emotionalProfile && (
                                    <div className="space-y-1.5 mt-2">
                                        {Object.entries(entry.emotionalProfile).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 3).map(([emotion, percent]) => (
                                            <div key={emotion} className="flex items-center text-xs">
                                                <span className="w-20 text-gray-600 dark:text-gray-300 truncate">{emotion}</span>
                                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mx-2"><div className="h-full bg-primary-500/70" style={{ width: `${percent}%` }}></div></div>
                                                <span className="text-gray-500 dark:text-gray-400 w-8 text-right">{percent}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
             )}
             <div className="mb-4">
                 <h2 className="text-lg font-bold mb-4 dark:text-white">{t.recentEntries}</h2>
                 {entries.length === 0 ? <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500">{t.noEntries}</div> : (
                     <div className="space-y-4">
                         {entries.slice(0, 5).map(entry => (
                             <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString(settings.language)}</span>
                                     <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700">
                                          {getEmotionIcon(entry.sentiment || '')}<span className="text-[10px]">{entry.sentiment}</span>
                                     </div>
                                 </div>
                                 <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{entry.personal || entry.family || entry.professional}</p>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
        </div>
    )
}

const Layout = ({ children }: React.PropsWithChildren) => {
    const { settings } = useAppContext();
    const location = useLocation();
    const t = translations[settings.language].nav;
    const fontClass = { 'small': 'text-sm', 'medium': 'text-base', 'large': 'text-lg' }[settings.fontSize];
    const navItems = [
        { path: '/', icon: Home, label: t.home },
        { path: '/journal', icon: Book, label: t.journal },
        { path: '/goals', icon: Target, label: t.goals },
        { path: '/chat', icon: MessageCircle, label: t.assistant },
        { path: '/settings', icon: SettingsIcon, label: t.settings },
    ];
    return (
        <div className={`min-h-screen ${fontClass} transition-all duration-200`}>
            <main className="pb-20">{children}</main>
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
                <div className="flex justify-around items-center p-3 max-w-2xl mx-auto">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} className={`flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} /><span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

const AppContent = () => {
  const { user } = useAppContext();
  if (!user) return <LoginScreen />;
  if (!user.onboardingComplete) return <Onboarding />;
  return (
    <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
    </HashRouter>
  );
};

const App = () => <AppProvider><AppContent /></AppProvider>;
export default App;
