
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { OnboardingAnswers, JournalEntry, UserProfile, Goal, Language } from "../types";

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
 */
export const analyzePurpose = async (answers: OnboardingAnswers, lang: Language = 'es'): Promise<{ detailedAnalysis: string, shortStatement: string }> => {
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
    
    Language: ${lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Italian'}.
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
export const analyzeSentiment = async (text: string, lang: Language = 'es'): Promise<{ sentiment: string, summary: string, breakdown: { emotion: string, percentage: number }[] }> => {
  const ai = getAIClient();
  const prompt = `
    Analyze the emotional tone of this journal entry based on Barbara Fredrickson's 10 Positive Emotions.
    Entry Text: "${text}"
    Language of output: ${lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Italian'}.
    Return JSON with dominant emotion, summary and breakdown.
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
          breakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    emotion: { type: Type.STRING },
                    percentage: { type: Type.NUMBER }
                }
            }
          }
        },
        required: ["sentiment", "summary", "breakdown"],
      } as Schema
    }
  });

  const textResult = response.text;
  if (!textResult) return { sentiment: 'Neutral', summary: 'No content analyzed.', breakdown: [{ emotion: 'Neutral', percentage: 100 }] };
  return JSON.parse(textResult);
};

/**
 * Generates tips based on active goals using PERMA model.
 */
export const generatePermaTips = async (purpose: string, activeGoals: Goal[], lang: Language = 'es'): Promise<{ tips: string[], motivation: string }> => {
  const ai = getAIClient();
  const goalsSummary = activeGoals.map(g => `- ${g.title} (${g.domain})`).join('\n');
  
  const prompt = `
    As a PERMA coach, provide short, actionable tips for a user to achieve their goals.
    Purpose: "${purpose}"
    Active Goals:
    ${goalsSummary}

    Task:
    1. Create 3 short, concrete tips (max 15 words each). Each tip MUST relate to one PERMA pillar (Positive Emotion, Engagement, Relationships, Meaning, Accomplishment).
    2. Create 1 powerful motivational mantra (max 10 words).
    
    Language: ${lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Italian'}.
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
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          motivation: { type: Type.STRING },
        },
        required: ["tips", "motivation"],
      } as Schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

/**
 * Generates a reflective journal prompt.
 */
export const generateJournalPrompt = async (purpose: string, recentThemes: string, lang: Language = 'es'): Promise<string> => {
  const ai = getAIClient();
  const langStr = lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Italian';
  const prompt = `Generate a deep journaling question for today. Purpose: ${purpose}, Recent: ${recentThemes}. Language: ${langStr}.`;
  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return response.text || "Reflexiona sobre tu propósito hoy.";
};

/**
 * Generates Goal Suggestions.
 */
export const generateGoalSuggestions = async (user: UserProfile, entries: JournalEntry[], lang: Language = 'es'): Promise<Omit<Goal, 'id' | 'createdAt' | 'status' | 'isAiGenerated'>[]> => {
  const ai = getAIClient();
  const langStr = lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Italian';
  const prompt = `Generate 3 suggested PERMA goals for: ${user.purposeAnalysis}. Return JSON in ${langStr}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                term: { type: Type.STRING, enum: ["short-term", "long-term"] },
                domain: { type: Type.STRING, enum: ["personal", "family", "professional"] }
            },
            required: ["title", "description", "term", "domain"]
        }
      } as Schema
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
}

export const sendChatMessage = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({ model: 'gemini-3-pro-preview', history: history });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};

export const searchResources = async (query: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Summarize findings for: ${query}.`,
    config: { tools: [{ googleSearch: {} }] },
  });
  return { text: response.text, chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

export const findPlaces = async (query: string, location?: { lat: number, lng: number }) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Find places for: ${query}.`,
    config: { tools: [{ googleMaps: {} }] }
  });
  return { text: response.text, chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};
