import { GoogleGenAI, Type, Schema } from "@google/genai";
import { OnboardingAnswers } from "../types";

// Helper to check for API Key
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes the user's initial onboarding answers to define their "Purpose" (Sentido).
 * Uses gemini-2.5-flash for speed and efficiency.
 */
export const analyzePurpose = async (answers: OnboardingAnswers): Promise<{ detailedAnalysis: string, shortStatement: string }> => {
  const ai = getAIClient();
  
  const prompt = `
    You are an expert psychologist specializing in the PERMA model, specifically the "Meaning" (Sentido) pillar.
    
    Analyze the following user profile to help them find their life purpose.
    
    User Data:
    - Emotional Drivers: ${answers.emotions}
    - Hobbies/Passions: ${answers.hobbies}
    - Important Values: ${answers.importantValues}
    - Professional Context: ${answers.professionalGoals}

    Task:
    1. Provide a detailed, encouraging analysis of how these factors connect to a greater purpose (approx 150 words).
    2. Create a concise "Purpose Statement" or Mantra (max 15 words).

    Return JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detailedAnalysis: { type: Type.STRING },
          shortStatement: { type: Type.STRING },
        },
        required: ["detailedAnalysis", "shortStatement"],
      } as Schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

/**
 * Analyzes the sentiment of a journal entry based on the 10 Positive Emotions.
 */
export const analyzeSentiment = async (text: string): Promise<{ sentiment: string, summary: string }> => {
  const ai = getAIClient();
  const prompt = `
    Analyze the emotional tone of this journal entry based on Barbara Fredrickson's 10 Positive Emotions and common negative states.
    Entry Text: "${text}"
    
    Possible Emotions (Choose the best fit):
    - Positive: Joy, Gratitude, Serenity, Interest, Hope, Pride, Amusement, Inspiration, Awe, Love.
    - Negative/Neutral: Neutral, Sadness, Anger, Fear, Anxiety, Frustration, Stress.
    
    Task:
    1. Identify the single most dominant emotion from the list above.
    2. Provide a very brief summary (max 10 words) of the emotional tone.
    
    Return JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING },
          summary: { type: Type.STRING },
        },
        required: ["sentiment", "summary"],
      } as Schema
    }
  });

  const textResult = response.text;
  if (!textResult) return { sentiment: 'Neutral', summary: 'No content analyzed.' };
  return JSON.parse(textResult);
};

/**
 * Generates a reflective journal prompt based on user's purpose and recent context.
 */
export const generateJournalPrompt = async (purpose: string, recentThemes: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = `
    Generate a single, deep, reflective journaling question (prompt) for a user to answer today.
    
    User Context:
    - Life Purpose Analysis: "${purpose}"
    - Recent Journal Themes: "${recentThemes}"
    
    The prompt should help them connect their daily activities to their purpose using the PERMA model.
    The tone should be inspiring and introspective.
    Language: Spanish.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Escribe sobre un momento hoy que te hizo sentir conectado con tu propósito.";
};

/**
 * General Chatbot using gemini-3-pro-preview for complex reasoning.
 */
export const sendChatMessage = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction: "You are a helpful assistant for a Purpose Journal app. Help the user reflect on their day, their meaning in life, and the PERMA model.",
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};

/**
 * Grounded Search for resources.
 */
export const searchResources = async (query: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Find resources, articles, or books related to: ${query}. Summarize findings.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

/**
 * Grounded Maps for finding places (volunteering, hobbies).
 */
export const findPlaces = async (query: string, location?: { lat: number, lng: number }) => {
  const ai = getAIClient();
  
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Find places related to: ${query}.`,
    config: config
  });

  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};