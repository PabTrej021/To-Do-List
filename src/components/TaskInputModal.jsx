import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;

const CATEGORIES = [
  { id: 'health', color: 'var(--tag-health)' },
  { id: 'work', color: 'var(--tag-work)' },
  { id: 'study', color: 'var(--tag-study)' },
  { id: 'home', color: 'var(--tag-home)' },
  { id: 'other', color: 'var(--text-secondary)' }
];

export default function TaskInputModal({ onAdd, onCancel }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), category, dueDate);
      setTitle('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="mobile-handle"></div>
        <h3 className="modal-title">{t('newTask')}</h3>

        <form onSubmit={handleSubmit} className="task-form">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('whatNext')}
            className="clean-input input-large"
            autoFocus
          />

          <div className="input-group">
            <label>{t('dateOptional')}</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="datetime-input"
            />
          </div>

          <div className="category-scroll">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`cat-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
                style={{
                  borderColor: category === cat.id ? cat.color : 'transparent',
                  color: category === cat.id ? cat.color : 'var(--text-secondary)'
                }}
              >
                <div className="cat-dot" style={{ backgroundColor: cat.color }}></div>
                {t(cat.id)}
              </button>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="btn-add"
            >
              {t('add')} <PlusIcon />
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background-color: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          background-color: var(--glass-bg);
          border-radius: var(--border-radius-lg);
          padding: 2rem;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          animation: slideUpFadeIn 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-title { font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--text-primary); }

        .task-form { display: flex; flex-direction: column; gap: 1.5rem; }

        .input-large {
          width: 100%;
          font-size: 1.25rem;
          padding: 0.5rem 0;
          border-bottom: 2px solid var(--glass-border);
          border-radius: 0;
          background: transparent;
        }
        .input-large:focus { border-bottom-color: var(--accent-color); }

        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .datetime-input {
          padding: 0.85rem 1rem;
          border-radius: 12px;
          background-color: var(--bg-color-secondary);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          width: 100%;
        }
        
        .datetime-input::-webkit-calendar-picker-indicator {
          filter: var(--calendar-icon-filter, invert(0));
          cursor: pointer;
        }
        
        :root.dark-mode .datetime-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }

        .category-scroll {
          display: flex;
          flex-wrap: wrap; /* Fix: Now they wrap on mobile instead of overflowing */
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .cat-btn {
          display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem;
          border-radius: 99px; font-size: 0.85rem; font-weight: 600;
          background-color: var(--bg-color-secondary); border: 1.5px solid transparent;
          transition: all var(--transition-fast);
        }
        
        .cat-btn.active {
          background-color: var(--bg-color); transform: translateY(-2px); box-shadow: var(--shadow-sm);
        }

        .cat-dot { width: 8px; height: 8px; border-radius: 50%; }

        .modal-actions {
          display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;
        }

        .btn-cancel {
          padding: 0.85rem 1.5rem; border-radius: 99px; color: var(--text-secondary); font-weight: 600;
        }
        .btn-cancel:hover { color: var(--text-primary); background-color: var(--bg-color-secondary); }

        .btn-add {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.85rem 1.5rem; border-radius: 99px;
          background: linear-gradient(135deg, var(--accent-color), #ff719a); color: white;
          font-weight: 700; box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4);
        }
        .btn-add:disabled { opacity: 0.5; box-shadow: none; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
