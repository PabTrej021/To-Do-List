import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';

const BellIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
const SunIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>;
const MoonIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>;
const GlobeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;

const languages = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' }
];

export default function Header({ userName, handleSignOut, toggleTheme, darkMode }) {
  const { lang, setLang, t } = useI18n();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code) => {
    setLang(code);
    setIsLangOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-greeting">
        <p className="greeting-text">{t('hello')}, {userName}</p>
        <h1 className="header-title">{t('yourTasks')}</h1>
      </div>

      <div className="header-actions">

        {/* Custom Language Switcher Dropdown */}
        <div className="lang-container" ref={dropdownRef}>
          <button
            className="icon-btn"
            onClick={() => setIsLangOpen(!isLangOpen)}
            aria-label="Select Language"
            style={{ borderColor: isLangOpen ? 'var(--accent-color)' : '' }}
          >
            <GlobeIcon />
          </button>

          {isLangOpen && (
            <div className="custom-dropdown glass-panel-dropdown">
              {languages.map(l => (
                <button
                  key={l.code}
                  className={`dropdown-item ${lang === l.code ? 'active-lang' : ''}`}
                  onClick={() => handleSelectLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>

        <button className="icon-btn bell-btn" aria-label="Notifications">
          <BellIcon />
          <span className="bell-dot"></span>
        </button>

        {/* Avatar Mock */}
        <div
          className="user-avatar"
          onClick={handleSignOut}
          title="Sign Out"
        >
          {userName?.charAt(0)?.toUpperCase()}
        </div>
      </div>

      <style>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
          position: relative;
        }

        .greeting-text {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
        }

        .header-title {
          margin: 0;
          font-size: 1.6rem;
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .icon-btn {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          transition: all var(--transition-fast);
        }

        .icon-btn:hover {
          color: var(--text-primary);
          background: var(--bg-color-secondary);
        }

        /* Dropdown customizado */
        .lang-container {
          position: relative;
        }

        .glass-panel-dropdown {
          background: var(--glass-bg);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
        }

        .custom-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
          z-index: 200;
          min-width: 140px;
          animation: slideDownFade 0.2s ease-out;
        }

        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-item {
          padding: 0.6rem 1rem;
          margin: 0.15rem 0;
          border-radius: 8px;
          text-align: left;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          transition: background var(--transition-fast);
          background: transparent;
        }

        .dropdown-item:hover {
          background: var(--bg-color-secondary);
        }

        .active-lang {
          color: var(--accent-color);
          background: rgba(255, 42, 95, 0.05);
          font-weight: 600;
        }

        .bell-btn { position: relative; }
        .bell-dot {
          position: absolute; top: 8px; right: 10px;
          width: 8px; height: 8px;
          background-color: var(--accent-color);
          border-radius: 50%;
          border: 2px solid var(--glass-bg);
        }

        .user-avatar {
          width: 45px; height: 45px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5e5ce6, #bf5af2);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1.2rem;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        .user-avatar:hover { transform: scale(1.05); }
      `}</style>
    </header>
  );
}
