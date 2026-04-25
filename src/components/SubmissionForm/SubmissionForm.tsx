import React, { useState } from 'react';
import { NarrativeStage, LexiconTerm, Article } from '../../types';
import './SubmissionForm.css';

interface Props {
  lexicon: LexiconTerm[];
  existingArticles: Article[];
  onSubmit: (article: Article) => void;
}

export const SubmissionForm: React.FC<Props> = ({ lexicon, existingArticles, onSubmit }) => {
  const [stage, setStage] = useState<NarrativeStage>('Genesis');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedLexicon, setSelectedLexicon] = useState<string[]>([]);
  const [linkedStruggleId, setLinkedStruggleId] = useState('');
  const [error, setError] = useState('');

  const struggles = existingArticles.filter(a => a.stage === 'Lamentations');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (selectedLexicon.length === 0) {
      setError('You must select at least one Lexicon term to maintain consistency.');
      return;
    }

    if ((stage === 'Gospels' || stage === 'Revelation') && !linkedStruggleId) {
      setError(`Stage ${stage} must be linked to a specific Struggle (Lamentations).`);
      return;
    }

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
    <form className="submission-form" onSubmit={handleSubmit}>
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
          <select value={linkedStruggleId} onChange={(e) => setLinkedStruggleId(e.target.value)} required>
            <option value="">-- Select a Struggle --</option>
            {struggles.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className="submit-btn">Publish to Canon</button>
    </form>
  );
};
