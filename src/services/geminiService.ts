import { GoogleGenAI } from "@google/genai";
import { DailyLog, Goal, UserProfile } from "../types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const PLACEHOLDER_KEYS = new Set([
  "",
  "MY_GEMINI_API_KEY",
  "MY_VITE_GEMINI_API_KEY",
  "your-gemini-api-key-here",
  "your-real-key",
]);

export interface AcademicChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getGeminiClient() {
  const apiKey = GEMINI_API_KEY?.trim() ?? "";

  if (PLACEHOLDER_KEYS.has(apiKey)) {
    return {
      ai: null,
      setupMessage: [
        "## AI Coach setup needed",
        "",
        "The live app was built without a Gemini API key.",
        "",
        "For local development, add `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` to `.env.local`, then restart the dev server.",
        "",
        "For the deployed app, add the same value as `VITE_GEMINI_API_KEY` in your hosting provider's environment variables, then redeploy.",
      ].join("\n"),
    };
  }

  return {
    ai: new GoogleGenAI({ apiKey }),
    setupMessage: null,
  };
}

function formatGeminiError(error: unknown) {
  console.error("Gemini API Error:", error);
  const message = String((error as any)?.message ?? error);

  if (message.toLowerCase().includes("api key")) {
    return "## Gemini API key problem\n\nThe AI request failed because the Gemini API key is missing, invalid, or restricted. Locally, check `.env.local`. On the live app, check `VITE_GEMINI_API_KEY` in your hosting environment variables and redeploy.";
  }

  if (message.toLowerCase().includes("model")) {
    return `## Gemini model problem\n\nThe configured model \`${GEMINI_MODEL}\` was rejected by Gemini. Try checking that your API key has access to Gemini Developer API models.`;
  }

  return "## AI Coach unavailable\n\nGemini did not return a response. Please check your internet connection, API key billing/quota, and try again.";
}

export async function getAICoachFeedback(profile: UserProfile, logs: DailyLog[], goals: Goal[]) {
  const { ai, setupMessage } = getGeminiClient();

  if (!ai) {
    return setupMessage;
  }

  const logsContext = logs.length
    ? logs.slice(0, 7).map(l => `${l.date}: ${l.hoursStudied}h, Focus: ${l.focusLevel}/10`).join('\n')
    : "No study logs yet.";
  const goalsContext = goals.length
    ? goals.map(g => `${g.title} (${g.category}, priority: ${g.priority})`).join('\n')
    : "No active goals yet.";

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
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text || "I've analyzed your data but don't have specific feedback yet. Keep locking in!";
  } catch (error) {
    return formatGeminiError(error);
  }
}

export async function getAcademicChatReply(
  question: string,
  profile?: UserProfile | null,
  history: AcademicChatMessage[] = [],
) {
  const { ai, setupMessage } = getGeminiClient();

  if (!ai) {
    return setupMessage;
  }

  const recentHistory = history
    .slice(-8)
    .map(message => `${message.role === "user" ? "Student" : "Coach"}: ${message.content}`)
    .join("\n");

  const learnerContext = profile
    ? `Student context: ${profile.name}, ${profile.academicLevel}, studying ${profile.fieldOfStudy}.`
    : "Student context: unknown.";

  const prompt = `
    You are LockIn's Academic AI Coach.
    ${learnerContext}

    Your job is to answer academic questions clearly and practically.
    You can help with studying, assignments, concepts, exam preparation, note-taking,
    time management, research planning, and understanding difficult topics.

    Rules:
    - Give clear, direct answers.
    - Break complex ideas into steps.
    - If the student asks for homework help, teach the method instead of only dumping the final answer.
    - If the question is vague, ask one focused follow-up question.
    - Keep responses encouraging and concise unless the student asks for depth.
    - Use Markdown formatting where it improves clarity.

    Recent conversation:
    ${recentHistory || "No previous chat messages."}

    Student question:
    ${question}
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text || "I could not form a clear answer yet. Try asking the question in a slightly different way.";
  } catch (error) {
    return formatGeminiError(error);
  }
}
