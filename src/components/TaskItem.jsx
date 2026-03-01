import { useState, useRef } from 'react';

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-svg"><path d="M20 6 9 17l-5-5" /></svg>
);

const TrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

export default function TaskItem({ task, onToggle, onDelete }) {
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const touchStartRef = useRef(null);
    const itemRef = useRef(null);

    const SWIPE_THRESHOLD = -80; // Distance needed to reveal delete button

    const triggerHaptic = (pattern = 50) => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    };

    const handleToggle = () => {
        triggerHaptic(30);
        onToggle(task.id, task.completed);
    };

    const handleDelete = () => {
        setIsDeleting(true);
        triggerHaptic([50, 50, 50]);
        setTimeout(() => {
            onDelete(task.id);
        }, 300); // Wait for shrink animation
    };

    // Touch Events for Swipe-to-Delete
    const handleTouchStart = (e) => {
        touchStartRef.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!touchStartRef.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartRef.current;

        // Solo permitir swipe a la izquierda
        if (diff < 0) {
            // Add resistance when pulling past the threshold
            const offset = diff < SWIPE_THRESHOLD ? SWIPE_THRESHOLD + (diff - SWIPE_THRESHOLD) * 0.2 : diff;
            setSwipeOffset(offset);
        }
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);
        if (swipeOffset <= SWIPE_THRESHOLD + 20) {
            // Snap open
            setSwipeOffset(SWIPE_THRESHOLD);
            triggerHaptic(20);
        } else {
            // Snap back
            setSwipeOffset(0);
        }
        touchStartRef.current = null;
    };

    return (
        <div className={`task-wrapper ${isDeleting ? 'deleting' : ''}`} ref={itemRef}>

            {/* Background Delete Button (Revealed on swipe) */}
            <div className="task-background-delete">
                <button onClick={handleDelete} className="delete-btn">
                    <TrashIcon />
                    <span>Eliminar</span>
                </button>
            </div>

            {/* Foreground Task Card */}
            <div
                className={`task-card glass-panel ${task.completed ? 'completed' : ''}`}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform var(--transition-normal)'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    className="task-checkbox"
                    onClick={handleToggle}
                    aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
                >
                    {task.completed && <CheckIcon />}
                </button>

                <div className="task-content">
                    <p className="task-title">{task.title}</p>
                    {task.description && <p className="task-description">{task.description}</p>}
                </div>
            </div>

            <style>{`
        .task-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: var(--border-radius-md);
          margin-bottom: 0.75rem;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        
        .task-wrapper.deleting {
          opacity: 0;
          transform: scale(0.95);
          height: 0;
          margin-bottom: 0;
          padding: 0;
        }

        .task-background-delete {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          background-color: var(--danger-color);
          border-radius: var(--border-radius-md);
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding-right: 1.5rem;
        }

        .delete-btn {
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .task-card {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          min-height: 72px;
          cursor: grab;
          background-color: var(--bg-color-secondary);
        }

        .task-card:active {
          cursor: grabbing;
        }

        .task-checkbox {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          color: white;
          margin-top: 0.125rem;
        }

        .task-checkbox:hover {
          border-color: var(--accent-color);
        }

        .task-card.completed .task-checkbox {
          background-color: var(--accent-color);
          border-color: var(--accent-color);
        }
        
        .check-svg {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: drawCheck 0.3s forwards ease-out;
        }

        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        .task-content {
          flex: 1;
          min-width: 0;
        }

        .task-title {
          font-weight: 500;
          font-size: 1.05rem;
          color: var(--text-primary);
          transition: color var(--transition-fast);
          word-break: break-word;
        }

        .task-description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
          word-break: break-word;
        }

        .task-card.completed .task-title,
        .task-card.completed .task-description {
          color: var(--text-secondary);
          text-decoration: line-through;
          opacity: 0.7;
        }
      `}</style>
        </div>
    );
}
