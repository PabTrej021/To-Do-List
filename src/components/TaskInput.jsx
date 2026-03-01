import { useState } from 'react';

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);

export default function TaskInput({ onAdd }) {
    const [title, setTitle] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title.trim());
            setTitle('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="task-input-form glass-panel">
            <div className="input-wrapper">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Añadir nueva tarea..."
                    className="clean-input"
                />
            </div>
            <button
                type="submit"
                disabled={!title.trim()}
                className="add-button"
                aria-label="Añadir tarea"
            >
                <PlusIcon />
            </button>

            <style>{`
        .task-input-form {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.5rem 0.5rem 1.25rem;
          margin-bottom: 2rem;
          background-color: var(--bg-color-secondary);
        }
        
        .input-wrapper {
          flex: 1;
        }

        .clean-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 1.05rem;
          color: var(--text-primary);
          outline: none;
        }
        
        .clean-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .add-button {
          background-color: var(--accent-color);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 122, 255, 0.3);
        }

        .add-button:hover:not(:disabled) {
          background-color: var(--accent-color-hover);
          transform: scale(1.05);
        }

        .add-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .add-button:disabled {
          background-color: var(--text-secondary);
          opacity: 0.3;
          box-shadow: none;
          cursor: default;
        }
      `}</style>
        </form>
    );
}
