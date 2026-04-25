import { useState, useEffect } from 'react'
import './App.css'
import { CanonState, Article } from './types'
import { SubmissionForm } from './components/SubmissionForm/SubmissionForm'

function App() {
  const [state, setState] = useState<CanonState>(() => {
    const saved = localStorage.getItem('canon_state');
    return saved ? JSON.parse(saved) : {
      anchor: "The fragmentation of knowledge prevents a unified ethical framework.",
      lexicon: [
        { id: '1', term: 'Interoperability', definition: 'The ability of systems to exchange and use information.' },
        { id: '2', term: 'Human-Centricity', definition: 'Design that prioritizes human needs and ethics.' }
      ],
      articles: []
    };
  });

  const [view, setView] = useState<'dashboard' | 'submit'>('dashboard');

  useEffect(() => {
    localStorage.setItem('canon_state', JSON.stringify(state));
  }, [state]);

  const addArticle = (article: Article) => {
    setState(prev => ({
      ...prev,
      articles: [...prev.articles, article]
    }));
    setView('dashboard');
  };

  return (
    <div className="app-container">
      <header>
        <h1>Canon Framework</h1>
        <p className="anchor-text"><strong>Anchor:</strong> {state.anchor}</p>
        <nav>
          <button onClick={() => setView('dashboard')}>Dashboard</button>
          <button onClick={() => setView('submit')}>Submit Witness</button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' ? (
          <section className="dashboard">
            <h2>Canon Map</h2>
            
            <div className="gap-analysis">
              <h3>Gap Analysis</h3>
              {(() => {
                const struggles = state.articles.filter(a => a.stage === 'Lamentations');
                const resolutions = state.articles.filter(a => a.stage === 'Gospels' || a.stage === 'Revelation');
                const unresolved = struggles.filter(s => !resolutions.some(r => r.linkedStruggleId === s.id));
                
                return unresolved.length > 0 ? (
                  <ul className="unresolved-list">
                    {unresolved.map(s => (
                      <li key={s.id} className="warning-item">
                        ⚠️ Struggle "{s.title}" has no Resolution yet.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="success-msg">✅ All Struggles have linked Resolutions. The Canon is consistent.</p>
                );
              })()}
            </div>

            <div className="stages-container">
              {['Genesis', 'Leviticus', 'Lamentations', 'Gospels', 'Revelation'].map(stage => (
                <div key={stage} className="stage-column">
                  <h3>{stage}</h3>
                  {state.articles.filter(a => a.stage === stage).map(article => (
                    <div key={article.id} className="article-card">
                      <h4>{article.title}</h4>
                      <p>{article.content.substring(0, 100)}...</p>
                      <div className="card-footer">
                        <small>By: {article.author}</small>
                        <div className="lexicon-tags">
                          {article.lexiconTerms.map(ltId => (
                            <span key={ltId} className="lexicon-tag">
                              #{state.lexicon.find(l => l.id === ltId)?.term}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="submit-form-view">
            <h2>Submit a Witness</h2>
            <SubmissionForm 
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
