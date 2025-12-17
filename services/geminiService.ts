import { GoogleGenAI } from "@google/genai";
import { Word } from "../types";

// Note: In a real app, never expose API keys on the client side.
// This is for demonstration purposes using the user's environment.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getWordInsights = async (word: Word): Promise<string> => {
  if (!apiKey) return "Please configure your API Key to use AI features.";

  try {
    const prompt = `
      Teach me the English word/phrase "${word.en}" (meaning: ${word.zh}).
      1. Provide a fun memory aid or mnemonic suitable for a Chinese student.
      2. Provide 2 distinct example sentences (English with Chinese translation).
      3. List 2 common collocations (phrases it appears in).
      4. If it's a confusing word, explain the nuance.
      
      Format the output in clear Markdown. Keep it concise (under 200 words).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insight generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't fetch the AI insights right now. Please check your connection or API key.";
  }
};

export const generateQuizQuestion = async (word: Word): Promise<{question: string, options: string[], answerIndex: number} | null> => {
    // Advanced: This could be used to generate dynamic questions instead of static ones
    // Skipping for this iteration to keep the app snappy, relying on client-side logic for quizzes.
    return null; 
}