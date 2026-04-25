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

export interface Article {
  id: string;
  title: string;
  content: string;
  stage: NarrativeStage;
  lexiconTerms: string[]; // IDs of LexiconTerms
  linkedStruggleId?: string; // For Gospels and Revelation stages
  author: string;
  createdAt: number;
}

export interface CanonState {
  anchor: string;
  lexicon: LexiconTerm[];
  articles: Article[];
}
