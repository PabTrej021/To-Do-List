import { useState, useEffect } from 'react';

// Icons
const FireIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#fireGradient)" stroke="url(#fireGradient)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff9500" /><stop offset="100%" stopColor="#ff2a5f" /></linearGradient></defs><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
const TrophyIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;

export default function Dashboard({ tasks, xp, level, streak, onFilterChange, activeFilter }) {
  const total = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;

  // Level Logic - e.g. 100 XP per level
  const XP_PER_LEVEL = 100;
  const xpProgress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="dashboard-container">

      {/* Top Header: Greeting + Streak */}
      <div className="header-row">
        <div>
          <h2 className="text-title" style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>
            {getGreeting()} 🌅
          </h2>
          <p className="text-subtitle" style={{ fontSize: '0.95rem' }}>
            {total === 0
              ? "Planifica tu día perfecto."
              : completedCount === total
                ? "¡Has arrasado con todo!"
                : `Llevas ${completedCount} de ${total} tareas.`}
          </p>
        </div>

        <div className="streak-badge glass-panel-sm">
          <FireIcon />
          <span className="streak-count">{streak}</span>
          <span className="streak-label">Racha</span>
        </div>
      </div>

      {/* Gamification Bar: Level & XP */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: 600 }}>
            <TrophyIcon />
            <span>Nivel {level}</span>
          </div>
          <div className="text-subtitle" style={{ fontSize: '0.85rem' }}>
            {xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP
          </div>
        </div>

        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: `${Math.max(xpProgress, 2)}%` }}></div>
        </div>
      </div>

      {/* Interactive Filters */}
      <div className="filter-tabs">
        {['Todas', 'Pendientes', 'Completadas'].map(filter => (
          <button
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <style>{`
        .dashboard-container {
          margin-bottom: 2rem;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .glass-panel-sm {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-sm);
        }

        .streak-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 1.25rem;
          min-width: 80px;
        }

        .streak-count {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
          margin-top: 0.25rem;
        }

        .streak-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
          font-weight: 600;
        }

        .xp-bar-container {
          width: 100%;
          height: 14px;
          background-color: var(--bg-color-secondary);
          border-radius: 99px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff2a5f, #ff9500);
          border-radius: 99px;
          transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy effect */
          box-shadow: 0 0 10px rgba(255, 42, 95, 0.5);
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          background-color: var(--glass-bg);
          padding: 0.35rem;
          border-radius: 99px;
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          overflow-x: auto;
        }
        
        .filter-tabs::-webkit-scrollbar {
          display: none;
        }

        .filter-btn {
          flex: 1;
          padding: 0.6rem 1rem;
          border-radius: 99px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          min-width: max-content;
        }

        .filter-btn:hover {
          color: var(--text-primary);
        }

        .filter-btn.active {
          background-color: var(--bg-color-secondary);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
}
