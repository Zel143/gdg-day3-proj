import React, { useMemo } from 'react';
import { CanonState, NarrativeStage } from '../../types';
import './CanonIntegrity.css';

interface Props {
  state: CanonState;
  revelationMode: boolean;
}

interface IntegrityMetrics {
  overall: number;
  narrativeCompleteness: number;
  struggleResolution: number;
  lexiconUtilization: number;
  contributorBalance: number;
  thoughtDepth: number;
  distribution: Record<NarrativeStage, number>;
  totalArticles: number;
  totalThoughts: number;
  uniqueAuthors: string[];
  unresolvedStruggles: number;
  lexiconUsage: Map<string, number>; // term id -> usage count
  stageFlow: { from: string; to: string; count: number }[];
}

const STAGES: NarrativeStage[] = ['Genesis', 'Leviticus', 'Lamentations', 'Gospels', 'Revelation'];

const STAGE_COLORS: Record<NarrativeStage, string> = {
  Genesis: '#4ecdc4',
  Leviticus: '#a78bfa',
  Lamentations: '#ff6b6b',
  Gospels: '#ffd93d',
  Revelation: '#6bcb77',
};

const STAGE_ICONS: Record<NarrativeStage, string> = {
  Genesis: '🌱',
  Leviticus: '⚖️',
  Lamentations: '💎',
  Gospels: '🕯️',
  Revelation: '🚪',
};

function computeMetrics(state: CanonState): IntegrityMetrics {
  const { articles, lexicon } = state;

  // Stage Distribution
  const distribution = STAGES.reduce((acc, s) => {
    acc[s] = articles.filter(a => a.stage === s).length;
    return acc;
  }, {} as Record<NarrativeStage, number>);

  // Narrative Completeness: % of stages that have at least 1 article
  const stagesPresent = STAGES.filter(s => distribution[s] > 0).length;
  const narrativeCompleteness = articles.length === 0 ? 0 : (stagesPresent / STAGES.length) * 100;

  // Struggle Resolution Rate
  const struggles = articles.filter(a => a.stage === 'Lamentations');
  const resolutions = articles.filter(a => a.stage === 'Gospels' || a.stage === 'Revelation');
  const resolvedStruggles = struggles.filter(s =>
    resolutions.some(r => r.linkedStruggleId === s.id)
  );
  const struggleResolution = struggles.length > 0
    ? (resolvedStruggles.length / struggles.length) * 100
    : (articles.length > 0 ? 100 : 0);

  // Lexicon Utilization + Usage Counts
  const lexiconUsage = new Map<string, number>();
  lexicon.forEach(l => lexiconUsage.set(l.id, 0));
  articles.forEach(a => {
    a.thoughts.forEach(t => {
      if (t.lexiconTermId && lexiconUsage.has(t.lexiconTermId)) {
        lexiconUsage.set(t.lexiconTermId, (lexiconUsage.get(t.lexiconTermId) || 0) + 1);
      }
    });
    // Also count from lexiconTerms array on article
    a.lexiconTerms?.forEach(id => {
      if (lexiconUsage.has(id)) {
        lexiconUsage.set(id, Math.max(lexiconUsage.get(id) || 0, 1));
      }
    });
  });
  const usedTerms = Array.from(lexiconUsage.values()).filter(v => v > 0).length;
  const lexiconUtilization = lexicon.length > 0 ? (usedTerms / lexicon.length) * 100 : 0;

  // Contributor Balance
  const authorCounts: Record<string, number> = {};
  articles.forEach(a => {
    authorCounts[a.author] = (authorCounts[a.author] || 0) + 1;
  });
  const authors = Object.keys(authorCounts);
  const counts = Object.values(authorCounts);
  let balance = articles.length === 0 ? 0 : 100;
  if (authors.length > 1) {
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, c) => a + Math.pow(c - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    balance = Math.max(0, Math.round((1 - cv) * 100));
  }

  // Thought Depth
  const totalThoughts = articles.reduce((sum, a) => sum + a.thoughts.length, 0);
  const avgDepth = articles.length > 0 ? totalThoughts / articles.length : 0;
  const thoughtDepth = Math.min(100, Math.round(avgDepth * 20)); // 5 thoughts/article = 100%

  // Stage Flow: how articles connect across stages via linkedStruggleId
  const stageFlow: { from: string; to: string; count: number }[] = [];
  const flowMap = new Map<string, number>();
  articles.forEach(a => {
    if (a.linkedStruggleId) {
      const source = articles.find(s => s.id === a.linkedStruggleId);
      if (source) {
        const key = `${source.stage}→${a.stage}`;
        flowMap.set(key, (flowMap.get(key) || 0) + 1);
      }
    }
  });
  flowMap.forEach((count, key) => {
    const [from, to] = key.split('→');
    stageFlow.push({ from, to, count });
  });

  // Overall Score
  const overall = articles.length === 0 ? 0 : Math.round(
    (narrativeCompleteness * 0.20) +
    (struggleResolution * 0.25) +
    (lexiconUtilization * 0.20) +
    (balance * 0.15) +
    (thoughtDepth * 0.20)
  );

  return {
    overall,
    narrativeCompleteness,
    struggleResolution,
    lexiconUtilization,
    contributorBalance: balance,
    thoughtDepth,
    distribution,
    totalArticles: articles.length,
    totalThoughts,
    uniqueAuthors: authors,
    unresolvedStruggles: struggles.length - resolvedStruggles.length,
    lexiconUsage,
    stageFlow,
  };
}

const MetricBar: React.FC<{ label: string; value: number; color: string; sacredLabel?: string; revelationMode: boolean }> = 
  ({ label, value, color, sacredLabel, revelationMode }) => (
  <div className="metric-bar">
    <div className="metric-bar-header">
      <span className="metric-bar-label">{revelationMode && sacredLabel ? sacredLabel : label}</span>
      <span className="metric-bar-value" style={{ color }}>{Math.round(value)}%</span>
    </div>
    <div className="metric-bar-track">
      <div 
        className="metric-bar-fill" 
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  </div>
);

export const CanonIntegrity: React.FC<Props> = ({ state, revelationMode }) => {
  const metrics = useMemo(() => computeMetrics(state), [state]);

  const getGrade = (score: number): string => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const getGradeColor = (score: number): string => {
    if (score >= 90) return '#00ff66';
    if (score >= 70) return '#4ecdc4';
    if (score >= 50) return '#ffd93d';
    if (score >= 30) return '#ff9f43';
    return '#ff6b6b';
  };

  const maxStageCount = Math.max(...Object.values(metrics.distribution), 1);

  return (
    <div className="canon-integrity">
      <div className="integrity-header">
        <h3>{revelationMode ? 'Divine Health' : 'Canon Integrity'}</h3>
      </div>

      <div className="integrity-body">
        {/* Central Score */}
        <div className="score-ring">
          <svg viewBox="0 0 120 120" className="ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle 
              cx="60" cy="60" r="52" 
              fill="none" 
              stroke={getGradeColor(metrics.overall)} 
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(metrics.overall / 100) * 327} 327`}
              transform="rotate(-90 60 60)"
              className="ring-progress"
            />
          </svg>
          <div className="score-center">
            <span className="score-grade" style={{ color: getGradeColor(metrics.overall) }}>
              {getGrade(metrics.overall)}
            </span>
            <span className="score-number">{metrics.overall}%</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{metrics.totalArticles}</span>
            <span className="stat-label">{revelationMode ? 'Witnesses' : 'Articles'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{metrics.totalThoughts}</span>
            <span className="stat-label">{revelationMode ? 'Verses' : 'Thoughts'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{metrics.uniqueAuthors.length}</span>
            <span className="stat-label">{revelationMode ? 'Prophets' : 'Authors'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: metrics.unresolvedStruggles > 0 ? '#ff6b6b' : '#00ff66' }}>
              {metrics.unresolvedStruggles}
            </span>
            <span className="stat-label">{revelationMode ? 'Open Wounds' : 'Unresolved'}</span>
          </div>
        </div>

        {/* Metric Bars */}
        <div className="metrics-breakdown">
          <MetricBar 
            label="Narrative Completeness" 
            sacredLabel="Canonical Fullness" 
            value={metrics.narrativeCompleteness} 
            color="#4ecdc4"
            revelationMode={revelationMode}
          />
          <MetricBar 
            label="Struggle Resolution" 
            sacredLabel="Redemption Rate"
            value={metrics.struggleResolution} 
            color="#ffd93d"
            revelationMode={revelationMode}
          />
          <MetricBar 
            label="Lexicon Utilization" 
            sacredLabel="Sacred Language Adoption"
            value={metrics.lexiconUtilization} 
            color="#a78bfa"
            revelationMode={revelationMode}
          />
          <MetricBar 
            label="Contributor Balance" 
            sacredLabel="Prophetic Harmony"
            value={metrics.contributorBalance} 
            color="#ff9f43"
            revelationMode={revelationMode}
          />
          <MetricBar 
            label="Thought Depth" 
            sacredLabel="Wisdom Density"
            value={metrics.thoughtDepth} 
            color="#6bcb77"
            revelationMode={revelationMode}
          />
        </div>

        {/* Stage Distribution */}
        <div className="stage-distribution">
          <h4>{revelationMode ? 'Book Volumes' : 'Stage Distribution'}</h4>
          <div className="distribution-bars">
            {STAGES.map(stage => {
              const count = metrics.distribution[stage];
              const pct = (count / maxStageCount) * 100;
              return (
                <div key={stage} className="dist-bar-row">
                  <span className="dist-icon">{STAGE_ICONS[stage]}</span>
                  <span className="dist-label">{stage}</span>
                  <div className="dist-track">
                    <div 
                      className="dist-fill" 
                      style={{ width: `${pct}%`, background: STAGE_COLORS[stage] }}
                    />
                  </div>
                  <span className="dist-count" style={{ color: STAGE_COLORS[stage] }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Flow (connections) */}
        {metrics.stageFlow.length > 0 && (
          <div className="stage-flow">
            <h4>{revelationMode ? 'Divine Connections' : 'Resolution Lineage'}</h4>
            <div className="flow-items">
              {metrics.stageFlow.map((flow, i) => (
                <div key={i} className="flow-item">
                  <span className="flow-from" style={{ color: STAGE_COLORS[flow.from as NarrativeStage] }}>
                    {flow.from}
                  </span>
                  <span className="flow-arrow">→</span>
                  <span className="flow-to" style={{ color: STAGE_COLORS[flow.to as NarrativeStage] }}>
                    {flow.to}
                  </span>
                  <span className="flow-count">×{flow.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lexicon Health */}
        <div className="lexicon-health">
          <h4>{revelationMode ? 'Sacred Tongue Vitality' : 'Lexicon Health'}</h4>
          <div className="lexicon-health-grid">
            {state.lexicon.map(term => {
              const usage = metrics.lexiconUsage.get(term.id) || 0;
              const isActive = usage > 0;
              return (
                <div key={term.id} className={`lexicon-health-item ${isActive ? 'active' : 'dormant'}`}>
                  <span className="lh-term">#{term.term}</span>
                  <span className={`lh-count ${isActive ? '' : 'zero'}`}>
                    {usage === 0 ? 'unused' : `${usage} ref${usage > 1 ? 's' : ''}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
