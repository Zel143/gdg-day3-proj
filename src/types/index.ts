export type NarrativeStage = 
  | 'Genesis' 
  | 'Leviticus' 
  | 'Lamentations' 
  | 'Gospels' 
  | 'Revelation';

export interface LexiconTerm {
  id: string;
  term: string;
  definition: string;
}

export interface Thought {
  id: string;
  text: string;
  refinedText?: string; // AI-refined version aligned with canon tone
  assignedStage?: NarrativeStage; // AI-assigned stage for this individual thought
  lexiconTermId?: string; // Optional anchor to a specific term
}

export interface Article {
  id: string;
  title: string;
  thoughts: Thought[];
  stage: NarrativeStage;
  lexiconTerms: string[]; // Still keep overall tags for high-level mapping
  linkedStruggleId?: string; 
  author: string;
  createdAt: number;
}

export interface CanonState {
  anchor: string;
  lexicon: LexiconTerm[];
  articles: Article[];
}
