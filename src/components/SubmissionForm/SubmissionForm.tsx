import React, { useState } from 'react';
import { NarrativeStage, LexiconTerm, Article, Thought } from '../../types';
import { validateSubmission } from '../../lib/gemini';
import './SubmissionForm.css';

interface Props {
  anchor: string;
  lexicon: LexiconTerm[];
  existingArticles: Article[];
  onSubmit: (article: Article) => void;
}

export const SubmissionForm: React.FC<Props> = ({ anchor, lexicon, existingArticles, onSubmit }) => {
  const [stage, setStage] = useState<NarrativeStage>('Genesis');
  const [title, setTitle] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([{ id: crypto.randomUUID(), text: '' }]);
  const [author, setAuthor] = useState('');
  const [linkedStruggleId, setLinkedStruggleId] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ verdict: string; feedback: string; suggestedEdits?: string } | null>(null);

  const struggles = existingArticles.filter(a => a.stage === 'Lamentations');

  const addThought = () => {
    setThoughts([...thoughts, { id: crypto.randomUUID(), text: '' }]);
  };

  const updateThought = (id: string, text: string, lexiconTermId?: string) => {
    setThoughts(thoughts.map(t => t.id === id ? { ...t, text, lexiconTermId } : t));
  };

  const removeThought = (id: string) => {
    if (thoughts.length > 1) {
      setThoughts(thoughts.filter(t => t.id !== id));
    }
  };

  const handleValidateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAiFeedback(null);
    
    if (thoughts.some(t => t.text.trim() === '')) {
      setError('All thoughts must contain text to be witnessed.');
      return;
    }

    if ((stage === 'Gospels' || stage === 'Revelation') && struggles.length > 0 && !linkedStruggleId) {
      setError(`Stage ${stage} should be linked to a specific Struggle (Lamentations) if one exists.`);
      return;
    }

    setIsValidating(true);
    // Combine thoughts for AI validation
    const combinedContent = thoughts.map((t, i) => `Verse ${i + 1}: ${t.text}`).join('\n');
    const validation = await validateSubmission(combinedContent, anchor, lexicon, existingArticles);
    setIsValidating(false);
    setAiFeedback(validation);
  };

  const finalSubmit = () => {
    const newArticle: Article = {
      id: crypto.randomUUID(),
      title,
      thoughts,
      stage,
      lexiconTerms: Array.from(new Set(thoughts.filter(t => t.lexiconTermId).map(t => t.lexiconTermId!) as string[])),
      linkedStruggleId: linkedStruggleId || undefined,
      author,
      createdAt: Date.now()
    };
    onSubmit(newArticle);
  };

  return (
    <div className="submission-container">
      <form className="submission-form" onSubmit={handleValidateAndSubmit}>
        {error && <p className="error-msg">{error}</p>}
        
        <div className="form-group">
          <label>Narrative Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value as NarrativeStage)}>
            <option value="Genesis">Genesis (Origin)</option>
            <option value="Leviticus">Leviticus (Law)</option>
            <option value="Lamentations">Lamentations (Struggle)</option>
            <option value="Gospels">Gospels (Resolution)</option>
            <option value="Revelation">Revelation (Future)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="The heading of this Witness..." />
        </div>

        <div className="form-group">
          <label>The Chain of Thoughts (Verses)</label>
          <div className="thoughts-list">
            {thoughts.map((thought, index) => (
              <div key={thought.id} className="thought-item-container">
                <div className="thought-number">{index + 1}</div>
                <div className="thought-inputs">
                  <textarea 
                    value={thought.text} 
                    onChange={(e) => updateThought(thought.id, e.target.value, thought.lexiconTermId)}
                    placeholder="Enter a distinct thought or observation..."
                    rows={3}
                    required
                  />
                  <select 
                    value={thought.lexiconTermId || ''} 
                    onChange={(e) => updateThought(thought.id, thought.text, e.target.value)}
                  >
                    <option value="">-- Anchor to Lexicon (Optional) --</option>
                    {lexicon.map(l => <option key={l.id} value={l.id}>{l.term}</option>)}
                  </select>
                </div>
                <button type="button" className="remove-thought" onClick={() => removeThought(thought.id)}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="add-thought-btn" onClick={addThought}>+ Add Next Thought</button>
        </div>

        <div className="form-group">
          <label>Author</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="Who bears this Witness?" />
        </div>

        {(stage === 'Gospels' || stage === 'Revelation') && (
          <div className="form-group">
            <label>Link to Struggle (Lamentations)</label>
            {struggles.length > 0 ? (
              <select value={linkedStruggleId} onChange={(e) => setLinkedStruggleId(e.target.value)} required>
                <option value="">-- Select a Struggle to Resolve --</option>
                {struggles.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            ) : (
              <p className="info-msg"><i>No active Struggles (Lamentations) found. This Witness will be recorded as a General Resolution.</i></p>
            )}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isValidating}>
          {isValidating ? 'Guardian is reviewing the chain...' : 'Review with AI'}
        </button>
      </form>

      {aiFeedback && (
        <div className={`ai-feedback-panel ${aiFeedback.verdict.toLowerCase()}`}>
          <h3>Guardian Verdict: {aiFeedback.verdict}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{aiFeedback.feedback}</p>
          {aiFeedback.suggestedEdits && (
            <div className="suggested-edits">
              <h4>Suggested Refinement:</h4>
              <p><i>{aiFeedback.suggestedEdits}</i></p>
            </div>
          )}
          {aiFeedback.verdict === 'APPROVED' && (
            <button onClick={finalSubmit} className="publish-btn">Final Publish to Canon</button>
          )}
        </div>
      )}
    </div>
  );
};
