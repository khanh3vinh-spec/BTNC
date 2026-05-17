
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a high-level mathematical OCR specialist. 
Your task is to convert images or PDF documents of math content into clear, high-quality Markdown text with LaTeX formulas.

Rules:
1. Wrap inline math with $ $.
2. Wrap block math with $$ $$.
3. Use proper LaTeX commands for symbols (e.g., \\triangle, \\overline{...}, \\lceil ... \\rceil, \\mathbb{N}, etc.).
4. Keep the structure of the document (Question numbers, sub-points like a, b, c).
5. Output the result in Vietnamese as shown in the document.
6. Ensure precision in numbers and mathematical expressions.
7. Only return the processed markdown content, nothing else.`;

export async function convertFileToLatex(base64Data: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Please accurately retype this mathematical document using LaTeX for all expressions. Maintain the original structure and language (Vietnamese)."
          }
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    return response.text || '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
