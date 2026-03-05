import React, { useState, useEffect } from 'react';
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

export default function TaskInputModal({ onAdd, onCancel, taskToEdit, defaultCategory }) {
  const { t, lang } = useI18n();
  const isEditing = !!taskToEdit;

  const [isListening, setIsListening] = useState(false);

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [category, setCategory] = useState(taskToEdit?.category || defaultCategory || 'other');
  const [dueDate, setDueDate] = useState(taskToEdit?.due_date ? taskToEdit.due_date.slice(0, 16) : '');

  useEffect(() => {
    if (!isEditing && defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      const formattedDate = dueDate ? new Date(dueDate).toISOString() : null;
      onAdd(title.trim(), description.trim(), category, formattedDate, isEditing ? taskToEdit.id : null);
      setTitle('');
      setDescription('');
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

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Añade detalles o una descripción (opcional)..."
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '12px',
              borderRadius: '12px',
              width: '100%',
              minHeight: '80px',
              resize: 'none',
              marginTop: '15px'
            }}
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
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: overlayFadeIn 0.2s ease-out;
        }
        @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content {
          width: 100%;
          max-width: 500px;
          background: rgba(15, 15, 20, 0.75);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(255, 45, 85, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: modalSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateZ(0);
          will-change: transform, opacity;
        }

        @media (max-width: 768px) {
           .modal-content { max-height: 85vh; overflow-y: auto; }
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mobile-handle {
          width: 40px; height: 4px; border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
          margin: 0 auto 1.25rem;
        }

        .modal-title {
          font-size: 1.4rem; margin-bottom: 1.5rem; color: #fff;
          font-weight: 700; letter-spacing: -0.01em;
        }

        .task-form { display: flex; flex-direction: column; gap: 1.25rem; }

        .input-large, .clean-input.input-large {
          width: 100%;
          font-size: 1.15rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          color-scheme: dark;
          font-family: 'Inter', sans-serif;
          transition: all 0.25s ease;
        }
        .input-large::placeholder, .clean-input.input-large::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .input-large:focus, .clean-input.input-large:focus {
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.12);
          outline: none;
          box-shadow: 0 0 20px rgba(255, 45, 85, 0.15);
        }

        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label {
          font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
        }

        .datetime-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px 16px;
          color: #fff;
          color-scheme: dark;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          transition: all 0.25s ease;
        }
        .datetime-input:focus {
          border-color: var(--accent-color);
          outline: none;
          box-shadow: 0 0 15px rgba(255, 45, 85, 0.1);
        }
        .datetime-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(1) brightness(0.8);
        }

        .category-scroll {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .cat-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: 99px; font-size: 0.8rem; font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.25s ease;
        }
        .cat-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .cat-btn.active {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .cat-dot { width: 8px; height: 8px; border-radius: 50%; }

        .modal-actions {
          display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;
        }

        .btn-cancel-modal {
          padding: 0.8rem 1.5rem; border-radius: 12px;
          color: rgba(255, 255, 255, 0.6); font-weight: 600; font-size: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          touch-action: manipulation;
        }
        .btn-cancel-modal:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-add {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.8rem 1.5rem; border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-color), #ff719a);
          color: white; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 4px 20px rgba(255, 45, 85, 0.4);
          touch-action: manipulation;
          transition: all 0.25s ease;
          border: none;
        }
        .btn-add:hover {
          box-shadow: 0 6px 25px rgba(255, 45, 85, 0.6);
          transform: translateY(-1px);
        }
        .btn-add:disabled { opacity: 0.4; box-shadow: none; cursor: not-allowed; transform: none; }

        .mic-btn {
           position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
           background: transparent; border: none; color: rgba(255,255,255,0.4);
           padding: 0.5rem; cursor: pointer; border-radius: 50%;
           display: flex; align-items: center; justify-content: center;
           transition: all 0.25s ease;
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
