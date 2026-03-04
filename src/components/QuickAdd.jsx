import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

const SendIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;

export default function QuickAdd({ onAdd }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), 'other', null); // Default category 'other', no due date
      setTitle('');
    }
  };

  return (
    <div className="quick-add-container glass-panel">
      <form onSubmit={handleSubmit} className="quick-add-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('quickAddPlaceholder')}
          className="quick-add-input"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="quick-add-btn"
          aria-label={t('add')}
        >
          <SendIcon />
        </button>
      </form>

      <style>{`
        .quick-add-container {
          position: fixed;
          bottom: 5.5rem; /* Above the bottom navigation */
          margin-bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 600px;
          border-radius: 99px;
          padding: 0.5rem;
          z-index: 80;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .quick-add-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quick-add-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.5rem 1rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
        }

        .quick-add-input::placeholder {
          color: var(--text-secondary);
        }

        .quick-add-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color), #ff719a);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          border: none;
        }

        .quick-add-btn:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .quick-add-btn:disabled {
          background: var(--bg-color-secondary);
          color: var(--text-secondary);
          opacity: 0.5;
        }

        /* Desktop Override: Snaps back into the regular DOM flow */
        @media (min-width: 1024px) {
          .quick-add-container {
            position: relative;
            bottom: auto;
            left: auto;
            transform: none;
            width: 100%;
            margin: 0 auto 2rem auto;
          }
        }
      `}</style>
    </div>
  );
}
