import React, { useState } from 'react';
import { NarrativeStage, LexiconTerm, Article, Thought } from '../../types';
import { analyzeAndRefine, AnalysisResult, ThoughtAnalysis } from '../../lib/gemini';
import './SubmissionForm.css';

interface Props {
  anchor: string;
  lexicon: LexiconTerm[];
  existingArticles: Article[];
  onSubmit: (article: Article) => void;
}

const STAGE_META: Record<NarrativeStage, { icon: string; label: string; color: string }> = {
  Genesis:      { icon: '🌱', label: 'Foundation',   color: '#4ecdc4' },
  Leviticus:    { icon: '⚖️', label: 'Protocol',     color: '#a78bfa' },
  Lamentations: { icon: '💎', label: 'Friction',     color: '#ff6b6b' },
  Gospels:      { icon: '🕯️', label: 'Coherence',    color: '#ffd93d' },
  Revelation:   { icon: '🚪', label: 'Convergence',  color: '#6bcb77' },
};

const getConfidenceColor = (c: number): string => {
  if (c >= 85) return '#00ff66';
  if (c >= 70) return '#4ecdc4';
  if (c >= 50) return '#ffd93d';
  if (c >= 30) return '#ff9f43';
  return '#ff6b6b';
};

export const SubmissionForm: React.FC<Props> = ({ anchor, lexicon, existingArticles, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([{ id: crypto.randomUUID(), text: '' }]);
  const [author, setAuthor] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [useRefined, setUseRefined] = useState(true);

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

  const handleRevealTruth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAnalysis(null);
    
    if (!title.trim()) {
      setError('Every witness needs a title.');
      return;
    }

    if (thoughts.some(t => t.text.trim() === '')) {
      setError('All thoughts must contain text to be witnessed.');
      return;
    }

    if (!author.trim()) {
      setError('A witness must bear a name.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeAndRefine(thoughts, title, anchor, lexicon, existingArticles);
      setAnalysis(result);
    } catch (err) {
      setError('The Guardian encountered an error. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const finalSubmit = () => {
    if (!analysis) return;

    // Build thoughts with AI metadata baked in
    const enrichedThoughts: Thought[] = thoughts.map((thought, i) => {
      const ai = analysis.thoughtAnalysis[i];
      return {
        ...thought,
        refinedText: ai?.refinedText || thought.text,
        assignedStage: (ai?.assignedStage as NarrativeStage) || analysis.primaryStage,
      };
    });

    const newArticle: Article = {
      id: crypto.randomUUID(),
      title,
      thoughts: useRefined 
        ? enrichedThoughts.map(t => ({ ...t, text: t.refinedText || t.text }))
        : enrichedThoughts,
      stage: analysis.primaryStage,
      lexiconTerms: Array.from(new Set(
        thoughts.filter(t => t.lexiconTermId).map(t => t.lexiconTermId!) as string[]
      )),
      linkedStruggleId: analysis.linkedStruggleId || undefined,
      author,
      createdAt: Date.now()
    };

    onSubmit(newArticle);
    
    // Reset form
    setTitle('');
    setThoughts([{ id: crypto.randomUUID(), text: '' }]);
    setAuthor('');
    setAnalysis(null);
    setUseRefined(true);
  };

  const hasContradictions = analysis && (
    analysis.contradictions.length > 0 || 
    analysis.thoughtAnalysis.some(ta => ta.contradictions.length > 0)
  );

  return (
    <div className="submission-container">
      <form className="submission-form" onSubmit={handleRevealTruth}>
        {error && <p className="error-msg">{error}</p>}
        
        <div className="form-hint">
          <span className="hint-icon">✦</span>
          <p>Write freely in any style — casual, poetic, technical, emotional. The Guardian will see through the narrative and reveal the truth of each thought.</p>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder="The heading of this Witness..." 
          />
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
                    placeholder="Speak your truth in any way that feels natural..."
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
          <input 
            value={author} 
            onChange={(e) => setAuthor(e.target.value)} 
            required 
            placeholder="Who bears this Witness?" 
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isAnalyzing}>
          {isAnalyzing ? (
            <span className="analyzing-text">
              <span className="pulse-dot"></span>
              Guardian is revealing the truth...
            </span>
          ) : (
            '✦ Reveal Truth'
          )}
        </button>
      </form>

      {/* ========================= */}
      {/* THE REVELATION PANEL v2   */}
      {/* ========================= */}
      {analysis && (
        <div className="revelation-panel">
          <div className="revelation-header">
            <div className="revelation-title">
              <h3>The Truth Revealed</h3>
              <span className={`verdict-badge ${analysis.verdict === 'APPROVED' ? 'approved' : 'revision'}`}>
                {analysis.verdict === 'APPROVED' ? '✓ ' : '⟳ '}{analysis.verdict}
              </span>
            </div>
            
            {/* Coherence + Primary Stage */}
            <div className="revelation-scores">
              <div className="detected-stage">
                <span className="detected-label">Primary Stage:</span>
                <span className={`stage-badge stage-${analysis.primaryStage.toLowerCase()}`}>
                  {STAGE_META[analysis.primaryStage]?.icon} {analysis.primaryStage} — {STAGE_META[analysis.primaryStage]?.label}
                </span>
              </div>
              <div className="coherence-display">
                <span className="detected-label">Canon Coherence:</span>
                <div className="coherence-bar-container">
                  <div className="coherence-bar-track">
                    <div 
                      className="coherence-bar-fill" 
                      style={{ 
                        width: `${analysis.coherenceScore}%`,
                        background: getConfidenceColor(analysis.coherenceScore)
                      }}
                    />
                  </div>
                  <span className="coherence-value" style={{ color: getConfidenceColor(analysis.coherenceScore) }}>
                    {analysis.coherenceScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Auto-Linked Struggle */}
            {analysis.linkedStruggleId && (
              <div className="auto-linked">
                <span className="linked-label">🔗 Auto-linked to Struggle:</span>
                <span className="linked-value">
                  {existingArticles.find(a => a.id === analysis.linkedStruggleId)?.title || analysis.linkedStruggleId}
                </span>
              </div>
            )}

            {/* System-level Contradictions */}
            {hasContradictions && (
              <div className="contradictions-alert">
                <h4>⚠️ Contradictions Detected</h4>
                {analysis.contradictions.map((c, i) => (
                  <p key={i} className="contradiction-item">{c}</p>
                ))}
              </div>
            )}
          </div>

          {/* Per-Thought Deep Breakdown */}
          <div className="thought-breakdown">
            <h4>Verse-by-Verse Deep Analysis</h4>
            {analysis.thoughtAnalysis.map((ta: ThoughtAnalysis, i: number) => (
              <div key={i} className={`verse-analysis ${ta.contradictions.length > 0 ? 'has-contradiction' : ''}`}>
                <div className="verse-analysis-header">
                  <span className="verse-idx">Verse {i + 1}</span>
                  <div className="verse-header-right">
                    {/* Confidence Score */}
                    <div className="confidence-indicator">
                      <span className="confidence-label">Confidence</span>
                      <div className="confidence-bar-mini">
                        <div 
                          className="confidence-fill-mini"
                          style={{ width: `${ta.confidence}%`, background: getConfidenceColor(ta.confidence) }}
                        />
                      </div>
                      <span className="confidence-value" style={{ color: getConfidenceColor(ta.confidence) }}>
                        {ta.confidence}%
                      </span>
                    </div>
                    <span className={`stage-pill stage-${ta.assignedStage.toLowerCase()}`}>
                      {STAGE_META[ta.assignedStage as NarrativeStage]?.icon} {ta.assignedStage}
                    </span>
                  </div>
                </div>

                {/* Original → Refined Comparison */}
                <div className="verse-comparison">
                  <div className="verse-original">
                    <small>Original</small>
                    <p>{ta.originalText}</p>
                  </div>
                  <div className="verse-arrow">→</div>
                  <div className="verse-refined">
                    <small>Refined</small>
                    <p>{ta.refinedText}</p>
                  </div>
                </div>

                {/* Classification Reason */}
                <p className="verse-reason"><em>{ta.reason}</em></p>

                {/* Per-thought contradictions */}
                {ta.contradictions.length > 0 && (
                  <div className="verse-contradictions">
                    {ta.contradictions.map((c, j) => (
                      <p key={j} className="verse-contradiction-item">⚡ {c}</p>
                    ))}
                  </div>
                )}

                {/* Suggested Lexicon Terms */}
                {ta.suggestedLexiconTerms.length > 0 && (
                  <div className="verse-lexicon-suggest">
                    <span className="lexicon-suggest-label">Suggested anchors:</span>
                    {ta.suggestedLexiconTerms.map((term, j) => (
                      <span key={j} className="lexicon-suggest-tag">#{term}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Canon Alignment */}
          <div className="canon-alignment">
            <h4>Canon Alignment Analysis</h4>
            <p>{analysis.canonAlignment}</p>
          </div>

          {/* Suggested Edits */}
          {analysis.suggestedEdits && (
            <div className="suggested-edits">
              <h4>Suggested Refinement</h4>
              <p><i>{analysis.suggestedEdits}</i></p>
            </div>
          )}

          {/* Final Actions */}
          {analysis.verdict === 'APPROVED' && (
            <div className="final-actions">
              <div className="text-toggle">
                <span className={!useRefined ? 'toggle-active' : ''}>Original Voice</span>
                <button 
                  type="button" 
                  className={`refined-toggle ${useRefined ? 'active' : ''}`}
                  onClick={() => setUseRefined(!useRefined)}
                >
                  <span className="toggle-knob"></span>
                </button>
                <span className={useRefined ? 'toggle-active' : ''}>Canonical Voice</span>
              </div>
              <button onClick={finalSubmit} className="publish-btn">
                ✦ Seal into Canon
              </button>
            </div>
          )}

          {/* Revision Required — can't publish */}
          {analysis.verdict === 'REVISION REQUIRED' && (
            <div className="revision-notice">
              <p>The Guardian requires revisions before this witness may enter the Canon. Address the contradictions and concerns above, then re-submit.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
