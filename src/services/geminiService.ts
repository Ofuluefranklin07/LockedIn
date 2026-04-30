import { GoogleGenAI } from "@google/genai";
import { DailyLog, Goal, UserProfile } from "../types";

export async function getAICoachFeedback(profile: UserProfile, logs: DailyLog[], goals: Goal[]) {
  if (!process.env.GEMINI_API_KEY) {
    return "AI Coach is currently unavailable. Please configure the GEMINI_API_KEY.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const logsContext = logs.slice(0, 7).map(l => `${l.date}: ${l.hoursStudied}h, Focus: ${l.focusLevel}/10`).join('\n');
  const goalsContext = goals.map(g => `${g.title} (${g.category}, priority: ${g.priority})`).join('\n');

  const prompt = `
    You are an AI Academic Coach for a student named ${profile.name}.
    Academic Level: ${profile.academicLevel}
    Field of Study: ${profile.fieldOfStudy}
    
    Current Goals:
    ${goalsContext}
    
    Recent Activity Logs (last 7 entries):
    ${logsContext}
    
    Please analyze their patterns and provide:
    1. A summary of their performance this week.
    2. Specific insights (e.g., "Your focus is higher on days you study more than 4 hours").
    3. Actionable advice to improve consistency and discipline.
    
    Keep the tone professional, encouraging, and focused on discipline. Use Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "I've analyzed your data but don't have specific feedback yet. Keep locking in!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to get AI feedback. Please try again later.";
  }
}
