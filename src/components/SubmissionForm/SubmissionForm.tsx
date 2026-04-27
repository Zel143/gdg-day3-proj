import React, { useState } from 'react';
import { NarrativeStage, LexiconTerm, Article } from '../../types';
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
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedLexicon, setSelectedLexicon] = useState<string[]>([]);
  const [linkedStruggleId, setLinkedStruggleId] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ verdict: string; feedback: string; suggestedEdits?: string } | null>(null);

  const struggles = existingArticles.filter(a => a.stage === 'Lamentations');

  const handleValidateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAiFeedback(null);
    
    // Basic Validation
    if (selectedLexicon.length === 0) {
      setError('You must select at least one Lexicon term to maintain consistency.');
      return;
    }

    if ((stage === 'Gospels' || stage === 'Revelation') && !linkedStruggleId) {
      setError(`Stage ${stage} must be linked to a specific Struggle (Lamentations).`);
      return;
    }

    setIsValidating(true);
    const validation = await validateSubmission(content, anchor, lexicon, existingArticles);
    setIsValidating(false);
    setAiFeedback(validation);

    if (validation.verdict === 'APPROVED') {
      // Auto-submit if approved? Or let user see feedback? 
      // For now, let's just let them click 'Confirm' if they see approval.
    }
  };

  const finalSubmit = () => {
    const newArticle: Article = {
      id: crypto.randomUUID(),
      title,
      content,
      stage,
      lexiconTerms: selectedLexicon,
      linkedStruggleId: linkedStruggleId || undefined,
      author,
      createdAt: Date.now()
    };
    onSubmit(newArticle);
  };

  const toggleLexicon = (id: string) => {
    setSelectedLexicon(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={10} />
        </div>

        <div className="form-group">
          <label>Author</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Lexicon Terms (Select at least one)</label>
          <div className="lexicon-picker">
            {lexicon.map(term => (
              <label key={term.id} className={`lexicon-item ${selectedLexicon.includes(term.id) ? 'selected' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={selectedLexicon.includes(term.id)} 
                  onChange={() => toggleLexicon(term.id)} 
                />
                {term.term}
              </label>
            ))}
          </div>
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
          {isValidating ? 'Guardian is reviewing...' : 'Review with AI'}
        </button>
      </form>

      {aiFeedback && (
        <div className={`ai-feedback-panel ${aiFeedback.verdict.toLowerCase()}`}>
          <h3>Guardian Verdict: {aiFeedback.verdict}</h3>
          <p>{aiFeedback.feedback}</p>
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
