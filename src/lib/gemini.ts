import { GoogleGenerativeAI } from "@google/generative-ai";
import { NarrativeStage, LexiconTerm, Article } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

// ============================================================
// THE "TRUTH PREVAILS" ENGINE — v2: Deep Analysis
// ============================================================
// Now with: contradiction detection, confidence scoring,
// auto-lexicon suggestion, and coherence scoring.
// ============================================================

export interface ThoughtAnalysis {
  verseIndex: number;
  assignedStage: NarrativeStage;
  originalText: string;
  refinedText: string;
  reason: string;
  confidence: number; // 0-100: how confident is the Guardian in this classification
  contradictions: string[]; // any contradictions with existing canon
  suggestedLexiconTerms: string[]; // lexicon term names that should be anchored
}

export interface AnalysisResult {
  primaryStage: NarrativeStage;
  linkedStruggleId: string | null;
  thoughtAnalysis: ThoughtAnalysis[];
  verdict: 'APPROVED' | 'REVISION REQUIRED';
  canonAlignment: string;
  suggestedEdits: string | null;
  coherenceScore: number; // 0-100: overall coherence with the existing canon
  contradictions: string[]; // system-level contradictions
}

export async function analyzeAndRefine(
  thoughts: { id: string; text: string; lexiconTermId?: string }[],
  title: string,
  anchor: string,
  lexicon: LexiconTerm[],
  existingArticles: Article[]
): Promise<AnalysisResult> {
  const lexiconList = lexicon.map(l => `"${l.term}": ${l.definition}`).join('\n');
  
  // Build canon summary from thoughts
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
You are the Guardian of the Canon — a truth-seeking intelligence that sees through every narrative style to find the raw truth beneath. Your purpose: let the truth prevail regardless of how it is expressed.

A user has submitted a chain of thoughts. They have NOT chosen a narrative stage. YOU must determine the truth of each thought with DEEP ANALYSIS.

THE FIVE STAGES:
- Genesis: Foundational truths, axioms, first principles. The bedrock.
- Leviticus: Protocols, rules, standards, governance. The law.
- Lamentations: Struggles, gaps, contradictions, pain points. The honest cry.
- Gospels: Resolutions, answers, healing, solutions. The good news.
- Revelation: Future vision, convergence, prophecy. The horizon.

CORE ANCHOR (The North Star — all truth must orbit this):
"${anchor}"

ACTIVE LEXICON (The Shared Language):
${lexiconList || "No terms defined yet."}

THE EXISTING CANON (The Sacred History):
${existingArticles.length > 0 ? canonSummary : "The Canon is currently empty. This is a founding submission."}

ACTIVE STRUGGLES (Lamentations that may be resolved by this submission):
${struggles.length > 0 ? strugglesList : "No active struggles."}

SUBMISSION TITLE: "${title}"

RAW THOUGHTS FROM USER:
${thoughtsForPrompt}

YOUR DEEP ANALYSIS DUTIES:

1. TRUTH EXTRACTION: See through the narrative style. Whether casual, poetic, technical, or emotional — extract the TRUTH.

2. CLASSIFICATION + CONFIDENCE: Classify each thought into its true stage AND rate your confidence (0-100). Low confidence means the thought is ambiguous or could belong to multiple stages.

3. CONTRADICTION DETECTION: For EACH thought, check if it contradicts anything in the existing Canon. If a thought says "X is true" but the Canon already contains "X is false", flag it. Be specific — quote the conflicting canonical text.

4. REFINEMENT: Rewrite each thought with canonical weight — dignified, clear, aligned with the Anchor. Do NOT change the meaning, only elevate the expression.

5. LEXICON MAPPING: For each thought, identify which Lexicon terms are conceptually relevant (even if the user didn't explicitly use them). Return the TERM NAMES, not IDs.

6. STRUGGLE RESOLUTION: If any thought resolves an existing Struggle, identify which one by its ID.

7. COHERENCE SCORING: Rate the overall coherence (0-100) of this submission against the entire existing Canon. Consider: Does it fit? Does it advance the narrative? Does it introduce noise?

8. VERDICT: Only issue "APPROVED" if coherenceScore >= 60 AND no critical contradictions exist. Otherwise "REVISION REQUIRED".

Respond in this EXACT JSON format (no markdown fences, just raw JSON):
{
  "primaryStage": "Genesis",
  "linkedStruggleId": null,
  "coherenceScore": 85,
  "contradictions": ["System-level contradiction description if any"],
  "thoughtAnalysis": [
    {
      "verseIndex": 0,
      "assignedStage": "Genesis",
      "confidence": 92,
      "originalText": "...",
      "refinedText": "...",
      "reason": "Why this thought belongs to this stage",
      "contradictions": ["Specific contradiction with existing canon, or empty array"],
      "suggestedLexiconTerms": ["TermName1", "TermName2"]
    }
  ],
  "verdict": "APPROVED",
  "canonAlignment": "Detailed analysis of how this submission aligns with the Anchor and existing Canon",
  "suggestedEdits": null
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) throw new Error("No JSON found in Guardian response");
    
    const json = JSON.parse(text.substring(startIdx, endIdx + 1));

    // Normalize the thought analysis to ensure all fields exist
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
  } catch (error) {
    console.error("Guardian analysis failed:", error);
    // Graceful fallback — allow passage with original text
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
