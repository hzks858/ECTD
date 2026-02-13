import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateComplianceCheck = async (content: string, context: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert Regulatory Affairs professional specializing in ICH eCTD requirements.
      Analyze the following content segment from an eCTD submission.
      Context/Section: ${context}
      
      Content:
      "${content}"

      Task: 
      1. Identify if the content aligns with ICH M4 guidelines for this section.
      2. Highlight any missing critical information (e.g., cross-references, specific data points).
      3. Provide a brief compliance status (Compliant/Needs Revision) and actionable feedback.
      
      Keep the response concise and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate compliance check.";
  } catch (error) {
    console.error("Gemini Compliance Check Error:", error);
    return "Error connecting to AI service. Please check your API key.";
  }
};

export const generateSummary = async (content: string): Promise<string> => {
  try {
    const prompt = `
      You are a regulatory writer. Summarize the following technical document content for an executive overview (Module 2 style).
      
      Content:
      "${content}"
      
      Output a concise paragraph suitable for an Executive Summary.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate summary.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Error connecting to AI service.";
  }
};

export const chatWithEctdExpert = async (message: string): Promise<string> => {
  try {
     const prompt = `
      You are PharmaSync AI, an expert assistant for the eCTD management system.
      You help regulatory professionals with ICH guidelines, submission structures, and document formatting.
      
      User Query: "${message}"
      
      Provide a helpful, accurate answer based on ICH M1-M5 guidelines.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "System Error: Unable to reach AI service.";
  }
}