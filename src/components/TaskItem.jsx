import { useState, useRef } from 'react';

const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="check-svg"><path d="M20 6 9 17l-5-5" /></svg>;
const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;
const CheckCircleIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;

// Base64 short pop sound for completion
const POP_SOUND = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

export default function TaskItem({ task, onToggle, onDelete }) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const touchStartRef = useRef(null);
  const itemRef = useRef(null);
  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio(POP_SOUND) : null);

  const SWIPE_LEFT_THRESHOLD = -80;
  const SWIPE_RIGHT_THRESHOLD = 80;

  const triggerHaptic = (pattern = 50) => {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => console.log("Audio play blocked by browser"));
    }
  };

  const handleToggle = () => {
    if (!task.completed) playSound();
    triggerHaptic(task.completed ? 30 : [30, 50, 30]);
    onToggle(task.id, task.completed);
    setSwipeOffset(0);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    triggerHaptic([50, 50, 50]);
    setTimeout(() => {
      onDelete(task.id);
    }, 300);
  };

  // Touch Events
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartRef.current;

    if (diff < 0) {
      setSwipeOffset(diff < SWIPE_LEFT_THRESHOLD ? SWIPE_LEFT_THRESHOLD + (diff - SWIPE_LEFT_THRESHOLD) * 0.2 : diff);
    } else if (diff > 0) {
      setSwipeOffset(diff > SWIPE_RIGHT_THRESHOLD ? SWIPE_RIGHT_THRESHOLD + (diff - SWIPE_RIGHT_THRESHOLD) * 0.2 : diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset <= SWIPE_LEFT_THRESHOLD + 20) {
      setSwipeOffset(SWIPE_LEFT_THRESHOLD);
      triggerHaptic(20);
    } else if (swipeOffset >= SWIPE_RIGHT_THRESHOLD - 20) {
      handleToggle();
      setSwipeOffset(0);
    } else {
      setSwipeOffset(0);
    }
    touchStartRef.current = null;
  };

  // Extract from description (since we don't have DB schemas for these yet)
  const tagClass = `tag-${task.category ? task.category.toLowerCase() : 'other'}`;

  // Randomize priority if not set (Mock logic for priority badges depending roughly on title length, just to show UI)
  const priority = task.priority || (task.title.length > 20 ? 'high' : task.title.length > 10 ? 'medium' : 'low');

  // Random Progress if not set (Mock logic for UI display)
  const rawProgress = task.progress || (Math.random() * 100);
  const progress = task.completed ? 100 : rawProgress;

  return (
    <div className={`task-wrapper ${isDeleting ? 'deleting' : ''}`} ref={itemRef}>

      {/* Background Actions */}
      <div className="task-actions-bg">
        <div className="bg-action-complete" style={{ opacity: swipeOffset > 20 ? 1 : 0 }}>
          <CheckCircleIcon />
          <span>{task.completed ? '- Deshacer' : '+ Completar'}</span>
        </div>
        <div className="bg-action-delete" style={{ opacity: swipeOffset < -20 ? 1 : 0 }}>
          <button onClick={handleDelete} className="delete-btn">
            <TrashIcon />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Foreground Task Card */}
      <div
        className={`task-card glass-panel ${task.completed ? 'completed' : ''} ${tagClass}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform var(--transition-normal)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button className="task-checkbox" onClick={handleToggle}>
          {task.completed && <CheckIcon />}
        </button>

        <div className="task-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="task-title">{task.title}</p>
            {/* Priority Badge */}
            {!task.completed && (
              <span className={`priority-badge priority-${priority}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            )}
          </div>

          <p className="task-description">{task.description}</p>

          {/* Inline Progress Bar */}
          <div className="task-progress-track">
            <div className="task-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <style>{`
        .task-wrapper { position: relative; width: 100%; overflow: hidden; margin-bottom: 0.85rem; transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); border-radius: var(--border-radius-lg); }
        .task-wrapper.deleting { opacity: 0; transform: scale(0.9) translateX(-100%); height: 0; margin-bottom: 0; }
        .task-actions-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; border-radius: var(--border-radius-lg); overflow: hidden; }
        .bg-action-complete { background-color: var(--success-color); color: white; display: flex; align-items: center; padding-left: 1.5rem; width: 50%; font-weight: 700; font-size: 0.85rem; gap: 0.5rem; transition: opacity var(--transition-fast); }
        .bg-action-delete { background-color: var(--danger-color); color: white; display: flex; align-items: center; justify-content: flex-end; padding-right: 1.5rem; width: 50%; transition: opacity var(--transition-fast); }
        .delete-btn { color: white; display: flex; flex-direction: column; align-items: center; gap: 0.15rem; font-size: 0.8rem; font-weight: 700; }
        .task-card { position: relative; z-index: 10; display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem 1.5rem; min-height: 80px; cursor: grab; border-left: 4px solid transparent; }
        .task-card:active { cursor: grabbing; }

        .tag-health { border-left-color: var(--tag-health); box-shadow: -2px 0 10px rgba(255, 59, 48, 0.2); }
        .tag-work { border-left-color: var(--tag-work); box-shadow: -2px 0 10px rgba(94, 92, 230, 0.2); }
        .tag-home { border-left-color: var(--tag-home); box-shadow: -2px 0 10px rgba(255, 204, 0, 0.2); }
        .tag-study { border-left-color: var(--tag-study); box-shadow: -2px 0 10px rgba(50, 173, 230, 0.2); }
        .tag-other { border-left-color: var(--tag-other); }

        .task-checkbox { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); color: white; background-color: transparent; margin-top: 0.25rem; }
        .task-card.completed .task-checkbox { background-color: var(--success-color); border-color: var(--success-color); box-shadow: 0 0 15px rgba(52, 199, 89, 0.6); transform: scale(1.1); }
        .check-svg { stroke-dasharray: 24; stroke-dashoffset: 24; animation: drawCheck 0.4s 0.1s forwards ease-out; }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }

        .task-content { flex: 1; min-width: 0; }
        .task-title { font-weight: 600; font-size: 1.05rem; color: var(--text-primary); transition: all var(--transition-normal); word-break: break-word; }
        .task-description { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; margin-bottom: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Badges */
        .priority-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .priority-high { background-color: rgba(255, 59, 48, 0.15); color: #ff3b30; border: 1px solid rgba(255,59,48,0.3); }
        .priority-medium { background-color: rgba(50, 173, 230, 0.15); color: #32ade6; border: 1px solid rgba(50,173,230,0.3); }
        .priority-low { background-color: rgba(52, 199, 89, 0.15); color: #34c759; border: 1px solid rgba(52,199,89,0.3); }

        /* Inline Progress */
        .task-progress-track { width: 100%; height: 4px; background-color: var(--bg-color-secondary); border-radius: 99px; overflow: hidden; }
        .task-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-color), #ffcc00); border-radius: 99px; transition: width 0.8s ease-out; }

        .task-card.completed .task-title, .task-card.completed .task-description { color: var(--text-secondary); text-decoration: line-through; opacity: 0.5; }
        .task-card.completed .task-progress-fill { background: var(--text-secondary); }
      `}</style>
    </div>
  );
}
