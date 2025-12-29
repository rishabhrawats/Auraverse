import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

// Safety check
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing in environment variables");
}

// Initialize Gemini only if API key exists
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateOracleResponseGemini(
  question: string,
  systemPrompt: string,
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
${systemPrompt}

User question:
${question}

Respond with empathetic, practical, and concise guidance.
    `.trim();

    const result = await model.generateContent(prompt);

    if (!result?.response) {
      throw new Error("Empty response from Gemini");
    }

    return result.response.text();
  } catch (error: any) {
    console.error("❌ Gemini API Error:", error.message || error);
    throw new Error("Gemini API failed");
  }
}
