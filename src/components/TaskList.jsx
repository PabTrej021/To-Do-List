import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onDelete, onEdit }) {
    if (tasks.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3 className="text-title" style={{ fontSize: '1.25rem' }}>Tu día está despejado</h3>
                <p className="text-subtitle">Añade tareas para mantenerte productivo.</p>

                <style>{`
          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-secondary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
            filter: grayscale(1);
          }
        `}</style>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="task-list">
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tareas de Hoy</h4>
            {pendingTasks.map((task) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            ))}

            {completedTasks.length > 0 && (
                <>
                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completadas</h4>
                    <div style={{ opacity: 0.6 }}>
                        {completedTasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
