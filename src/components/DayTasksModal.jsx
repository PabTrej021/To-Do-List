import React from 'react';
import TaskItem from './TaskItem';

const isSameDay = (dateString1, dateString2) => {
    if (!dateString1 || !dateString2) return false;
    const d1 = new Date(dateString1);
    const d2 = new Date(dateString2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

export default function DayTasksModal({ tasks, selectedDate, onClose, onToggle, onDelete, onEdit }) {
    // Filter tasks that belong exclusively to the selected date using robust Date comparison
    const dayTasks = tasks.filter(t => t.due_date && isSameDay(t.due_date, selectedDate));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.25rem' }}>
                        {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                    <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                <div className="modal-body no-scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                    {dayTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                            <p style={{ fontSize: '1.5rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>🎉</p>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Día libre</h3>
                            <p style={{ fontSize: '0.9rem' }}>No tienes tareas programadas para hoy.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {dayTasks.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', fontWeight: 'bold' }}>
                        Volver
                    </button>
                </div>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--bg-color-secondary);
          backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 1rem;
          animation: fadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .glass-panel-modal {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-md);
          border-radius: var(--border-radius-lg);
          backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
        }
        .modal-content {
          width: 100%; max-width: 450px; padding: 1.5rem;
          animation: slideUp 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border);
          padding-bottom: 1rem; text-transform: capitalize;
        }
        .btn-close {
          background: none; border: none; color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s; padding: 0.5rem; border-radius: 50%;
        }
        .btn-close:hover { color: var(--danger-color); background: rgba(255, 59, 48, 0.1); }
      `}</style>
        </div>
    );
}
