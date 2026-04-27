import { GoogleGenerativeAI } from "@google/generative-ai";
import { NarrativeStage, LexiconTerm, Article } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Model fallback chain — ordered by speed/quota availability
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

// Try calling Gemini with automatic model fallback on quota/model errors
async function callWithFallback(prompt: string, useJsonMode: boolean = false): Promise<string> {
  let lastError: any = null;
  
  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[Guardian] Trying model: ${modelName}...`);
      
      const modelConfig: any = { model: modelName };
      if (useJsonMode) {
        modelConfig.generationConfig = { responseMimeType: "application/json" };
      }
      
      const currentModel = genAI.getGenerativeModel(modelConfig);
      const result = await currentModel.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`[Guardian] ✅ ${modelName} responded (${text.length} chars)`);
      return text;
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || '';
      console.warn(`[Guardian] ❌ ${modelName} failed: ${msg.substring(0, 120)}`);
      
      // Only retry on quota/model errors, not on prompt issues
      if (msg.includes('quota') || msg.includes('429') || msg.includes('model') || msg.includes('404') || msg.includes('not found')) {
        continue; // Try next model
      }
      // For other errors (network, auth), don't bother trying other models
      throw error;
    }
  }
  
  throw lastError || new Error("All models exhausted");
}

export async function askGemini(prompt: string) {
  return callWithFallback(prompt);
}

// ============================================================
// THE "TRUTH PREVAILS" ENGINE — v2: Deep Analysis
// ============================================================

export interface ThoughtAnalysis {
  verseIndex: number;
  assignedStage: NarrativeStage;
  originalText: string;
  refinedText: string;
  reason: string;
  confidence: number;
  contradictions: string[];
  suggestedLexiconTerms: string[];
}

export interface AnalysisResult {
  primaryStage: NarrativeStage;
  linkedStruggleId: string | null;
  thoughtAnalysis: ThoughtAnalysis[];
  verdict: 'APPROVED' | 'REVISION REQUIRED';
  canonAlignment: string;
  suggestedEdits: string | null;
  coherenceScore: number;
  contradictions: string[];
}

export async function analyzeAndRefine(
  thoughts: { id: string; text: string; lexiconTermId?: string }[],
  title: string,
  anchor: string,
  lexicon: LexiconTerm[],
  existingArticles: Article[]
): Promise<AnalysisResult> {
  const lexiconList = lexicon.map(l => `"${l.term}": ${l.definition}`).join('\n');
  
  const canonSummary = existingArticles.map(a => {
    const thoughtsText = a.thoughts
      .map((t, i) => `  Verse ${i + 1}: ${t.refinedText || t.text}`)
      .join('\n');
    return `[${a.stage}] "${a.title}" (by ${a.author}):\n${thoughtsText}`;
  }).join('\n\n');

  const thoughtsForPrompt = thoughts.map((t, i) =>
    `Verse ${i + 1}: "${t.text}"`
  ).join('\n');

  const struggles = existingArticles.filter(a => a.stage === 'Lamentations');
  const strugglesList = struggles.map(s => `- ID: "${s.id}" | Title: "${s.title}"`).join('\n');

  const prompt = `
You are the Guardian of the Canon — a truth-seeking intelligence that sees through every narrative style to find the raw truth beneath.

A user has submitted thoughts. Classify each thought, refine its text, and analyze alignment.

THE FIVE STAGES:
- Genesis: Foundational truths, axioms, first principles.
- Leviticus: Protocols, rules, standards, governance.
- Lamentations: Struggles, gaps, contradictions, pain points.
- Gospels: Resolutions, answers, healing, solutions.
- Revelation: Future vision, convergence, prophecy.

CORE ANCHOR: "${anchor}"

LEXICON: ${lexiconList || "None yet."}

EXISTING CANON: ${existingArticles.length > 0 ? canonSummary : "Empty — this is a founding submission."}

STRUGGLES: ${struggles.length > 0 ? strugglesList : "None."}

TITLE: "${title}"

THOUGHTS:
${thoughtsForPrompt}

INSTRUCTIONS:
1. Classify each thought into a stage.
2. Rate confidence 0-100 for each classification.
3. Refine each thought to canonical tone (preserve meaning, elevate expression).
4. Check for contradictions with existing canon.
5. Suggest relevant lexicon terms for each thought.
6. Determine the primary stage and overall coherence score (0-100).
7. If coherenceScore >= 60 and no critical contradictions, verdict = "APPROVED", otherwise "REVISION REQUIRED".
8. If this resolves a struggle, set linkedStruggleId to its ID.

Return ONLY valid JSON matching this schema:
{
  "primaryStage": "Genesis",
  "linkedStruggleId": null,
  "coherenceScore": 85,
  "contradictions": [],
  "thoughtAnalysis": [
    {
      "verseIndex": 0,
      "assignedStage": "Genesis",
      "confidence": 92,
      "originalText": "the original text",
      "refinedText": "The refined canonical text",
      "reason": "Why this stage",
      "contradictions": [],
      "suggestedLexiconTerms": ["TermName"]
    }
  ],
  "verdict": "APPROVED",
  "canonAlignment": "Alignment analysis text",
  "suggestedEdits": null
}`;

  console.log("[Guardian] Starting analysis with", thoughts.length, "thoughts...");

  try {
    // Try with JSON mode first, fall back to raw text parsing
    let text: string;
    try {
      text = await callWithFallback(prompt, true);
    } catch {
      console.log("[Guardian] JSON mode failed, trying raw text mode...");
      text = await callWithFallback(prompt, false);
    }

    // Extract JSON from response
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      console.error("[Guardian] No JSON found. Response:", text.substring(0, 300));
      throw new Error("No JSON in response");
    }

    const json = JSON.parse(text.substring(startIdx, endIdx + 1));
    console.log("[Guardian] ✅ Analysis complete. Verdict:", json.verdict, "| Coherence:", json.coherenceScore);

    const normalizedAnalysis: ThoughtAnalysis[] = (json.thoughtAnalysis || []).map((ta: any, i: number) => ({
      verseIndex: ta.verseIndex ?? i,
      assignedStage: ta.assignedStage as NarrativeStage,
      originalText: ta.originalText || thoughts[i]?.text || '',
      refinedText: ta.refinedText || ta.originalText || thoughts[i]?.text || '',
      reason: ta.reason || '',
      confidence: typeof ta.confidence === 'number' ? ta.confidence : 75,
      contradictions: Array.isArray(ta.contradictions) ? ta.contradictions : [],
      suggestedLexiconTerms: Array.isArray(ta.suggestedLexiconTerms) ? ta.suggestedLexiconTerms : [],
    }));

    return {
      primaryStage: json.primaryStage as NarrativeStage,
      linkedStruggleId: json.linkedStruggleId || null,
      thoughtAnalysis: normalizedAnalysis,
      verdict: json.verdict,
      canonAlignment: json.canonAlignment || '',
      suggestedEdits: json.suggestedEdits || null,
      coherenceScore: typeof json.coherenceScore === 'number' ? json.coherenceScore : 75,
      contradictions: Array.isArray(json.contradictions) ? json.contradictions : [],
    };
  } catch (error: any) {
    console.error("[Guardian] FAILED:", error?.message || error);
    return {
      primaryStage: 'Genesis' as NarrativeStage,
      linkedStruggleId: null,
      thoughtAnalysis: thoughts.map((t, i) => ({
        verseIndex: i,
        assignedStage: 'Genesis' as NarrativeStage,
        originalText: t.text,
        refinedText: t.text,
        reason: 'Guardian encountered a technical anomaly. Original text preserved.',
        confidence: 50,
        contradictions: [],
        suggestedLexiconTerms: [],
      })),
      verdict: 'APPROVED',
      canonAlignment: 'The Guardian was unable to fully analyze this submission but allowed its passage.',
      suggestedEdits: null,
      coherenceScore: 50,
      contradictions: [],
    };
  }
}
