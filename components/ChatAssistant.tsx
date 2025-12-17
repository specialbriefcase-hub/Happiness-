
import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Bot } from 'lucide-react';
import { sendChatMessage, searchResources, findPlaces } from '../services/gemini';
import { Message } from '../types';
import { useAppContext } from '../context/AppContext';
import { translations } from '../services/translations';

const ChatAssistant = () => {
  const { settings } = useAppContext();
  const t = translations[settings.language].chat;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: t.welcome }
  ]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'search' | 'maps'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset messages if language changes to show the localized welcome
  useEffect(() => {
    setMessages([{ role: 'model', content: t.welcome }]);
  }, [settings.language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      let responseText = '';
      let chunks = null;
      let type: 'text' | 'map_result' | 'search_result' = 'text';
      if (mode === 'chat') {
        const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
        responseText = await sendChatMessage(history, userMsg.content);
      } else if (mode === 'search') {
        const result = await searchResources(userMsg.content);
        responseText = result.text || '...';
        chunks = result.chunks;
        type = 'search_result';
      } else if (mode === 'maps') {
        const result = await findPlaces(userMsg.content);
        responseText = result.text || '...';
        chunks = result.chunks;
        type = 'map_result';
      }
      setMessages(prev => [...prev, { role: 'model', content: responseText, type, metadata: chunks }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: t.error }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (msg: Message) => {
    if (msg.role === 'user') return <p>{msg.content}</p>;
    return (
      <div>
        <div className="markdown prose dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
        {msg.metadata && msg.type === 'search_result' && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">{t.sources}</p>
            {msg.metadata.map((chunk: any, i: number) => (
              chunk.web?.uri && (
                <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 hover:underline truncate">
                  {chunk.web.title || chunk.web.uri}
                </a>
              )
            ))}
          </div>
        )}
        {msg.metadata && msg.type === 'map_result' && (
           <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">{t.places}</p>
             {msg.metadata.map((chunk: any, i: number) => (
               chunk.web?.uri && (
                 <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-xs text-green-600 hover:underline bg-green-50 dark:bg-green-900/20 p-2 rounded">
                   <MapPin size={12} />
                   <span>{chunk.web.title || "Map"}</span>
                 </a>
               )
             ))}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-900 p-2 flex justify-around border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setMode('chat')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'chat' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`}>
            <Bot size={16} /> <span>{t.modes.chat}</span>
        </button>
        <button onClick={() => setMode('search')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'search' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
            <Search size={16} /> <span>{t.modes.search}</span>
        </button>
        <button onClick={() => setMode('maps')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'maps' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>
            <MapPin size={16} /> <span>{t.modes.maps}</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              {renderContent(m)}
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex justify-start animate-in fade-in duration-300">
                 <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-3">
                     <div className="flex space-x-1 h-3 items-center">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                     </div>
                     <span className="text-xs text-gray-500">{t.writing}</span>
                 </div>
             </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'chat' ? t.placeholderChat : mode === 'search' ? t.placeholderSearch : t.placeholderMaps}
            className="flex-1 p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900"
          />
          <button onClick={handleSend} disabled={!input.trim() || loading} className="p-3 bg-primary-600 text-white rounded-xl disabled:opacity-50">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
