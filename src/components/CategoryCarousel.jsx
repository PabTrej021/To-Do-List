import React from 'react';
import { useI18n } from '../context/I18nContext';

// Icons for categories
const MonitorIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>;
const BookOpenIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const BriefcaseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const HeartPulseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;

const CATEGORY_DATA = [
  { id: 'work', icon: <BriefcaseIcon />, color: '#5e5ce6', bgLight: 'rgba(94, 92, 230, 0.15)' },
  { id: 'study', icon: <BookOpenIcon />, color: '#32ade6', bgLight: 'rgba(50, 173, 230, 0.15)' },
  { id: 'health', icon: <HeartPulseIcon />, color: '#ff3b30', bgLight: 'rgba(255, 59, 48, 0.15)' },
  { id: 'home', icon: <HomeIcon />, color: '#ffcc00', bgLight: 'rgba(255, 204, 0, 0.15)' },
  { id: 'other', icon: <MonitorIcon />, color: '#8e8e93', bgLight: 'rgba(142, 142, 147, 0.15)' }
];

export default function CategoryCarousel({ tasks, onAddCategoryTask }) {
  const { t } = useI18n();

  // Count tasks per category
  const getCount = (categoryId) => {
    return tasks.filter(t => t.category === categoryId && !t.completed).length;
  };

  return (
    <div className="category-section">
      <h3 className="section-title">Categorías</h3>

      <div className="horizontal-scroll" style={{ paddingRight: '24px' }}>
        {CATEGORY_DATA.map(cat => {
          const count = getCount(cat.id);
          return (
            <div key={cat.id} className="scroll-item category-card glass-panel-soft">
              <div className="cat-icon-wrapper" style={{ backgroundColor: cat.bgLight, color: cat.color }}>
                {cat.icon}
              </div>
              <div className="cat-info">
                <h4>{t(cat.id)}</h4>
                <p>{count} {count === 1 ? t('taskSingular') : t('taskPlural')}</p>
              </div>
              <button
                className="cat-add-btn"
                style={{ backgroundColor: cat.color }}
                onClick={() => onAddCategoryTask(cat.id)}
                aria-label={`Añadir a ${t(cat.id)}`}
              >
                <PlusIcon />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .category-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .glass-panel-soft {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .category-card {
          width: 140px;
          height: 160px;
          margin-right: 1rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform var(--transition-fast);
        }

        .category-card:hover {
          transform: translateY(-5px);
        }

        .cat-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: auto;
        }

        .cat-info h4 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 0.15rem;
          color: var(--text-primary);
        }

        .cat-info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .cat-add-btn {
          position: absolute;
          bottom: 1.25rem;
          right: 1.25rem;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: all var(--transition-fast);
        }

        .cat-add-btn:hover {
          transform: scale(1.1) rotate(90deg);
        }
      `}</style>
    </div>
  );
}
