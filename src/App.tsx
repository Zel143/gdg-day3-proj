import { useState, useEffect } from 'react'
import './App.css'
import { CanonState, Article } from './types'
import { SubmissionForm } from './components/SubmissionForm/SubmissionForm'
import { syncCanon, updateCanon } from './lib/supabase'

function App() {
  const [state, setState] = useState<CanonState>({
    anchor: "The fragmentation of knowledge prevents a unified ethical framework.",
    lexicon: [
      { id: '1', term: 'Interoperability', definition: 'The ability of systems to exchange and use information.' },
      { id: '2', term: 'Human-Centricity', definition: 'Design that prioritizes human needs and ethics.' }
    ],
    articles: []
  });

  const [view, setView] = useState<'dashboard' | 'submit'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [revelationMode, setRevelationMode] = useState(false);

  useEffect(() => {
    const unsubscribe = syncCanon((remoteState) => {
      if (remoteState) {
        setState(remoteState);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const focusedArticle = state.articles.find(a => a.id === focusedId);

  const updateAnchor = async (newAnchor: string) => {
    const newState = { ...state, anchor: newAnchor };
    await updateCanon(newState);
  };

  const addArticle = async (article: Article) => {
    const newState = {
      ...state,
      articles: [...state.articles, article]
    };
    await updateCanon(newState);
    setView('dashboard');
  };

  const handleArticleClick = (id: string) => {
    setFocusedId(prev => prev === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Connecting to the Canon...</p>
      </div>
    );
  }

  return (
    <div className={`app-container ${revelationMode ? 'mode-revelation' : 'mode-secular'}`}>
      <header>
        <div className="header-top">
          <h1>Canon Framework</h1>
          <div className="toggle-container">
            <span className="toggle-label">{revelationMode ? 'Revelation Mode' : 'Technical View'}</span>
            <button 
              className={`mode-toggle ${revelationMode ? 'active' : ''}`} 
              onClick={() => setRevelationMode(!revelationMode)}
            >
              {revelationMode ? '👁️' : '📊'}
            </button>
          </div>
        </div>
        <div className="anchor-section">
          <label>{revelationMode ? 'The Alpha & Omega:' : 'The Anchor (The North Star):'}</label>
          <input 
            className="anchor-input"
            value={state.anchor} 
            onChange={(e) => updateAnchor(e.target.value)}
            placeholder="Define the core vision..."
          />
        </div>
        <nav>
          <button onClick={() => setView('dashboard')}>Dashboard</button>
          <button onClick={() => setView('submit')}>Submit Witness</button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' ? (
          <section className="dashboard">
            <div className="dashboard-header">
              <h2>{revelationMode ? 'The Sacred Map' : 'System Canon Map'}</h2>
              <div className="coherence-meter">
                <span className="meter-label">{revelationMode ? 'Fullness:' : 'System Integrity:'}</span>
                <span className="meter-value">
                  {Math.round((state.articles.filter(a => a.stage === 'Gospels').length / Math.max(state.articles.filter(a => a.stage === 'Lamentations').length, 1)) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="gap-analysis">
              <h3>{revelationMode ? 'Unfulfilled Prophecy' : 'Gap Analysis'}</h3>
              {(() => {
                const struggles = state.articles.filter(a => a.stage === 'Lamentations');
                const resolutions = state.articles.filter(a => a.stage === 'Gospels' || a.stage === 'Revelation');
                const unresolved = struggles.filter(s => !resolutions.some(r => r.linkedStruggleId === s.id));
                
                return unresolved.length > 0 ? (
                  <ul className="unresolved-list">
                    {unresolved.map(s => (
                      <li key={s.id} className="warning-item">
                        ⚠️ {revelationMode ? `Struggle "${s.title}" awaits its resolution.` : `Friction "${s.title}" has no Coherence yet.`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="success-msg">
                    {revelationMode ? '✅ The Canon is Complete. All struggles have found their peace.' : '✅ System Coherent. All Friction points resolved.'}
                  </p>
                );
              })()}
            </div>

            <div className="stages-container">
              {[
                { val: 'Genesis', label: 'Foundation', sub: 'Genesis', icon: '🌱', sacredIcon: '📜' },
                { val: 'Leviticus', label: 'Protocol', sub: 'Leviticus', icon: '⚖️', sacredIcon: '🔥' },
                { val: 'Lamentations', label: 'Friction', sub: 'Lamentations', icon: '💎', sacredIcon: '🍷' },
                { val: 'Gospels', label: 'Coherence', sub: 'Gospels', icon: '🕯️', sacredIcon: '🍞' },
                { val: 'Revelation', label: 'Convergence', sub: 'Revelation', icon: '🚪', sacredIcon: '👑' }
              ].map(stage => (
                <div key={stage.val} className={`stage-column column-${stage.val.toLowerCase()}`}>
                  <div className="column-header">
                    <span className="stage-icon">
                      {revelationMode ? stage.sacredIcon : stage.icon}
                    </span>
                    <div className="stage-titles">
                      <h3>{revelationMode ? stage.sub : stage.label}</h3>
                      {revelationMode && <small className="sacred-sub">Book of {stage.sub}</small>}
                    </div>
                  </div>
                  {state.articles.filter(a => a.stage === stage.val).map(article => {
                    const isActive = article.id === focusedId;
                    const isLinked = focusedId && (
                      article.id === focusedArticle?.linkedStruggleId || 
                      article.linkedStruggleId === focusedId
                    );
                    const isDimmed = focusedId && !isActive && !isLinked;

                    return (
                      <div 
                        key={article.id} 
                        className={`article-card ${isActive ? 'active-witness' : ''} ${isLinked ? 'linked-witness' : ''} ${isDimmed ? 'dimmed-witness' : ''}`}
                        onClick={() => handleArticleClick(article.id)}
                      >
                        <h4>{article.title}</h4>
                        <p>{article.content.substring(0, 100)}...</p>
                        <div className="card-footer">
                          <small>{revelationMode ? 'Witnessed by:' : 'Author:'} {article.author}</small>
                          <div className="lexicon-tags">
                            {article.lexiconTerms.map(ltId => (
                              <span key={ltId} className="lexicon-tag">
                                #{state.lexicon.find(l => l.id === ltId)?.term}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="submit-form-view">
            <h2>{revelationMode ? 'Offer a Witness' : 'Submit a Witness'}</h2>
            <SubmissionForm 
              anchor={state.anchor}
              lexicon={state.lexicon} 
              existingArticles={state.articles} 
              onSubmit={addArticle} 
            />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
