import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Bot } from 'lucide-react';
import { sendChatMessage, searchResources, findPlaces } from '../services/gemini';
import { Message } from '../types';

const ChatAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hola. Soy tu asistente de propósito. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre el modelo PERMA, pedirme que busque libros, o que encuentre lugares para realizar actividades.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'search' | 'maps'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        // Convert history format
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));
        responseText = await sendChatMessage(history, userMsg.content);
      } else if (mode === 'search') {
        const result = await searchResources(userMsg.content);
        responseText = result.text || 'No encontré resultados.';
        chunks = result.chunks;
        type = 'search_result';
      } else if (mode === 'maps') {
        // Mock location for demo purposes (San Francisco), ideally use navigator.geolocation
        const result = await findPlaces(userMsg.content, { lat: 37.7749, lng: -122.4194 });
        responseText = result.text || 'No encontré lugares.';
        chunks = result.chunks;
        type = 'map_result';
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: responseText, 
        type: type,
        metadata: chunks 
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: 'Lo siento, hubo un error procesando tu solicitud.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (msg: Message) => {
    if (msg.role === 'user') return <p>{msg.content}</p>;

    return (
      <div>
        <div className="markdown prose dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
        
        {/* Render Grounding Sources if available */}
        {msg.metadata && msg.type === 'search_result' && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Fuentes:</p>
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
            <p className="text-xs font-bold text-gray-500 uppercase">Lugares:</p>
             {msg.metadata.map((chunk: any, i: number) => (
               chunk.web?.uri && ( // Maps tool often returns web uris for places
                 <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-xs text-green-600 hover:underline bg-green-50 dark:bg-green-900/20 p-2 rounded">
                   <MapPin size={12} />
                   <span>{chunk.web.title || "Ver en Mapa"}</span>
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
      {/* Header / Mode Switcher */}
      <div className="bg-gray-50 dark:bg-gray-900 p-2 flex justify-around border-b border-gray-200 dark:border-gray-700">
        <button 
            onClick={() => setMode('chat')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'chat' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-500'}`}
        >
            <Bot size={16} /> <span>Chat</span>
        </button>
        <button 
            onClick={() => setMode('search')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'search' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500'}`}
        >
            <Search size={16} /> <span>Recursos</span>
        </button>
        <button 
            onClick={() => setMode('maps')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'maps' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'text-gray-500'}`}
        >
            <MapPin size={16} /> <span>Lugares</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              m.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-none' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
            }`}>
              {renderContent(m)}
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex justify-start">
                 <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
                     <div className="flex space-x-1">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                 </div>
             </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
                mode === 'chat' ? "Pregunta algo..." : 
                mode === 'search' ? "Buscar artículos, libros..." : "Buscar lugares..."
            }
            className="flex-1 p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;