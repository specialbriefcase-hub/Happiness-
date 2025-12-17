
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../services/translations';

const LiveCoach = () => {
  const { settings } = useAppContext();
  const t = translations[settings.language].live;
  const [connected, setConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setConnected(false);
  };

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      return stream;
    } catch (err) {
      setError("Microphone access denied.");
      return null;
    }
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
     const dataInt16 = new Int16Array(data.buffer);
     const frameCount = dataInt16.length / numChannels;
     const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
     for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
     }
     return buffer;
  }

  const createBlob = (data: Float32Array) => {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
      return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const toggleConnection = async () => {
    if (connected) {
      cleanup();
      return;
    }
    const stream = await initAudio();
    if (!stream || !audioContextRef.current || !outputAudioContextRef.current) return;
    setError(null);
    setConnected(true);
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;
    const ai = new GoogleGenAI({ apiKey });
    sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                if (!audioContextRef.current) return;
                const source = audioContextRef.current.createMediaStreamSource(stream);
                const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(processor);
                processor.connect(audioContextRef.current.destination);
                inputSourceRef.current = source;
                processorRef.current = processor;
            },
            onmessage: async (msg: LiveServerMessage) => {
                if (!outputAudioContextRef.current) return;
                const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio) {
                    setIsTalking(true);
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                    const source = outputAudioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContextRef.current.destination);
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) setIsTalking(false);
                    });
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }
                if (msg.serverContent?.interrupted) {
                    sourcesRef.current.forEach(s => s.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setIsTalking(false);
                }
            },
            onerror: () => setConnected(false),
            onclose: () => setConnected(false)
        },
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: t.systemInstruction,
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl shadow-xl text-white mb-6 flex flex-col items-center justify-center relative overflow-hidden">
        {connected && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className={`w-64 h-64 rounded-full bg-white opacity-10 animate-ping ${isTalking ? 'duration-1000' : 'duration-[3000ms]'}`}></div>
                 <div className={`w-48 h-48 rounded-full bg-white opacity-10 animate-ping delay-75 ${isTalking ? 'duration-1000' : 'duration-[3000ms]'}`}></div>
             </div>
        )}
        <h2 className="text-xl font-bold mb-4 z-10">{t.title}</h2>
        <p className="text-white/80 text-center mb-6 z-10 max-w-xs">{t.subtitle}</p>
        {error && <p className="text-red-200 bg-red-900/50 px-3 py-1 rounded mb-4 z-10">{error}</p>}
        <button onClick={toggleConnection} className={`z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg border-4 ${connected ? 'bg-white text-red-500 border-red-200' : 'bg-white text-primary-600 border-primary-200'}`}>
            {connected ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <div className="mt-4 h-6 flex items-center space-x-2 z-10">
            {connected && (
                <>
                    <div className={`w-2 h-2 rounded-full bg-white ${isTalking ? 'animate-bounce' : ''}`}></div>
                    <div className={`w-2 h-2 rounded-full bg-white ${isTalking ? 'animate-bounce delay-75' : ''}`}></div>
                    <div className={`w-2 h-2 rounded-full bg-white ${isTalking ? 'animate-bounce delay-150' : ''}`}></div>
                    <span className="text-sm font-medium ml-2">{isTalking ? t.talking : t.listening}</span>
                </>
            )}
        </div>
    </div>
  );
};

export default LiveCoach;
