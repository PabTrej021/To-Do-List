import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const MicIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>;
const MicOffIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5l-1.5-1.5a5 5 0 0 1-9-5v-2" /><path d="M12 19v3" /><path d="M12 2a3 3 0 0 1 3 3v2l-6 6v-3a3 3 0 0 1 3-3z" /></svg>;

const CATEGORIES = [
  { id: 'health', color: 'var(--tag-health)' },
  { id: 'work', color: 'var(--tag-work)' },
  { id: 'study', color: 'var(--tag-study)' },
  { id: 'home', color: 'var(--tag-home)' },
  { id: 'other', color: 'var(--text-secondary)' }
];

export default function TaskInputModal({ onAdd, onCancel, taskToEdit }) {
  const { t, lang } = useI18n();
  const isEditing = !!taskToEdit;

  const [isListening, setIsListening] = useState(false);

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [category, setCategory] = useState(taskToEdit?.category || 'other');
  const [dueDate, setDueDate] = useState(taskToEdit?.due_date ? taskToEdit.due_date.slice(0, 16) : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), category, dueDate, isEditing ? taskToEdit.id : null);
      setTitle('');
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador actual no soporta dictado por voz natively.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTitle(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    if (isListening) return; // Wait until it naturally stops if already listening
    recognition.start();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="mobile-handle"></div>
        <h3 className="modal-title">{t('newTask')}</h3>

        <form onSubmit={handleSubmit} className="task-form">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isListening ? 'Escuchando...' : t('whatNext')}
              className="clean-input input-large"
              style={{ paddingRight: '50px' }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              aria-label="Voice Dictate"
            >
              {isListening ? <MicIcon /> : <MicIcon />}
            </button>
          </div>

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
            <button type="button" className="btn-cancel-modal" onClick={onCancel}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="btn-add"
            >
              {isEditing ? 'Guardar Cambios' : t('add')} {!isEditing && <PlusIcon />}
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
          transform: translateZ(0);
          will-change: transform, opacity;
        }

        /* Mobile specific modal height */
        @media (max-width: 768px) {
           .modal-content { max-height: 85vh; overflow-y: auto; }
        }

        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(30px) translateZ(0); }
          to { opacity: 1; transform: translateY(0) translateZ(0); }
        }

        .modal-title { font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--text-primary); }

        .task-form { display: flex; flex-direction: column; gap: 1.5rem; }

        .input-large {
          width: 100%;
          font-size: 1.25rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 12px;
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        :root.dark-mode .input-large {
           color-scheme: dark;
        }

        .input-large:focus { border-color: var(--accent-color); background: rgba(255, 255, 255, 0.25); }
        :root.dark-mode .input-large:focus { background: rgba(255, 255, 255, 0.25); }

        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.85rem; color: var(--text-primary); opacity: 0.9; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .datetime-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 12px;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
        }
        :root.dark-mode .datetime-input {
           color-scheme: dark;
        }
        
        .datetime-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
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

        .btn-cancel-modal {
          padding: 0.85rem 1.5rem; border-radius: 99px; color: var(--text-secondary); font-weight: 600;
          border: 1px solid var(--glass-border);
          background: transparent;
          transition: all var(--transition-fast);
          touch-action: manipulation;
        }
        .btn-cancel-modal:hover { color: var(--text-primary); background-color: var(--glass-bg); }

        .btn-add {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.85rem 1.5rem; border-radius: 99px;
          background: linear-gradient(135deg, var(--accent-color), #ff719a); color: white;
          font-weight: 700; box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4);
          touch-action: manipulation;
        }
        .btn-add:disabled { opacity: 0.5; box-shadow: none; cursor: not-allowed; }

        .mic-btn {
           position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
           background: transparent; border: none; color: var(--text-secondary);
           padding: 0.5rem; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center;
           transition: all var(--transition-fast);
        }
        .mic-btn:hover { color: var(--accent-color); background: rgba(255, 45, 85, 0.1); }
        .mic-btn.listening {
           color: var(--danger-color); 
           background: rgba(255, 59, 48, 0.15);
           animation: pulseMic 1.5s infinite;
        }

        @keyframes pulseMic {
           0% { transform: translateY(-50%) scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
           70% { transform: translateY(-50%) scale(1.1); box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
           100% { transform: translateY(-50%) scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
        }
      `}</style>
    </div>
  );
}
