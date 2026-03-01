import { useState } from 'react';

const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;

const CATEGORIES = [
  { id: 'health', label: 'Salud', color: 'var(--tag-health)' },
  { id: 'work', label: 'Trabajo', color: 'var(--tag-work)' },
  { id: 'study', label: 'Estudio', color: 'var(--tag-study)' },
  { id: 'home', label: 'Hogar', color: 'var(--tag-home)' },
  { id: 'other', label: 'Otro', color: 'var(--text-secondary)' }
];

export default function TaskInput({ onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), category);
      setTitle('');
      // Mantener la categoría o resetearla. 
      // setCategory('other');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-input-form glass-panel">

      <div className="input-row">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué sigue en tu vida?"
          className="clean-input"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="add-button"
          aria-label="Añadir tarea"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Category Selector */}
      <div className="category-tabs">
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
            {cat.label}
          </button>
        ))}
      </div>

      <style>{`
        .task-input-form {
          display: flex;
          flex-direction: column;
          padding: 1rem 1.25rem;
          margin-bottom: 2rem;
          background-color: var(--glass-bg);
          gap: 1rem;
        }
        
        .input-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }

        .clean-input {
          flex: 1;
          width: 100%;
          border: none;
          background: transparent;
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--text-primary);
          outline: none;
        }
        
        .clean-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .add-button {
          background: linear-gradient(135deg, var(--accent-color), #ff719a);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4);
        }

        .add-button:hover:not(:disabled) {
          transform: scale(1.1) rotate(90deg);
        }

        .add-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .add-button:disabled {
          background: var(--bg-color-secondary);
          color: var(--text-secondary);
          opacity: 0.5;
          box-shadow: none;
          cursor: default;
        }

        .category-tabs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }

        .category-tabs::-webkit-scrollbar {
          display: none;
        }

        .cat-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          background-color: var(--bg-color-secondary);
          border: 1.5px solid transparent;
          transition: all var(--transition-fast);
          min-width: max-content;
        }
        
        .cat-btn.active {
          background-color: var(--bg-color);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </form>
  );
}
