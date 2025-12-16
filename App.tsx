import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Onboarding from './components/Onboarding';
import Journal from './components/Journal';
import LiveCoach from './components/LiveCoach';
import ChatAssistant from './components/ChatAssistant';
import { Home, Book, MessageCircle, Settings as SettingsIcon, LogOut, Sun, Moon, Smile, Meh, Frown, Heart, Cloud, Zap, Star, Eye, Anchor, CloudRain, Sparkles, Loader2, Lock, User, Mail } from 'lucide-react';
import { AppTheme } from './types';

const LoginScreen = () => {
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email && password) {
      setIsLoading(true);
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      login(username, email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-4">
             <Anchor size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crear Cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400">Comienza tu viaje hacia el propósito</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 transition-all"
                  placeholder="Tu nombre"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 transition-all"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/30 transition-all flex justify-center items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>Registrarse</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Settings = () => {
    const { settings, updateSettings, logout, user } = useAppContext();
    
    return (
        <div className="p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Configuración</h2>
            
            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">Perfil</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                     <p className="font-bold dark:text-white">{user?.username}</p>
                     <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
            </div>

            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">Apariencia</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <span className="dark:text-white">Tema</span>
                    <button 
                        onClick={() => updateSettings({ theme: settings.theme === AppTheme.LIGHT ? AppTheme.DARK : AppTheme.LIGHT })}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {settings.theme === AppTheme.LIGHT ? <Sun size={20} className="text-orange-500" /> : <Moon size={20} className="text-blue-300" />}
                    </button>
                </div>
            </div>

             <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">Accesibilidad</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between mb-2 dark:text-white">
                        <span>Tamaño de Letra</span>
                    </div>
                    <div className="flex gap-2">
                        {['small', 'medium', 'large'].map((size) => (
                             <button
                                key={size}
                                onClick={() => updateSettings({ fontSize: size as any })}
                                className={`flex-1 py-2 rounded-lg border ${settings.fontSize === size ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                             >
                                {size === 'small' ? 'A' : size === 'medium' ? 'AA' : 'AAA'}
                             </button>
                        ))}
                    </div>
                </div>
            </div>

            <button 
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 p-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
            </button>
        </div>
    )
}

// Helper for dashboard icon
const getEmotionIcon = (sentiment: string) => {
  const s = sentiment || 'Neutral';
  switch (s) {
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
    const { user, entries } = useAppContext();

    // Sentiment Visualization Data
    const sentimentEntries = entries.filter(e => e.sentiment).slice(0, 7).reverse();

    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
             {/* Header */}
             <div className="mb-6">
                 <h1 className="text-2xl font-bold dark:text-white">Hola, {user?.username}</h1>
                 <p className="text-gray-500 dark:text-gray-400">Hoy es un buen día para encontrar sentido.</p>
             </div>

             {/* Purpose Card */}
             {user?.purposeStatement && (
                 <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 rounded-2xl shadow-lg text-white mb-8">
                     <p className="text-xs uppercase opacity-75 mb-2 font-bold tracking-wider">Tu Propósito</p>
                     <p className="text-xl font-medium italic">"{user.purposeStatement}"</p>
                 </div>
             )}

             {/* Live Coach Teaser */}
             <LiveCoach />

             {/* Sentiment Tracker */}
             {sentimentEntries.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">Tu Estado Emocional (Últimos días)</h2>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center px-2">
                            {sentimentEntries.map((entry) => (
                                <div key={entry.id} className="flex flex-col items-center space-y-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-700`}>
                                        {getEmotionIcon(entry.sentiment || '')}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             )}

             {/* Recent Entries */}
             <div className="mb-4">
                 <h2 className="text-lg font-bold mb-4 dark:text-white">Entradas Recientes</h2>
                 {entries.length === 0 ? (
                     <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500">
                         No hay entradas aún. ¡Escribe la primera!
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {entries.slice(0, 5).map(entry => (
                             <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                                     <div className="flex space-x-1 items-center">
                                         {entry.sentiment && (
                                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700">
                                                 {getEmotionIcon(entry.sentiment)}
                                                 <span className="text-[10px] text-gray-600 dark:text-gray-300">
                                                    {entry.sentiment}
                                                 </span>
                                            </div>
                                         )}
                                     </div>
                                 </div>
                                 <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                     {entry.personal || entry.family || entry.professional}
                                 </p>
                                 {entry.images.length > 0 && (
                                     <div className="mt-2 flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                                         {entry.images.map((img, i) => (
                                             <img key={i} src={img} className="w-12 h-12 rounded-lg object-cover" alt="thumb" />
                                         ))}
                                     </div>
                                 )}
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

    // Map fontSize setting to Tailwind classes on a wrapper
    const fontClass = {
        'small': 'text-sm',
        'medium': 'text-base',
        'large': 'text-lg',
    }[settings.fontSize];

    const navItems = [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/journal', icon: Book, label: 'Diario' },
        { path: '/chat', icon: MessageCircle, label: 'Asistente' },
        { path: '/settings', icon: SettingsIcon, label: 'Ajustes' },
    ];

    return (
        <div className={`min-h-screen ${fontClass} transition-all duration-200`}>
            <main className="pb-20">
                {children}
            </main>
            
            {/* Sticky Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
                <div className="flex justify-around items-center p-3 max-w-2xl mx-auto">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                className={`flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
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

  if (!user) {
    return <LoginScreen />;
  }

  if (!user.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
    </HashRouter>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;