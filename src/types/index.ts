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
