import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function generateOracleResponseGemini(question: string, systemPrompt: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key not configured");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `${systemPrompt}

User question:
${question}

Respond with empathetic, practical, and concise guidance.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  return response;
}
