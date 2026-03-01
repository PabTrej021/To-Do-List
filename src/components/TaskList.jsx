import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onDelete }) {
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

    return (
        <div className="task-list">
            {tasks.map((task) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
