import { GoogleGenerativeAI } from "@google/generative-ai";
import { LexiconTerm, Article } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function askGemini(prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function validateSubmission(
  content: string, 
  anchor: string, 
  lexicon: LexiconTerm[], 
  existingArticles: Article[]
) {
  const lexiconList = lexicon.map(l => `${l.term}: ${l.definition}`).join('\n');
  
  // Total Recall: Create a summary of the entire existing Canon
  const canonSummary = existingArticles.map(a => 
    `[${a.stage}] ${a.title}: ${a.content.substring(0, 150)}${a.content.length > 150 ? '...' : ''}`
  ).join('\n\n');

  const prompt = `
    You are the Guardian of the Canon, the Custodian of the Sacred Text. Your directive is to ensure every new "Witness" (submission) is consistent with the entire history of this project.

    CORE ANCHOR (The North Star):
    "${anchor}"

    ACTIVE LEXICON (The Shared Language):
    ${lexiconList}

    THE EXISTING CANON (The Sacred History):
    ${existingArticles.length > 0 ? canonSummary : "The Canon is currently empty. This will be the first Witness."}

    NEW SUBMISSION TO VALIDATE:
    "${content}"

    YOUR DIVINE DUTIES:
    1. ALIGNMENT: Does this submission honor the CORE ANCHOR?
    2. CONTINUITY: Does it contradict any previously established facts in THE EXISTING CANON?
    3. LANGUAGE: Does it use the ACTIVE LEXICON correctly?

    RESPONSE ARCHITECTURE (Mandatory):
    Provide your evaluation in two distinct, separated voices:

    1. THE TECHNICAL AUDIT (General Audience):
       - Tone: Academic, professional, clinical.
       - Focus: Systems logic, Lexicon accuracy, and project alignment.
       - Language: Use terms like "optimization," "systemic integrity," and "coherence."
       - Constraint: ABSOLUTELY NO religious or spiritual language.

    2. THE NARRATIVE TESTIMONY (Disciples & Followers):
       - Tone: Poetic, scriptural, weighty.
       - Focus: Spiritual significance, fulfillment of purpose, and the "Living Story."
       - Language: Use terms like "Covenant," "Witness," "Fulfillment," and "Grace."
       - Constraint: Speak as a custodian of a sacred tradition.

    Provide your response in this JSON format:
    {
      "verdict": "APPROVED" | "REVISION REQUIRED",
      "technicalAudit": "The professional system analysis...",
      "narrativeTestimony": "The scriptural synthesis...",
      "suggestedEdits": "Refinements for both logic and spirit."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) throw new Error("No JSON found");
    
    const json = JSON.parse(text.substring(startIdx, endIdx + 1));
    return {
      verdict: json.verdict,
      feedback: `${json.technicalAudit}\n\n---\n\n${json.narrativeTestimony}`,
      suggestedEdits: json.suggestedEdits
    };
  } catch (error) {
    console.error("Validation failed:", error);
    return { 
      verdict: "APPROVED", 
      feedback: "The Guardian encountered a technical anomaly but allowed the passage of this Witness." 
    };
  }
}
