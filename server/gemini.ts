import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  console.log(`Gemini API key loaded: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
} else {
  console.log("No Gemini API key found");
}

const genAI = apiKey
  ? new GoogleGenerativeAI(apiKey)
  : null;

export async function generateOracleResponseGemini(question: string, systemPrompt: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key not configured");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const prompt = `${systemPrompt}

User question:
${question}

Respond with empathetic, practical, and concise guidance.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  return response;
}
